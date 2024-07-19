import { useEffect } from 'react';
import RoomList from '../components/room_list';
import { getUserDetails, updateChatroomUserList } from '../utils/utils';

function Main() {

	useEffect(() => {
        const getDetails = async () => {
            const details = await getUserDetails();
            if (details) {
                console.log('userDetails, ', details);
                // updateChatroomUserList(details._id, details.currentRoom, false);
            }
            return details;
        }

		getDetails();
	}, [])

    return (
        <div>
            <RoomList />
        </div>
    );
}

export default Main;