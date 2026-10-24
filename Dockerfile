# The API in a container, for any host that runs Docker (Vercel doesn't need it).
#   docker build -t hallmate-api .
#   docker run --env-file .env -p 5000:5000 hallmate-api
FROM node:24-alpine

WORKDIR /app

# Dependencies first: this layer is reused until package*.json changes
COPY package*.json ./
RUN npm ci

COPY . .
# prisma.config.ts needs a DATABASE_URL to load, but generate never connects:
# a placeholder keeps real addresses out of the image (they come at `docker run`)
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npx prisma generate && npm run build

ENV NODE_ENV=production
EXPOSE 5000
CMD ["npm", "start"]
