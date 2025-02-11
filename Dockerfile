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

# ✅ Replace `%VITE_*%` placeholders with actual values at runtime
CMD ["/bin/sh", "-c", "sed -i 's|%VITE_VATUSA_API_KEY%|${VITE_VATUSA_API_KEY}|g' /usr/share/nginx/html/index.html && \
                         sed -i 's|%VITE_FOLDER_PREFIX%|${VITE_FOLDER_PREFIX}|g' /usr/share/nginx/html/index.html && \
                         exec nginx -g 'daemon off;'"]
