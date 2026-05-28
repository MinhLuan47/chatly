import prisma from '../libs/prisma.ts';

async function check() {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, username: true, displayName: true }
        });
        console.log('--- USERS ---');
        console.log(JSON.stringify(users, null, 2));

        const conversations = await prisma.conversation.findMany({
            include: {
                participants: {
                    include: {
                        user: { select: { username: true } }
                    }
                }
            }
        });
        console.log('--- CONVERSATIONS ---');
        console.log(JSON.stringify(conversations, null, 2));

        const messages = await prisma.message.findMany({
            orderBy: { createdAt: 'asc' }
        });
        console.log('--- MESSAGES ---');
        console.log(JSON.stringify(messages, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

check();
