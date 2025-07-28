
    const express = require('express');
    const multer = require('multer');
    const cors = require('cors');
    const path = require('path');
    const fs = require('fs');
    const { spawn } = require('child_process');

    const app = express();
    const port = 3001;

    app.use(cors());

    // --- Directory Setup ---
    const uploadDir = path.join(__dirname, 'uploads');
    const convertedDir = path.join(__dirname, 'converted_pdfs');
    const logDir = path.join(__dirname, 'logs');

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

    // --- Multer Configuration ---
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
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
          'application/vnd.ms-powerpoint'
        ];
        const fileExtension = path.extname(file.originalname).toLowerCase();

        if (allowedMimeTypes.includes(file.mimetype) || fileExtension === '.ppt' || fileExtension === '.pptx') {
          cb(null, true);
        } else {
          cb(new Error(`Only PowerPoint (.ppt) and PowerPoint Open XML (.pptx) files are allowed! Detected MIME: ${file.mimetype}, Extension: ${fileExtension}`), false);
        }
      },
      limits: {
        fileSize: 20 * 1024 * 1024
      }
    });

    // --- API Endpoint for Presentation Conversion ---
    app.post('/convert-presentation', (req, res, next) => {
      upload.single('presentationFile')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          console.error(`[Multer Error] ${err.message}`);
          return res.status(400).json({ error: `Upload Error: ${err.message}` }); // Send JSON error
        } else if (err) {
          console.error(`[Upload Error] ${err.message}`);
          return res.status(400).json({ error: `Upload Error: ${err.message}` }); // Send JSON error
        }
        next();
      });
    }, async (req, res) => {
      if (!req.file) {
        console.error('Error: No file received by server after Multer processing.');
        return res.status(400).json({ error: 'No presentation file was uploaded.' }); // Send JSON error
      }

      const inputFilePath = req.file.path;
      const outputFileName = `${path.basename(req.file.filename, path.extname(req.file.filename))}.pdf`;
      const outputFilePath = path.join(convertedDir, outputFileName);

      console.log(`[Conversion Process] Received file: ${inputFilePath}`);
      console.log(`[Conversion Process] Attempting to convert to PDF at: ${outputFilePath}`);

      const libreOfficeCommand = process.platform === 'win32' ? 'soffice' : 'libreoffice';
      const libreOfficeArgs = [
        '--headless',
        '--convert-to', 'pdf',
        inputFilePath,
        '--outdir', convertedDir
      ];

      const libreOfficeLogFileName = `libreoffice_debug_${Date.now()}.log`;
      const libreOfficeLogFilePath = path.join(logDir, libreOfficeLogFileName);

      console.log(`[Conversion Process] Executing command: ${libreOfficeCommand} ${libreOfficeArgs.join(' ')}`);
      console.log(`[Conversion Process] LibreOffice debug output will be logged to: ${libreOfficeLogFilePath}`);

      let libreOfficeStderrOutput = '';
      let libreOfficeStdoutOutput = '';

      // Ensure temporary file is cleaned up in all cases
      const cleanupTempFile = () => {
          if (fs.existsSync(inputFilePath)) {
              fs.unlink(inputFilePath, (err) => {
                  if (err) console.error(`[Cleanup Error] Failed to delete temporary uploaded file ${inputFilePath}:`, err);
                  else console.log(`[Cleanup] Deleted temporary uploaded file: ${inputFilePath}`);
              });
          } else {
              console.log(`[Cleanup] Temporary uploaded file not found for deletion: ${inputFilePath}`);
          }
      };

      try {
        if (!fs.existsSync(inputFilePath)) {
          console.error(`[Conversion Error] Input file does not exist at path: ${inputFilePath}`);
          throw new Error(`Input presentation file not found on server at ${inputFilePath}`);
        }

        const conversionPromise = new Promise((resolve, reject) => {
            const child = spawn(libreOfficeCommand, libreOfficeArgs, {
                cwd: uploadDir,
                stdio: ['ignore', 'pipe', 'pipe'],
                timeout: 60000 // Add a timeout of 60 seconds (60000 ms)
            });

            const logStream = fs.createWriteStream(libreOfficeLogFilePath, { flags: 'a' });

            child.stdout.on('data', (data) => {
                const chunk = data.toString();
                libreOfficeStdoutOutput += chunk;
                console.log(`[LibreOffice stdout]: ${chunk.trim()}`);
            });

            child.stderr.on('data', (data) => {
                const chunk = data.toString();
                libreOfficeStderrOutput += chunk;
                logStream.write(chunk);
                console.error(`[LibreOffice stderr]: ${chunk.trim()}`);
            });

            child.on('close', (code) => {
                logStream.end(); // Close log stream
                if (code === 0) {
                    resolve(true); // Success
                } else {
                    reject(new Error(`LibreOffice process exited with code ${code}. Stderr: ${libreOfficeStderrOutput.trim() || '[No stderr output]'}`));
                }
            });

            child.on('error', (err) => {
                logStream.end(); // Close log stream
                reject(new Error(`Failed to start LibreOffice process. Is it installed and in PATH? Error: ${err.message}`));
            });

            child.on('timeout', () => {
                child.kill(); // Kill the process if it times out
                reject(new Error('LibreOffice conversion timed out after 60 seconds.'));
            });
        });

        await conversionPromise; // Wait for the LibreOffice process to complete

        // After LibreOffice process finishes, check if PDF was actually created
        if (fs.existsSync(outputFilePath)) {
          console.log(`[Conversion Process] PDF file successfully created: ${outputFilePath}`);
          res.json({ pdfUrl: `/converted_pdfs/${outputFileName}` }); // Send success JSON
        } else {
          console.error(`[Conversion Error] PDF output file not found even after LibreOffice process indicated success (code 0).`);
          console.error(`Expected output path: ${outputFilePath}`);
          throw new Error(`PDF conversion failed. Output file not found. LibreOffice stderr: "${libreOfficeStderrOutput.trim() || 'No specific error message.'}"`);
        }

      } catch (error) {
        console.error(`[Conversion Error] Caught exception during conversion: ${error.message}`);
        // Ensure a JSON error response is always sent with a 500 status
        res.status(500).json({
            error: `Server error during file conversion: ${error.message}`,
            details: libreOfficeStderrOutput.trim() || 'No detailed error from LibreOffice process.'
        });
      } finally {
        cleanupTempFile(); // Ensure cleanup happens
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
    
