const express = require('express');
const bcrypt = require('bcrypt');
const { StatusCodes } = require('http-status-codes');
const Account = require('../models/account.js');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth2').Strategy;
const dotenv = require('dotenv');

dotenv.config();

const authRouter = express.Router();

const saltRounds = 10;

authRouter.use(express.json());

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

passport.use(new GoogleStrategy({
		clientID: GOOGLE_CLIENT_ID,
		clientSecret: GOOGLE_CLIENT_SECRET,
		callbackURL: "http://localhost:8000/google/callback",
		passReqToCallback: true,
	},
	(request, accessToken, refreshToken, profile, done) => {
		return done(null, profile);
	}
));

function isLoggedIn(req, res, next) {
	req.user ? next() : res.sendStatus(StatusCodes.UNAUTHORIZED);
}

passport.serializeUser((user, done) => {
	done(null, user);
});

passport.deserializeUser((user, done) => {
	done(null, user);
});

authRouter.get('/google', passport.authenticate('google', { scope: ['email', 'profile'] }));

authRouter.get('/google/callback', 
	passport.authenticate('google', {
		successRedirect: '/auth-success',
		failureRedirect: '/auth-failure',
	}
));

authRouter.get('/auth-success', (req, res) => {
	res.status(StatusCodes.ACCEPTED).json({ message: 'Authenticated' });
})

authRouter.get('/auth-failure', (req, res) => {
	res.status(StatusCodes.BAD_GATEWAY).json({ message: 'Something went wrong' });
});

authRouter.get('/protected', isLoggedIn, (req, res) => {
	res.send("logged in");
});

authRouter.post('/login', async (req, res) => {
	const { username, password } = req.body;

	if (!username || username === '' || !password || password === '') {
		res.status(StatusCodes.BAD_REQUEST).json({ message: "Missing username or password" });
		return;
	}

	const foundUser = await Account.findOne({ username });

	if (foundUser) {
		try {
			let result;
			
			bcrypt.compare(password, foundUser.password, (err, data) => {
				if (err) {
					result = res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: err.message });
				} else if (data) {
					req.session.user = foundUser;
					req.session.save();

					result = res.status(StatusCodes.ACCEPTED).json(foundUser);
				} else {
					result = res.status(StatusCodes.BAD_REQUEST).json({ message: "Password incorrect" });
				}
			});

			return result;
		} catch(err) {
			return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: err.message });
		}
	}

	res.status(StatusCodes.BAD_REQUEST).json({ message: `No user with username ${username} exists` });
});

authRouter.get('/account', async (req, res) => {
	const user = req.session.user;

	if(!user) {
		console.log("User not logged in");
		res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized" });
		return;
	}

	try {
		const date = new Date();

		if (user) {
			await Account.findOneAndUpdate(user, {
				'$set': {'timestamp': date},
			});	
		}
	} catch (err) {
		console.log(err);
	}

	console.log(`Session found for user ${user.username}`);
	res.status(StatusCodes.ACCEPTED).json(user);
});

const minUsernameLength = 3, minPasswordLength = 5;

authRouter.post('/signup', async (req, res) => {
	const { username, password } = req.body;

	if (!username || !password) {
		return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing parameters" });
	}

	if (username.length < minUsernameLength || password.length < minPasswordLength) {
		return res.status(StatusCodes.BAD_REQUEST).json({ message: 'username or password too short' });
	}

	try {
		const existingAccount = await Account.findOne({ username });

		if (existingAccount) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				message: 'Account with username already exists'
			});
		}

		const hashedPassword = await bcrypt.hash(password, saltRounds);

		const newAccount = new Account({
			username,
			password: hashedPassword,
		});

		const savedAccount = await Account.create(newAccount);

		res.status(StatusCodes.CREATED).json(savedAccount);
	} catch(err) {
		console.error(err.message);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: err.message });
	}
});

authRouter.post('/logout', async (req, res) => {
	if (!req.session.user) {
		return res.status(StatusCodes.BAD_REQUEST).json({ message: "Can't log out: Not logged in" });
	}

	req.session.destroy();
	return res.status(StatusCodes.ACCEPTED).json({ message: "Logged out!"});
});

authRouter.post('/update-session', async (req, res) => {
	
});

module.exports = authRouter;