# Use an official Node.js runtime as the base image
FROM node:24-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy the rest of the application files
COPY . .

# Supply Google Cloud credentials at runtime, rather than baking them into the image.
RUN mkdir -p uploads

# Expose the necessary port (if applicable, modify as needed)
EXPOSE 3000

# Define the command to run the application
CMD ["node", "index.js"]
