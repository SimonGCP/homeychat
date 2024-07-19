import axios from 'axios';

export const getUserDetails = async () => {
    try {
        const response = await axios.get('http://localhost:8000/account', {
            Headers: {
                "Content-Type": "application/json",
            },
            withCredentials: true,
        });

        return response.data;
    } catch(err) {
        console.log(err);
        return null;
    }
}

export const updateChatroomUserList = async (userID, roomID, push) => {
    if (userID === '' || roomID === '') {
        return;
    }

    await axios.post('http://localhost:8000/rooms/update-list', {
        userID,
        roomID,
        push,
    },{
        headers: {
            "Content-Type": "application/json",
        },
        withCredentials: true,
    })
    .catch((error) => {
        console.log(error.message);
    });
}