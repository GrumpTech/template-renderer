FROM node:23-slim
EXPOSE 5000

ARG PLAYWRIGHT_VERSION=1.52.0

ENV NODE_ENV=production
ENV LANG=en_US.UTF-8
ENV PLAYWRIGHT_BROWSERS_PATH="/home/app/.cache/ms-playwright/"

WORKDIR /home/app

RUN apt update -y && apt upgrade -y
RUN npm install playwright@$PLAYWRIGHT_VERSION
RUN npx -y playwright@$PLAYWRIGHT_VERSION install chromium --only-shell --with-deps

COPY package.json .
COPY package-lock.json .
RUN npm ci --omit=dev

COPY --chown=node:node dist /home/app/dist
COPY --chown=node:node keys /home/app/keys

USER node
CMD ["node", "dist/index.js"]
