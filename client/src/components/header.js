import axios from 'axios';
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import '../index.css'
import LoginPopup from './login_popup';
import SignupPopup from './signup_popup';

const UNAUTHORIZED = 401;

function Header() {
    const [ toggleLoginPopup, setToggleLoginPopup ] = useState(false);
    const [ toggleSignupPopup, setToggleSignupPopup ] = useState(false);
    const [ loggedIn, setLoggedIn ] = useState(false);
    const [ showSidebar, setShowSidebar ] = useState(false);
    const [ username, setUsername ] = useState('');

    const navigate = useNavigate();

    const navigateToLogin = () => {
        setToggleLoginPopup(true);
    }

    const navigateToSignup = () => {
        setToggleSignupPopup(true);
    }

    const hideLogin = () => {
        setToggleLoginPopup(false);
        checkLogin();
    }

    const hideSignup = () => {
        setToggleSignupPopup(false);
        checkLogin();
    }

    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
    }

    const navigateToAccount = () => {
        if (username !== '') {
            navigate(`/account?username=${username}`);
        }
    }

    const logout = async () => {
        await axios.post('http://localhost:8000/logout', {}, {
            headers: {
                "Content-Type": "application/json",
            },
            withCredentials: true,
        })
        .then((data) => {
            setUsername('');
            setLoggedIn(false);
        })
        .catch((error) => {
            console.error(error.message);
        });

        toggleSidebar();
        navigate('/');
    }

    const checkLogin = async () => {
        await axios.get('http://localhost:8000/account', {
            headers: {
                "Content-Type": "application/json",
            },
            withCredentials: true,
        })
        .then((response) => {
            setUsername(response.data.username);
            setLoggedIn(true);

            console.log(`Logged in with username ${response.data.username}`);
        })
        .catch((error) => {
            if (error.response && error.response.status === UNAUTHORIZED) {
                setUsername('');
                setLoggedIn(false);
                console.log("not logged in");
            } else {
                console.log(error);
            }
        });
    }

    useEffect(() => {
        checkLogin();
    }, [loggedIn]);

    return (
        <>
            <div className="bg-slate-800 mb-auto w-full h-16 flex items-center justify-between">
                <div className="logo ml-3">
                    <h1 className="text-2xl text-white">homeychat</h1>
                </div>

                {!loggedIn && (
                    <div className="buttons ml-auto mr-3">
                        <button className="w-24 h-12 border-2 bg-slate-400 rounded-l-lg hover:bg-slate-700 hover:text-white"
                            onClick={navigateToLogin}
                        >Log In</button>
                        <button className="w-24 h-12 border-2 bg-slate-400 rounded-r-lg hover:bg-slate-700 hover:text-white"
                            onClick={navigateToSignup}
                        >Sign Up</button>
                    </div>
                )}
                {loggedIn && (
                    <div className="sidebar-toggle-button ml-auto mr-3">
                        <button onClick={toggleSidebar} className="w-24 h-12 border-2 bg-slate-400 rounded-lg hover:bg-slate-700 hover:text-white" >
                            {username}</button>
                    </div>
                )}

                <div className="auth-handler">
                    {toggleLoginPopup && (
                        <div>
                            <LoginPopup hideLogin={hideLogin}/>
                        </div>
                    )}
                    {toggleSignupPopup && !toggleLoginPopup && (
                        <div>
                            <SignupPopup hideSignup={hideSignup}/>
                        </div>
                    )}
                </div>
            </div>

            <div className={`sidebar h-full ${showSidebar ? 'w-1/6' : 'w-0'} bg-slate-500 fixed top-16 right-0 bg-opacity-75 transition-all z-50`}>
                <button onClick={navigateToAccount} className='w-full h-12 bg-slate-600 hover:bg-slate-800 hover:text-white transition-all'>My account</button>
                <button onClick={logout} className='w-full h-12 bg-slate-600 hover:bg-slate-800 hover:text-white transition-all'>Log out</button>
            </div>
        </>
    );
}

export default Header;
