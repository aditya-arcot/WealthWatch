FROM node:lts-alpine
WORKDIR /src
COPY . .
RUN npm i -g npm && npm ci --omit=dev && npm install pm2 -g
CMD ["pm2-runtime", "--no-autorestart", "npm run start:deploy"]
