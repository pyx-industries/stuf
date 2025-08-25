FROM node:16-alpine

WORKDIR /app

COPY ./spa/package*.json ./
RUN npm install

COPY ./spa .

EXPOSE 3000

CMD ["npm", "start"]
