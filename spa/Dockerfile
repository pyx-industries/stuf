FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# Copy the public directory first to ensure index.html is available
COPY public/ ./public/
# Then copy the rest of the files
COPY src/ ./src/

EXPOSE 3000

CMD ["npm", "start"]
