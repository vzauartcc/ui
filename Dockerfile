# 🛠 Build Vue App
FROM node:lts AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ✅ Serve with Nginx
FROM nginx:alpine

# Copy built Vue app from builder
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Copy Nginx config
COPY nginx.conf /etc/nginx/nginx.conf


CMD ["/bin/sh", "-c", "envsubst < /usr/share/nginx/html/index.html > /usr/share/nginx/html/index.tmp && \
                         mv /usr/share/nginx/html/index.tmp /usr/share/nginx/html/index.html && \
                         exec nginx -g 'daemon off;'"]
