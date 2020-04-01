FROM node:12.2.0-alpine

RUN mkdir /app
WORKDIR /app

COPY tsconfig.json /app
COPY ./src /app/src
COPY package.json /app
COPY package-lock.json /app

RUN npm ci --no-optional
RUN npm run build
RUN npm prune --production

ENV NODE_ENV production
ENV PORT 8001
EXPOSE 8001

ENTRYPOINT ["node", "dist/index.js"]
