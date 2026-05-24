const axios = require('axios');

async function run() {
  try {
    // 1. register or login
    let token;
    try {
        const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
          username: 'admin',
          password: 'admin_password' // guess for dev_seed
        });
        token = loginRes.data.access_token;
    } catch(e) {
        console.log('login fail, try register');
        const regRes = await axios.post('http://localhost:3000/api/auth/register', {
          username: 'testuser2',
          email: 'testuser2@test.com',
          password: 'password123'
        });
        token = regRes.data.access_token;
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
    console.log('err:', e.response?.data || e.message);
  }
}
run();
