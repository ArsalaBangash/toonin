import io from "socket.io-client";

//const ENDPOINT = "http://www.toonin.ml:8100/";
const ENDPOINT = "http://138.51.172.200:8100/";

const servers = {
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302"
        ]
      }
    ]
};

var socket;

var incomingStream = null;
var audioElem;
var playBtn;

export function init(vueDataRef, audioElement, playRef) {
    playBtn = playRef;
    audioElem = audioElement;
    var key = window.location.pathname;
    if(key !== '/') {
        checkstream(null, key.substr(1, key.length), vueDataRef);
    }

    setSocketListeners = setSocketListeners.bind(this);
    createAnswer = createAnswer.bind(this);
}

export function enablePlayback() {
    this.$refs.audio.muted = false;
}

export function manualPlay() {
    logMessage('user played manually');
    audioElem.srcObject = incomingStream;
    audioElem.play();
}

export function logMessage(msg) { console.log(msg); }

export function checkstream(thisClass, roomID, vueDataRef) {
    
    var ref = this || vueDataRef;
    var obj = {
        room: roomID || ref.room,
        isPlaying: null,
        established: null,
        rtcConn: null,
        peerID: null
    };

    fetch(ENDPOINT + obj.room)
        .then(res => res.json())
        .then(res => checkStreamResult(res, obj))
        .then(() => {
            ref.room = obj.room,
            ref.isPlaying = obj.isPlaying,
            ref.established = obj.established,
            ref.rtcConn = obj.rtcConn,
            ref.peerID= obj.peerID;
        })
        .catch(err => logMessage(err));
}

export function checkStreamResult(result, obj) {
    if (result === "SUCCESS") {
        logMessage("Active session with ID: " + obj.room + " found!");
        socket = io(ENDPOINT);
        socket.emit("new peer", obj.room);
        setSocketListeners(socket, obj);
        const rtcConn = new RTCPeerConnection(servers);
        rtcConn.onicecandidate = event => {
            if (!event.candidate) {
                logMessage("No candidate for RTC connection");
                return;
            }
            socket.emit("peer new ice", {
                id: socket.id,
                room: obj.room,
                candidate: event.candidate
            });
        };
        rtcConn.onaddstream = event => {
            logMessage("Stream added");
            logMessage(event.stream);
            audioElem.srcObject = event.stream;	
            //pause = 0;
            console.log(audioElem);
            audioElem.oncanplay = () => {
                audioElem.play().catch((err) => {
                    logMessage(err);
                });
                obj.isPlaying = audioElem.srcObject.active;
            }
        };

        rtcConn.ontrack = (event) => {

            logMessage('track added');
            incomingStream = new MediaStream([event.track]);

            try {
                audioElem.srcObject = incomingStream;
                audioElem.play();
            }
            catch(err) {
                playBtn.$refs.link.hidden = false;
            }
        }
        obj.established = true;
        obj.rtcConn = rtcConn;
        obj.peerID = socket.id;
    } else {
        obj.established = false;
        obj.room = "";
    }
}

export function setSocketListeners(socket, obj) {
    socket.on("src ice", iceData => {
        logMessage(`Received new ICE Candidate from src for peer: ${iceData.id} in room: ${iceData.room}`);
        logMessage(`I have id: ${socket.id} and room: ${obj.room}`);
        if (iceData.room !== obj.room || iceData.id !== socket.id) {
            logMessage("ICE Candidate not for me");
            return;
        }
        obj.rtcConn
            .addIceCandidate(new RTCIceCandidate(iceData.candidate))
            .then(logMessage("Ice Candidate added successfully"))
            .catch(err => logMessage(`ERROR on addIceCandidate: ${err}`));
    });

    socket.on("src desc", descData => {
        logMessage(`Received description from src for peer: ${descData.id} in room: ${descData.room}`);
        logMessage(`I have id: ${socket.id} and room: ${obj.room}`);
        if (descData.room !== obj.room || descData.id !== socket.id) {
            logMessage("ICE Candidate not for me");
            return;
        }
        obj.rtcConn.setRemoteDescription(new RTCSessionDescription(descData.desc)).then(() => {
            logMessage("Setting remote description success");
            createAnswer(descData.desc, obj);
        });
    });
}

export function createAnswer(desc, obj) {
    const roomID = obj.room;
    obj.rtcConn.createAnswer().then(desc => {
        //preferOpus(desc.sdp);
        logMessage("Answer created");
        obj.rtcConn.setLocalDescription(new RTCSessionDescription(desc)).then(function () {
            logMessage("Local description from answer set");
            socket.emit("peer new desc", {
                id: socket.id,
                room: roomID,
                desc: desc
            });
        });
    });
}
