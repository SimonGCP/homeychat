const express = require('express');
const { StatusCodes } = require('http-status-codes');
const Account = require('../models/account.js');
const FriendRequest = require('../models/friend-request.js');
const bad_request = require('../utils/utils.js');

const accountRouter = express.Router();
accountRouter.use(express.json());

accountRouter.get('/friend-list', async (req, res) => {
    const { id } = req.query;

    if (!id) {
        return bad_request(res, 'missing id');
    }

    try {
        const user = await Account.findOne({ _id: id });

        if (!user) {
            return bad_request(res, 'bad id');
        }

        const friendList = [];
        for (friend of user.friends) {
            const friendDetails = await Account.findOne({_id: friend});
            friendList.push(await Account.findOne({ _id: friend }));
        }

        res.status(StatusCodes.OK).json({ friendList });
    } catch (err) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err);
    }
});

accountRouter.post('/send-friend-request', async (req, res) => {
    const { userId, friendId } = req.body;

    if (!userId || !friendId) {
        return bad_request(res, 'missing parameter');
    }

    try {
        // check if friend request already exists
        const request = FriendRequest.find({ user: friendId, friend: userId });
    
        // if friend request already exists, add to users' friend list
        if (request) {
            Account.findByIdAndUpdate(userId, {
                '$addToSet': {'friends': friendId},
            }); 

            Account.findByIdAndUpdate(friendId, {
                '$addToSet': {'friends': userId},
            });

            FriendRequest.deleteOne({
                friendId: userId,
                userId: friendId,
            });

            return res.status(StatusCodes.OK).send({ message: 'friend request accepted' });
        } else {
            const newRequest = new FriendRequest({
                userId, friendId,
            });

            FriendRequest.create(newRequest);

            return res.status(StatusCodes.OK).send({ message: 'friend request created' });
        }
    } catch(err) {
        console.log(err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'error creating friend request' });
    }
});

// add-friend should be called when user ACCEPTS friend request from friend
// friend should be added to user's friend list, user should be added
// to friend's friend list
accountRouter.post('/add-friend', async (req, res) => {
    const { userId, friendId } = req.body;

    if (!userId || !friendId) {
        return bad_request(res, 'missing id');
    }

    try {
        const user = await Account.findOne({ _id: userId });
        const friend = await Account.findOne({ _id: friendId });

        if (!user || !friend) {
            return bad_request(res, 'bad id');
        }

        if (user === friend) {
            return bad_request(res, 'cannot add self as friend');
        }
    
        updatedUser = await Account.findByIdAndUpdate(userId, {
            '$addToSet': {'friends': friendId},
        });

        updatedFriend = await Account.findByIdAndUpdate(friendId, {
            '$addToSet': {'friends': userId}, 
        });

        return res.sendStatus(StatusCodes.OK);
    } catch(err) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err);
    }
});

accountRouter.post('/remove-friend', async (req, res) => {
    const { userId, friendId } = req.body;

    if (!userId || !friendId) {
        return bad_request(res, 'missing id');
    }

    try {
        const user = await Account.findOne({ _id: userId });
        const friend = await Account.findOne({ _id: friendId });

        if (!user || !friend) {
            return bad_request(res, 'bad id');
        }
    
        updatedUser = await Account.findByIdAndUpdate(userId, {
            '$pull': {'friends': friendId },
        });

        updatedFriend = await Account.findByIdAndUpdate(friendId, {
            '$pull': {'friends': userId },
        });

        return res.status(StatusCodes.OK).json([updatedUser, updatedFriend]);
    } catch(err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err);
    }
    return res.sendStatus(StatusCodes.OK);
});

accountRouter.get('/user', async (req, res) => {
    const { id } = req.query;

    if (!id) {
        return bad_request(res, 'missing id');
    }

    try {
        const user = await Account.findOne({ _id: id });

        return res.status(StatusCodes.OK).json(user);
    } catch(err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err);
    }
});

module.exports = accountRouter;
