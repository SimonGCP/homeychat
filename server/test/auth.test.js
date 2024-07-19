const Account = require('../models/account.js');
const app = require('../index.js');
const request = require('supertest');
const { StatusCodes } = require('http-status-codes');
const bcrypt = require('bcrypt');

describe('UNIT TESTS FOR AUTHORIZATION', () => {
    var mockDatabase = [];
    const saltRounds = 10;

    const exampleUser = {
        _id: 'example_id',
        username: 'simon',
        password: '$2b$10$zq77IC7M9CkrGzOCF3ir/.B5VH2EJDQ2hbrXgp0mzl866rvy5SCnW' // 'password' hashed
    }

    const exampleSession = {
        _id: 'example_id',
    }

    Account.findOne = jest.fn((object) => {
        return mockDatabase.find((element) => element.username == object.username);
    });

    describe('testing signup', () => {
        beforeEach(() => {
            mockDatabase = [];
        });

        Account.create = jest.fn((newAccount) => {
            mockDatabase.push(newAccount);
        });

        test('it should add one user to database', async () => {
            const response = await request(app)
                .post('/signup')
                .send({ username: 'simon', password: 'password' });

            expect(response.status).toBe(StatusCodes.CREATED);
            expect(mockDatabase.length).toBe(1);

            const newAcc = mockDatabase[0];
            expect(newAcc.username).toMatch('simon');
            expect(await bcrypt.compare('password', newAcc.password)).toBeTruthy();
        });

        test('it should not add a user if one w/ username already exists', async () => {
            mockDatabase.push(exampleUser);

            const response = await request(app)
                .post('/signup')
                .send({ username: 'simon', password: 'password' });

            expect(response.status).toBe(StatusCodes.BAD_REQUEST);
            expect(mockDatabase.length).toBe(1);
        });

        test('it should not add to database if username or password are shorter than allowed', async () => {
            const response = await request(app)
                .post('/signup')
                .send({ username: 'a', password: 'b' });

            expect(response.status).toBe(StatusCodes.BAD_REQUEST);
            expect(mockDatabase.length).toBe(0);
        });

        test('it should not add to database if a parameter is missing', async () => {
            const response = await request(app)
                .post('/signup')
                .send({ username: 'simon' });
            
            expect(response.status).toBe(StatusCodes.BAD_REQUEST);
            expect(mockDatabase.length).toBe(0);
        });
    });

    describe('testing login', () => {
        beforeEach(() => {
            mockDatabase = [exampleUser];
        });

        test('it should log in if username and password are correct', async () => {
            const username = 'simon', password = 'password';

            const response = await request(app)
                .post('/login')
                .send({ username, password });
            
            expect(response.status).toBe(StatusCodes.ACCEPTED);
            expect(response.body).toEqual(exampleUser);
        });

        test('it should not log in if password does not match', async () => {
            const username = 'simon', password = "i'm a silly goose";

            const response = await request(app)
                .post('/login')
                .send({ username, password });
            
            expect(response.status).toBe(StatusCodes.BAD_REQUEST);
            expect(response.body.message).toMatch('Password incorrect');
        });

        test('it should not log in if no user w/ username exists', async () => {
            const username = 'sillygoose', password = 'password';

            const response = await request(app)
                .post('/login')
                .send({ username, password });

            expect(response.status).toBe(StatusCodes.BAD_REQUEST);
            expect(response.body.message).toMatch('No user with username sillygoose exists');
        });

        test('it should not log in if a parameter is missing', async () => {
            const username = 'simon';

            const response = await request(app)
                .post('/login')
                .send({ username });

            expect(response.status).toBe(StatusCodes.BAD_REQUEST);
            expect(response.body.message).toMatch('Missing username or password');
        });
    });
});