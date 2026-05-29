import prisma from './libs/prisma.ts';

async function main() {
    const userA = await prisma.user.findUnique({
        where: { username: 'luanbui' }
    });
    const userB = await prisma.user.findUnique({
        where: { username: 'luanbui47' }
    });

    if (!userA || !userB) {
        console.error('Không tìm thấy userA hoặc userB trong database!');
        return;
    }

    console.log(`Đã tìm thấy User A: ${userA.username} (${userA.id}) và User B: ${userB.username} (${userB.id})`);

    // 1. Kết bạn nếu chưa là bạn bè
    const existingFriend = await prisma.friend.findFirst({
        where: {
            OR: [
                { userAId: userA.id, userBId: userB.id },
                { userAId: userB.id, userBId: userA.id }
            ]
        }
    });

    if (!existingFriend) {
        await prisma.friend.create({
            data: {
                userAId: userA.id,
                userBId: userB.id
            }
        });
        console.log('Đã kết bạn thành công cho hai user!');
    } else {
        console.log('Hai user đã là bạn bè từ trước.');
    }

    // 2. Tạo cuộc hội thoại direct nếu chưa có
    const existingConversation = await prisma.conversation.findFirst({
        where: {
            type: 'direct',
            participants: {
                every: {
                    userId: {
                        in: [userA.id, userB.id]
                    }
                }
            }
        }
    });

    if (!existingConversation) {
        const convo = await prisma.conversation.create({
            data: {
                type: 'direct',
                lastMessageAt: new Date()
            }
        });

        await prisma.participant.createMany({
            data: [
                { conversationId: convo.id, userId: userA.id },
                { conversationId: convo.id, userId: userB.id }
            ]
        });
        console.log('Đã tạo cuộc hội thoại trực tiếp mới!');
    } else {
        console.log('Cuộc hội thoại trực tiếp đã tồn tại.');
    }

    console.log('Đã hoàn tất cấu hình kiểm thử!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
