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

const AKASH_API_KEY = process.env.AKASH_API_KEY;
const AKASH_MODEL = process.env.AKASH_MODEL || 'meta-llama/Meta-Llama-3-8B-Instruct';
const CONFIGURED_URL = process.env.AKASH_BASE_URL;

// List of base URLs to test
// We will test the configured one first.
const CANDIDATE_URLS = [
    CONFIGURED_URL,
    'https://console-api.akash.network/v1',
    'https://console-api.akash.network/api/v1',
    'https://api.akashml.com/v1',
];

// Deduplicate
const uniqueUrls = [...new Set(CANDIDATE_URLS.filter(Boolean))];

console.log('Testing Akash API with Model:', AKASH_MODEL);
console.log('Key Present:', !!AKASH_API_KEY);

async function testUrl(baseUrl) {
    // Handle trailing slashes in baseUrl to avoid double slashes
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const fullUrl = `${cleanBase}/chat/completions`;
    console.log('Testing URL:', fullUrl);

    try {
        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AKASH_API_KEY}`
            },
            body: JSON.stringify({
                model: AKASH_MODEL,
                messages: [{ role: 'user', content: 'Hello' }],
                temperature: 0.7,
            })
        });

        const text = await response.text();
        console.log(`Response Status: ${response.status} ${response.statusText}`);

        // Check if it looks like JSON
        if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
            try {
                const data = JSON.parse(text);
                if (response.ok) {
                    console.log('SUCCESS! Valid JSON response:', data.choices?.[0]?.message?.content);
                    return true;
                } else {
                    console.log('Valid JSON Error:', JSON.stringify(data, null, 2));
                    // If specific error code matches known "wrong endpoint" issues, continue.
                    // Otherwise, if it's a valid API error (flakey model, rate limit), we found the endpoint.
                    if (response.status === 404) return false;
                    return false;
                }
            } catch (e) {
                console.log('Failed to parse JSON.');
            }
        } else {
            console.log('Response is not JSON.');
        }
    } catch (error) {
        console.error('Network Error:', error.message);
    }
    return false;
}

async function runTests() {
    if (!AKASH_API_KEY) {
        console.error('ERROR: AKASH_API_KEY is missing');
        return;
    }

    for (const url of uniqueUrls) {
        console.log('---');
        const success = await testUrl(url);
        if (success) {
            console.log('\n>>> FOUND WORKING URL:', url);
            break;
        }
    }
}

runTests();
