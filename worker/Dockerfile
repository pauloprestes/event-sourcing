FROM node:12.2.0-alpine as builder

RUN mkdir /app
WORKDIR /app

COPY tsconfig.json /app
COPY ./src /app/src
COPY package.json /app
COPY package-lock.json /app

RUN npm ci --no-optional
RUN npm run build
RUN npm prune --production

FROM node:12.2.0-alpine

COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules

ENTRYPOINT ["node", "app/dist/index.js"]
