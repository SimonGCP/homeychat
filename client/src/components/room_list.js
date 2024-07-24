import axios from 'axios';
import '../index.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserDetails } from '../utils/utils';
import NewRoomPopup from './new_room_popup';
import LoginPopup from './login_popup';

function RoomList() {
    const navigate = useNavigate();
    const [ rooms, setRooms ] = useState([]);
    const [ toggleNewRoomForm, setToggleNewRoomForm ] = useState(false);
    const [ userDetails, setUserDetails ] = useState({});
    const [ toggleLoginPopup, setToggleLoginPopup ] = useState(false);
    const [ currentRoomID, setCurrentRoomID ] = useState('');
    const [ refreshList, setRefreshList ] = useState(false);

    const getRooms = () => {
        axios.get('http://localhost:8000/rooms/get-rooms', {
            headers: {
                "Content-Type": "application/json",
            },
        })
        .then((response) => {
            setRooms(response.data);
            console.log(response.data);
            console.log("Got rooms");
        }).catch((err) => {
            console.log(err);
        });
    }

    // used to confirm that the room still has capacity when joining
    const getRoomDetails = async (id) => {
        try {
            const response =  await axios.get('http://localhost:8000/rooms/room-details', {
                params: {
                    id
                },
                headers: {
                    "Content-Type": "application/json",
                },
            })

            return response.data;
        } catch(err) {
            console.log(err);
            return null;
        }
    }

    const joinRoom = async(room_id, capacity, users) => {
        const room = await getRoomDetails(room_id);
        if (!room) {
            return;
        }

        if (room.users.length >= room.roomCapacity) {
            setCurrentRoomID('full');
            return;
        }

        const details = await getUserDetails();

        if (details) {
            setCurrentRoomID(room_id);
            navigate(`/chatroom?id=${room_id}`, { state: {roomID: room_id, accountInfo: userDetails}});
        } else {
            setToggleLoginPopup(true);
        }
    }

    function refresh() {
        setRefreshList(!refreshList);
    }

    useEffect(() => {
        const getDetails = async () => {
            setUserDetails(await getUserDetails());
        }
        
        getDetails();
        getRooms();
    }, [currentRoomID, refreshList]);

    return (
        <div className='h-5/6 overflow-y-auto'>
            { toggleLoginPopup && <LoginPopup hideLogin={() => setToggleLoginPopup(false)}/>}
            { toggleNewRoomForm && < NewRoomPopup hideForm={() => setToggleNewRoomForm(false)}/>}
            <div className='relative flex items-center justify-between w-11/12 pl-20'>
                <p className='text-3xl text-center mt-2 mb-2 float-left'>Rooms</p>
                <div>
                    <button onClick={() => setToggleNewRoomForm(!toggleNewRoomForm)} className='w-24 h-12 border-2 bg-slate-400 rounded-r-lg hover:bg-slate-700 hover:text-white float-right'>New Room</button>
                    <button onClick={refresh} className='w-24 h-12 border-2 bg-slate-400 rounded-l-lg hover:bg-slate-700 hover:text-white float-right'>Refresh</button>
                </div>
            </div>
            <div className="relative flex justify-center back z-40">
                <table className="w-11/12 table-auto text-left bg-slate-900 text-white">
                    <thead>
                        <tr>
                            <th className='px-6 py-3' scope="col">Topic</th>
                        </tr>
                    </thead>
                    <tbody className='text-black'>
                        {rooms && rooms.map(room => 
                            <tr className="odd:bg-slate-300 even:bg-slate-400 flex items-center" key={room._id}>
                                <td className='px-6 py-3 mr-auto'>{room.topic}</td>
                                <td className='px-6 py-3 mr-auto'>{room.users.length}/{room.roomCapacity}</td>
                                <td>
                                    <button onClick={() => joinRoom(room._id, room.roomCapacity, room.users.length)} className='px-3 py-2 bg-slate-500 hover:bg-white transition-colors mr-3 rounded-md border-2 border-slate-800 disabled:bg-slate-800' disabled={room.users.length === room.roomCapacity}>Join</button>
                                </td>
                            </tr> 
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default RoomList;
