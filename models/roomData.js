var users = [];
var rooms = [];

const addUser = function({ id, userId, firstname, lastname, username, email, profileUrl, room }) {
    const user = { id, userId, firstname, lastname, username, email, profileUrl, room };
    users.push(user);
    return { user };
}

const updateUser = function({ id, firstname, lastname, username, email }) {
    for(var i = 0; i < users.length; i++) {
      if(users[i].id.toString() === id.toString()) {
        users[i].firstname = firstname;
        users[i].lastname = lastname;
        users[i].username = username;
        users[i].email = email;
        return users[i];
      }
    }
}

const removeUser = function(id) {
    var index = users.findIndex(function(user) {
        return user.userId === id;
    })
    if(index != -1) {
        return users.splice(index, 1)[0];
    }
}

const getUser = function(userId) {
    return users.find(function(user) {
        return user.userId === userId;
    })
}

const getUserInRoom = function(room) {
    return users.filter(function(user) {
        return user.room === room;
    })
}

const addRoom = function(roomId) {
    rooms.push(roomId);
    return roomId;
}

const removeRoom = function(id) {
    var index = rooms.findIndex(function(roomId) {
        return roomId === id;
    })
    if(index != -1) {
        return rooms.splice(index, 1)[0];
    }
}

const roomFind = function(id) {
    var index = rooms.findIndex(function(roomId) {
        return roomId === id;
    })
    return index;
}

module.exports = {
    addUser,
    updateUser,
    removeUser,
    getUser,
    getUserInRoom,
    addRoom,
    removeRoom,
    roomFind
}
