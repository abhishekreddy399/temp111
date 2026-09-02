FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

EXPOSE 5004

ENV NODE_ENV=production
ENV PORT=5004

CMD ["node", "server.js"]
