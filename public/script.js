const socket = io('/');

const videoGrid = document.getElementById('video-grid');

var mainChat = document.getElementById('main-chat');
var mainParticipants = document.getElementById('main-participants');
var messageForm = document.getElementById('message-form');
var messages = document.getElementById('sending-messages');
var notificationMessage = document.getElementById('notification-messages');

var messageFormButton = messageForm.querySelector('button');
var messageFormValue = messageForm.querySelector('input');

// INVITE MODAL
var modal = document.getElementById("myModal");
var span = document.getElementsByClassName("close")[0];
var code = document.getElementById("myCode");
var codeBtn = document.getElementById("copyCodeBtn");

// ALERT MODAL
var Usermodal = document.getElementById("myUserModal");
var close = document.getElementsByClassName("close-span")[0];
var profile = document.getElementById("user-profile");
var mute = document.getElementById("user-mute");

// NOTIFICATION MODAL
var Notificationmodal = document.getElementById("notificationModal");
var closeSpan = document.getElementsByClassName("span-close")[0];

var messageTemplate = document.querySelector("#message-template").innerHTML;
var participantsTemplate = document.querySelector("#participants-template").innerHTML;
var sizeTemplate = document.querySelector("#size-template").innerHTML;
var notificationTemplate = document.querySelector("#notification-template").innerHTML;

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

let myVideoStream;
let userID;
let userdata;
let chatNo = 0;
let notificationNo = 0;
const peers = {};

const myPeer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: '443'
})

var myVideo = document.createElement('video');

socket.on('profile-image', function(user) {
    document.querySelector('.profileImage').srcset = `${ user.profileUrl }`;
})

myVideo.muted = true;

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(function(stream) {
    myVideoStream = stream;
    myVideo.muted = true;
    addVideoStream(myVideo, stream);

    myPeer.on('call', (call) => {
        call.answer(stream);
        const video = document.createElement('video');

        call.on('stream', (userVideoStream) => {
            addVideoStream(video, userVideoStream);
        });
    })

    socket.on('user-connected', function(userId, user) {
        connectToNewUser(userId, stream);
    })
})
    socket.on('newMessage', function(message) {
        if(mainChat.style.display === "none") {
          document.getElementById('lblCartCount').style.display = 'flex';
          chatNo++;
          if(chatNo == 0) {
            document.getElementById('lblCartCount').style.display = "";
          } else {
            document.getElementById('lblCartCount').innerHTML = chatNo;
          }
        } else {
          chatNo = 0;
          document.getElementById('lblCartCount').innerHTML = "";
        }
        const html = Mustache.render(messageTemplate, {
            username: message.from,
            message: message.text,
            createdAt: moment(message.createdAt).format('h:mm A') //rendering message to div inside script tag with id("message-template")
        });
        messages.insertAdjacentHTML('beforeend', html); //inserting the rendered message to the upper div.
    });

myPeer.on('open', function(id) {
    socket.emit('join-room', ROOM_ID, id, currentUser);
})

socket.on('user-disconnected', userId => {
    if(peers[userId])
    peers[userId].close();
})

function leave() {
    socket.emit("user-disconnecting", userID);
    location.href='/';
}

socket.on('no-of-participants', function({ room, users }) {
    var size = users.length;

    const html1 = Mustache.render(sizeTemplate, {
        size
    })

    const html = Mustache.render(participantsTemplate, {
        room,
        users
    })
    document.getElementById("NoOfparticipants").innerHTML = html;
    document.getElementById("size").innerHTML = html1;
})


// Showing user data
socket.on('user-data', function(user, currentuser) {
    if(user.username != currentuser.username)
    window.open('/user/' + user.id, '_blank');
})

// Current User data
socket.on('my-data', function(user) {
    window.open('/myprofile/' + user.id, '_blank');
})

// Alerting specific user
socket.on('alert-message', function(message) {
      if(Notificationmodal.style.display === "block") {
        notificationNo = 0;
        document.getElementById('lblCartCount2').style.display = "none";
      } else {
        notificationNo++;
        document.getElementById('lblCartCount2').style.display = "flex";
        document.getElementById('new-notification').innerHTML = notificationNo;
      }

      var mp3 = '<source src="https://nf1f8200-a.akamaihd.net/downloads/ringtones/files/dl/mp3/samsung-good-news-54001.mp3" type="audio/mpeg">';
				document.getElementById("sound").innerHTML = '<audio autoplay="autoplay">' + mp3 + "</audio>";

    const html = Mustache.render(notificationTemplate, {
        message
    })

    if(notificationMessage.innerHTML === 'No new notifications.') {
      notificationMessage.innerHTML = html;
    } else {
      notificationMessage.innerHTML += html;
    }
})

function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream);
    const video = document.createElement('video');

    call.on('stream', (userVideoStream) => {
        addVideoStream(video, userVideoStream);
    });
    call.on('close', function() {
        video.remove();
    })

    peers[userId] = call;
}

function addVideoStream(video, stream) {
    video.srcObject = stream  //play our video
    video.addEventListener('loadedmetadata', function() {
        video.play();
    })
    if(video) {
        videoGrid.append(video);
    }
}

messageFormButton.addEventListener('click', function(e) {
    e.preventDefault(); //prevent from constantly reloading

    messageFormButton.setAttribute('disabled','disabled');

    socket.emit('createMessage', document.querySelector('input[name="message"]').value, function(error) {
        if(messageFormValue.value != '')
        messageFormButton.removeAttribute('disabled');
        messageFormValue.value = '';
        messageFormValue.focus();
        if(error) {
            return console.log(error);
        }
    });
})

// CHAT
function showChat() {

    if (mainChat.style.display === "none") {
        chatNo = 0;
        document.getElementById('lblCartCount').style.display = 'none';
        document.getElementsByClassName("main__left")[0].style.flex = 0.7;
        document.getElementsByClassName("main__right")[0].style.flex = 0.3;
        mainParticipants.style.flex = 0;
        mainChat.style.display = "flex";
    } else {
        document.getElementsByClassName("main__left")[0].style.flex = 1;
        document.getElementsByClassName("main__right")[0].style.flex = 0;
        mainParticipants.style.flex = 0;
        mainChat.style.display = "none";
    }
    mainParticipants.style.flex = 0;
    mainParticipants.style.display = "none";
}

// No. OF PARTICIPANTS
function participants(e) {
    socket.emit('update-participants', ROOM_ID);
    if (mainParticipants.style.display === "none") {
        document.getElementsByClassName("main__left")[0].style.flex = 0.7;
        mainParticipants.style.display = "flex";
        mainParticipants.style.flex = 0.3;
        document.getElementsByClassName("main__right")[0].style.flex = 0;
    } else {
        document.getElementsByClassName("main__left")[0].style.flex = 1;
        mainParticipants.style.flex = 0;
        mainParticipants.style.display = "none";
        document.getElementsByClassName("main__right")[0].style.flex = 0;
    }
    document.getElementsByClassName("main__right")[0].style.flex = 0;
    mainChat.style.display = "none";
}

// VIDEO ON/OFF
function onoffVideo(e) {
    let enabled = myVideoStream.getVideoTracks()[0].enabled;
    console.log(myVideoStream.getTracks());
    if (enabled) {
        e.firstElementChild.classList.value = 'fa fa-video-slash';
        myVideoStream.getVideoTracks()[0].enabled = false;
    } else {
        e.firstElementChild.classList.value = 'fa fa-video-camera';
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
}

function onoffVoice(e) {
    let enabled = myVideoStream.getAudioTracks()[0].enabled;
    console.log(myVideoStream.getTracks(), myVideoStream.getAudioTracks()[0]);
    if (enabled) {
        e.firstElementChild.classList.value = 'fa fa-microphone-slash';
        myVideo.muted = true;
        myVideoStream.getAudioTracks()[0].enabled = false;
    } else {
        e.firstElementChild.classList.value = 'fa fa-microphone';
        myVideo.muted = true;
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
}

function home() {
  location.href = '/';
}

function myProfile() {
  socket.emit('my-profile', ROOM_ID);
}

function invite(e) {
    // link.value = e.baseURI;
    code.value = ROOM_ID;
    modal.style.display = "block";
}

span.onclick = function() {
    modal.style.display = "none";
    codeBtn.innerHTML = 'Copy code';
}

window.onclick = function(e) {
    if (e.target == Usermodal) {
        Usermodal.style.display = "none";
    }

    if (e.target == Notificationmodal) {
        notificationMessage.innerHTML = '';
        Notificationmodal.style.display = "none";
    }

    if (e.target == modal) {
        modal.style.display = "none";
        codeBtn.innerHTML = 'Copy code';
    }
}

function copyCode() {
    code.select();
    code.setSelectionRange(0, 99999);
    document.execCommand("copy");
    codeBtn.innerHTML = 'Copied';
}

function notification() {
  if(notificationNo == 0) {
    notificationMessage.innerHTML = 'No new notifications.';
  }
  notificationNo = 0;
  document.getElementById('lblCartCount2').style.display = 'none';
  Notificationmodal.style.display = "block";
}

closeSpan.onclick = function() {
    notificationMessage.innerHTML = '';
    Notificationmodal.style.display = "none";
}

// Search Participants
function searchNames() {
    var filter, a, i, txtValue;
    var input = document.getElementById("search-names");
    var ul = document.getElementById("names-of-participants").children;
    filter = input.value.toUpperCase();

    for (i = 0; i < ul.length; i++) {
        var name = ul[i].textContent.split(' ')[1] + " " + ul[i].textContent.split(' ')[2];
        if (name.toUpperCase().indexOf(filter) > -1) {
            ul[i].style.display = "";
        } else {
            ul[i].style.display = "none";
        }
    }
}

function User(e) {
    var user = e.children[0].textContent.split(' ');
    userdata = user[3];
    var username = user[1] + " " + user[2];
    document.getElementById('user-profile').textContent = username + ' Profile';
    document.getElementById('user-mute').textContent = 'Ask ' + username + ' to mute';
    Usermodal.style.display = "block";
}

// Displaying Profile
function UserProfile(e) {
    var user = userdata;
    socket.emit('user-profile', ROOM_ID, user);
}

function MuteAlert(e) {
    var user = userdata;
    socket.emit('sending-to-user', ROOM_ID, user, 'Someone asked you to kindly mute yourself.');
}

close.onclick = function() {
    Usermodal.style.display = "none";
}
