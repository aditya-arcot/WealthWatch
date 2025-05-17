FROM node:22.15.1-alpine3.21
WORKDIR /src
COPY . .
RUN npm i -g npm && npm ci --omit=dev && npm install pm2 -g
CMD ["pm2-runtime", "start", "npm run start:deploy"]
