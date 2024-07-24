import './styles.css';
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Main from './pages/home.js';
import Chatroom from './pages/chatroom.js';
import Missing from './pages/missing.js';
import Friendlist from './pages/friendlist.js';
import AccountPage from './pages/account.js';
import Header from './components/header';


function App() {
	return (
		<div className="App">
			<BrowserRouter>
				<Header />
				<Routes>
					<Route path="/" element={<Main />} />
					<Route path="/account" element={<AccountPage />} />
					<Route path="/chatroom" element={<Chatroom />} />
                    <Route path="/account/friends" element={<Friendlist />} />
					<Route path="/*" element={<Missing />} />
				</Routes>
			</BrowserRouter>
		</div>
  );
}

export default App;
