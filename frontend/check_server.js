const http = require('http');

const options = {
    host: '127.0.0.1',
    port: 3000,
    timeout: 2000
};

const request = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
});

request.on('error', (e) => {
    console.log(`ERROR: ${e.message}`);
});

request.end();
