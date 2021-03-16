FROM node:14-alpine

WORKDIR /app

COPY ./ormconfig.js ./

# Install dependencies
ENV NODE_ENV production
COPY ./dist/apps/storage/package.json ./
RUN npm install --production

COPY ./dist/out-tsc/apps/storage/migrations ./migrations

# Copy main file
COPY ./dist/apps/storage/main.js ./

CMD ["npm", "start"]
