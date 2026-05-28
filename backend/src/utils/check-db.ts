import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, username: true }
        });
        console.log('--- USERS ---');
        console.log(users);

        const requests = await prisma.friendRequest.findMany();
        console.log('--- FRIEND REQUESTS ---');
        console.log(requests);

        const friends = await prisma.friend.findMany();
        console.log('--- FRIENDS ---');
        console.log(friends);
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

check();
