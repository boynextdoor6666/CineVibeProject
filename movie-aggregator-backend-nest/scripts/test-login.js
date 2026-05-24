const axios = require('axios');
async function run() {
  try {
    const res = await axios.post('http://127.0.0.1:8080/api/auth/login', { username: 'demo', password: 'password123' });
    const token = res.data.access_token;
    console.log('Login token:', token);
    const r2 = await axios.post('http://127.0.0.1:8080/api/reviews', { contentId: 2, reviewType: 'VIEWER', content: 'Testing out the review constraint fix', rating: 7 }, { headers: { Authorization: Bearer  }});
    console.log('review result:', r2.data);
  } catch(e) {
    if (e.response) {
      console.log('err data:', e.response.status, e.response.data);
    } else {
      console.log('network err:', e.message);
    }
  }
}
run();
