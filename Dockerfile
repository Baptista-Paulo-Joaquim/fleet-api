# Usa imagem do Node.js
FROM node:20

# Define diretório de trabalho
WORKDIR /app

# Copia package.json e instala dependências
COPY package*.json ./
RUN npm install

# Copia todos os arquivos
COPY . .

# Expondo a porta que tua API usa
EXPOSE 5000

# Comando para rodar a aplicação
CMD ["npm", "run", "dev"]