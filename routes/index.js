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

/*
Rotas:
    - validar nome da prova
    - criar prova (POST, dados: nome, horários, alunos)
    - inserir questões (POST, dados {versão, horário (sala+hora+alunos), [questões]})
    - obter as provas de um docente (GET, idDocente)
    - efectuar correcção automática de uma certa prova (GET, idprova)
    - submeter a correcção de uma prova (PUT, idProva, idAluno, )
*/
router.post('/provas', verificaDocenteToken, function(req, res, next){
    ProvasController.addProva(req.body)
    .then(result => {
        res.jsonp(result)
    })
    .catch(err => {
        res.status(500).jsonp({msg: err.message});
    })
})

router.get('/provas/:id', function(req, res, next){
    ProvasController.getProva(req.params.id)
    .then(result => {
        res.jsonp(result)
    })
    .catch(err => {
        res.status(500).jsonp({msg: err.message});
    })
})


module.exports = router;
