const mongoose = require('mongoose')

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
            hora: Datetime,
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
