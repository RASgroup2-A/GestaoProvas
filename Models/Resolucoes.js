const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

const respostaSchema = new mongoose.Schema({
    idQuestao: Number,
    cotacao: {
        type: Number,
        default: 0
    },
    respostaAberta: {
        type: String,
        default: ''
    }, //> resposta aberta escrita pelo aluno, campo opcional
    opcoesEscolhidas:{ 
        type: [Number], //> ids opções marcadas como verdadeiras ou seleccionadas numa escolha múltipla, campo opcional
        default: []
    },
})

const resolucaoSchema = new mongoose.Schema({
    _id: ObjectId,
    idAluno: String,
    idProva: String,
    idVersao: Number,
    respostas: [respostaSchema]
}, {collection: 'resolucoes'})

module.exports = mongoose.model('resolucao', resolucaoSchema)
