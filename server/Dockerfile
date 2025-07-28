# Use Node.js LTS base image
FROM node:18-slim

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and lock file
COPY package*.json ./

# Install node dependencies (including libreoffice-convert)
RUN npm install

# Install LibreOffice and dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libreoffice \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    libreoffice-draw \
    libreoffice-math \
    libreoffice-base \
    libreoffice-common \
    libreoffice-core \
    fonts-opensymbol \
    fonts-liberation \
    fonts-noto-color-emoji \
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

# Copy all application files
COPY . .

# Optional: Log LibreOffice activity
ENV SAL_LOG='+INFO +WARN +ERROR'

# Use Render-compatible PORT
ENV PORT=3001
EXPOSE 3001

# Start the server
CMD ["node", "server.js"]
