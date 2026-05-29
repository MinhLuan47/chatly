import prisma from '../src/libs/prisma.ts';

async function main() {
    const args = process.argv.slice(2);
    const isCleanup = args.includes('--cleanup');
    const isConnect = args.includes('--connect');

    if (isCleanup) {
        console.log('Bắt đầu dọn dẹp User C...');
        
        // 1. Tìm User C
        const userC = await prisma.user.findUnique({
            where: { username: 'luanbui99' }
        });

        if (userC) {
            // Xóa các Participant liên quan
            await prisma.participant.deleteMany({
                where: { userId: userC.id }
            });

            // Xóa các Friend liên quan
            await prisma.friend.deleteMany({
                where: {
                    OR: [
                        { userAId: userC.id },
                        { userBId: userC.id }
                    ]
                }
            });

            // Xóa User C
            await prisma.user.delete({
                where: { id: userC.id }
            });
            console.log('Đã dọn dẹp xong User C luanbui99!');
        } else {
            console.log('User C chưa tồn tại, không cần dọn dẹp.');
        }

        // Đảm bảo A và B luôn là bạn bè
        const userA = await prisma.user.findUnique({ where: { username: 'luanbui' } });
        const userB = await prisma.user.findUnique({ where: { username: 'luanbui47' } });
        if (userA && userB) {
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
                    data: { userAId: userA.id, userBId: userB.id }
                });
            }
        }
    }

    if (isConnect) {
        console.log('Bắt đầu kết nối bạn bè và tạo nhóm chat...');
        const userA = await prisma.user.findUnique({ where: { username: 'luanbui' } });
        const userB = await prisma.user.findUnique({ where: { username: 'luanbui47' } });
        const userC = await prisma.user.findUnique({ where: { username: 'luanbui99' } });

        if (!userA || !userB || !userC) {
            console.error('Không tìm thấy đủ 3 người dùng!');
            return;
        }

        // Kết bạn A-C
        const friendAC = await prisma.friend.findFirst({
            where: {
                OR: [
                    { userAId: userA.id, userBId: userC.id },
                    { userAId: userC.id, userBId: userA.id }
                ]
            }
        });
        if (!friendAC) {
            await prisma.friend.create({ data: { userAId: userA.id, userBId: userC.id } });
            console.log('Đã kết bạn A - C');
        }

        // Kết bạn B-C
        const friendBC = await prisma.friend.findFirst({
            where: {
                OR: [
                    { userAId: userB.id, userBId: userC.id },
                    { userAId: userC.id, userBId: userB.id }
                ]
            }
        });
        if (!friendBC) {
            await prisma.friend.create({ data: { userAId: userB.id, userBId: userC.id } });
            console.log('Đã kết bạn B - C');
        }

        // Tạo cuộc hội thoại nhóm "Group Playwright Test" nếu chưa tồn tại
        const existingGroup = await prisma.conversation.findFirst({
            where: {
                type: 'group',
                name: 'Group Playwright Test'
            }
        });

        if (existingGroup) {
            // Xóa nhóm cũ để tạo nhóm mới sạch sẽ
            await prisma.conversation.delete({
                where: { id: existingGroup.id }
            });
            console.log('Đã xóa cuộc hội thoại nhóm cũ.');
        }

        const convo = await prisma.conversation.create({
            data: {
                type: 'group',
                name: 'Group Playwright Test',
                lastMessageAt: new Date()
            }
        });

        await prisma.participant.createMany({
            data: [
                { conversationId: convo.id, userId: userA.id },
                { conversationId: convo.id, userId: userB.id },
                { conversationId: convo.id, userId: userC.id }
            ]
        });
        console.log('Đã tạo nhóm chat "Group Playwright Test" mới và add 3 thành viên!');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
