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

module.exports.getResolucaoOfAluno = async (idAluno,idProva) => {
    let res = await ResolucoesModel.collection.find({idAluno: idAluno, idProva: idProva}).toArray()
    res = res[0]
    return res
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

function verificaQuestaoTipo1(resposta, solucao) {
    let correta = true

    //lista de numeros
    let opcoesEscolhidas = resposta.opcoesEscolhidas

    let numCorretas = 0

    //mapa de id's de opcao para bool
    const optionMap = new Map()

    //itera sobre uma lista de opcaoSchema
    solucao.opcoes.forEach(element => {
        optionMap.set(element.id, element.correcta)
        numCorretas += element.correcta ? 1 : 0
    });

    if (opcoesEscolhidas.length != numCorretas) {
        correta = false
    } else {
        //tem que ter todas corretas para ter a potuaçao
        opcoesEscolhidas.forEach(element => {
            correta = correta && optionMap.get(element)
        });
    }
    return correta
}

function verificaQuestaoTipo2(resposta, solucao) {
    
    console.log("questao do tipo 2")

    let correta = true

    //lista de opcoesSchema
    let respostasPreencherEspacos = resposta.respostasPreencherEspacos

    //mapa de id's de opcao para String
    const patternMap = new Map()

    //itera sobre uma lista de opcaoSchema
    solucao.opcoes.forEach(element => {

        patternMap.set(element.id, new RegExp(element.pattern))

    });

    if (respostasPreencherEspacos.length != solucao.opcoes.length) {
        correta = false
    } else {
        //tem que ter todas corretas para ter a potuaçao
        respostasPreencherEspacos.forEach(element => {

            let pattern = patternMap.get(element.idOpcao)

            console.log("pattern:")
            console.log(pattern)

            console.log("resposta:")
            console.log(element.resposta)

            console.log("regex test:")
            console.log(pattern.test(element.resposta))

            correta = correta && pattern.test(element.resposta)

        });
    }
    return correta
}


/**
 * Verifica se uma resposta de um aluno está correcta. Se estiver, devolve a cotação da pergunta. Se não estiver, devolve o desconto da pergunta.
 * !Não é exportada pelo módulo
 */
function verificaQuestao(resposta, solucao) {
    //resposta -> respostaSchema
    //solucao -> questaoSchema
    
    let correta = true

    correta = verificaQuestaoTipo1(resposta, solucao)

    return correta ? solucao.cotacao : -Math.abs(solucao.desconto)
}

/**
 * Corrige uma resolução de uma prova
 * 
 */
module.exports.corrigeResolucao = async (resolucao) => {

    let idProva = resolucao.idProva
    let idVersao = resolucao.idVersao

    //lista de questaoSchema
    let questoes = await ProvasController.getQuestoesOfVersaoOfProvaUnwound(idProva, idVersao)

    //mapa de id's de questao para questaoSchema
    const solMap = new Map()

    //copiar todos os elemtos para um mapa 
    //para evitar filtrar todos os ciclos
    questoes.forEach(element => {
        solMap.set(element.id, element)
    });

    //lista de respostaSchema
    let respostas = resolucao.respostas // list of respostas

    for (let i = 0; i < respostas.length; i++) {
        //respostaSchema
        let resposta = respostas[i]

        //questaoSchema
        let solucao = solMap.get(resposta.idQuestao)

        resposta.cotacao = verificaQuestao(resposta, solucao)
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
            await ResolucoesModel.collection.updateOne({ _id: idResolucao }, { $set: resolucao })
        }
        return true
    } catch (error) {
        throw error
    }

}
