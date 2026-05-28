import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:5002/api/v1';

async function testApi() {
    console.log('--- STARTING API VERIFICATION TESTS ---');
    const randomUsername = `testuser_${Math.floor(Math.random() * 100000)}`;
    const email = `${randomUsername}@example.com`;
    const password = 'testpassword123';

    try {
        // 1. Test Sign Up
        console.log(`1. Testing Sign Up with username: ${randomUsername}...`);
        const signupRes = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: randomUsername,
                email,
                password,
                firstName: 'Test',
                lastName: 'User'
            })
        });

        const signupData = await signupRes.json();
        console.log('Signup Response status:', signupRes.status);
        console.log('Signup Response data:', signupData);

        if (signupRes.status !== 201 || !signupData.success) {
            throw new Error('Sign Up test failed');
        }
        console.log('✅ Sign Up works!');

        // 2. Test Sign In
        console.log(`2. Testing Sign In for ${randomUsername}...`);
        const signinRes = await fetch(`${API_URL}/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: randomUsername,
                password
            })
        });

        const signinData = await signinRes.json();
        console.log('Signin Response status:', signinRes.status);
        console.log('Signin Response data:', signinData);

        if (signinRes.status !== 200 || !signinData.accessToken) {
            throw new Error('Sign In test failed');
        }
        const token = signinData.accessToken;
        console.log('✅ Sign In works! Token received.');

        // 3. Test Auth Me
        console.log('3. Testing Auth Me (/user/me)...');
        const meRes = await fetch(`${API_URL}/user/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const meData = await meRes.json();
        console.log('Auth Me Response status:', meRes.status);
        console.log('Auth Me Response data:', meData);

        if (meRes.status !== 200 || !meData.success || !meData.user) {
            throw new Error('Auth Me test failed');
        }
        console.log('✅ Auth Me works! User profile retrieved successfully.');
        console.log(`User ID: ${meData.user.id}, Username: ${meData.user.username}`);

        console.log('--- ALL BASIC API TESTS PASSED SUCCESSFULLY! ---');
        process.exit(0);
    } catch (error) {
        console.error('❌ API Verification Test failed:', error);
        process.exit(1);
    }
}

testApi();
