import axios from 'axios';
import '../index.css';
import React, { useState } from 'react';

function SignupPopup(props) {
    const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
	const [errorMessage, setErrorMessage] = useState('');

	function handleClose() {
		props.hideSignup();
	}

	// send a request to server to sign up
	const requestSignup = async () => {
		var signupSuccess = false;

		if (username === '') {
			setErrorMessage("please enter a username");
			return;
		} else if (password === '') {
			setErrorMessage("please enter a password");
			return;
		} else if (password !== confirmPassword) {
            setErrorMessage("Passwords don't match");
            return;
        }

		await axios.post('http://localhost:8000/signup', {
            username: username,
            password: password
		}, {
			headers: {
				"Content-Type": "application/json"
			},
			withCredentials: true,
		})
		.then((response) => {
			setErrorMessage('');
			console.log(response);
			console.log("signup success");

			// log in user to new account if signup is successful
			signupSuccess = true;
		})
		.catch((error) => {
			// error 400 occurs if a user w/ username already exists
			if (error.response && error.response.status === 400) {
				setErrorMessage(`User with username ${username} already exists`);
			} else {
				setErrorMessage(`error: ${error}`);
				console.log(error);	
			}
		})

		if (!signupSuccess) {
			console.log("signup failed");
			return;
		}

		axios.post('http://localhost:8000/login', {
			username: username,
			password: password,
		}, {
			headers: {
				"Content-Type": "application/json",
			},
			withCredentials: true,
		})
		.then((data) => {
			setErrorMessage('');
			handleClose();
		})
		.catch((error) => {
			setErrorMessage(`error: ${error}`);
			console.log(error);
		});
	}

	const handleUsernameChange = (event) => {
		setUsername(event.target.value);
	}

	const handlePasswordChange = (event) => {
		setPassword(event.target.value);
	}

    const handleConfirmPasswordChange = (event) => {
		setConfirmPassword(event.target.value);
	}

	return (
	  <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
		<div className="bg-white rounded-lg p-8 max-w-md w-full">
		  <input 
			type="text"
			placeholder="Enter username"
			value={username}
			onChange={handleUsernameChange}
			className="w-full mb-4 px-3 py-2 border border-gray-300 rounded"
		  />
		  <input 
			type="password"
			placeholder="Enter password"
			value={password}
			onChange={handlePasswordChange}
			className="w-full mb-4 px-3 py-2 border border-gray-300 rounded"
		  />
          <input 
			type="password"
			placeholder="Confirm password"
			value={confirmPassword}
			onChange={handleConfirmPasswordChange}
			className="w-full mb-4 px-3 py-2 border border-gray-300 rounded"
		  />
		  <button 
			onClick={requestSignup}
			className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
		  >Sign Up</button>

		  <button 
			onClick={handleClose}
			className="w-full bg-blue-300 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded border mt-3"
		  >Cancel</button>
		  <br />
		  {errorMessage && <p className="text-red-500">{errorMessage}</p>}
		</div>
	  </div>
	);
}

export default SignupPopup;