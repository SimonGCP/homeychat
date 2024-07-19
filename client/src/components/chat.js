import '../index.css'

function Chat(props) {
    const roomMessages = props.roomMessages;
    return (
        <>
            <table>
                <tbody>
                    {roomMessages && roomMessages.map(message => 
                        <tr key={message.timestamp}>
                            <td>{message.author}</td>
                            <td>{message.message}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </>
    );
}

export default Chat;