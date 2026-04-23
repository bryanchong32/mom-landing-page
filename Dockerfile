FROM nginx:alpine

# Copy static files
COPY . /usr/share/nginx/html/

# Custom nginx config for clean URLs and bilingual routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
