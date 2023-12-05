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
    alunos: [String],
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
    docentes: [String],
    unidadeCurricular: String,
    retrocesso: Boolean,
    aleatorizacao: Boolean,
    versoes: {
        type: [versaoSchema],
        default: []
    }
}, {collection: 'provas'})

/*
{
    _id: String
    nome: str
    docentes: [idsDocentes]
    unidadeCurricular: String
    retrocesso: bool
    versões: [
        {
            _id: String,
            numVersao: Int,
            alunos: [idsAlunos],
            sala: idSala,
            data: Datetime,
            questoes: [
                {
                    _id: objid
                    descricao: String
                    imagem: bytes
                    tipo: Int // ajuda no frontend
                    cotação: Int
                    desconto: Int
                    opcoes: [ // escolha múltipla e V/F
                        {
                            texto: Str
                            correcta: bool
                        }
                    ]
                    espaços
                }
            ]
        }
    ]
}
*/

module.exports = mongoose.model('prova', provaSchema)