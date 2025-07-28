# Use Node.js LTS slim base image
FROM node:18-slim

# Create and set working directory
WORKDIR /app/server

# Copy package.json and lock file for optimized install
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Install LibreOffice and dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libreoffice \
    fonts-dejavu-core \
    fonts-dejavu-extra \
    fonts-liberation \
    fonts-noto-color-emoji \
    xdg-utils \
    ca-certificates \
    libfontconfig1 \
    libxrender1 \
    libxtst6 \
    libcups2 \
    libglib2.0-0 \
    libgtk-3-0 \
    libsm6 \
    libice6 \
    libxext6 \
    libxrandr2 \
    libxinerama1 \
    libxcursor1 \
    libxi6 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxft2 \
    libxkbcommon0 \
    libxmuu1 \
    libxxf86vm1 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy remaining application code
COPY . .

# Enable verbose LibreOffice logging (optional)
ENV SAL_LOG='+INFO +WARN +ERROR'

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "server.js"]
