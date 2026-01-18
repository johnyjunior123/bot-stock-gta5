FROM node:20-alpine

WORKDIR /app

# Dependências
COPY package*.json ./
RUN npm install

# Prisma
COPY prisma ./prisma
RUN npx prisma generate

# Código
COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]