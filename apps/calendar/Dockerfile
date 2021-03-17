FROM node:14-alpine

WORKDIR /app

# Install dependencies
ENV NODE_ENV production
COPY ./package.json ./package-lock.json ./
RUN npm install --production

# Copy main files
COPY ./dist/apps/calendar/main.js ./dist/apps/calendar/main.js.map ./

CMD ["node", "main.js"]
