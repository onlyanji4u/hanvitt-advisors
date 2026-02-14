import http from 'http';

function checkHeaders() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:5000/', (res) => {
      console.log('--- Security Headers Check ---');
      const hsts = res.headers['strict-transport-security'];
      const csp = res.headers['content-security-policy'];
      
      console.log(`HSTS: ${hsts ? '✅ Present' : '❌ Missing'} (${hsts})`);
      console.log(`CSP: ${csp ? '✅ Present' : '❌ Missing'} (${csp ? 'Configured' : ''})`);
      
      if (hsts && csp) resolve(true);
      else resolve(false);
    });
    
    req.on('error', (e) => {
      console.error(`Problem with request: ${e.message}`);
      reject(e);
    });
    
    req.end();
  });
}

function checkContactAPI() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      name: 'Verification Bot',
      email: 'help@hanvitt.in',
      message: 'Checking API functionality',
      phone: '1234567890'
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/contact',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      console.log('\n--- Contact API Check ---');
      console.log(`Status Code: ${res.statusCode}`);
      
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`Response Body: ${body}`);
        if (res.statusCode === 201) {
          console.log('✅ API Functional');
          resolve(true);
        } else {
          console.log('❌ API Failed');
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.error(`Problem with request: ${e.message}`);
      reject(e);
    });

    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('Waiting for server to start...');
  setTimeout(async () => {
    try {
      await checkHeaders();
      await checkContactAPI();
    } catch (e) {
      console.error(e);
    }
  }, 5000); // Wait 5s for server to settle
}

run();
