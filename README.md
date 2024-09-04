# homeychat
homeychat is an online chat application written with the MERN stack. It allows users to meet new people with similar interests by creating and joining chatrooms where they can chat with people with similar interests. The aim of this web app is to facilitate social connection with strangers who can become friends by discussing common interests in chatrooms of up to 50 people.

### Chatrooms
Chatrooms are implemented with the Socket.IO package.

### User Authentication
Users can securely create and login to their accounts as their personal information is encrypted by the SHA-256 algorithm before being stored.

### Development
To run the project locally, you will need to provide the following ENV variables in the server directory in a .env file:
```
MONGODB_URI=(your MongoDB URI)
SECRET=(a secret passphrase)
NODE_ENV=development
```
Then, run ```npm start``` first from the server directory, and again from the client directory in a separate terminal.
