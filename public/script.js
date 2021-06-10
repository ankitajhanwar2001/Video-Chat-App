const socket = io('/');

const videoGrid = document.getElementById('video-grid');
// const myVideoGrid = document.getElementById('my-video-grid');

const photoGrid = document.getElementById('photo-grid');

var mainChat = document.getElementById('main-chat');
var mainParticipants = document.getElementById('main-participants');
var messageForm = document.getElementById('message-form');
var messages = document.getElementById('sending-messages');
// var NoOfPeople = document.getElementById('NoOfparticipants');

// var inputMessage = document.getElementById('chat_message');
var messageFormButton = messageForm.querySelector('button');
var messageFormValue = messageForm.querySelector('input');

var messageTemplate = document.querySelector("#message-template").innerHTML;
var participantsTemplate = document.querySelector("#participants-template").innerHTML;

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

let myVideoStream;
let userID;
let userdata;
const peers = {};

const myPeer = new Peer(undefined, {
    // host: 'localhost',
    path: '/peerjs',
    host: '/',
    port: '443'
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
        connectToNewUser(userId, stream)
    })

    socket.on('newMessage', function(message) {
        console.log(message);
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
    const html = Mustache.render(participantsTemplate, {
        room,
        users
    })
    document.getElementById("NoOfparticipants").innerHTML = html;
})


// Showing user data
socket.on('user-data', function(user) {
    console.log(user);
    // location.href += '/user';
    window.open('/user', '_blank');
})

// Alerting specific user
socket.on('alert-message', function(message) {
    alert(message);
})

// socket.on('update-user-name', function(user) {
//     userdata = user;
// })

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
function onoffVideo() {
    let enabled = myVideoStream.getVideoTracks()[0].enabled;
    console.log(myVideoStream.getTracks());
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        // videoGrid.style.display = 'none';
        // for(var i = 0; i < videoGrid.childElementCount; i++) {
        //     if(videoGrid.style.display === "none") {
        //         videoGrid.children[i].innerHTML = '<img src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png">'
        //         videoGrid.children[i].style.display = 'flex';
        //     }
        // }
        
        // console.log(videoGrid.firstElementChild);
        // videoGrid.firstElementChild.innerHTML = "hcsdabhgd";'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
        // myVideo.srcObject = img;
        // videoGrid.append(myVideo);
        // setPlayVideo();
        // myVideoGrid.style.display = 'none';
        // videoGrid.firstElementChild.innerHTML = "hjscbaj";
        // photoGrid.style.display = 'flex';
        // socket.emit('videoOFF', ROOM_ID);
    } else {
        // setStopVideo();
        // videoGrid.style.display = 'flex';
        // // photoGrid.style.display = 'none';

        // for(var i = 0; i < videoGrid.childElementCount; i++) {
        //     if(videoGrid.style.display === "flex")
        //     videoGrid.children[i].style.display = 'none';
        // }
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
}

function onoffVoice() {
    let enabled = myVideoStream.getAudioTracks()[0].enabled;
    console.log(myVideoStream.getTracks(), myVideoStream.getAudioTracks()[0]);
    if (enabled) {
        myVideo.muted = true;
        myVideoStream.getAudioTracks()[0].enabled = false;
        // setPlayVideo();
    } else {
        // setStopVideo();
        myVideo.muted = true;
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
}

function leave() {
    console.log(userID);
    socket.emit("user-disconnecting", userID);
    location.href='/';
}

var modal = document.getElementById("myModal");
var span = document.getElementsByClassName("close")[0];
var link = document.getElementById("myURL");
var code = document.getElementById("myCode");
var linkBtn = document.getElementById("copyLinkBtn");
var codeBtn = document.getElementById("copyCodeBtn");


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
    // console.log(e);

    if (e.target == Usermodal) {
        Usermodal.style.display = "none";
    }

    if (e.target == modal) {
        modal.style.display = "none";
        linkBtn.innerHTML = 'Copy Link';
        codeBtn.innerHTML = 'Copy code';
    }

//     if (!e.target.matches('#dropBtn')) {
//     var dropdowns = document.getElementsByClassName("dropdown-content");
//     var i;
//     for (i = 0; i < dropdowns.length; i++) {
//       var openDropdown = dropdowns[i];
//       if (openDropdown.classList.contains('show')) {
//         openDropdown.classList.remove('show');
//       }
//     }
//   }
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



var Usermodal = document.getElementById("myUserModal");
var close = document.getElementsByClassName("close-span")[0];
var profile = document.getElementById("user-profile");
var mute = document.getElementById("user-mute");
var Uservideo = document.getElementById("user-video");
// var userdata;


// Displaying Profile
function UserProfile(e) {
    // console.log(e);
    console.log(userdata);
    var user = userdata;
    // .substring(1);
    // user = user.substring(0,user.indexOf(' '));
    // socket.emit('sending-to-user', ROOM_ID, e.text);

    socket.emit('user-profile', ROOM_ID, user);
}

function MuteAlert(e) {
    // console.log(e.text);
    var user = userdata;
    // .substring(userdata.text.indexOf(' ')+1);
    // user = user.split(" ")[0];
    socket.emit('sending-to-user', ROOM_ID, user, 'Kindly mute yourself');
}

// function VideoAlert(e) {
//     // console.log(e);
//     var user = userdata;
//     // .substring(userdata.text.indexOf(' ')+1);
//     // user = user.split(" ")[0];
//     socket.emit('sending-to-user', ROOM_ID, user, 'Kindly turn off your video');
// }

/* When the user clicks on the button, toggle between hiding and showing the dropdown content */

function User(e) {
    // socket.emit('get-username', e.text);
    
    console.log(e.text);
    var user = e.text.split(' ');
    userdata = user[3];
    // console.log(user);
    var username = user[1] + " " + user[2];
    document.getElementById('user-profile').textContent = username + ' Profile';
    document.getElementById('user-mute').textContent = 'Ask ' + username + ' to mute';
    // document.getElementById('user-video').textContent = 'Ask ' + username + ' to turn video off';
    Usermodal.style.display = "block";
}

close.onclick = function() {
    Usermodal.style.display = "none";
}