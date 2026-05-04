
FROM nginx:alpine

COPY /usr/src/app/dist/tre-biodata/ /usr/share/nginx/html

# # Use an official Nginx image as the base image
FROM nginx:alpine

# # Copy built Angular files to Nginx HTML folder
COPY dist/tre-biodata/browser /usr/share/nginx/html

EXPOSE 80

# Start Nginx when the container starts
CMD ["nginx", "-g", "daemon off;"]
