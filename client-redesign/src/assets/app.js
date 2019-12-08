import io from "socket.io-client";
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

const SUCCESSFUL = "connected";
const DISCONNECTED = "disconnected";
const FAILED = "failed";
const ENDPOINT = "https://www.toonin.ml:8443/";

// ATTN: Uncomment accordingly for local/remote dev
var socket = io(ENDPOINT, { secure: true });
// var socket = io("http://127.0.0.1:8100");

var incomingStream = null;
var audioElem, playBtn, titleTag, disconnectBtn;
var state = null;

/**
 * 
 * @param {any} vueDataRef Reference to the main vue object
 * @param {HTMLAudioElement} audioElement reference to <audio> tag on page for playback
 * @param {any} playRef <v-btn> for manual audio playback by the user, revealed when auto playback is not possible
 */
export function init(vueDataRef, audioElement, playRef, titleRef, disconnectRef) {
    playBtn = playRef;
    audioElem = audioElement;
    titleTag = titleRef;
    state = vueDataRef;
    disconnectBtn = disconnectRef;
    // bind window close event to handler to notify backend of client
    // disconnection
    window.onbeforeunload = (event) => { onCloseHandler(); }
    var key = window.location.pathname;
    if (key !== '/') {
        checkstream(null, key.substr(1, key.length));
    }

    setSocketListeners = setSocketListeners.bind(this);
    createAnswer = createAnswer.bind(this);
}

// notify backend of client leaving
function onCloseHandler() { socket.emit('logoff', { from: socket.id, to: state.room }); }

/**
 * Update the program state variables with new values of the newState object.
 * If a variable in newState is not part of the program state, it is ignored.
 * 
 * @param {Object} newState object with state variables and new values that will
 *                          be updated
 */
function updateState(newState) {
    var alteredVars = Object.keys(newState);
    for (var i = 0; i < alteredVars.length; i++) {
        if (alteredVars[i] in state) {
            state[alteredVars[i]] = newState[alteredVars[i]];
        }
    }

}

export function enablePlayback() { this.$refs.audio.muted = false; }

export function updateVolume() { audioElem.volume = state.volume / 100; }

/**
 * Callback for disconnect button to disconnect from the current stream.
 * Resets the state of the app.
 */
export function disconnectStream() {
    socket.emit('logoff', { from: socket.id, to: state.room });
    state.rtcConn.close();
    audioElem.srcObject = null;
    incomingStream = null;
    disconnectBtn.$refs.link.hidden = true;
    updateState({
        established: false,
        room: "",
        roomFound: false,
        peerID: "",
        streamTitle: "",
        isPlaying: false
    });

    titleTag.innerText = state.streamTitle;
}

/**
 * callback for <v-btn>.onclick for manual audio playback
 */
export function manualPlay() {
    logMessage('user played manually');
    audioElem.srcObject = incomingStream;
    audioElem.play();
    updateState({ isPlaying: audioElem.srcObject.active });
    disconnectBtn.$refs.link.hidden = false;
}

/**
 * 
 * @param {any} msg log 'msg' to console
 */
export function logMessage(msg) { console.log(msg); }

/**
 * search for the room with 'roomID'. If room exists, connect the user.
 * else, do nothing. (In future, notify user of invalid id)
 * 
 */
export function checkstream() {

    fetch(ENDPOINT + state.room)
        .then(res => res.json())
        .then(res => checkStreamResult(res))
        .catch(err => logMessage(err));
}

/**
 * respond to the result sent by server after roomID search. if successful,
 * connect the user to the room and play audio (update state as well), else do nothing
 * 
 * @param {String} result server response for the roomID provided by the user
 */
export function checkStreamResult(result) {

    if (result === "SUCCESS") {
        updateState({ roomFound: true });
        logMessage("Active session with ID: " + state.room + " found!");
        socket.emit("new peer", state.room);
        setSocketListeners(socket);

        const rtcConn = new RTCPeerConnection(servers, { optional: [{ RtpDataChannels: true }] });
        attachRTCliteners(rtcConn);

        updateState({
            rtcConn: rtcConn,
            peerID: socket.id
        });

    } else {
        updateState({
            room: "",
            established: false
        })
    }
}

/**
 * Callback for onmessage event for webRTC data channel
 * @param {event} messageEvent webRTC data channel message event
 */
function onDataChannelMsg(messageEvent) {
    // data channel to recieve the media title
    try {
        var mediaDescription = JSON.parse(messageEvent.data);
        updateState({ streamTitle: mediaDescription.title });

        if (state.streamTitle.length > 0) {
            titleTag.innerText = state.streamTitle;
            if (state.streamTitle.length <= 41) {
                titleTag.classList.remove('title-text');
                titleTag.classList.add('title-text-no-animation');
            }
            else {
                titleTag.classList.remove('title-text-no-animation');
                titleTag.classList.add('title-text');
            }
        }
    } catch (err) { logMessage(err); }
}

/**
 * attach listeners for webRTC peer connection events
 * @param {RTCPeerConnection} rtcConn RTCPeerConnection object to attach listeners to
 */
function attachRTCliteners(rtcConn) {
    rtcConn.onicecandidate = event => {
        if (!event.candidate) {
            logMessage("No candidate for RTC connection");
            return;
        }
        socket.emit("peer new ice", {
            id: socket.id,
            room: state.room,
            candidate: event.candidate
        });
    }

    rtcConn.onconnectionstatechange = (ev) => {
        if (rtcConn.connectionState === SUCCESSFUL) {
            updateState({ established: true });
        }

        if (rtcConn.connectionState == DISCONNECTED ||
            rtcConn.connectionState == FAILED) {
            updateState({
                established: false,
                isPlaying: false,
                streamTitle: ""
            });

            titleTag.classList.remove('title-text');
            titleTag.classList.add('title-text-no-animation');
            titleTag.innerText = "";

            disconnectBtn.$refs.link.hidden = true;
        }
    }

    rtcConn.ondatachannel = (event) => {
        var channel = event.channel;
        channel.onmessage = onDataChannelMsg;
    }
    //onDataChannelMsg;


    rtcConn.onaddstream = event => {
        logMessage("Stream added");
        incomingStream = event.stream;
        disconnectBtn.$refs.link.hidden = false;
        audioElem.oncanplay = () => {
            audioElem.srcObject = incomingStream;
            audioElem.onplay = () => {
                updateState({
                    established: true,
                    isPlaying: audioElem.srcObject.active,
                    stream: incomingStream
                });
            }

            audioElem.play().catch = (err) => { playBtn.$refs.link.hidden = false; }

        }
    }

    rtcConn.ontrack = (event) => {

        logMessage('track added');
        incomingStream = new MediaStream([event.track]);

        var _iOSDevice = !!navigator.platform.match(/iPhone|iPod|iPad|Macintosh|MacIntel/);
        if (_iOSDevice) {
            playBtn.$refs.link.hidden = false;
            audioElem.srcObject = incomingStream;
            audioElem.onplay = () => {
                updateState({
                    established: true,
                    isPlaying: audioElem.srcObject.active,
                    stream: incomingStream
                });
            }
        } else {
            audioElem.srcObject = incomingStream;
            audioElem.onplay = () => {
                updateState({
                    established: true,
                    isPlaying: audioElem.srcObject.active,
                    stream: incomingStream
                });
            }

            audioElem.play().catch = (err) => { playBtn.$refs.link.hidden = false; }
        }

        disconnectBtn.$refs.link.hidden = false;
    }
}


/**
 * Initialize socket listeners necessary to establish communication 
 * betweeen backend and the web app
 * 
 * @param {io} socket socket connection to the backend
 */
function setSocketListeners(socket) {
    socket.on("src ice", iceData => {
        logMessage(`Received new ICE Candidate from src for peer: ${iceData.id} in room: ${iceData.room}`);
        logMessage(`I have id: ${socket.id} and room: ${state.room}`);
        if (iceData.room !== state.room || iceData.id !== socket.id) {
            logMessage("ICE Candidate not for me");
            return;
        }
        state.rtcConn
            .addIceCandidate(new RTCIceCandidate(iceData.candidate))
            .then(logMessage("Ice Candidate added successfully"))
            .catch(err => logMessage(`ERROR on addIceCandidate: ${err}`));
    });

    socket.on("src desc", descData => {
        logMessage(`Received description from src for peer: ${descData.id} in room: ${descData.room}`);
        logMessage(`I have id: ${socket.id} and room: ${state.room}`);
        if (descData.room !== state.room || descData.id !== socket.id) {
            logMessage("ICE Candidate not for me");
            return;
        }
        state.rtcConn.setRemoteDescription(new RTCSessionDescription(descData.desc)).then(() => {
            logMessage("Setting remote description success");
            createAnswer(descData.desc);
        });
    });
}

/**
 * respond to the backend server with description 'desc'.
 * This is called after receiving some msg from server.
 * 
 * @param {any} desc 
 */
function createAnswer(desc) {
    const roomID = state.room;
    state.rtcConn.createAnswer().then(desc => {
        //preferOpus(desc.sdp);
        logMessage("Answer created");
        state.rtcConn.setLocalDescription(new RTCSessionDescription(desc)).then(function () {
            logMessage("Local description from answer set");
            socket.emit("peer new desc", {
                id: socket.id,
                room: roomID,
                desc: desc
            });
        });
    });
}
