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
var link = document.getElementById("myURL");
var code = document.getElementById("myCode");
var linkBtn = document.getElementById("copyLinkBtn");
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
    port: '8080'
})

var myVideo = document.createElement('video');
myVideo.muted = true;

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(function(stream) {
    myVideoStream = stream;
    myVideo.muted = true;
    addVideoStream(myVideo, stream);
    console.log('Oh yeah');

    myPeer.on('call', (call) => {
        call.answer(stream);
        console.log("you there");
        const video = document.createElement('video');
        console.log(video.muted);
        call.on('stream', (userVideoStream) => {
            console.log("come in");
            addVideoStream(video, userVideoStream);
        });
    })

    socket.on('user-connected', function(userId) {
        console.log("user connected");
        console.log(myVideo.muted);
        connectToNewUser(userId, stream);
        console.log('yoyoyoyo');
    })

    socket.on('newMessage', function(message) {
        console.log(message);
        if(mainChat.style.display === "none") {
          document.getElementById('lblCartCount').style.display = 'flex';
          chatNo++;
          console.log(chatNo);
          if(chatNo == 0) {
            document.getElementById('lblCartCount').style.display = "";
          } else {
            document.getElementById('lblCartCount').innerHTML = chatNo;
          }
        } else {
          chatNo = 0;
          document.getElementById('lblCartCount').innerHTML = "";
          console.log(chatNo);
        }
        const html = Mustache.render(messageTemplate, {
            username: message.from,
            message: message.text,
            createdAt: moment(message.createdAt).format('h:mm A') //rendering message to div inside script tag with id("message-template")
        });
        messages.insertAdjacentHTML('beforeend', html); //inserting the rendered message to the upper div.
    });
})

socket.on('no-of-participants', function({ room, users }) {
    console.log(users);
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
    console.log(user);
    if(user.username != currentuser.username)
    window.open('/user', '_blank');
})

// Current User data
socket.on('my-data', function(user) {
    console.log(user.id);
    window.open('/myprofile/' + user.id, '_blank');
})

// Alerting specific user
socket.on('alert-message', function(message) {
      console.log(notificationNo);
      if(Notificationmodal.style.display === "block") {
        notificationNo = 0;
        document.getElementById('lblCartCount2').style.display = "none";
      } else {
        notificationNo++;
        document.getElementById('lblCartCount2').style.display = "flex";
        document.getElementById('new-notification').innerHTML = notificationNo;
      }

    const html = Mustache.render(notificationTemplate, {
        message
    })
    // document.getElementById('box-notification').innerHTML +=html;
    if(notificationMessage.innerHTML === 'No new notifications.') {
      notificationMessage.innerHTML = html;
    } else {
      notificationMessage.innerHTML += html;
    }
    // alert(message);
})

socket.on('user-disconnected', userId => {
    if(peers[userId])
    peers[userId].close();
})

myPeer.on('open', function(id) {
    userID = id;
    socket.emit('join-room', ROOM_ID, id);
})

function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream);
    const video = document.createElement('video');
    call.on('stream', (userVideoStream) => {
        console.log("yohoo");
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
    if(video)
    {
        console.log("upljxbx");
        videoGrid.append(video);
    }
    else
    console.log('Error....');
}

messageForm.addEventListener('click', function(e) {
    e.preventDefault(); //prevent from constantly reloading

    messageFormButton.setAttribute('disabled','disabled');

    socket.emit('createMessage', document.querySelector('input[name="message"]').value, function(error) {
        if(messageFormValue.value!='')
        console.log("Message delivered!");
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
    if (mainParticipants.style.display === "none") {
        document.getElementsByClassName("main__left")[0].style.flex = 0.7;
        mainParticipants.style.flex = 0.3;
        document.getElementsByClassName("main__right")[0].style.flex = 0;
        mainParticipants.style.display = "flex";

    } else {
        document.getElementsByClassName("main__left")[0].style.flex = 1;
        mainParticipants.style.flex = 0;
        document.getElementsByClassName("main__right")[0].style.flex = 0;
        mainParticipants.style.display = "none";
    }
    document.getElementsByClassName("main__right")[0].style.flex = 0;
    mainChat.style.display = "none";
    // document.getElementById('message-container').style.display = 'none';
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
        console.log(e);
        e.firstElementChild.classList.value = 'fa fa-microphone-slash';
        // document.getElementById("muteButton").innerHTML = '<i class='fas fa-microphone-slash'></i>';
        myVideo.muted = true;
        myVideoStream.getAudioTracks()[0].enabled = false;
        // setPlayVideo();
    } else {
        // setStopVideo();
        console.log(e);
        e.firstElementChild.classList.value = 'fa fa-microphone';
        // document.getElementById("muteButton").innerHTML = '<i class='fas fa-microphone'></i>';
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

function leave() {
    console.log(userID);
    socket.emit("user-disconnecting", userID);
    location.href='/';
}

function invite(e) {
    link.value = e.baseURI;
    code.value = ROOM_ID;
    modal.style.display = "block";
}

span.onclick = function() {
    modal.style.display = "none";
    linkBtn.innerHTML = 'Copy Link';
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
        linkBtn.innerHTML = 'Copy Link';
        codeBtn.innerHTML = 'Copy code';
    }
}

function copyLink() {
    link.select();
    link.setSelectionRange(0, 99999); /* For mobile devices */

    /* Copy the text inside the text field */
    document.execCommand("copy");

    linkBtn.innerHTML = 'Copied';
}

function copyCode() {
    code.select();
    code.setSelectionRange(0, 99999); /* For mobile devices */

    /* Copy the text inside the text field */
    document.execCommand("copy");

    codeBtn.innerHTML = 'Copied';
}

function notification() {
  if(notificationNo != 0) {
    // notificationMessage.innerHTML = '';
  } else {
    notificationMessage.innerHTML = 'No new notifications.';
  }
  notificationNo = 0;
  // document.querySelector('.box').style.display = 'block';
  document.getElementById('lblCartCount2').style.display = 'none';
  Notificationmodal.style.display = "block";
}

closeSpan.onclick = function() {
    notificationMessage.innerHTML = '';
    // document.querySelector('.box').style.display = 'none';
    Notificationmodal.style.display = "none";
}

// Search Participants
function searchNames() {
    var filter, a, i, txtValue;
    var input = document.getElementById("search-names");
    var ul = document.getElementById("names-of-participants");
    var li = ul.getElementsByTagName("li");
    filter = input.value.toUpperCase();

    for (i = 0; i < li.length; i++) {
        a = li[i].getElementsByTagName("a")[0];
        txtValue = a.textContent || a.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            li[i].style.display = "";
        } else {
            li[i].style.display = "none";
        }
    }
}

function User(e) {
    console.log(e.text);
    var user = e.text.split(' ');
    userdata = user[3];
    var username = user[1] + " " + user[2];
    document.getElementById('user-profile').textContent = username + ' Profile';
    document.getElementById('user-mute').textContent = 'Ask ' + username + ' to mute';
    Usermodal.style.display = "block";
}

// Displaying Profile
function UserProfile(e) {
    console.log(userdata);
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
