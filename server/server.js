const port = 8000;
const { server } = require('./index.js');

server.listen(port, () => {
	console.log(`server listening on port ${port}`);
});

module.exports = server;
