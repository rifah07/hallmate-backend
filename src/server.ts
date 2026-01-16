import dotenv from 'dotenv';
import app from './app';
import { env } from './config/env.config';
import prisma from './config/database.config';
import logger from './shared/utils/logger.util';

// Load env variables
dotenv.config();

const PORT = parseInt(env.PORT, 10);

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connection successful');

    // Start the server
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info('Year: 2026');
      logger.info(`Environment : ${env.NODE_ENV}`);
      logger.info(`Node version: ${process.version}`);
      logger.info(`Server running on: http://localhost:${PORT}`);
      logger.info(`Health Check: http://localhost:${PORT}/health`);
      // logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
    });

  } catch (error) {
    logger.error('Failed to start the server ', error);
    process.exit(1);
  } 
};


// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
startServer();
