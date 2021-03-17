FROM node:14-alpine

WORKDIR /app

# Install dependencies
ENV NODE_ENV production
COPY ./package.json ./package-lock.json ./
RUN npm install --production

# Copy main files
COPY ./dist/apps/discord-client/main.js ./dist/apps/discord-client/main.js.map ./

CMD ["node", "main.js"]
