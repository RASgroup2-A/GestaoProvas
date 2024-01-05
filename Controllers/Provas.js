const ProvasModel = require('../Models/Provas');
const ResolucoesModel = require('../Models/Resolucoes');
const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;

/* 
Obtém uma prova dado o seu id.
*/
module.exports.getProva = async (id) => {
    let doc = await ProvasModel.findById(id)
    doc = doc.toObject()
    // Elimina ids de lixo criados pelo mongodb
    for (let i = 0; i < doc.versoes.length; i++) {
        delete doc.versoes[i]._id
        for (let j = 0; j < doc.versoes[i].questoes.length; j++) {
            delete doc.versoes[i].questoes[j]._id
            for (let k = 0; k < doc.versoes[i].questoes[j].opcoes.length; k++) {
                delete doc.versoes[i].questoes[j].opcoes[k]._id
            }
        }
    }
    return doc
}

module.exports.getQuestoesOfVersaoOfProvaUnwound = (idProva, idVersao) => {
    return ProvasModel.aggregate([
        { $match: { _id: new ObjectId(idProva) } },
        { $project: { _id: 0, versoes: 1 } },
        { $unwind: "$versoes" },
        { $match: { 'versoes.id': idVersao } },
        { $project: { 'versoes.questoes': 1 } },
        { $unwind: "$versoes.questoes" },
        { $replaceRoot: { newRoot: "$versoes.questoes" } }
    ]).then((result) => {
            return result
        }).catch((err) => {
            throw err
    });
}

/**
 * Obtém as questões de uma versão de uma prova
 */
module.exports.getQuestoesOfVersaoOfProva = (idProva, idVersao) => {
    return ProvasModel.aggregate([{$match:{"_id":new mongoose.Types.ObjectId(idProva)}},
        {$unwind:{path:"$versoes"}},
        {$match:{"versoes.numVersao":parseInt(idVersao)}},
        {$project:{"versoes.questoes":1}}]).then((result) => {
            return result
        }).catch((err) => {
            throw err
    });
}

/* 
Regista uma prova na base de dados
*/
module.exports.addProva = (prova) => {
    // Criação de ids que não são tratados automaticamente pelo mongodb
    prova.versoes = prova.versoes || [] //> para evitar que a prova não tenha o campo versoes
    let versoes = prova.versoes || []
    for (let i = 1; i <= versoes.length; i++) {
        versoes[i - 1].id = i // id da versão
        versoes[i - 1].questoes = versoes[i - 1].questoes || [] //> para evitar que a versao não tenha o campo questoes
        let questoes = versoes[i - 1].questoes || []
        for (let j = 1; j <= questoes.length; j++) {
            versoes[i - 1].questoes[j - 1].id = j // id da questão
            versoes[i - 1].questoes[j - 1].opcoes = versoes[i - 1].questoes[j - 1].opcoes || [] //> para evitar que a questão não tenha o campo opcoes
            let opcoes = questoes[j - 1].opcoes || []
            for (let k = 1; k <= opcoes.length; k++) {
                opcoes[k - 1].id = k // id da opção, se existir
            }
        }
    }

    return ProvasModel.collection.insertOne(prova)
}

/*
Obtém o maior dos ids de questões de uma certa versão de uma prova
Vai a uma versão de uma prova, vê os ids das questões dessa versão dessa prova e selecciona o maior id.
(Parece funcionar)
*/
module.exports.biggestIdQuestionsInProvaVersion = (idProva, idVersao) => {
    return ProvasModel.aggregate([
        { $match: { _id: new ObjectId(idProva) } }, // vai buscar a prova pelo seu id da base de dados
        { $project: { _id: 0, 'versoes.id': 1, 'versoes.questoes.id': 1 } }, // selecciona apenas os campos necessários (ids das versoes na base de dados e os ids das questões de cada versão na base de dados)
        { $unwind: "$versoes" },
        {
            $replaceRoot: {
                newRoot: "$versoes"
            }
        },
        { $match: { id: parseInt(idVersao) } }, // obtem a versão pretendida (pelo id da versão), converte para inteiro porque o argumento vem como string
        { $project: { id: 0 } },
        {
            $unwind: "$questoes"
        },
        {
            $group: {
                _id: null,
                maxId: { $max: "$questoes.id" }
            }
        },
        { $project: { _id: 0, maxId: 1 } }
    ]).then(result => {
        //> Output no formato: {maxId: X}
        if (!result || result.length === 0) { //> No caso de ainda não haver uma questão
            return { maxId: 0 }
        } else {
            return result[0]
        }
    }).catch((err) => {
        throw err
    });
}

/*
Insere uma questão numa versão de uma prova
*/
module.exports.addQuestaoToProva = (idProva, idVersao, questao) => {
    return this.biggestIdQuestionsInProvaVersion(idProva, idVersao)
        .then((result) => {
            questao.id = result.maxId + 1 //> calcula o id da questão 
            let opcoes = questao.opcoes || []
            //> Criação de ids que não são tratados automaticamente pelo mongodb
            for (let i = 1; i <= opcoes.length; i++) {
                opcoes[i - 1].id = i
            }

            //> Insere a questão na versão da prova
            return ProvasModel.collection.updateOne({ _id: new ObjectId(idProva), 'versoes.id': parseInt(idVersao) }, {
                $push: {
                    'versoes.$.questoes': questao
                }
            })
        }).catch((err) => {
            throw err
        });
}

/* Obtém o maior dos ids das versões de uma prova
Vai a uma prova, vê os ids das versões e escolhe o maior deles
(Parece funcionar)
*/
module.exports.biggestIdOfProvaVersions = (idProva) => {
    return ProvasModel.aggregate([
        { $match: { _id: new ObjectId(idProva) } },
        { $project: { _id: 0, 'versoes.id': 1 } },
        { $unwind: "$versoes" },
        {
            $replaceRoot: {
                newRoot: "$versoes"
            }
        },
        {
            $group: {
                _id: null,
                maxId: {
                    $max: "$id"
                }
            }
        },
        { $project: { _id: 0, maxId: 1 } }
    ]).then(result => {
        //> Output no formato: {maxId: X}
        if (!result || result.length === 0) { //> No caso de ainda não haver uma versão
            return { maxId: 0 }
        } else {
            return result[0]
        }
    }).catch((err) => {
        throw err
    });
}

/* Insere uma versão da prova dentro da prova. */
module.exports.addVersaoToProva = (idProva, versao) => {
    return this.biggestIdOfProvaVersions(idProva)
        .then((result) => {
            versao.id = result.maxId + 1 //> calcula o id da versão
            versao.questoes = versao.questoes || [] //> para evitar que a versão não tenha o campo questoes
            let questoes = versao.questoes || []
            //> Criação de ids que não são tratados automaticamente pelo mongodb
            for (let i = 1; i <= questoes.length; i++) {
                questoes[i - 1].id = i
                questoes.opcoes[i - 1].opcoes = questoes.opcoes || [] //> para evitar que a questão não tenha o campo opcoes
                let opcoes = questoes[i - 1].opcoes || []
                for (let j = 1; j <= opcoes.length; j++) {
                    opcoes[j - 1].id = j
                }
            }

            return ProvasModel.collection.updateOne({ _id: new ObjectId(idProva) }, {
                $push: {
                    versoes: versao
                }
            })

        }).catch((err) => {
            throw err
        });
}

/*
Verifica se já existe uma prova com o nome fornecido.
*/
module.exports.existsProvaName = async (provaName) => {
    let prova = await ProvasModel.findOne({ nome: provaName })
    if (prova) return { result: true }
    else return { result: false }
}

module.exports.getProvasOfDocente = async (idDocente) => {
    let provas =  await ProvasModel.find({"docentes": idDocente})
    console.log(provas)
    return provas
}

/*
Verifica se uma certa prova tem um docente
*/
module.exports.provaHasDocente = async (idProva, idDocente) => {
    let verificacao = await ProvasModel.findOne(
        {
            _id: idProva,
            docentes: { $in: [idDocente] }
        }
    )

    if (verificacao) return { result: true }
    else return { result: false }
}

module.exports.getProvasNaoRealizadasAluno = async (numMecAluno) => {
    let agora = new Date()
    let provas = await ProvasModel.aggregate([
        {
            $match: {
                "versoes.alunos": numMecAluno,
                "versoes.data": { $gt: agora.toISOString().replace('T', ' ').substring(0, 16) }
            }
        },
        {
            $project: {
                nome: 1,
                docentes: 1,
                unidadeCurricular: 1,
                retrocesso: 1,
                aleatorizacao: 1,
                versao: {
                    $arrayElemAt: [{
                        $filter: {
                            input: "$versoes",
                            as: "versao",
                            cond: {
                                $and: [
                                    { $gt: ["$$versao.data", agora.toISOString().replace('T', ' ').substring(0, 16)] },
                                    { $in: [numMecAluno, "$$versao.alunos"] } // Verifica se o aluno está inscrito nesta versão
                                ]
                            }
                        }
                    }, 0]
                }
            }
        }
    ])
    let resolucoesAluno = await ResolucoesModel.find({idAluno: numMecAluno})
    let provasResolvidasAluno = resolucoesAluno.map(resolucao => resolucao.idProva)
    provas.forEach(prova => prova._id = prova._id.toString())
    return provas.filter(prova => !provasResolvidasAluno.includes(prova._id.toString()))
}

module.exports.getProvasRealizadasAluno = async (numMecAluno) => {
    let provasRealizadasIDS = await ResolucoesModel.collection.find({idAluno: numMecAluno}).toArray()
    provasRealizadasIDS = provasRealizadasIDS.map(prova => new ObjectId(prova.idProva))
    return await ProvasModel.aggregate([
        {
            $match: {
                _id: {$in: provasRealizadasIDS},
                "versoes.alunos": numMecAluno
            }
        },
        {$unwind: "$versoes"},
        {
            $group: {
                _id: "$_id",
                nome: { $first: "$nome" },
                docentes: { $first: "$docentes" },
                unidadeCurricular: { $first: "$unidadeCurricular" },
                retrocesso: { $first: "$retrocesso" },
                aleatorizacao: { $first: "$aleatorizacao" },
                versoes: { $push: "$versoes" }
            }
        },
        {
            $project: {
                nome: 1,
                docentes: 1,
                unidadeCurricular: 1,
                retrocesso: 1,
                aleatorizacao: 1,
                versao: {
                    $arrayElemAt: [{
                        $filter: {
                            input: "$versoes",
                            as: "versao",
                            cond: { $in: [numMecAluno, "$$versao.alunos"] }
                        }
                    }, 0]
                }
            }
        }
    ])

}

/*
Devolve todas as provas com o seu id
*/
module.exports.getAllProvas = async () => {
    let provas = await ProvasModel.find()
    return provas
}
