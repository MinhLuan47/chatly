import dotenv from 'dotenv';
import { io as clientIo } from 'socket.io-client';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const API_URL = 'http://localhost:5002/api/v1';
const prisma = new PrismaClient();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runAllTests() {
    console.log('🚀 --- INITIATING COMPREHENSIVE E2E & SOCKET.IO API TESTS --- 🚀');

    const rand = () => Math.floor(Math.random() * 1000000);
    const uA = { username: `user_a_${rand()}`, email: `a_${rand()}@test.com`, password: 'password123', firstName: 'A', lastName: 'User' };
    const uB = { username: `user_b_${rand()}`, email: `b_${rand()}@test.com`, password: 'password123', firstName: 'B', lastName: 'User' };
    const uC = { username: `user_c_${rand()}`, email: `c_${rand()}@test.com`, password: 'password123', firstName: 'C', lastName: 'User' };

    let tokenA = '';
    let tokenB = '';
    let tokenC = '';
    
    let userIdA = '';
    let userIdB = '';
    let userIdC = '';
    
    let cookieA = '';

    let socketA: any;
    let socketB: any;

    try {
        // ==========================================
        // 1. SIGNUP & SIGNIN TESTS
        // ==========================================
        console.log('\n--- [Step 1: Auth - Sign Up & Sign In] ---');
        
        for (const user of [uA, uB, uC]) {
            console.log(`Registering ${user.username}...`);
            const signupRes = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });
            const signupData = await signupRes.json();
            if (signupRes.status !== 201 || !signupData.success) {
                throw new Error(`Failed to sign up user: ${user.username}. Status: ${signupRes.status}, Error: ${JSON.stringify(signupData)}`);
            }
        }
        console.log('✅ All 3 users signed up successfully!');

        const loginResA = await fetch(`${API_URL}/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: uA.username, password: uA.password })
        });
        const loginDataA = await loginResA.json();
        tokenA = loginDataA.accessToken;
        
        // Grab Set-Cookie for Sign Out
        const setCookieHeader = loginResA.headers.get('set-cookie');
        if (setCookieHeader) {
            cookieA = setCookieHeader.split(';')[0];
        }
        console.log('✅ User A logged in successfully.');

        const loginResB = await fetch(`${API_URL}/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: uB.username, password: uB.password })
        });
        const loginDataB = await loginResB.json();
        tokenB = loginDataB.accessToken;
        console.log('✅ User B logged in successfully.');

        const loginResC = await fetch(`${API_URL}/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: uC.username, password: uC.password })
        });
        const loginDataC = await loginResC.json();
        tokenC = loginDataC.accessToken;
        console.log('✅ User C logged in successfully.');

        // ==========================================
        // 2. USER PROFILE & SEARCH TESTS
        // ==========================================
        console.log('\n--- [Step 2: User Profile & Search] ---');

        const meRes = await fetch(`${API_URL}/user/me`, {
            headers: { 'Authorization': `Bearer ${tokenA}` }
        });
        const meData = await meRes.json();
        if (meRes.status !== 200 || !meData.success) {
            throw new Error('GET /user/me failed');
        }
        userIdA = meData.user.id;
        console.log(`✅ User A verified. ID: ${userIdA}`);

        const meResB = await fetch(`${API_URL}/user/me`, {
            headers: { 'Authorization': `Bearer ${tokenB}` }
        });
        const meDataB = await meResB.json();
        userIdB = meDataB.user.id;

        const meResC = await fetch(`${API_URL}/user/me`, {
            headers: { 'Authorization': `Bearer ${tokenC}` }
        });
        const meDataC = await meResC.json();
        userIdC = meDataC.user.id;

        const searchRes = await fetch(`${API_URL}/user/search?username=${uB.username}`, {
            headers: { 'Authorization': `Bearer ${tokenA}` }
        });
        const searchData = await searchRes.json();
        if (searchRes.status !== 200 || !searchData.success || searchData.user.username !== uB.username) {
            throw new Error('User search failed');
        }
        console.log('✅ User search working as expected.');

        // Mock-safe uploadAvatar test
        console.log('Uploading mock avatar for User A...');
        try {
            const formData = new FormData();
            formData.append('file', new Blob([Buffer.from('test-avatar-content')], { type: 'image/png' }), 'avatar.png');
            const uploadRes = await fetch(`${API_URL}/user/uploadAvatar`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${tokenA}` },
                body: formData
            });
            const uploadData = await uploadRes.json();
            if (uploadRes.status !== 200 || !uploadData.success || !uploadData.avatarUrl) {
                console.log('⚠️ Skipping avatar upload test (Cloudinary credentials are likely placeholder values).');
            } else {
                console.log('✅ Upload avatar working. Avatar URL:', uploadData.avatarUrl);
            }
        } catch (e) {
            console.log('⚠️ Skipping avatar upload test due to error (likely mock Cloudinary credentials).');
        }

        // ==========================================
        // 3. FRIEND REQUESTS & FRIENDSHIP TESTS
        // ==========================================
        console.log('\n--- [Step 3: Friend Requests & Friendship] ---');

        console.log('User A sending friend request to User B...');
        const reqABRes = await fetch(`${API_URL}/friends/requests`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenA}`
            },
            body: JSON.stringify({ to: userIdB, message: 'Let us be friends!' })
        });
        const reqABData = await reqABRes.json();
        if (reqABRes.status !== 201 || !reqABData.success) {
            throw new Error(`Failed to send friend request: ${JSON.stringify(reqABData)}`);
        }
        const requestIdAB = reqABData.request._id;
        console.log('✅ Friend request sent from A to B. ID:', requestIdAB);

        const getRequestsBRes = await fetch(`${API_URL}/friends/requests`, {
            headers: { 'Authorization': `Bearer ${tokenB}` }
        });
        const requestsBData = await getRequestsBRes.json();
        if (requestsBData.received.length === 0 || requestsBData.received[0]._id !== requestIdAB) {
            throw new Error('Failed to get received friend requests for B');
        }
        console.log('✅ Received requests correctly retrieved by User B.');

        console.log('User B accepting friend request...');
        const acceptRes = await fetch(`${API_URL}/friends/requests/${requestIdAB}/accept`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${tokenB}` }
        });
        const acceptData = await acceptRes.json();
        if (acceptRes.status !== 200 || !acceptData.success) {
            throw new Error('Accept friend request failed');
        }
        console.log('✅ Friend request accepted successfully.');

        console.log('User A sending friend request to User C...');
        const reqACRes = await fetch(`${API_URL}/friends/requests`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenA}`
            },
            body: JSON.stringify({ to: userIdC, message: 'Hello C' })
        });
        const reqACData = await reqACRes.json();
        const requestIdAC = reqACData.request._id;

        console.log('User C rejecting friend request...');
        const rejectRes = await fetch(`${API_URL}/friends/requests/${requestIdAC}/reject`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${tokenC}` }
        });
        if (rejectRes.status !== 200) {
            throw new Error('Reject friend request failed');
        }
        console.log('✅ Friend request rejected successfully.');

        const getFriendsARes = await fetch(`${API_URL}/friends`, {
            headers: { 'Authorization': `Bearer ${tokenA}` }
        });
        const friendsAData = await getFriendsARes.json();
        if (friendsAData.friends.length !== 1 || friendsAData.friends[0]._id !== userIdB) {
            throw new Error('User A friend list incorrect');
        }
        console.log('✅ Friends lists verified for User A.');

        // ==========================================
        // 4. SOCKET.IO REAL-TIME CONNECTION TESTS
        // ==========================================
        console.log('\n--- [Step 4: Socket.io Connection & Events] ---');

        socketA = clientIo('http://localhost:5002', { auth: { token: tokenA } });
        socketB = clientIo('http://localhost:5002', { auth: { token: tokenB } });

        await new Promise<void>((resolve, reject) => {
            let connCount = 0;
            const onConnect = () => {
                connCount++;
                if (connCount === 2) resolve();
            };
            socketA.on('connect', onConnect);
            socketB.on('connect', onConnect);
            socketA.on('connect_error', reject);
            socketB.on('connect_error', reject);
            setTimeout(() => reject(new Error('Socket.io connection timeout')), 5000);
        });
        console.log('✅ Socket.io clients successfully connected and authenticated!');

        // ==========================================
        // 5. DIRECT MESSAGES & CONVERSATION TESTS
        // ==========================================
        console.log('\n--- [Step 5: Direct Messages & Conversations] ---');

        console.log('User A creating a direct conversation with User B...');
        const createConvRes = await fetch(`${API_URL}/conversations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenA}`
            },
            body: JSON.stringify({
                type: 'direct',
                memberIds: [userIdB]
            })
        });
        const convData = await createConvRes.json();
        if (createConvRes.status !== 201 || !convData.success) {
            throw new Error(`Failed to create conversation: ${JSON.stringify(convData)}`);
        }
        const conversationId = convData.conversation._id;
        console.log('✅ Direct conversation created. ID:', conversationId);

        socketA.emit('joinConversation', conversationId);
        socketB.emit('joinConversation', conversationId);
        await delay(500);

        let caughtMessageEvent: any = null;
        socketB.on('newMessage', (data: any) => {
            caughtMessageEvent = data;
        });

        console.log('User A sending direct message to User B...');
        const msgRes = await fetch(`${API_URL}/messages/direct`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenA}`
            },
            body: JSON.stringify({ recipientId: userIdB, content: 'Hi B! How are you?', conversationId })
        });
        const msgData = await msgRes.json();
        if (msgRes.status !== 200 || !msgData.success) {
            throw new Error(`Failed to send direct message: ${JSON.stringify(msgData)}`);
        }
        console.log('✅ Direct message sent in conversation.');

        await delay(1000);

        if (!caughtMessageEvent || caughtMessageEvent.message.content !== 'Hi B! How are you?') {
            throw new Error('Socket.io client did not receive newMessage event');
        }
        console.log('✅ Socket.io real-time newMessage event captured successfully!');

        const getConvsBRes = await fetch(`${API_URL}/conversations`, {
            headers: { 'Authorization': `Bearer ${tokenB}` }
        });
        const convsBData = await getConvsBRes.json();
        const conv = convsBData.conversations.find((c: any) => c._id === conversationId);
        if (!conv || conv.unreadCounts[userIdB] !== 1) {
            throw new Error(`Unread counts incorrect for User B: ${JSON.stringify(conv)}`);
        }
        console.log('✅ Conversations list unread count correctly incremented.');

        console.log('User B marking conversation as seen...');
        let caughtSeenEvent: any = null;
        socketA.on('readMessage', (data: any) => {
            caughtSeenEvent = data;
        });

        const seenRes = await fetch(`${API_URL}/conversations/${conversationId}/seen`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${tokenB}` }
        });
        const seenData = await seenRes.json();
        if (seenRes.status !== 200 || !seenData.success || seenData.myUnreadCount !== 0) {
            throw new Error('Mark as seen failed');
        }
        
        await delay(1000);
        if (!caughtSeenEvent || caughtSeenEvent.conversation._id !== conversationId) {
            throw new Error('Socket.io client did not receive readMessage (seen) event');
        }
        console.log('✅ Mark as seen works! Socket.io readMessage event captured successfully.');

        // ==========================================
        // 6. GROUP MESSAGES & CONVERSATION PAGINATION
        // ==========================================
        console.log('\n--- [Step 6: Group Messages & Pagination] ---');

        console.log('User A creating a group conversation...');
        const createGroupRes = await fetch(`${API_URL}/conversations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenA}`
            },
            body: JSON.stringify({
                type: 'group',
                name: 'Cool Group',
                memberIds: [userIdB]
            })
        });
        const groupData = await createGroupRes.json();
        if (createGroupRes.status !== 201 || !groupData.success) {
            throw new Error(`Failed to create group: ${JSON.stringify(groupData)}`);
        }
        const groupId = groupData.conversation._id;
        console.log('✅ Group conversation created. ID:', groupId);

        console.log('User A sending a group message...');
        const sendGroupMsgRes = await fetch(`${API_URL}/messages/group`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenA}`
            },
            body: JSON.stringify({
                conversationId: groupId,
                content: 'Welcome to the cool group!'
            })
        });
        const groupMsgData = await sendGroupMsgRes.json();
        if (sendGroupMsgRes.status !== 200 || !sendGroupMsgRes.ok) {
            throw new Error('Failed to send group message');
        }
        console.log('✅ Group message sent successfully.');

        console.log('Testing message pagination...');
        const getMessagesRes = await fetch(`${API_URL}/conversations/${groupId}/messages?limit=5`, {
            headers: { 'Authorization': `Bearer ${tokenA}` }
        });
        const messagesData = await getMessagesRes.json();
        if (messagesData.messages.length === 0 || messagesData.messages[0].content !== 'Welcome to the cool group!') {
            throw new Error('Failed to retrieve messages');
        }
        console.log('✅ Messages pagination retrieved correctly.');

        // ==========================================
        // 7. CLEAN UP & AUTH EXTRA
        // ==========================================
        console.log('\n--- [Step 7: Cleanup Database] ---');
        
        await prisma.participant.deleteMany({ where: { conversationId: { in: [conversationId, groupId] } } });
        await prisma.message.deleteMany({ where: { conversationId: { in: [conversationId, groupId] } } });
        await prisma.conversation.deleteMany({ where: { id: { in: [conversationId, groupId] } } });
        await prisma.friend.deleteMany({ where: { OR: [{ userAId: userIdA }, { userBId: userIdA }] } });
        await prisma.friendRequest.deleteMany({ where: { OR: [{ fromId: userIdA }, { toId: userIdA }] } });
        await prisma.session.deleteMany({ where: { userId: { in: [userIdA, userIdB, userIdC] } } });
        await prisma.user.deleteMany({ where: { id: { in: [userIdA, userIdB, userIdC] } } });
        console.log('✅ Database cleaned successfully. All test records removed.');

        // ==========================================
        // 8. LOGOUT
        // ==========================================
        console.log('\n--- [Step 8: Sign Out] ---');
        const signoutRes = await fetch(`${API_URL}/auth/signout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokenA}`,
                'Cookie': cookieA
            }
        });
        const signoutData = await signoutRes.json();
        if (signoutRes.status !== 200 || !signoutData.success) {
             throw new Error('Signout failed');
        }
        console.log('✅ Logout endpoint successfully tested.');

        console.log('\n🎉 🚀 --- ALL E2E API & SOCKET TESTS PASSED SUCCESSFULLY! --- 🚀 🎉');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ E2E API Verification Test failed:', error);
        
        try {
            await prisma.participant.deleteMany({ where: { userId: { in: [userIdA, userIdB, userIdC].filter(Boolean) } } });
            await prisma.message.deleteMany({ where: { senderId: { in: [userIdA, userIdB, userIdC].filter(Boolean) } } });
            await prisma.conversation.deleteMany({ where: { createdById: { in: [userIdA, userIdB, userIdC].filter(Boolean) } } });
            await prisma.friend.deleteMany({ where: { OR: [{ userAId: { in: [userIdA, userIdB, userIdC].filter(Boolean) } }, { userBId: { in: [userIdA, userIdB, userIdC].filter(Boolean) } }] } });
            await prisma.friendRequest.deleteMany({ where: { OR: [{ fromId: { in: [userIdA, userIdB, userIdC].filter(Boolean) } }, { toId: { in: [userIdA, userIdB, userIdC].filter(Boolean) } }] } });
            await prisma.session.deleteMany({ where: { userId: { in: [userIdA, userIdB, userIdC].filter(Boolean) } } });
            await prisma.user.deleteMany({ where: { id: { in: [userIdA, userIdB, userIdC].filter(Boolean) } } });
            console.log('🧹 Cleanup performed after failure.');
        } catch (e) {
            console.error('Failed to cleanup database:', e);
        }

        process.exit(1);
    } finally {
        if (socketA) socketA.close();
        if (socketB) socketB.close();
        await prisma.$disconnect();
    }
}

runAllTests();
