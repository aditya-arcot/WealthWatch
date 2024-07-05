FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
WORKDIR /src
COPY dist .
CMD ["nginx", "-g", "daemon off;"]