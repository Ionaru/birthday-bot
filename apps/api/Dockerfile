FROM node:14-alpine

WORKDIR /app

# Install dependencies
ENV NODE_ENV production
COPY ./dist/apps/api/package.json ./
RUN npm install --production

# Copy main file
COPY ./dist/apps/api/main.js ./

CMD ["npm", "start"]
