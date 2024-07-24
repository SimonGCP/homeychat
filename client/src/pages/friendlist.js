import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserDetails } from '../utils/utils.js';
import axios from 'axios';

function Friendlist(props) {
    const userId = props.id;
    const [ userDetails, setUserDetails ] = useState({});
    const [ friendDetails, setFriendDetails ] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const getInfo = async () => {
            const details = await getUserDetails();
            setUserDetails(details);
            try {
                const friendInfo = await axios.get('http://localhost:8000/account/friend-list', {
                    params: { id: details._id },
                    headers: {'Content-Type': 'application/json'},
                });

                console.log(friendInfo.data.friendList);
                setFriendDetails(friendInfo.data.friendList);
            } catch(err) {
                console.log(err);
            };
        }

        getInfo();
    }, []);

    function joinFriend(roomId) {
        navigate(`/chatroom?id=${roomId}`)
    }

    return (
        <div className='w-full align-center'>
            <div className='align-center'>
                <table className='w-full table-auto text-left bg-slate-900 text-white'>
                    <thead>
                        <tr>
                            <th className='px-6 py-3' scope='col'>Friends</th>
                        </tr>
                    </thead>
                    <tbody>
                        { friendDetails && friendDetails.map(friend => 
                            <tr className='odd:bg-slate-300 even:bg-slate-400 flex items-center text-black' key={friend._id}>
                                <td className='px-6 py-3 mr-auto'>{friend.username}</td>
                                <td className='px-6 py-3 mr-auto'>{friend.currentRoom === '' ? 'Offline' : 'Online'}</td>
                                { friend.currentRoom !== '' && (
                                    <button onClick={() => joinFriend(friend.currentRoom)} className='mr-2 w-16 h-10 bg-slate-500 rounded-md border-2 border-black hover:bg-slate-600'>Join</button>
                                )}
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Friendlist;
