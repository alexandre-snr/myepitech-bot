FROM alpine:edge

WORKDIR /usr/src/app

RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      freetype-dev \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      nodejs \
      yarn

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN yarn add puppeteer@5.2.1

COPY package.json ./
COPY yarn.lock ./
RUN yarn install --production=true
COPY src ./src

CMD [ "node", "." ]