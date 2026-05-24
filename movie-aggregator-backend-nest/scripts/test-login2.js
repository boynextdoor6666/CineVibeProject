const axios = require('axios');
async function run() {
  try {
    const r1 = await axios.post('http://127.0.0.1:8080/api/auth/register', { username: 'testdemo3', email: 'testdemo3@example.com', password: 'password123', role: 'USER' });
    const token = r1.data.access_token || r1.data.token || r1.data.accessToken;
    console.log('Login token:', token?.substring(0,20)+'...');
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
