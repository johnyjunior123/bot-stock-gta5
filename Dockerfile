FROM node:20-alpine

WORKDIR /app

# Copia package.json
COPY package*.json ./

# Copia Prisma ANTES do npm install
COPY prisma ./prisma

# Instala dependências (postinstall agora funciona)
RUN npm install

# Copia o restante do código
COPY . .

RUN npx prisma generate

# Build do TypeScript
RUN npm run build

EXPOSE 3003

CMD ["npm", "run", "start"]
