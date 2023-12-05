const ProvasModel = require('../Models/Provas');
const ObjectId = require('mongoose').Types.ObjectId;

/* 
Obtém uma prova dado o seu id.
*/
module.exports.getProva = async (id) => {
    let doc = await ProvasModel.findById(id)
    doc = doc.toObject()
    // Elimina ids de lixo criados pelo mongodb
    for(let i = 0; i < doc.versoes.length; i++){
        delete doc.versoes[i]._id
        for(let j = 0; j < doc.versoes[i].questoes.length; j++){
            delete doc.versoes[i].questoes[j]._id 
            for(let k = 0; k < doc.versoes[i].questoes[j].opcoes.length; k++){
                delete doc.versoes[i].questoes[j].opcoes[k]._id
            }
        }
    }
    return doc
}

/* 
Regista uma prova na base de dados
*/
module.exports.addProva = async (prova) => {
    // Criação de ids que não são tratados automaticamente pelo mongodb
    let versoes = prova.versoes || []
    for(let i = 1; i <= versoes.length; i++){
        versoes[i-1].id = i // id da versão
        let questoes = versoes[i-1].questoes || []
        for(let j = 1; j <= questoes.length; j++){
            versoes[i-1].questoes[j-1].id = j // id da questão
            let opcoes = questoes[j-1].opcoes || []
            for(let k = 1; k <= opcoes.length; k++){
                opcoes[k-1].id = k // id da opção, se existir
            }
        }
    }

    return await ProvasModel.collection.insertOne(prova)
}

/*
Obtém o maior dos ids de questões de uma certa versão de uma prova
Vai a uma versão de uma prova, vê os ids das questões dessa versão dessa prova e selecciona o maior id.
(Parece funcionar)
*/
module.exports.biggestIdQuestionsInProvaVersion = async (idProva, idVersao) => {
    let maxId = await ProvasModel.aggregate([
        {$match: {_id: new ObjectId(idProva)}}, // vai buscar a prova pelo seu id da base de dados
        {$project: {_id: 0, 'versoes.id': 1,'versoes.questoes.id': 1}}, // selecciona apenas os campos necessários (ids das versoes na base de dados e os ids das questões de cada versão na base de dados)
        {$unwind: "$versoes"},
        {
          $replaceRoot: {
            newRoot: "$versoes"
          }
        },
        {$match: {id: parseInt(idVersao)}}, // obtem a versão pretendida (pelo id da versão), converte para inteiro porque o argumento vem como string
        {$project: {id: 0}},
        {
          $unwind: "$questoes"
        },
        {
          $group: {
            _id: null,
            maxId: { $max: "$questoes.id" }
          }
        },
        {$project: {_id: 0,maxId: 1}}
    ])
    // maxId no formato [ { "maxId": X} ], é uma lista de um elemento
    if (!maxId || maxId.length === 0 ){ // houve um problema nos ids ou assim, fazendo com que não haja resultado
        throw new Error(`[Controllers/Provas.js/biggestIdQuestionInProvaVersion] Não existe a correspondência idProva <-> idVersao com idProva=${idProva} e idVersao=${idVersao}`)
    }

    return maxId[0] // output com o formato { "maxId": X}
}

/* 
Insere uma questão numa versão de uma prova
*/
module.exports.addQuestaoToProva = async (idProva, idVersao, questao) => {
    let nextQuestionId = await this.biggestIdQuestionInProvaVersion(idProva,idVersao).maxId+1// obtém o id da questão
    questao.id = nextQuestionId
    //! TODO: Continuar isto
}

/* Obtém o maior dos ids das versões de uma prova
Vai a uma prova, vê os ids das versões e escolhe o maior deles
(Parece funcionar)
*/
module.exports.biggestIdOfProvaVersions = async (idProva) => {
    let maxId = await ProvasModel.aggregate([
        {$match: {_id: new ObjectId(idProva)}},
        {$project: {_id: 0, 'versoes.id': 1}},
        {$unwind: "$versoes"},
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
        {$project: {_id: 0, maxId: 1}}
    ])

    // maxId no formato [ { "maxId": X} ], é uma lista de um elemento
    if (!maxId || maxId.length === 0 ){ // houve um problema nos ids ou assim, fazendo com que não haja resultado
        throw new Error(`[Controllers/Provas.js/biggestIdOfProvaVersions] A prova com id '${idProva}' não existe`)
    }

    return maxId[0] // output com o formato { "maxId": X}
    
}

/* Insere uma versão da prova dentro da prova. */
module.exports.addVersaoToProva = async (idProva, versao) => {
    let nextVersionId = await this.biggestIdOfProvaVersions(idProva).maxId +1
    versao.id = nextVersionId
    //! TODO: Continuar isto
}

/*
Verifica se já existe uma prova com o nome fornecido.
*/
module.exports.existsProvaName = async (provaName) => {
    let prova = await ProvasModel.findOne({nome: provaName})
    if (prova) return {result: true}
    else return {result: false}
}

/*
Verifica se uma certa prova tem um docente
*/
module.exports.provaHasDocente = async (idProva, idDocente) => {
    let verificacao = await ProvasModel.findOne(
        {
            _id: idProva, 
            docentes: {$in: [idDocente]}
        }
    )

    if (verificacao) return {result: true}
    else return {result: false}
}

/* 
Verifica se uma questão de escolha múltipla ou V/F está correcta
*/
module.exports.respostaCorrecta = async (idProva, idQuestao, idVersao, opcoesEscolhidas) => {

}