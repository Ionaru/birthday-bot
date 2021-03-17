FROM node:14-alpine

WORKDIR /app

# Install dependencies
ENV NODE_ENV production
COPY ./package.json ./package-lock.json ./
RUN npm install --production

# Copy main file
COPY ./dist/apps/api/main.js ./dist/apps/api/main.js.map ./

CMD ["node", "main.js"]
