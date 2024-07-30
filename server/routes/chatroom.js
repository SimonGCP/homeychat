const express = require('express');
const { StatusCodes } = require('http-status-codes');
const Account = require('../models/account.js');
const Chatroom = require('../models/chatrooms.js');

const chatRouter = express.Router();

chatRouter.use(express.json());

chatRouter.post('/new-room', async (req, res) => {
    const { topic, capacity } = req.body;

    if (!topic || topic === '' || !capacity) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: "Missing parameters" });
    }

    const newChatroom = new Chatroom({
        topic,
        roomCapacity: capacity,
        users: [],
        messages: [],
    })

    try {
        const savedChatroom = await Chatroom.create(newChatroom);
        return res.status(StatusCodes.CREATED).json(savedChatroom);
    } catch(err) {
        console.log(err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ message: "Failure in creating new chatroom" });
    }
});

const num_rooms = 15;

// gets the first few rooms in the collection
chatRouter.get('/get-rooms', async (req, res) => {
    try {
        const rooms = await Chatroom.find(); //.limit(num_rooms);
        res.json(rooms);
    } catch (err) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "problem retrieving chatroom list" });
    }
});

chatRouter.get('/room-details', async (req, res) => {
    const id = req.query.id;

    try {
        const room = await Chatroom.findById(id);
        
        if (!room) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "room does not exist" });
        }

        res.json(room);
    } catch (err) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'error getting room details' });
    }
});

chatRouter.post('/update-list', async (req, res) => {
    const { user, roomID, push } = req.body;

    if (!user || !roomID || push === undefined ) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: "Missing parameters" });
    }

    try {
        var updatedChatroom;
        const date = new Date();
        if (push) {
            updatedChatroom = await Chatroom.findByIdAndUpdate(roomID, {
                '$addToSet': {'users': user},
                '$set': {'lastModified': date }
            });

            if (req.session.user) {
                req.session.user.currentRoom = roomID;
            } 

            await Account.findByIdAndUpdate(user._id, {
                '$set': {'currentRoom': roomID },
            });
        } else {
            updatedChatroom = await Chatroom.findByIdAndUpdate(roomID, {
                '$pull': {'users': user}
            });

            if (req.session.user) {
                req.session.user.currentRoom = '';
            } 

            await Account.findByIdAndUpdate(user._id, {
                '$set': {'currentRoom': '' },
            });
        }
 
        if (!updatedChatroom) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "chatroom not found" });
        }
        
        return res.sendStatus(StatusCodes.ACCEPTED);
    } catch(err) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "could not add to list" });
    }
});

class Chat {
    constructor (author, message) {
        this.author = author;
        this.message = message;
    }
}

chatRouter.post('/send-message', async (req, res) => {
    const { message, author, roomID } = req.body;
    console.log(roomID);

    const NewChat = new Chat(author, message);

    try {
        const date = new Date();
        const result = await Chatroom.findByIdAndUpdate(roomID, {
            '$push': {'messages': NewChat},
            '$set': {'lastModified': date}
        });

        if (!result) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "chatroom not found" });
        }

        return res.sendStatus(StatusCodes.ACCEPTED);
    } catch(err) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "could not send message" });
    }
});

module.exports = chatRouter;
