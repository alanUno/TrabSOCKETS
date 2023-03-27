var express = require('express');
var app = express();
var http = require('http');

const server = http.createServer(app);

const { Server } = require('socket.io');

const io = new Server(server);

const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

function enviarMensagem(mensagem){
    $.post('http://127.0.0.1:3000/mensagem', {
        nome: mensagem.nome,
        mensagem: mensagem.mensagem,
        channel: $("#canal").val()
    });
}

io.on('connection', (socket)=>{
    console.log('usuario conectado');

    socket.on('join', (channel) => {
        socket.join(channel);
        console.log('Usuário entrou no canal:', channel);
    });

    socket.on('leave', (channel) => {
        socket.leave(channel);
        console.log('Usuário saiu do canal:', channel);
    });

    socket.on('mensagem', (data)=>{
        console.log(data);
        io.to(data.channel).emit('mensagem', data);
    });
});


var bodyParser = require('body-parser');
db = 'mongodb://localhost:27017/local'

mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Conectado ao banco de dados MongoDB');
  })
  .catch((err) => {
    console.log('Erro ao conectar ao banco de dados MongoDB', err);
  });

var Mensagem = mongoose.model('Mensagem', {nome: String, mensagem: String });


app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/mensagens', (req, res) =>{
    Mensagem.find({},(err, mensagens)=>{
        res.send(mensagens);
    });
});

app.post('/mensagem',(req, res)=> {
    var mensagem = new Mensagem(req.body);
    mensagem.save((err)=>{
        if(err){
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
            io.to(req.body.channel).emit('mensagem', req.body);
        }
    })
    console.log('Mensagem Enviada');
});

server.listen(3000, () => {
    console.log('Server port', server.address().port);
});

