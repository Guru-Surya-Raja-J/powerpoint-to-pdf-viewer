# Use a Node.js LTS (Long Term Support) image as the base
FROM node:18-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
# This step is optimized for Docker caching: if package.json doesn't change,
# npm install won't be re-run.
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Install LibreOffice and its dependencies
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
    libreoffice-gnome \
    libreoffice-gtk3 \
    libreoffice-help-en-us \
    libreoffice-l10n-en \
    fonts-opensymbol \
    fonts-liberation \
    fonts-noto-color-emoji \
    # Add any other fonts your PPTs might use for better fidelity
    # For example, Microsoft fonts (requires 'msttcorefonts' package, often needs 'non-free' repo)
    # ttf-mscorefonts-installer \
    # xfonts-mathml \
    # xfonts-utils \
    # xdg-utils \
    # libfontconfig1 \
    # libxrender1 \
    # libxtst6 \
    # libcups2 \
    # libglib2.0-0 \
    # libgtk-3-0 \
    # libsm6 \
    # libice6 \
    # libxext6 \
    # libxrandr2 \
    # libxinerama1 \
    # libxcursor1 \
    # libxi6 \
    # libxcb1 \
    # libxcomposite1 \
    # libxdamage1 \
    # libxfixes3 \
    # libxft2 \
    # libxkbcommon0 \
    # libxmuu1 \
    # libxrandr2 \
    # libxrender1 \
    # libxtst6 \
    # libxxf86vm1 \
    # This is a minimal set, you might need more depending on your specific PPT features
    # For full headless functionality, sometimes more X11/GUI-related libs are needed but often libreoffice pulls them
    && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy the rest of your application code
COPY . .

# Expose the port your Node.js application listens on
EXPOSE 3001

# Define the command to run your application
CMD ["node", "server.js"]
