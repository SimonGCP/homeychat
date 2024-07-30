const Account = require('../models/account.js');
const FriendRequest = require('../models/friend-request.js');
const app = require('../index.js');
const request = require('supertest');
const { StatusCodes } = require('http-status-codes');

describe('UNIT TESTS FOR ACCOUNTS', () => {
    var mockDatabase = [];

    const exampleUser = {
        _id: '66789f5235ba2e104fb2df9d',
        username: 'simon',
        friends: [],
    }

    const exampleFriend = {
        _id: '6680792ae7e0391f371626d2',
        username: 'alex',
        friends: [],
    }

    Account.findOne = jest.fn((object) => {
        return mockDatabase.find((element) => element._id == object._id);
    });


    describe('testing friends list', () => {
        beforeEach(() => {
            mockDatabase = [exampleUser, exampleFriend];
            exampleUser.friends = [];
        });

        test('it should return an empty list if user has no friends', async () => {
            const response = await request(app)
                .get('/account/friend-list')
                .query({ id: exampleUser._id });

            expect(response.status).toBe(StatusCodes.OK);
            expect(response.body.friendList.length).toBe(0);
        });

        test('it should return the user\'s friend list', async () => {
            const friendList = ['friend1', 'friend2', 'friend3'];
            exampleUser.friends = friendList;

            const response = await request(app)
                .get('/account/friend-list')
                .query({ id: exampleUser._id });

            expect(response.status).toBe(StatusCodes.OK);
            expect(response.body.friendList.length).toBe(3);
        });

        test('it should return bad request if no id is given', async () => {
            const response = await request(app)
                .get('/account/friend-list')

            expect(response.status).toBe(StatusCodes.BAD_REQUEST);
        });

        test('it should return bad request if the user does not exist', async () => {
            const response = await request(app)
                .get('/account/friend-list')
                .query({ id: "i'm a silly goose" });

            expect(response.status).toBe(StatusCodes.BAD_REQUEST);
        });
    });

    describe('testing sending friend requests', () => {
        var mockFriendRequest = [];

        Account.findByIdAndUpdate = jest.fn((id, object) => {
            const account = mockDatabase.find((element) => element.id == id);

            account.friends.push('friend');
            return;
        }); 

        FriendRequest.create = jest.fn((object) => {
            mockFriendRequest = [object];
            return;
        });

        FriendRequest.deleteOne = jest.fn((object) => {
            mockFriendRequest = [];
            return;
        });

        FriendRequest.find = jest.fn((object) => {
            return mockFriendRequest.find((element) => element.userId == object.user);
        });

        beforeEach(() => {
            mockFriendRequest = [{
                userId: exampleUser._id,
                friendId: exampleFriend._id,
            }];
        });

        test('it should add a friend request', async () => {
            mockFriendRequest = [];

            const response = await request(app)
                .post('/account/send-friend-request')
                .send({ userId: exampleUser._id, friendId: exampleFriend._id });

            expect(response.status).toBe(StatusCodes.OK);
            expect(mockFriendRequest.length).toBe(1);
        });

        test('it should return 400 if id is missing', async () => {
            const response = await request(app)
                .post('/account/send-friend-request')
                
            expect(response.status).toBe(StatusCodes.BAD_REQUEST);
            expect(mockFriendRequest.length).toBe(1);
        });

        test('it should remove a friend request if it already exists', async () => {
            const response = await request(app)
                .post('/account/send-friend-request')
                .send({ userId: exampleFriend._id, friendId: exampleUser._id });

            expect(response.status).toBe(StatusCodes.OK);
            expect(mockFriendRequest.length).toBe(0);
            expect(exampleUser.friends.length).toBe(0);
            expect(exampleFriend.friends.length).toBe(0);
        });
    });

    describe('testing adding friends', () => {
        Account.findByIdAndUpdate = jest.fn((id, object) => {
            id === exampleUser._id ?
                exampleUser.friends = [exampleFriend._id] :
                exampleFriend.friends = [exampleUser._id];

            return;
        });

        beforeEach(() => {
            mockDatabase = [exampleUser, exampleFriend];
            exampleUser.friends = [];
        });

        test('it should add a friend to the list', async () => {
            const response = await request(app)
                .post('/account/add-friend')
                .send({ userId: exampleUser._id, friendId: exampleFriend._id });

            expect(response.status).toBe(StatusCodes.OK);
            // expect(exampleUser.friends).toStrictEqual([exampleFriend._id]);
            // expect(exampleFriend.friends).toStrictEqual([exampleUser._id]);
        });

        test('it should return bad request if user tries to add a friend that doesn\'t exist', async () => {
            const response = await request(app)
                .post('/account/add-friend')
                .send({ userId: exampleUser._id, friendId: 'silly goose' });

            expect(response.status).toBe(StatusCodes.BAD_REQUEST);
            expect(exampleUser.friends.length).toBe(0);
        });

        test('it should return bad request if a field is missing', async () => {
            const response = await request(app)
                .post('/account/add-friend')
                .send({ userId: exampleUser._id });

            expect(response.status).toBe(StatusCodes.BAD_REQUEST);
            expect(exampleUser.friends.length).toBe(0);
        });

        test('it should return bad request if a user tries to add themself as a friend', async () => {
            const response = await request(app)
                .post('/account/add-friend')
                .send({ userId: exampleUser._id, friendId: exampleUser._id })

            expect(response.status).toBe(StatusCodes.BAD_REQUEST);
            expect(exampleUser.friends.length).toBe(0);
        })
    });

    describe('testing removing friends', () => {
        Account.findByIdAndUpdate = jest.fn((id, object) => {
            exampleUser.friends = [];
            exampleFriend.friends = [];

            return;
        });

        beforeEach(() => {
            mockDatabase = [exampleUser, exampleFriend];
            exampleUser.friends = [exampleFriend._id];
            exampleFriend.friends = [exampleUser._id];
        });

        test('it should remove a friend from both users\' list', async () => {
            const response = await request(app)
                .post('/account/remove-friend')
                .send({ userId: exampleUser._id, friendId: exampleFriend._id });

            expect(response.status).toBe(StatusCodes.OK);
            expect(exampleUser.friends.length).toBe(0);
            expect(exampleFriend.friends.length).toBe(0);
        });

        test('it should return bad request if friend does not exist', async () => {
            const response = await request(app)
                .post('/account/remove-friend')
                .send({ userId: exampleUser._id, friendId: 'silly goose' });

            expect(response.status).toBe(StatusCodes.BAD_REQUEST);
            expect(exampleUser.friends.length).toBe(1);
            expect(exampleFriend.friends.length).toBe(1);
        });

        test('it should return bad request if user does not exist', async () => {
            const response = await request(app)
                .post('/account/remove-friend')
                .send({ userId: 'silly goose', friendId: exampleFriend._id });

            expect(response.status).toBe(StatusCodes.BAD_REQUEST);
            expect(exampleUser.friends.length).toBe(1);
            expect(exampleFriend.friends.length).toBe(1);
        });

        test('it should return bad request if a parameter is missing', async () => {
            const response = await request(app)
                .post('/account/remove-friend')
                .send({ userId: exampleUser._id });

            expect(response.status).toBe(StatusCodes.BAD_REQUEST);
            expect(exampleUser.friends.length).toBe(1);
            expect(exampleFriend.friends.length).toBe(1);
        });
    });
});
