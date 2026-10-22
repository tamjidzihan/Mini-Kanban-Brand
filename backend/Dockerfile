FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.sequelizerc ./.sequelizerc
COPY --from=builder /app/config ./config
COPY --from=builder /app/migrations ./migrations

EXPOSE 5000

CMD ["sh", "-c", "npx sequelize-cli db:migrate && node dist/server.js"]
