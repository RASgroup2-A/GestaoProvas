const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

const preencherEspacosSchema = new mongoose.Schema({
    idOpcao: Number,
    resposta: String
})

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
    respostasPreencherEspacos: { //> aqui a ordem é importante por isso deve precisar de um id
        type: [preencherEspacosSchema],
        default: []
    },
    opcoesEscolhidas: {
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
}, { collection: 'resolucoes' })

module.exports = mongoose.model('resolucao', resolucaoSchema)

/*
{
    idAluno: ObjectId
    idProva: objectid
    idVersao: objectid
    respostas: [
        {
            idQuestao: objectid
            cotacao: int
            respostaAberta: String, // resposta aberta escrita pelo aluno
            opcoesEscolhidas: [
                {
                    text
                }
            ]
        }
    ]
}
*/
