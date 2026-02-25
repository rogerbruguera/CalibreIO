# Stage 1: Build the React application
FROM node:20 as build

WORKDIR /app

COPY package*.json ./
RUN rm -rf package-lock.json node_modules && npm install --no-fund

COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the build output to replace the default nginx contents.
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
