const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

//> Schema de uma opção de escolha múltipla ou V/F
const opcaoSchema = new mongoose.Schema({
    id: Number,
    texto: String,
    correcta: Boolean
})

//> Schema de uma questão da prova
const questaoSchema = new mongoose.Schema({
    id: Number,
    descricao: String,
    // imagem: Buffer, //! Ver melhor isto!!
    tipo: Number,
    cotacao: Number,
    desconto: {
        type: Number,
        default: 0
    },
    opcoes: { //> Campo opcional
        type: [opcaoSchema], 
        default: []
    }
})

//> Schema de uma versão da prova
const versaoSchema = new mongoose.Schema({
    id: Number,
    numVersao: Number,
    alunos: {
        type: [String],
        default: []
    },
    sala: String,
    data: Date,
    questoes: {
        type: [questaoSchema],
        default: []
    }
})

//> Schema de uma prova
const provaSchema = new mongoose.Schema({
    _id: ObjectId,
    nome: String,
    docentes: {
        type: [String],
        default: []
    },
    unidadeCurricular: String,
    retrocesso: Boolean,
    aleatorizacao: Boolean,
    versoes: {
        type: [versaoSchema],
        default: []
    }
}, {collection: 'provas'})

module.exports = mongoose.model('prova', provaSchema)