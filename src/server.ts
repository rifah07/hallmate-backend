import dotenv from 'dotenv';
import prisma from './config/database.config';

// Load env variables
dotenv.config();

const testConnection = async () => {
  try {
    await prisma.$connect();
    console.log('Database connection successful');

    const userCount = await prisma.user.count();
    console.log(`Number of users in the database: ${userCount}`);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

console.log('HallMate Backend Server');
console.log(`Environment : ${process.env.NODE_ENV || 'development'}`);
console.log(`Node version: ${process.version}`);

const PORT = process.env.PORT || 5000;

console.log(`Server is running on port: ${PORT}`);

testConnection();
