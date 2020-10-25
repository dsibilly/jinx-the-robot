FROM node:12-slim

WORKDIR /usr/src/jinx-the-robot

COPY package*.json ./

RUN npm install -g bunyan
RUN npm install

COPY . .
RUN npm run-script build

CMD [ "npm", "start" ]
