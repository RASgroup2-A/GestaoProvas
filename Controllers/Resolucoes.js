const ProvasController = require('./Provas')
const ResolucoesModel = require('../Models/Resolucoes');
const ObjectId = require('mongoose').Types.ObjectId;

//! FUNÇÕES AUXILIARES
function listasIguais(lista1, lista2) {
    //> Verificar se têm o mesmo comprimento
    if (lista1.length !== lista2.length) {
        return false;
    }

    //> Verificar cada elemento
    for (let i = 0; i < lista1.length; i++) {
        if (lista1[i] !== lista2[i]) {
            return false;
        }
    }

    //> Se chegou até aqui, as listas são iguais
    return true;
}
//-----------------------------------------

/* 
Obtém uma resolução dado o seu id.
*/
module.exports.getResolucao = async (id) => {
    let resolucao = await ResolucoesModel.findById(id)
    resolucao = resolucao.toObject()
    let respostas = resolucao.respostas || []
    //> Apaga ids de lixo criados pelo mongodb
    for (let i = 0; i < respostas.length; i++) {
        let resposta = respostas[i]
        delete resposta._id
        let opcoes = resposta.opcoesEscolhidas || []
        for (let j = 0; j < opcoes.length; j++) {
            let opcao = opcoes[j]
            delete opcao._id
        }
    }
    return resolucao
}

/* 
Regista uma resolução na base de dados
*/
module.exports.addResolucao = (resolucao) => {
    resolucao.respostas = resolucao.respostas || [] //> para evitar que a resolução não tenha o campo respostas
    let respostas = resolucao.respostas
    for (let i = 1; i <= respostas.length; i++) {
        let resposta = respostas[i - 1]
        resposta.cotacao = resposta.cotacao || 0 //> para evitar que a resposta não tenha o campo cotacao
        resposta.respostaAberta = resposta.respostaAberta || '' //> para evitar que a resposta não tenha o campo respostaAberta
        resposta.opcoesEscolhidas = resposta.opcoesEscolhidas || [] //> para evitar que a resposta não tenha o campo opcoesEscolhidas
    }

    return ResolucoesModel.collection.insertOne(resolucao)
}

/**
 * Devolve todas as resoluções de um aluno
 */
module.exports.getResolucoesOfAluno = (idAluno) => {
    return ResolucoesModel.collection.find({ idAluno: idAluno }).toArray()
}

/**
 * Adiciona uma resposta de um aluno à resolução de um aluno.
 */
module.exports.addRespostaToResolucao = (idAluno, idProva, resposta) => {
    resposta.cotacao = resposta.cotacao || 0 //> para evitar que a resposta não tenha o campo cotacao
    resposta.respostaAberta = resposta.respostaAberta || '' //> para evitar que a resposta não tenha o campo respostaAberta
    resposta.opcoesEscolhidas = resposta.opcoesEscolhidas || [] //> para evitar que a resposta não tenha o campo opcoesEscolhidas

    return ResolucoesModel.collection.updateOne({ idAluno: idAluno, idProva: idProva }, {
        $push: {
            respostas: resposta
        }
    })
}

/**
 * Obtém todas as resoluções de uma prova
 */
module.exports.getResolucoesOfProva = (idProva) => {
    return ResolucoesModel.collection.find({ idProva: idProva }).toArray()
}


/**
 * Verifica se uma resposta de um aluno está correcta. Se estiver, devolve a cotação da pergunta. Se não estiver, devolve o desconto da pergunta.
 * !Não é exportada pelo módulo
 */
function verificaQuestao(respostaAluno, solucoes) {
    let opcoesEscolhidas = respostaAluno.opcoesEscolhidas.sort((a, b) => a - b) //> lista de números que identificam as opções marcadas como verdadeiras ou selecionadas numa escolha múltipla
    let solucao = solucoes.filter(q => q.id === respostaAluno.idQuestao)[0] //> questão relativa à respostaAluno
    let opcoesCorrectas = solucao.opcoes.filter(q => q.correcta === true).map(q => q.id).sort((a, b) => a - b) //> solução desta questão de escolha múltipla ou VF
    let estaCorrecta = listasIguais(opcoesCorrectas,opcoesEscolhidas) //> verifica a igualdade entre as opções correctas e as opções marcadas pelo aluno
    return estaCorrecta ? solucao.cotacao : solucao.desconto
}

/**
 * Corrige uma resolução de uma prova
 * 
 */
module.exports.corrigeResolucao = async (resolucao) => {
    let idProva = resolucao.idProva
    let idVersao = resolucao.idVersao
    let solucoes = await ProvasController.getQuestoesOfVersaoOfProva(idProva, idVersao)
    let respostas = resolucao.respostas
    for (let i = 0; i < respostas.length; i++) {
        let resposta = respostas[i]
        resposta.cotacao = verificaQuestao(resposta, solucoes)
    }
}

/**
 * Corrige todas as resoluções de uma prova
 */
module.exports.corrigeProva = async (idProva) => {
    try {
        let resolucoes = await this.getResolucoesOfProva(idProva)
        for (let i = 0; i < resolucoes.length; i++) {
            let resolucao = resolucoes[i]
            await this.corrigeResolucao(resolucao)
            let idResolucao = resolucao._id //> tipo: ObjectId
            delete resolucao._id //> para evitar problemas de reescrita de _id no mongodb
            console.log(resolucao)
            await ResolucoesModel.collection.updateOne({ _id: idResolucao }, {$set: resolucao})
        }
        return true
    } catch (error) {
        throw error
    }

}
