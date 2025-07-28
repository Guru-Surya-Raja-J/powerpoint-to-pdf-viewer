

````markdown
# 🎯 PowerPoint to PDF Viewer

A responsive web application for converting PowerPoint (`.ppt` and `.pptx`) presentations to PDF format.  
It features a sleek, intuitive UI with full-screen viewing, page navigation, and mobile optimization.

---

## ✨ Features

- **PPT/PPTX to PDF Conversion**: Converts both older `.ppt` and newer `.pptx` files.
- **Responsive UI**: Optimized for desktop, tablet, and mobile devices.
- **Dynamic Page Scaling**: Auto-adjusts PDF page size to fit screen width.
- **Full-Screen Mode**: Toggle full-screen view for immersive reading.
- **Page Navigation**: Navigate pages easily with "Previous", "Next", and current page indicator.
- **Custom Scrollbars**: Polished scrollbar styling for a modern look.
- **Robust Error Handling**: Clear feedback on upload and conversion errors.
- **Server-Side Conversion**: Uses LibreOffice on the backend for accurate document rendering.

---

## 🚀 Technologies Used

### Frontend
- React (Vite)
- `react-pdf` for rendering PDF documents
- HTML5, CSS3

### Backend
- Node.js (Express.js)
- `multer` for file uploads
- `child_process` to invoke system commands
- LibreOffice for file conversion
- Java Runtime Environment (JRE)

---

## ⚙️ Local Setup Instructions

### 📋 Prerequisites

- [Node.js (LTS)](https://nodejs.org/)
- npm (comes with Node.js)
- [LibreOffice](https://www.libreoffice.org/download/download/)
  - ✅ **Important for Windows**: Add `C:\Program Files\LibreOffice\program` to your system `PATH`
- [Java (Temurin JRE 17 or 21)](https://adoptium.net/)
  - ✅ Select "Add to PATH" or "Set JAVA_HOME" during installation

### ✅ Verify Installations

```bash
soffice --version     # Should show LibreOffice version
java -version         # Should show Java version
````

---

### 📦 Steps to Run Locally

#### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/powerpoint-to-pdf-viewer.git
cd powerpoint-to-pdf-viewer
```

> 🔁 Replace `YOUR_USERNAME` with your GitHub username

#### 2. Backend Setup

```bash
cd server
npm install
node server.js
```

> 🟢 Keep this terminal running

#### 3. Frontend Setup

Open a **new terminal**:

```bash
cd client
npm install
npm run dev
```

> Your app should now be running at [http://localhost:5173](http://localhost:5173)

---

## 🧪 How to Use

1. Open [http://localhost:5173](http://localhost:5173)
2. Click **“Choose File”** to select a `.ppt` or `.pptx` file
3. The app will upload, convert, and display the PDF
4. Use **full-screen toggle**, **scrolling**, and **navigation buttons** to view the file

---

## 🚀 Deployment on Render

This app can be deployed on Render using **two services**:

---

### 1. Deploy Backend (Web Service)

* Go to [Render](https://render.com)
* Click **"New" → "Web Service"**
* Connect your repo → Select `server` as root

**Render Setup**:

* **Name**: `ppt-backend`
* **Root Directory**: `server`
* **Runtime**: Node
* **Build Command**:

  ```bash
  npm install && sudo apt-get update && sudo apt-get install -y libreoffice
  ```
* **Start Command**:

  ```bash
  node server.js
  ```
* **Port**: `3001`
* **Env Variables**:

  * `NODE_ENV=production`

📌 **After deploy**, note your backend URL (e.g., `https://ppt-backend-xxxx.onrender.com`)

---

### 2. Deploy Frontend (Static Site)

* Go to Render → **"New" → "Static Site"**
* Connect the same repo → Select `client` as root

**Render Setup**:

* **Name**: `ppt-frontend`
* **Root Directory**: `client`
* **Build Command**:

  ```bash
  npm install && npm run build
  ```
* **Publish Directory**: `dist`
* **Env Variables**:

  * `VITE_API_BASE_URL=https://ppt-backend-xxxx.onrender.com`

📌 This is critical to connect frontend ↔ backend in production.

---

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).

---

### 💡 Tips

* Need dark mode or PDF download? Add it using `react-pdf` enhancements.
* Use `ngrok` for sharing localhost during development.

---

Made with ❤️ by Guru surya raja J🍀



