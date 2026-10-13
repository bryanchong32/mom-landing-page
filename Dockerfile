FROM nginx:alpine

# Copy static files
COPY . /usr/share/nginx/html/
# The build files are not pages: keep them out of the web root
RUN rm -f /usr/share/nginx/html/Dockerfile /usr/share/nginx/html/nginx.conf

# Custom nginx config for clean URLs and bilingual routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
