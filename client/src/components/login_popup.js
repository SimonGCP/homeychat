import axios from 'axios';
import '../index.css';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SignupPopup from './signup_popup.js';

function LoginPopup(props) {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [errorMessage, setErrorMessage] = useState('');

	const navigate = useNavigate();

	// send a request to server to login
	const requestLogin = () => {
		// navigate("http://localhost:8000/google");
		if (username === '') {
			setErrorMessage("please enter a username");
			return;
		} else if (password === '') {
			setErrorMessage("please enter a password");
			return;
		}

		axios.post('http://localhost:8000/login', {
			username: username,
			password: password,
		},{
			headers: {
             "Content-Type": "application/json",
         },
         withCredentials: true,
		})
		.then((data) => {
			setErrorMessage('');
			console.log(data);

			navigate('/');
			handleClose();
		})
		.catch((error) => {
			if(error.response && error.response.status === 400) {
				setErrorMessage(error.response.data.message);
			} else {
				setErrorMessage(`error: ${error}`);
				console.log(error);	
			}
		})
	}

	const handleUsernameChange = (event) => {
		setUsername(event.target.value);
	}

	const handlePasswordChange = (event) => {
		setPassword(event.target.value);
	}

	function handleClose() {
		props.hideLogin();
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

			<button 
				onClick={requestLogin}
				className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded border"
			>Log In</button>

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

export default LoginPopup;
