const axios = require('axios');
async function run() {
  try {
    const regRes = await axios.post('http://localhost:3000/api/auth/register', { username: 'AidarTest', email: 'AidarTest@test.com', password: 'password123' });
    const token = regRes.data.access_token;
    console.log('Registered token:', token);
    const res = await axios.post('http://localhost:3000/api/reviews', { contentId: 2, reviewType: 'VIEWER', content: 'This is an amazing test', rating: 9 }, { headers: { Authorization: Bearer  }});
    console.log('review created:', res.data);
  } catch(e) {
    console.log('err:', e.response?.data || e.message);
  }
}
run();
