# Use official Node.js image
FROM node:24

# Set working directory
WORKDIR /usr/src/app


# Copy package.json and install dependencies
COPY package.json ./

RUN npm install

# Copy app source code
COPY . .

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "start"]