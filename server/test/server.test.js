const app = require('../index.js');
const request = require('supertest');

describe('Testing server connection', () => {
    test('it should ping the server', (done) => {
        request(app)
            .get('/ping')
            .then((response) => {
                expect(response.statusCode).toBe(200);
                expect(response.text).toMatch('pong');
                done();
            });
    });
});