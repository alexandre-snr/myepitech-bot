FROM alpine:edge


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

RUN addgroup -S pptruser && adduser -S -g pptruser pptruser \
    && mkdir -p /usr/src/app \
    && chown -R pptruser:pptruser /usr/src/app

USER pptruser

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./
RUN yarn install --production=true
COPY src ./src

CMD [ "node", "." ]