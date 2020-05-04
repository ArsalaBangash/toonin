/* eslint-disable no-console */
"use strict";
var express = require("express");
var app = express();
var cors = require("cors");
app.use(cors());
var http = require("http").Server(app);
var io = require("socket.io")(http);
const history = require("connect-history-api-fallback");
const RoomManager = require("./RoomManager").RoomManager;
const SocketManager = require("./SocketManager").SocketManager
const MAX_CLIENTS_PER_HOST = 2;

const roomManager = new RoomManager();
const socketManager = new SocketManager();

const port = process.env.PORT || 8443;

app.get("*", function(req, res, next) {
  if (req.headers["x-forwarded-proto"] !== "https") {
    res.redirect("https://" + req.headers.host + req.url);
  } else {
    next(); /* Continue to other routes if we're not redirecting */
  }
});

//Socket create a new "room" and listens for other connections
io.on("connection", (socket) => {
  socket.on("create room", (req) => {
    if (roomManager.createRoom(socket, req.room, req.isDistributed)) {
      socketManager.addSocket(socket,req.room)
    }
  });

  socket.on("new peer", (roomID) => {
    const room = roomManager.getRoom(roomID);
    if (room) {
      if (room.room.getConnectableNodes) {
        const potentialHosts = room.room.getConnectableNodes();
        socket.emit("host pool", { potentialHosts, roomID });
      } else {
        socket.join(roomID, () => {
          console.log("Peer connected successfully to room: " + roomID);
          socket.to(roomID).emit("peer joined", {
            room: roomID,
            id: socket.id,
          });
        });
      }
    } else {
      console.log("invalid room");
      socket.emit("room null");
    }
  });

  socket.on("host eval res", (res) => {
    if (res.evalResult.hostFound) {
      const room = res.evalResult.room;
      console.log("Res room: " + room);
      socket.join(room, () => {
        console.log("Peer connected successfully to room: " + room);
        io.to(res.evalResult.selectedHost).emit("peer joined", {
          room,
          id: socket.id,
          hostID: res.evalResult.selectedHost,
        });
        socket.to(room).emit("chatFromServer", res.name + " has joined.");
        socket.emit("chatFromServer", "You have joined the room " + room + ".");
        socketManager.addSocket(socket, room, res.name)
      });
    }
  });

  socket.on("src new ice", (iceData) => {
    console.log(
      `Received new ICE Candidate from src for peer: ${iceData.id} in room: ${iceData.room}`
    );
    io.to(iceData.id).emit("src ice", iceData);
  });

  socket.on("peer new ice", (iceData) => {
    console.log(
      `Received new ICE Candidate for peer: ${iceData.id} in room: ${iceData.room}`
    );
    io.to(iceData.hostID).emit("peer ice", iceData);
  });

  socket.on("src new desc", (descData) => {
    console.log(
      `Received description from src for peer: ${descData.id} in room: ${descData.room}`
    );
    io.to(descData.id).emit("src desc", descData);
  });

  socket.on("peer new desc", (descData) => {
    console.log(
      `Received answer description from peer: ${descData.id} in room: ${descData.room}`
    );
    io.to(descData.selectedHost).emit("peer desc", descData);
    if (descData.renegotiation) {
      const room = roomManager.getRoom(descData.room);
      if (room.room.addNode) {
        if(room.room.addNode(descData.id, MAX_CLIENTS_PER_HOST, descData.selectedHost)) {
          io.to(room.hostId).emit("PeerCount", socketManager.getSocketCountInRoom(descData.room))
        }
      }
    }
  });

  socket.on("title", (title) => {
    console.log(title);
    io.to(title.id).emit("title", title.title);
  });

  socket.on("logoff", (req) => {
    console.log('Log off request from ' + req.name)
    SocketDisconnect(req, socket) 
  });

  socket.on("disconnect room", (req) => {
    SocketDisconnect(req, socket) 
  });

  socket.on("disconnect", () => {
    console.log("user disconnected " + socket.id);
    const socketInfo = socketManager.getSocket(socket.id)
    var result = SocketDisconnect(socketInfo, socket)
    console.log("user disconnected " + result);
  });

  socket.on("message", (req) => {
    socket.to(req.room).emit("chatIncoming", req);
  });
});

/**
 * Handle socket disconnect
 * @param {Object} req request object from client.
 * @param {SocketIOClient.Socket} socket socket object.
 * @return {Boolean} Indicated if socket was deleted
 */
function SocketDisconnect(req, socket) {
  if (roomManager.deleteRoom(socket.id)) {
    console.log("closing room " + req.room);
    socket.to(req.room).emit("chatFromServer", "room being closed.");
    socketManager.removeSocket(socket.id)
    return true
  } else {
    if (req && req.room) {
      const room = roomManager.getRoom(req.room);
      if (room && room.room.removeNode) {
        room.room.removeNode(socket, socket.id, req.room, room.room);
        socketManager.removeSocket(socket.id)
        io.to(room.hostId).emit("PeerCount", socketManager.getSocketCountInRoom(req.room));
        socket.to(req.room).emit("chatFromServer", req.name + " has left.")
        console.log('REMOVED FROM ROOM' + socket.id)
      }
      return true
    }
  }
  return false
}

app.get("/status", (req, res) => {
  res.send("Server is alive");
});

const staticFileMiddleware = express.static("../app/dist/spa");

app.use(staticFileMiddleware);
app.use(
  history({
    disableDotRule: true,
    verbose: true,
  })
);
app.use(staticFileMiddleware);

app.get("/", function(req, res) {
  res.render("../app/dist/spa/index.html");
});

http.listen(port, () => {
  console.log("http listening on " + port);
});
