import dotenv from 'dotenv';

// Load env variables
dotenv.config();

console.log('HallMate Backend Server');
console.log(`Environment : ${process.env.NODE_ENV || 'development'}`);
console.log(`Node version: ${process.version}`);

const PORT = process.env.PORT || 5000;

console.log(`Server is running on port: ${PORT}`);
