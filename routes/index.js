var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/*
Rotas:
    - validar nome da prova
    - criar prova (POST, dados: nome, horários, alunos)
    - inserir questões (POST, dados {versão, horário (sala+hora+alunos), [questões]})
    - obter as provas de um docente (GET, idDocente)
    - efectuar correcção automática de uma certa prova (GET, idprova)
    - submeter a correcção de uma prova (PUT, idProva, idAluno, )
*/
router.post('/provas', function(req, res, next){
    
})

module.exports = router;
