# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Copy the Google Cloud service account key
COPY gen-lang-client-0486206811-5e107c97bd67.json /app/keyfile.json

# Ensure Sharp dependencies are installed
RUN apk add --no-cache \
    vips-dev \
    fftw-dev \
    --repository=http://dl-cdn.alpinelinux.org/alpine/edge/testing

# Set environment variables for Google Cloud authentication
ENV GOOGLE_APPLICATION_CREDENTIALS="/app/keyfile.json"

# Expose the necessary port (if applicable, modify as needed)
EXPOSE 3000

# Define the command to run the application
CMD ["node", "index.js"]
