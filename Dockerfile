# Step 1: BUILD
FROM node:24-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies (leveraging Docker layer caching)
COPY package*.json ./
RUN npm ci

# Copy rest of source code and build
COPY . .

RUN npm run build

# Step 2: PRODUCTION/SERVE
FROM nginx:alpine AS production

# Copy built app from builder
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Copy Nginx config without overwriting default /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose default port for documentation
EXPOSE 80

# Substitute variables in index.html for environment variables, and start nginx
CMD ["/bin/sh", "-c", "envsubst < /usr/share/nginx/html/index.html > /usr/share/nginx/html/index.tmp && \
                         mv /usr/share/nginx/html/index.tmp /usr/share/nginx/html/index.html && \
                         exec nginx -g 'daemon off;'"]
