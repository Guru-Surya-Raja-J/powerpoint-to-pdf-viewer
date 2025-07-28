    // server/server.js

    const express = require('express');
    const multer = require('multer');
    const libre = require('libreoffice-convert'); // New import for libreoffice-convert
    const util = require('util');                // For promisifying libre.convert
    const fs = require('fs');
    const path = require('path');
    const cors = require('cors');
    // const { spawn } = require('child_process'); // No longer needed directly for conversion

    const app = express();
    const port = 3001;

    app.use(cors());
    app.use(express.json()); // To parse JSON request bodies if needed (though not for file uploads directly)

    // --- NEW TEST ENDPOINT (Keep this for debugging) ---
    app.get('/test-json', (req, res) => {
      console.log('[Test Endpoint] Received request to /test-json');
      res.json({ message: 'Backend is alive and sending JSON!', timestamp: new Date() });
    });
    // --- END NEW TEST ENDPOINT ---

    // --- Directory Setup ---
    const uploadDir = path.join(__dirname, 'uploads');
    const convertedDir = path.join(__dirname, 'converted_pdfs');
    const logDir = path.join(__dirname, 'logs'); // Still useful for general server logs

    try {
        [uploadDir, convertedDir, logDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`[INIT] Created directory: ${dir}`);
            } else {
                console.log(`[INIT] Directory already exists: ${dir}`);
            }
        });
    } catch (dirError) {
        console.error(`[INIT ERROR] Failed to create necessary directories: ${dirError.message}`);
        process.exit(1);
    }

    // --- Multer Configuration for File Upload ---
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadDir); // Files saved to the 'uploads' directory
      },
      filename: (req, file, cb) => {
        // Generate a unique filename, preserving original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const originalExtension = path.extname(file.originalname);
        const newFileName = `${file.fieldname}-${uniqueSuffix}${originalExtension}`;
        cb(null, newFileName);
      },
    });

    const upload = multer({
      storage: storage,
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
          'application/vnd.ms-powerpoint' // .ppt
        ];
        const fileExtension = path.extname(file.originalname).toLowerCase();

        if (allowedMimeTypes.includes(file.mimetype) || fileExtension === '.ppt' || fileExtension === '.pptx') {
          cb(null, true);
        } else {
          cb(new Error(`Only PowerPoint (.ppt) and PowerPoint Open XML (.pptx) files are allowed! Detected MIME: ${file.mimetype}, Extension: ${fileExtension}`), false);
        }
      },
      limits: {
        fileSize: 20 * 1024 * 1024 // 20 MB limit
      }
    });

    // Promisify the libre.convert function so it can be used with async/await
    const convertAsync = util.promisify(libre.convert);

    // --- API Endpoint for Presentation Conversion ---
    app.post('/convert-presentation', upload.single('presentationFile'), async (req, res) => {
      console.log('[Conversion Process] Received POST request to /convert-presentation');

      if (!req.file) {
        console.error('Error: No file received by server.');
        return res.status(400).json({ error: 'No presentation file uploaded.' });
      }

      const inputFilePath = req.file.path; // Path to the uploaded temporary file
      const outputFileName = `${path.basename(req.file.filename, path.extname(req.file.filename))}.pdf`;
      const outputFilePath = path.join(convertedDir, outputFileName);

      console.log(`[Conversion Process] Input file: ${inputFilePath}`);
      console.log(`[Conversion Process] Output PDF path: ${outputFilePath}`);

      // Ensure temporary file is cleaned up in all cases
      const cleanupTempFiles = () => {
          if (fs.existsSync(inputFilePath)) {
              fs.unlink(inputFilePath, (err) => {
                  if (err) console.error(`[Cleanup Error] Failed to delete uploaded temp file ${inputFilePath}:`, err);
                  else console.log(`[Cleanup] Deleted uploaded temp file: ${inputFilePath}`);
              });
          }
          // Clean up the converted PDF too after it's served/processed
          if (fs.existsSync(outputFilePath)) {
              fs.unlink(outputFilePath, (err) => {
                  if (err) console.error(`[Cleanup Error] Failed to delete converted PDF file ${outputFilePath}:`, err);
                  else console.log(`[Cleanup] Deleted converted PDF file: ${outputFilePath}`);
              });
          }
      };

      try {
        if (!fs.existsSync(inputFilePath)) {
          console.error(`[Conversion Error] Input file does not exist at path: ${inputFilePath}`);
          throw new Error(`Input presentation file not found on server at ${inputFilePath}`);
        }

        const inputFileBuffer = fs.readFileSync(inputFilePath);
        
        // Perform the conversion using libreoffice-convert
        // The third argument (filter) is 'undefined' to let LibreOffice choose
        const pdfBuffer = await convertAsync(inputFileBuffer, '.pdf', undefined);
        
        fs.writeFileSync(outputFilePath, pdfBuffer); // Write the converted PDF buffer to a file

        if (fs.existsSync(outputFilePath)) {
          console.log(`[Conversion Process] PDF file successfully created: ${outputFilePath}`);
          // Send the URL to the frontend for display
          res.json({ pdfUrl: `/converted_pdfs/${outputFileName}` });
        } else {
          console.error(`[Conversion Error] PDF output file not found after conversion by libreoffice-convert.`);
          throw new Error(`PDF conversion failed: Output file not found.`);
        }

      } catch (error) {
        console.error(`[Conversion Error] Caught exception during conversion: ${error.message}`);
        // Send a JSON error response with a 500 status
        res.status(500).json({
            error: `Server error during file conversion: ${error.message}`,
            details: error.message // Provide the error message from libreoffice-convert
        });
      } finally {
        cleanupTempFiles(); // Ensure cleanup happens
      }
    });

    // --- Serve Static Files (Converted PDFs) ---
    app.use('/converted_pdfs', express.static(convertedDir));

    // --- Start the Server ---
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
      console.log(`Configured uploads directory: ${uploadDir}`);
      console.log(`Configured converted PDFs directory: ${convertedDir}`);
      console.log(`LibreOffice debug logs will be in: ${logDir}`);
    });
    
