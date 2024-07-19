const mongoose = require('mongoose');

const chatroomSchema = new mongoose.Schema({
    topic: {
        type: String,
        required: true,
    },
    lastModified: {
        type: Date,
        default: Date.now,
        expires: 60 * 30, // expire 30 minutes after last modified
    },
    roomCapacity: {
        type: Number,
        default: 10,
    },
    users: {
        type: Array,
    },
    messages: {
        type: Array,
    },
});

const Chatroom = mongoose.model('Chatroom', chatroomSchema);

module.exports = Chatroom;