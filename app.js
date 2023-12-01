var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const dotenv = require('dotenv');
dotenv.config();

// Docker mongodb: docker run --name mongodb -d -p 27017:27017 -v mongodb mongo

var mongoose = require('mongoose')
var mongodb = process.env.MONGODB_URL || `mongodb://127.0.0.1/${process.env.DATABASE}`; //! MONGODB_URL definida no docker-compose
mongoose.connect(mongodb, {useNewUrlParser: true, useUnifiedTopology: true})
var db = mongoose.connection
db.on('error', console.error.bind(console, "MongoDB conection error.."))
db.on('open', function() {
  console.log("MongoDB: Conexão estabelecida com sucesso...")
})

var indexRouter = require('./routes/index');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

module.exports = app;
