# Use a Node.js LTS (Long Term Support) image as the base
FROM node:18-slim

# Render's default root directory for the service is /opt/render/project/src
# And your service's root directory is 'server' within your repo.
# So, your server code will be at /opt/render/project/src/server
# Let's set the WORKDIR to this exact path.
WORKDIR /opt/render/project/src/server

# Copy package.json and package-lock.json (or yarn.lock) specific to the server
# This step is optimized for Docker caching: if package.json doesn't change,
# npm install won't be re-run.
COPY package*.json ./

# Install Node.js dependencies (including libreoffice-convert)
# This will create node_modules inside /opt/render/project/src/server/node_modules
RUN npm install

# Install LibreOffice and its dependencies (required by libreoffice-convert)
# This is a comprehensive list to cover most document conversion needs.
# We use apt-get no-install-recommends to keep the image size smaller
# We also clean up apt lists to further reduce image size
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
    libxrandr2 \
    libxrender1 \
    libxtst6 \
    libxxf86vm1 \
    && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy the rest of your application code (server.js etc.)
# This copies from the build context's 'server' folder (which is the root for Render)
# into the container's WORKDIR (/opt/render/project/src/server)
COPY . .

# --- ADD THIS LINE FOR VERBOSE LIBREOFFICE LOGGING ---
ENV SAL_LOG='+INFO +WARN +ERROR'

# Expose the port your Node.js application listens on
EXPOSE 3001

# Define the command to run your application
# This command runs from the WORKDIR (/opt/render/project/src/server)
CMD ["node", "server.js"]
