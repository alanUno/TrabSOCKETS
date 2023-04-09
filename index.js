const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Conexão com o banco de dados
const db = 'mongodb://localhost:27017/local';

mongoose.connect(db, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
    } else {
        console.log('Conectado ao banco de dados');
    }
});

// Definir o modelo de mensagens
const Mensagem = mongoose.model('Mensagem', {
    nome: String,
    mensagem: String,
    canal: String
});

// Configurar o servidor
app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Obter todas as mensagens do banco de dados
app.get('/mensagens', (req, res) => {
    Mensagem.find({}, (err, mensagens) => {
        if (err) {
            console.error('Erro ao obter mensagens:', err);
            res.sendStatus(500);
        } else {
            res.send(mensagens);
        }
    });
});

io.on('connection', (socket) => {
    console.log('Usuário conectado');

    socket.on('join', (canal) => {
        socket.join(canal);
        console.log(`Usuário entrou no canal ${canal}`);
    });

    socket.on('mensagem', (msg) => {
        console.log(`Mensagem enviada no canal ${msg.canal}: ${msg.mensagem}`);
        io.to(msg.canal).emit('mensagem', msg);
        const mensagem = new Mensagem({
            nome: msg.nome,
            mensagem: msg.mensagem,
            canal: msg.canal
        });
        mensagem.save((err) => {
            if (err) {
                console.error('Erro ao salvar mensagem:', err);
            } else {
                console.log('Mensagem salva com sucesso');
            }
        });
    });

    socket.on('disconnect', () => {
        console.log('Usuário desconectado');
        const rooms = Object.keys(socket.rooms);
        rooms.forEach((room) => {
            if (room !== socket.id) {
                socket.leave(room);
                console.log(`Usuário saiu do canal ${room}`);
            }
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Listen on ${PORT}`);
});
