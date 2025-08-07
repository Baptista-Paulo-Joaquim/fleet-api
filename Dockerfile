# Usa imagem oficial do Node.js
FROM node:20

# Define diretório de trabalho
WORKDIR /app

# Copia package.json e package-lock.json e instala todas as dependências (dev e prod)
COPY package*.json ./
RUN npm install

# Copia todo o código fonte para dentro do container
COPY . .

# Compila o TypeScript para JavaScript
RUN npm run build

# Expõe a porta da aplicação (ajuste conforme seu app)
EXPOSE 5000

# Roda a aplicação usando o código compilado (sem nodemon)
CMD ["node", "dist/index.js"]
