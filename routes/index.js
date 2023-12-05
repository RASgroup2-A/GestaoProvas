var express = require('express');
var router = express.Router();
const ProvasController = require('../Controllers/Provas');

function verificaDocenteToken(req, res, next) {
    var token = req.body.token;
    if (/*!! VERIFICAR VALIDADE DO TOKEN */ true) {
        next();
    } else {
        res.status(401).send({msg: 'Token inválido.'});
    }
}

/**
 *+O MVP deve permitir:
 *+Aos Docentes criar Provas compostas por Questões de Escolha Múltipla;
 *+Aos Alunos dar Resposta a uma Prova (i.e., realizar uma Prova);
 *+Aos Docentes espoletar a correção automática das Respostas dadas;
 *+Aos Alunos consultar as Respostas dadas a uma Prova, e respetiva Avaliação.
 */

//> Rota para criar uma prova
//> parece funcionar
router.post('/provas', verificaDocenteToken, function (req, res, next) {
    ProvasController.addProva(req.body)
    .then(result => {
        res.jsonp(result)
    })
    .catch(err => {
        //> Código 500: Internal Server Error
        res.status(500).jsonp({ msg: err.message });
    })
})

//> Rota para verificar se existe uma prova com o nome fornecido (validação de nomes de provas)
//> funciona
router.get('/provas/checkname', function (req, res, next) {
    //> Envolve uma querystring, logo a rota é assim: http://localhost:7777/provas/checkname?name=<nome_da_prova>
    let name = req.query ? req.query.name : undefined;
    if (name) {
        ProvasController.existsProvaName(name)
        .then(result => {
            res.jsonp(result)
        }).catch(err => {
            res.status(500).jsonp({ msg: err.message });
        });
    } else {
        //> Código 400: Bad Request
        res.status(400).jsonp({msg: 'É necessário informar o nome da prova na querystring.'});
    }
})

//> Rota para obter uma prova dado o seu id
//> funciona
router.get('/provas/:id', function (req, res, next) {
    ProvasController.getProva(req.params.id)
    .then(result => {
        res.jsonp(result)
    })
    .catch(err => {
        //> Código 500: Internal Server Error
        res.status(500).jsonp({msg: err.message});
    })
})

//> Rota para inserir uma questão numa versão de uma prova
//> parece funcionar
router.post('/provas/:idProva/versao/:idVersao/questoes', verificaDocenteToken, function (req, res, next) {
    let questao = req.body
    ProvasController.addQuestaoToProva(req.params.idProva, req.params.idVersao, questao)
    .then(result => {
        res.jsonp(result)
    })
    .catch(err => {
        //> Código 500: Internal Server Error
        res.status(500).jsonp({ msg: err.message });
    })
})

//! ROTA PARA DEBUG E TESTES
router.get('/debug', function (req, res, next) {
    ProvasController.biggestIdOfProvaVersions('656e5d1eab78269718bbbe1d')
    .then(result => {
        res.jsonp(result)
    })
    .catch(err => {
        //> Código 500: Internal Server Error
        res.status(500).jsonp({msg: err.message});
    })
})

module.exports = router;
