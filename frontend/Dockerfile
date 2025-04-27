FROM node:14

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including SASS
RUN npm install 
# Copy the rest of the application
COPY . .

# Expose port
EXPOSE 5173

# Start the application
CMD ["npm", "start"]