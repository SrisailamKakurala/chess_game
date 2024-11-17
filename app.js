const express = require('express');
const socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();
const server = http.createServer(app);

// By passing the Express app to the http.createServer method, 
// you are instructing Node.js to use the Express app to handle HTTP requests. 
// This does not duplicate the app but instead wraps it with an HTTP server that can handle 
// lower-level network operations required by Socket.IO. The resulting server object is an HTTP server 
// that knows how to delegate incoming requests to the Express app.
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = 'w';

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));


app.get("/", (req, res) => {
    res.render("index", {title: "Chess Game"});
})


io.on("connection", (socket) => {
    console.log("connected")

    if (!players.white) {
        players.white = socket.id;
        socket.emit("playerRole", "w");
    }else if(!players.black) {
        players.black = socket.id;
        socket.emit("playerRole", "b");
    }else{
        socket.emit("spectatorRole");
    }

    socket.on('disconnect', () => {
        if(socket.id == players.white) {
            delete players.white;
        }else if(socket.id == players.black){
            delete players.black
        }
    })

    socket.on("move", (move) => {
        try{
            if(chess.turn() === 'w' && socket.id !== players.white) return;
            if(chess.turn() === 'b' && socket.id !== players.black) return;

            const result = chess.move(move);
            if(result) {
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            }else{
                console.log("invalid move: ", move);
                socket.emit("invalid move");
            }
        }catch(err) {
            console.log(err)
            socket.emit("Invalid move: ", move);
        }
    })
})


server.listen(3000, () => {
    console.log("server started")
});
