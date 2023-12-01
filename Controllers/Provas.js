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
Insere uma questão numa versão de uma prova
*/
module.exports.addQuestaoToProva = async (idProva, idVersao, questao) => {

}

/* Insere uma versão da prova dentro da prova. */
module.exports.addVersaoToProva = async (idProva, versao) => {

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