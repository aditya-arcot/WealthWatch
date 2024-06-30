FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
WORKDIR /src
COPY dist .
# EXPOSE 8081
CMD ["nginx", "-g", "daemon off;"]