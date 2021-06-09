var users = [];
var rooms = [];

const addUser = function({ id, firstname, lastname, username, email, room }) {
    const user = { id, firstname, lastname, username, email, room };
    users.push(user);
    return { user };
}

const removeUser = function(id) {
    var index = users.findIndex(function(user) {
        return user.id === id;
    })
    if(index != -1) {
        return users.splice(index, 1)[0];
    }
}

const getUser = function(id) {
    return users.find(function(user) {
        return user.id === id;
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
    removeUser,
    getUser,
    getUserInRoom,
    addRoom,
    removeRoom,
    roomFind
}