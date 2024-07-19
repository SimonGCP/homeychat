const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const dotenv = require('dotenv');
const logger = require('morgan');
const { Server } = require('socket.io');
const { createServer } = require('http');

const authRouter = require('./routes/auth.js');
const chatRouter = require('./routes/chatroom.js');

dotenv.config();

const mongoURI = process.env.MONGODB_URI;
const app = express();

const server = createServer(app);
const io = new Server(server);

const corsOptions = {
	origin: 'http://localhost:3000',
	preflightContinue: false,
	methods: ['GET', 'POST'],
	allowedHeaders: ['Content-Type', 'Authorization'],
	credentials: true,
};

app.use(cors(corsOptions));
let mongooseConnection;

if (process.env.NODE_ENV !== 'test') {
	mongoose.connect(mongoURI, {})
		.then(() => console.log('🍃 MongoDB connected'))
		.catch(err => console.log(err));
	mongooseConnection = mongoose.connection;
}

const store = MongoStore.create({
	mongoUrl: mongoURI,
	mongooseConnection: mongooseConnection,
	ttl: 60 * 60 * 1,
});

const one_hour = 60 * 60 * 1000 // 1 hour in milliseconds

app.use(session({
	name: 'session.sid',
	secret: process.env.SECRET,
	resave: false,
	store: store,
	saveUninitialized: false,
	cookie: { maxAge: one_hour }
}));

app.use(logger('dev'));

app.use('/', authRouter);
app.use('/rooms', chatRouter);

app.get('/ping', (req, res) => {
	res.status(200).send('pong');
});

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('message', (data) => {
        console.log(`received message: ${data}`);
		const parsedData = JSON.parse(data);

		// client will send room id if just joining room
		const { room, username, connecting } = parsedData;

		if (room) {
			console.log(`joining room ${room}`);
			socket.join(room);

			// notify other room users a user has connected
			console.log(`${username} connected`);
			io.to(room).emit('connection', data);
			return;
		}

		const { currentRoomID } = parsedData;
        // send message to all connected clients
        io.to(currentRoomID).emit('message', data);
    });

	socket.on('error', (error) => {
		console.log(`error: ${error}`);
	});

	socket.on('disconnect-message', (data, ack) => {
		console.log('disconnect message received');
		try {
			const { roomID, username } = data;

			io.to(roomID).emit('connection', `${username} disconnected`);
			ack('Message acknowledged');
		} catch(err) {
			console.log(err);
		}
	});

    socket.on('disconnect', (data) => {
        console.log('A user disconnected');
    });
});

module.exports = app;
module.exports.server = server;