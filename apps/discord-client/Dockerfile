FROM node:14-alpine

WORKDIR /app

# Install dependencies
ENV NODE_ENV production
COPY ./dist/apps/discord-client/package.json ./
RUN npm install --production

# Copy main file
COPY ./dist/apps/discord-client/main.js ./

CMD ["npm", "start"]
