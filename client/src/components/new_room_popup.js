import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function NewRoomPopup(props) {
    const [ roomTopic, setRoomTopic ] = useState('');
    const [ roomCapacity, setRoomCapacity ] = useState(10);
    const [ errorMessage, setErrorMessage ] = useState('');

    const navigate = useNavigate();
    const maxRoomCapacity = 50;

    function handleRoomTopicChange(event) {
        setRoomTopic(event.target.value);
    }

    function handleRoomCapacityChange(event) {
        setRoomCapacity(event.target.value);
    }

    function handleClose() {
        props.hideForm();
    }

    async function makeNewRoom() {
        if (roomTopic === '') {
            setErrorMessage('Please specify the topic of the room');
            return;
        }

        if (roomCapacity > maxRoomCapacity) {
            setErrorMessage(`Maximum number of clients is ${maxRoomCapacity}`);
            setRoomCapacity(maxRoomCapacity);
            return;
        }
        
        axios.post('http://localhost:8000/rooms/new-room', {
            topic: roomTopic,
            capacity: roomCapacity,
        }, {
            headers: {
                "Content-Type": "application/json",
            },
            withCredentials: true,
        })
        .then(async (response) => {
            const { _id } = response.data;
            console.log(_id);

            if (_id) {
                navigate(`/chatroom?id=${_id}`);
            }
        }).catch((error) => {
            if (error.response){
                console.log(error.response);
            } else if(error.request){
                console.log(error.request);
            } else if(error.message){
                console.log(error.message);
            }
        });
    }

    return (
        <div className='fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-800 bg-opacity-75 z-50'>
            <div className='bg-white rounded-lg p-8 max-w-md w-full'>
                <input
                    type="text"
                    placeholder="Room Topic"
                    value={roomTopic}
                    onChange={handleRoomTopicChange}
                    className="w-full mb-4 px-3 py-2 border border-gray-300 rounded"
                ></input>
                <label htmlFor='capacity'>Maximum Clients</label>
                <input
                    type='number'
                    min='1' max={maxRoomCapacity}
                    id='capacity'
                    value={roomCapacity}
                    onChange={handleRoomCapacityChange}
                    className="w-full mb-4 px-3 py-2 border border-gray-300 rounded"
                ></input>

                {errorMessage !== '' && (
                    <p className='text-red-600'>{errorMessage}</p>
                )}

                <button 
                    onClick={makeNewRoom}
                    className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded border"
                >Make New Room</button>
                <button 
                    onClick={handleClose}
                    className="w-full bg-blue-300 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded border mt-3"
                >Cancel</button>
            </div>
        </div>
    );
}

export default NewRoomPopup;