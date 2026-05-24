const axios = require('axios');

async function run() {
  try {
    let token;
    try {
        const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
          username: 'testuser2',
          password: 'password123'
        });
        token = loginRes.data.access_token;
    } catch(e) {
        console.log('login fail', e.response?.data);
        return;
    }
    
    // 2. add review
    const res = await axios.post('http://localhost:3000/api/reviews', {
      contentId: 2,
      reviewType: 'VIEWER',
      content: 'This is another great test',
      rating: 8
    }, {
      headers: { Authorization: Bearer  }
    });
    console.log('review created:', res.data);
  } catch(e) {
    console.log('err review:', e.response?.data || e.message);
  }
}
run();
