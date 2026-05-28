import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clean() {
    try {
        console.log('Cleaning messages, participants, conversations, friends and friend requests...');
        await prisma.message.deleteMany({});
        await prisma.participant.deleteMany({});
        await prisma.conversation.deleteMany({});
        await prisma.friendRequest.deleteMany({});
        await prisma.friend.deleteMany({});
        console.log('Database clean completed successfully!');
    } catch (err) {
        console.error('Error during cleanup:', err);
    } finally {
        await prisma.$disconnect();
    }
}

clean();
