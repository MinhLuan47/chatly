import prisma from './prisma.ts';

const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log('PostgreSQL Connected via Prisma');
    } catch (error) {
        console.error('Failed to connect to PostgreSQL:', error);
    }
};

export default connectDB;

