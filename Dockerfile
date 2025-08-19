# Usar la imagen oficial de Node.js
FROM node:18-slim

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias (incluyendo devDependencies por si acaso)
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer el puerto
EXPOSE 8080

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=8080

# Comando para ejecutar la aplicación
CMD ["node", "src/index.js"]