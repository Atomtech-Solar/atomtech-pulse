FROM node:22-alpine

WORKDIR /app

# Habilita pnpm via corepack (versão definida em package.json packageManager)
RUN corepack enable

# Copia e instala dependências
COPY package.json ./
RUN pnpm install

# Copia código fonte
COPY . .

# Build TypeScript
RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "start"]
