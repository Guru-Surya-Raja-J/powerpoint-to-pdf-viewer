    # Use a Node.js LTS (Long Term Support) image as the base
    FROM node:18-slim

    # Set the working directory inside the container
    # This is the standard Docker convention for the application root.
    # Render's "Root Directory" setting will ensure the contents of your 'server' folder
    # are placed directly into this WORKDIR during the build.
    WORKDIR /usr/src/app

    # Copy package.json and package-lock.json (or yarn.lock)
    # These files are in the root of the build context (which is your 'server' directory)
    # and are copied to /usr/src/app/
    COPY package*.json ./

    # Install Node.js dependencies
    # This will create node_modules inside /usr/src/app/node_modules
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
    # This copies all remaining files from the build context root (your 'server' directory)
    # into the container's WORKDIR (/usr/src/app)
    COPY . .

    # Set LibreOffice verbose logging (optional, for debugging)
    ENV SAL_LOG='+INFO +WARN +ERROR'

    # Expose the port your Node.js application listens on
    EXPOSE 3001

    # Define the command to run your application
    # This command runs from the WORKDIR (/usr/src/app)
    CMD ["node", "server.js"]
    
