FROM nginx:alpine

# Copy static files
COPY . /usr/share/nginx/html/
# The build files are not pages: keep them out of the web root
RUN rm -f /usr/share/nginx/html/Dockerfile /usr/share/nginx/html/nginx.conf /usr/share/nginx/html/nginx-d11.conf

# Custom nginx config for clean URLs and bilingual routing
COPY nginx.conf /etc/nginx/conf.d/default.conf
# The 雙11 switch (sale window, A/B split start, preview token), included by default.conf
COPY nginx-d11.conf /etc/nginx/d11.conf

EXPOSE 80
