# Dockerfile para deploy quando Root Directory está em branco (raiz do repo)
# Usa o Dockerfile do backend
FROM node:22-alpine

WORKDIR /app

# Habilita pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copia apenas o backend
COPY backend/package.json ./
RUN pnpm install

COPY backend/ ./

# Build TypeScript
RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "start"]
