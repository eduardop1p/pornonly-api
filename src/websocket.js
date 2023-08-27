// const { io } = require('./app');
// const axios = require('axios');

// async function get(token) {
//   try {
//     const { data } = await axios.get(`${process.env.URL}/users`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return data;
//   } catch (err) {}
// }

// io.on('connection', async socket => {
//   const token = socket.handshake.auth.token;
//   const data = await get(token);
//   socket.data.user = data;
// });
