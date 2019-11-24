import Vue from 'vue';
import App from './App.vue';

// new Vue({
//   el: '#app',
//   render: h => h(App)
// });

const port = chrome.runtime.connect({
    name: "toonin-extension"
});

const shareButton = document.getElementById("btnShare");
const stopSharingButton = document.getElementById("btnShareStop");
const sessionIDText = document.getElementById("roomText");
const roomDiv = document.getElementById("roomDiv");
const newMessage = "";
const copyButton = document.getElementById("btnCopy");
const roomNameInput = document.getElementById("roomNameInput");
const connectionState = document.getElementById("connectionState");

copyButton.style.display = "none";
stopSharingButton.style.display = "none";
const playButton = document.getElementById("playRoom");
const roomNameToonin = document.getElementById("tooninToRoom");
const stopToonin = document.getElementById("stopToonin");
// mute control elements
const muteBtn = document.getElementById("mute-btn");
const muteStatus = document.getElementById("muted-notif");
// listener count
const peerCounter = document.getElementById("peerCounter");
const roomNameSpan = document.getElementById("roomNameSpan");
const connectSpan = document.getElementById("connectSpan");
const muteSpan = document.getElementById("muteSpan");
const titleSpan = document.getElementById("titleOfPage");
const titleText = document.getElementById("titleText");
const volume = document.getElementById("volume");
muteBtn.onclick = function() {
    muteStatus.hidden = !this.checked;
    port.postMessage({
        type: "toggleMute",
        value: !this.checked
    });
}


volume.onchange = (event) => {
    port.postMessage({
        type: "volume",
        value: event.target.value
    });
}

shareButton.onclick = () => {
    var roomName = roomNameInput.value;
    port.postMessage({
        type: "init",
        roomName: roomName
    });
};

stopSharingButton.onclick = () => {
    port.postMessage({ type: 'stopSharing' });
    hideElements();
    homePage();
    titleText.innerHTML = "";
}

var roomID;

port.onMessage.addListener((msg) => {
    console.log(msg);
    if (msg.type == "audio") {
        if (msg.status == "ok") localAudio.src = msg.url;
    } else if (msg.type == "roomID") {
        roomID = msg.roomID;

        Text.innerHTML = "Your Toonin ID is: \n" + roomID;
        sessionIDText.style.display = "block";
    }
    else if(msg.type === "room creation fail") {
        sessionIDText.innerHTML = "Room Creation Failed: \n" + msg.reason;
        roomDiv.style.display ="block";
        console.log("failed");
    }
});

copyButton.onclick = () => {
    var str = roomID;
    // Create new element
    var el = document.createElement('textarea');
    // Set value (string to be copied)
    el.value = str;
    // Set non-editable to avoid focus and move outside of view
    el.setAttribute('readonly', '');
    el.style = {position: 'absolute', left: '-9999px'};
    document.body.appendChild(el);
    // Select text inside element
    el.select();
    // Copy text to clipboard
    document.execCommand('copy');
    // Remove temporary element
    document.body.removeChild(el);
};



playButton.onclick = () => {
    port.postMessage({
        type: "play",
        roomName: roomNameToonin.value
    });
    roomNameToonin.value="";
}

stopToonin.onclick = () => {
    port.postMessage({
        type: "stopToonin"
    });
    hideElements();
    homePage();
    titleText.innerHTML = "";
}

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_extension"});
});

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message === "extension_state_from_background" && request.data.roomID) {
        roomNameSpan.style.display = "none";
        shareButton.style.display = "none";
        stopSharingButton.style.display = "block";
        copyButton.style.display = "block";
        playButton.style.display = "none";
        stopToonin.style.display = "none";
        connectSpan.style.display = "none";
        roomID=request.data.roomID;
        muteSpan.style.display = "flex";
        muteBtn.checked = request.data.muted;
        muteStatus.hidden = !muteBtn.checked;
        sessionIDText.innerHTML = "Your Toonin ID is: \n" + roomID;
        roomDiv.style.display = "block";
        peerCounter.style.display = "block";
        peerCounter.innerHTML = "You have " + request.data.peerCounter + " listeners.";
        volume.value = request.data.volume * 100;
        volume.disabled=request.data.tabMute;
        roomNameSpan.style.display = "none";
        btnShare.style.display = "none";
        titleText.innerHTML = "Currently streaming: " + request.data.title;
        volume.style.display = "block";
        connectionState.style.display = "none";
        
    }
    else if (request.message === "extension_state_from_background" && !request.data.roomID && request.data.playing) {
        roomNameSpan.style.display = "none";
        shareButton.style.display = "none";
        stopSharingButton.style.display = "none";
        copyButton.style.display = "none";
        roomNameToonin.value = request.data.room;
        muteSpan.style.display = "none";
        muteBtn.checked = request.data.muted;
        muteStatus.hidden = !muteBtn.checked;
        roomID=null;
        roomDiv.style.display = "flex";
        peerCounter.style.display = "block";
        peerCounter.innerHTML = "Tooned into room "+request.data.room;
        stopToonin.style.display = "block";
        playButton.style.display = "none";
        titleText.innerHTML = "Host is listening to: " + request.data.hostTitle;
        volume.style.display = "block";
        connectionState.style.display = "inline-block";
        switch(request.data.connectionState) {
            case "connected":
                    connectionState.style.backgroundColor = 'rgb(0, 255, 0)';
                    break;
            case "connecting":
                    connectionState.style.backgroundColor = 'rgb(255, 255, 0)';
                    break;
            case "disconnected":
                    connectionState.style.backgroundColor = 'rgb(255, 0, 0)';
                    break;
            case "failed":
                    // One or more transports has terminated unexpectedly or in an error
                    connectionState.style.backgroundColor = 'rgb(255, 0, 0)';
                    break;
            case "closed":
                    // The connection has been closed
                    connectionState.style.backgroundColor = 'rgb(255, 0, 0)';
                    break;
        }
    } else if (request.message === "extension_state_from_background" && !request.data.roomID && !request.data.playing) {
        roomNameToonin.disabled = false;
        // playButton.style.display = "block";
        // stopToonin.style.display = "block";
        // connectSpan.style.display = "block";
        // muteSpan.style.display = "none";
        muteBtn.checked = request.data.muted;
        muteStatus.hidden = !muteBtn.checked;
        roomID=null;
        roomDiv.style.display = "none";
        titleText.innerHTML = "";
        connectionState.style.display = "none";
    }
  });

  function homePage() {
      roomNameSpan.style.display = "flex";
      shareButton.style.display = "flex";
      roomDiv.style.display = "flex";
      connectSpan.style.display = "flex";
      playButton.style.display = "flex";
      shareButton.alignItems = "center";
      sessionIDText.innerHTML= "";
      sessionIDText.style.display = "none";
      volume.stlyle.display = "none";
      connectionState.style.visibility = "none";
  }
  function hideElements() {
      muteBtn.style.display = "none";
      stopToonin.style.display = "none";
      muteSpan.style.display = "none";
      stopSharingButton.style.display = "none";
      copyButton.style.display = "none";
      peerCounter.style.display = "none";
      roomDiv.style.display = "none";
      volume.style.display = "none";
      connectionState.style.display = "none";
  }
  hideElements();
