const Chatroom = require('../models/chatrooms.js');
const Account = require('../models/account.js');
const app = require('../index.js');
const request = require('supertest');
const { StatusCodes } = require('http-status-codes');

// Unit tests use a mock database to ensure fast tests, test endpoints/status
describe('UNIT TESTS FOR CHATROOMS', () => {
    var mockDatabase = [];

    const exampleRoom1 = {
        _id: '6699809a5a00c30fc366f24f',
        topic: 'test',
        roomCapacity: 10,
        users: [],
        messages: [],
        lastModified: '2024-07-18T20:52:42.765Z',
        __v: 0
    };

    const exampleRoom2 = {
        _id: '6699809a5a00c30fc366f24g',
        topic: 'test 2',
        roomCapacity: 12,
        users: [ '6680792ae7e0391f371626d2' ],
        messages: [],
        lastModified: '2024-07-18T20:52:42.765Z',
        __v: 0
    };

    describe('testing chatroom API', () => { 
        Chatroom.find = jest.fn(() => {
            return mockDatabase;
        });

        Chatroom.findById = jest.fn((id) => {
            return mockDatabase.find(element => element._id == id);
        });

        describe('GET chatroom tests', () => {
            beforeEach(() => {
                mockDatabase = [exampleRoom1, exampleRoom2];
            });

            test('it should return no rooms with no entries in database', async () => {
                mockDatabase = [];

                const response = await request(app)
                    .get('/rooms/get-rooms')
                
                expect(response.body).toEqual([]);
                expect(response.body.length).toBe(0);
                expect(response.status).toBe(StatusCodes.OK);
            });

            test('it should return two rooms with 2 entries in database', async () => {
                const response = await request(app)
                    .get('/rooms/get-rooms');

                expect(response.body.length).toBe(2);
                expect(response.body).toEqual([exampleRoom1, exampleRoom2]);
                expect(response.status).toBe(StatusCodes.OK);
            });

            test('it should return room details if room w/ id is in collection', async () => {
                const response = await request(app)
                    .get('/rooms/room-details')
                    .query({ id: '6699809a5a00c30fc366f24g' }); // id of example room 2
                
                expect(response.status).toBe(StatusCodes.OK);
                expect(response.body).toEqual(exampleRoom2);
            });

            test('it should return bad request if room w/ id does not exist in collection', async () => {
                const response = await request(app)
                    .get('/rooms/room-details')
                    .query({ id: "i'm a silly goose" });
                
                expect(response.status).toBe(StatusCodes.BAD_REQUEST);
            });

            test('it should return server error if an issue occurs getting room', async () => {
                Chatroom.findById = jest.fn(() => { // mock error being thrown by server
                    throw new Error('oopsie');
                })

                const response = await request(app) 
                    .get('/rooms/room-details')
                    .query({ id: '6699809a5a00c30fc366f24g' });

                expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
            });
        });

        describe('/POST new chatroom tests', () => {
            Chatroom.create = jest.fn((object) => {
                mockDatabase.push({
                    topic: object.topic,
                    roomCapacity: object.roomCapacity,
                    users: [],
                    messages: [],
                });
            });

            beforeEach(() => {
                mockDatabase = [];
            });

            test('it should add a new element if all parameters are present', async () => {
                const topic = 'topic', capacity = 10;
                const response = await request(app)
                    .post('/rooms/new-room')
                    .send({ topic, capacity });
                
                expect(response.status).toBe(StatusCodes.CREATED);
                expect(mockDatabase[0]).toEqual({
                    topic, roomCapacity: capacity, users: [], messages: [],
                });
            });

            test('it should not add a new element if capacity is undefined', async () => {
                const topic = 'topic', capacity = 10;
                const dbSnapshot = mockDatabase; // capture what db looks like before req

                const response = await request(app)
                    .post('/rooms/new-room')
                    .send({ topic });

                expect(response.status).toBe(StatusCodes.BAD_REQUEST);
                expect(mockDatabase).toEqual(dbSnapshot);
            });

            test('it should not add a new element if topic is undefined', async () => {
                const topic = 'topic', capacity = 10;
                const dbSnapshot = mockDatabase; // capture what db looks like before req

                const response = await request(app)
                    .post('/rooms/new-room')
                    .send({ capacity });

                expect(response.status).toBe(StatusCodes.BAD_REQUEST);
                expect(mockDatabase).toEqual(dbSnapshot);
            });
        });

        describe('/POST update chatroom users requests', () => {
            const exampleUserId = 'fake_id';
            var push = true;

            Chatroom.findByIdAndUpdate = jest.fn((roomID) => {
                var room = mockDatabase.find((element) => element._id === roomID);
                if (room) {
                    if (push) {
                        room.users.push(exampleUserId);
                    } else {
                        const index = room.users.indexOf({ _id: exampleUserId });
                        room.users.splice(index, 1);
                    }
                    return true;
                } else {
                    return false;
                }
            }); 


            Account.findByIdAndUpdate = jest.fn((param) => { return true; });

            beforeEach(() => {
                mockDatabase = [exampleRoom1, exampleRoom2];
                push = true;
            });

            test("it should add a user to the room's user list", async () => {
                const response = await request(app)
                    .post('/rooms/update-list')
                    .send({ 
                        roomID: exampleRoom1._id,
                        user: { _id: exampleUserId },
                        push: true,
                    });
                
                expect(response.status).toBe(StatusCodes.ACCEPTED);
                expect(mockDatabase[0].users[0]).toMatch(exampleUserId);
            })

            test('it should not update if not all parameters are defined', async () => {
                const dbSnapshot = mockDatabase;

                const response = await request(app)
                    .post('/rooms/update-list')
                    .send({
                        roomID: exampleRoom1._id,
                        push: true,
                    });            
                    
                expect(response.status).toBe(StatusCodes.BAD_REQUEST);
                expect(mockDatabase).toEqual(dbSnapshot);
            });

            test('it should not update if no parameters are sent', async () => {
                const dbSnapshot = mockDatabase;

                const response = await request(app)
                    .post('/rooms/update-list');

                expect(response.status).toBe(StatusCodes.BAD_REQUEST);
                expect(mockDatabase).toEqual(dbSnapshot);
            });

            test('it should remove a user from the room user list', async () => {
                var room = mockDatabase[0];
                room.users = [{ _id: exampleUserId }];
                push = false;

                const response = await request(app)
                    .post('/rooms/update-list')
                    .send({
                        roomID: room._id,
                        user: { _id: exampleUserId },
                        push: false,
                    });
                
                expect(response.status).toBe(StatusCodes.ACCEPTED);
                expect(room.users).toEqual([]);
            });

            test("it should return bad request if chatroom doesn't exist", async () => {
                const dbSnapshot = mockDatabase;
                const response = await request(app)
                    .post('/rooms/update-list')
                    .send({
                        roomID: "i'm a silly goose",
                        userID: exampleUserId,
                        push: true,
                    });

                expect(response.status).toBe(StatusCodes.BAD_REQUEST);
                expect(mockDatabase).toEqual(dbSnapshot);    
            });
        });
    });
});
