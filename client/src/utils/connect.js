import useWebSocket from 'react-use-websocket';
import { useEffect } from 'react';

export const ConnectToWS = ({ author, id }) => {
    const WS_URL = 'ws://localhost:8000/rooms/connect'

    const { sendJsonMessage } = useWebSocket(WS_URL, {
        queryParams: {
            author,
            id,
        },
        share: true,
    });

    useEffect(() => {
        sendJsonMessage({ message: "Hello" });
    }, [])
}