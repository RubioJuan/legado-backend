FROM node:16-bullseye

WORKDIR /app

COPY . /app

RUN npm install

RUN npm run build

EXPOSE 8000

CMD [ "npm", "start" ]