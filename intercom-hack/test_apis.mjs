import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const YOU_API_KEY = process.env.YOU_API_KEY;

async function testYou(config) {
    console.log(`\n--- Testing You.com: ${config.name} ---`);
    console.log(`URL: ${config.url}`);
    console.log(`Header: ${config.headerName}`);

    if (!YOU_API_KEY) {
        console.log('YOU_API_KEY is missing');
        return;
    }

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    if (config.headerName === 'X-API-Key') {
        headers['X-API-Key'] = YOU_API_KEY;
    } else {
        headers['Authorization'] = `Bearer ${YOU_API_KEY}`;
    }

    if (config.method === 'POST') {
        headers['Content-Type'] = 'application/json';
    }

    try {
        const fetchOptions = {
            method: config.method || 'GET',
            headers: headers
        };
        if (config.body) {
            fetchOptions.body = config.body;
        }

        const response = await fetch(config.url, fetchOptions);
        console.log('Status:', response.status, response.statusText);
        const text = await response.text();
        console.log('Response:', text.substring(0, 500));
    } catch (err) {
        console.error('Error:', err.message);
    }
}

async function runTests() {
    const queries = 'latest+NFL+AFC+champions';
    const configs = [
        { name: 'YDC Search V1 X-API-Key', url: `https://api.ydc-index.io/v1/search?query=${queries}`, headerName: 'X-API-Key' },
        { name: 'YDC Search V1 Bearer', url: `https://api.ydc-index.io/v1/search?query=${queries}`, headerName: 'Authorization' },
        { name: 'YDC Search Legacy X-API-Key', url: `https://api.ydc-index.io/search?query=${queries}`, headerName: 'X-API-Key' },
        { name: 'YDC Search Legacy Bearer', url: `https://api.ydc-index.io/search?query=${queries}`, headerName: 'Authorization' },
        { name: 'You Search V1 X-API-Key', url: `https://api.you.com/v1/search?query=${queries}`, headerName: 'X-API-Key' },
        { name: 'You Search V1 Bearer', url: `https://api.you.com/v1/search?query=${queries}`, headerName: 'Authorization' },
        { name: 'Agents API Run', url: 'https://api.you.com/v1/agents/runs', method: 'POST', headerName: 'Authorization', body: JSON.stringify({ agent: 'advanced', input: 'who are the afc champions' }) }
    ];

    for (const config of configs) {
        await testYou(config);
    }
}

runTests();
