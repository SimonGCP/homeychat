const Account = require('../models/account.js');
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
            expect(response.body.length).toBe(0);
        });

        test('it should return the user\'s friend list', async () => {
            const friendList = ['friend1', 'friend2', 'friend3'];
            exampleUser.friends = friendList;

            const response = await request(app)
                .get('/account/friend-list')
                .query({ id: exampleUser._id });

            expect(response.status).toBe(StatusCodes.OK);
            expect(response.body).toStrictEqual(friendList);
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
