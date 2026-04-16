
const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function test() {
  // Get Google Fonts CSS for Roboto
  const cssUrl = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap';
  console.log('Fetching Google Fonts CSS...');
  
  try {
    const result = await fetchUrl(cssUrl);
    console.log('Status:', result.status);
    console.log('CSS:');
    console.log(result.data);
  } catch(e) {
    console.log('Error:', e.message);
  }
}

test();
