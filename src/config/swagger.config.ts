// src/config/swagger.config.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HallMate API',
      version: '1.0.0',
      description: 'University Women\'s Hall Management System - Bangladesh',
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development' },
      // { url: 'https://hallmate-api.onrender.com', description: 'Production' },
    ],
  },
  apis: [
    './src/modules/auth/docs/auth.swagger.ts',
    // add other modules
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};