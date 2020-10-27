# Common base image for development and production
FROM node:12-slim AS base
WORKDIR /jinx-the-robot

# Dev image contains everything needed for testing, development, and building
FROM base AS development
COPY package*.json ./

RUN npm install --production
RUN cp -R node_modules /tmp/node_modules

RUN npm install
COPY . .

FROM development as builder
RUN npm run-script lint
RUN npm test
RUN npm run-script build

FROM base AS release
COPY --from=builder /tmp/node_modules ./node_modules
COPY --from=builder /jinx-the-robot/lib ./lib
COPY --from=builder /jinx-the-robot/package.json ./
COPY --from=builder /jinx-the-robot/Configuration.js ./

CMD [ "npm", "start" ]
