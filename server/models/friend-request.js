const mongoose = require('mongoose');

const friendRequestSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true,
    },
    friend: {
        type: String,
        required: true,
    }
});

const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);

module.exports = FriendRequest;
