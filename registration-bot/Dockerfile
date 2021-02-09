FROM node:14-alpine

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./
RUN yarn install --production=true

COPY src ./src

EXPOSE 8080
CMD [ "node", "." ]