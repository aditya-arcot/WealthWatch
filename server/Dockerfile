FROM node:lts
WORKDIR /src
COPY . .
RUN npm i -g npm && npm ci --omit=dev && npm install pm2 -g
CMD pm2-runtime start 'npm run start:deploy'
