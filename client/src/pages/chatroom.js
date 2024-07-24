import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUserDetails, updateChatroomUserList } from '../utils/utils.js';
import axios from 'axios';
import { socket } from '../socket.js';


const push = true;

function Chatroom(props) {
    const [ isConnected, setIsConnected ] = useState(socket.connected);
    const chatsRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const [ currentRoomID, setCurrentRoomID ] = useState('');
    const [ roomTopic, setRoomTopic ] = useState('');
    const [ message, setMessage ] = useState('');
    const [ roomMessages, setRoomMessages ] = useState([]);
    const [ userDetails, setUserDetails ] = useState({});

    class Chat {
        constructor (author, message) {
            this.author = author;
            this.message = message;
        }
    }

    const getRoomDetails = async (id) => {
        await axios.get('http://localhost:8000/rooms/room-details', {
            params: {
                id,
            }
        },{
            headers: {
                "Content-Type": "application/json",
            },
            withCredentials: true,
        })
        .then((response) => {
            console.log("got room details");
            console.log(response);
            setRoomTopic(response.data.topic);
            setRoomMessages(response.data.messages);
        })
        .catch((error) => {
            console.log(error);
            setRoomTopic('');
        });
    }

    const getInfo = async (roomID, username) => {
        const details = await getUserDetails();
        username = details.username;
        setUserDetails(details);
        console.log(details.username);

        if (!userDetails) {
            return;
        }
        setCurrentRoomID(roomID);
        await getRoomDetails(roomID);

        console.log('roomID, ', roomID);
        socket.send(JSON.stringify({room: roomID, username: details.username}));
        await updateChatroomUserList(details._id, roomID, push);
    }

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);       
        const roomID = searchParams.get('id');
        var username;

        getInfo(roomID, username);

        async function onConnect() {
            setIsConnected(true);
        }

        function onDisconnect() {
            leaveRoom();
            setIsConnected(false);
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        socket.on('message', (event) => {
            console.log('Message from server ', event);
    
            try {
                const { author, message } = JSON.parse(event);
    
                const newChat = new Chat(author, message);
                setRoomMessages(roomMessages => [...roomMessages, newChat]);
            } catch(err) {
                console.log('unexpected message format');
                console.log(`message: ${event}`);
            }
        });

        socket.on('connection', (event) => {
            console.log('Connection received');

            try {
                const { username } = JSON.parse(event);

                const notification = `${username} connected`;
                setRoomMessages(roomMessages => [...roomMessages, notification]);
            } catch(err) {
                console.log('error getting connection data');
            }
        });

        const listener = event => {
            if (event.code === "Enter" || event.code === "NumpadEnter") {
              console.log("Enter key was pressed. Run your function.");
              event.preventDefault();
              sendMessageToWs(userDetails.username, message, currentRoomID);
            }
          };
          document.addEventListener("keydown", listener);

        // manually connects and disconnects to socket on leave/entry
        socket.connect();

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('message');
            document.removeEventListener("keydown", listener);
        };
    }, []);

    // sets scroll to bottom of chat window by default when opening or when new message
    useEffect(() => {
        if (chatsRef.current){
            chatsRef.current.scrollTop = chatsRef.current.scrollHeight;
        }
    }, [roomMessages]);

    const sendMessageToWs = (author, message, id) => {
        // step 1: send message to websocket, broadcast to other users
        if (message === '') {
            // do not send empty message
            return;
        }

        try {
            socket.send(JSON.stringify({
                currentRoomID,
                author,
                message,
            }));
        } catch(err) {
            console.log(err);
        }

        // step 2: send message to database for later
        axios.post('http://localhost:8000/rooms/send-message', {
            author: userDetails.username,
            message,
            roomID: currentRoomID,
        },{
            headers: {
                "Content-Type": "application/json",
            },
        })
        .catch((error) => {
            console.log(error);
        });

        setMessage('');
    }

    const updateMessage = (event) => {
        setMessage(event.target.value);
    }

    const leaveRoom = async () => {
        socket.emit('disconnect-message', JSON.stringify({
            "username": userDetails.username,
            "roomID": currentRoomID,    
        }), (ack) => {
            console.log(ack);
        })
        await updateChatroomUserList(userDetails._id, currentRoomID, false);
        socket.disconnect();
        navigate('/');
    }

    const openAuthorMenu = () => {
        console.log('here');
    }

    return (
        <div>
            { (userDetails) && (
                <div className='flex flex-col items-center justify-center h-screen self-center bg-slate-400'>
                    <div className='flex flex-row w-full items-between justify-center mb-2'>
                        <p className='text-xl text-center p-2'>Welcome to the chatroom, {userDetails.username}!
                            The topic is {roomTopic}.
                        </p>
                        <button onClick={leaveRoom} className='bg-red-700 p-2 rounded-md border-2 border-black hover:bg-red-500 transition-all'>Leave</button>
                    </div>

                    <div ref={chatsRef} className='chat-interface flex flex-col w-5/6 h-4/6 self-center bg-slate-200 rounded-t-md border-2 border-b-0 border-slate-700 overflow-y-auto px-4 py-2'>
                        { roomMessages.map((message, index) => (
                            <div key={index} id='chats' className='flex flex-col-reverse mb-4'>
                                { message.author && (
                                    <>
                                        <div className={`rounded-md ${message.author === userDetails.username ? 'bg-emerald-700' : 'bg-cyan-800 float-right'} text-white py-4 px-3 shadow-md`}>
                                            {message.message}
                                        </div>
                                        <button onClick={() => openAuthorMenu()} className='pl-2 text-gray-600'>{message.author}</button>
                                    </>
                                )}
                                { !message.author && (
                                    <p className='text-slate-400'>{message}</p>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className='w-full flex justify-center'>
                        <input type='text' placeholder='message here' value={message} onChange={updateMessage} className='bg-slate-200 rounded-bl-md border-2 border-slate-700 w-4/6 h-14 t-4'/>
                        <button type='submit' onClick={() => sendMessageToWs(userDetails.username, message, currentRoomID)} className='bg-blue-200 rounded-br-md border-2 border-slate-700 hover:bg-blue-400 w-1/6'>send</button>
                    </div>
                </div>
            )}
            { (!userDetails) && (
                <div>
                    <p>You need to sign in to access chat rooms!</p>
                </div>
            )}
        </div>
    );
}

export default Chatroom;
