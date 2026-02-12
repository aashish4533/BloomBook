const https = require('https');

const urls = [
    'https://images.unsplash.com/photo-1507842217153-e21f40668bc9?auto=format&fit=crop&q=80&w=1000'
];

function checkUrl(url) {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            resolve({ url, status: res.statusCode });
        }).on('error', (e) => {
            resolve({ url, status: 'ERROR', error: e.message });
        });
    });
}

async function run() {
    console.log('Checking external assets...');
    for (const url of urls) {
        const result = await checkUrl(url);
        console.log(`[${result.status}] ${result.url}`);
    }
}

run();
