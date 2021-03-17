FROM node:14-alpine

WORKDIR /app

# Install dependencies
ENV NODE_ENV production
COPY ./package.json ./package-lock.json ./
RUN npm install --production

COPY ./ormconfig.js ./
COPY ./dist/out-tsc/apps/storage/migrations ./migrations

# Copy main files
COPY ./dist/apps/storage/main.js ./dist/apps/storage/main.js.map ./

CMD ["node", "main.js"]
