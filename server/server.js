// server/server.js

const express = require('express');
const multer = require('multer');       // For handling file uploads
const cors = require('cors');           // For enabling Cross-Origin Resource Sharing
const path = require('path');           // For working with file paths
const fs = require('fs');               // For file system operations
const { spawn } = require('child_process'); // For executing system commands (LibreOffice)

const app = express();
const port = 3001; // Port for your backend server

// Enable CORS for all origins (for development). In production, specify allowed origins.
app.use(cors());

// --- Directory Setup ---
// Define directories for uploaded files and converted PDFs
const uploadDir = path.join(__dirname, 'uploads');
const convertedDir = path.join(__dirname, 'converted_pdfs');
const logDir = path.join(__dirname, 'logs'); // New directory for LibreOffice debug logs

// Ensure these directories exist. If not, create them.
try {
    [uploadDir, convertedDir, logDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true }); // `recursive: true` ensures parent directories are created if they don't exist
            console.log(`[INIT] Created directory: ${dir}`);
        } else {
            console.log(`[INIT] Directory already exists: ${dir}`);
        }
    });
} catch (dirError) {
    console.error(`[INIT ERROR] Failed to create necessary directories: ${dirError.message}`);
    // If directories cannot be created, the server cannot function.
    process.exit(1); // Exit the process with an error code
}

// --- Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Set the destination directory for uploaded files
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename to prevent collisions, preserving original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalExtension = path.extname(file.originalname);
    const newFileName = `${file.fieldname}-${uniqueSuffix}${originalExtension}`;
    cb(null, newFileName);
  },
});

const upload = multer({
  storage: storage,
  // File filter to accept only specific MIME types (PPT and PPTX)
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.ms-powerpoint'                                              // .ppt
    ];
    // Also check by file extension as a fallback, because browser MIME type detection can be unreliable
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedMimeTypes.includes(file.mimetype) || fileExtension === '.ppt' || fileExtension === '.pptx') {
      cb(null, true); // Accept the file
    } else {
      // Reject the file and provide an error message
      cb(new Error(`Only PowerPoint (.ppt) and PowerPoint Open XML (.pptx) files are allowed! Detected MIME: ${file.mimetype}, Extension: ${fileExtension}`), false);
    }
  },
  limits: {
    fileSize: 20 * 1024 * 1024 // Optional: Limit file size to 20MB (adjust as needed)
  }
});

// --- API Endpoint for Presentation Conversion ---
// This route handles file upload first with Multer, then proceeds to conversion
app.post('/convert-presentation', (req, res, next) => {
  // Multer's upload.single() is used as middleware. It processes the file and
  // makes it available in req.file. It also handles Multer-specific errors.
  upload.single('presentationFile')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer-specific error occurred during upload (e.g., file size limit)
      console.error(`[Multer Error] ${err.message}`);
      return res.status(400).send(`Upload Error: ${err.message}`);
    } else if (err) {
      // A general error occurred during upload (e.g., file type rejected by filter)
      console.error(`[Upload Error] ${err.message}`);
      return res.status(400).send(`Upload Error: ${err.message}`);
    }
    // If no errors, proceed to the next middleware (the async conversion function)
    next();
  });
}, async (req, res) => {
  // This part runs after Multer has successfully processed and saved the file
  if (!req.file) {
    // This case should ideally not be hit if Multer ran successfully, but is a safeguard
    console.error('Error: No file received by server after Multer processing.');
    return res.status(400).send('No presentation file was uploaded.');
  }

  const inputFilePath = req.file.path; // Path to the uploaded temporary file
  // Generate output filename with .pdf extension, based on Multer's filename
  const outputFileName = `${path.basename(req.file.filename, path.extname(req.file.filename))}.pdf`;
  const outputFilePath = path.join(convertedDir, outputFileName); // Full path for the output PDF

  console.log(`[Conversion Process] Received file: ${inputFilePath}`);
  console.log(`[Conversion Process] Attempting to convert to PDF at: ${outputFilePath}`);

  // Determine the correct LibreOffice command based on OS
  const libreOfficeCommand = process.platform === 'win32' ? 'soffice.exe' : 'libreoffice'; // Use .exe for Windows for clarity

  // Arguments for LibreOffice command
  const libreOfficeArgs = [
    '--headless', // Run LibreOffice without a graphical user interface
    '--convert-to', 'pdf', // Convert the input file to PDF format
    inputFilePath,         // Path to the input PPT/PPTX file
    '--outdir', convertedDir // Directory where the output PDF should be saved
    // '-env:UserInstallation=file:///%cd%/lo_profile' // Removed for simplicity, can be added back if profile issues arise
  ];

  // Generate a unique log file name for LibreOffice's stderr/stdout
  const libreOfficeLogFileName = `libreoffice_debug_${Date.now()}.log`;
  const libreOfficeLogFilePath = path.join(logDir, libreOfficeLogFileName);

  console.log(`[Conversion Process] Executing command: ${libreOfficeCommand} ${libreOfficeArgs.join(' ')}`);
  console.log(`[Conversion Process] LibreOffice debug output will be logged to: ${libreOfficeLogFilePath}`);

  let libreOfficeStderrOutput = ''; // To capture stderr in memory for response
  let libreOfficeStdoutOutput = ''; // To capture stdout in memory for response

  try {
    // Check if the input file actually exists before trying to convert
    if (!fs.existsSync(inputFilePath)) {
      console.error(`[Conversion Error] Input file does not exist at path: ${inputFilePath}`);
      throw new Error(`Input presentation file not found on server at ${inputFilePath}`);
    }

    // --- Using child_process.spawn for better stream handling ---
    const child = spawn(libreOfficeCommand, libreOfficeArgs, {
        cwd: uploadDir, // Set working directory to where the input file is
        stdio: ['ignore', 'pipe', 'pipe'] // Ignore stdin, pipe stdout, pipe stderr
    });

    // Capture stdout and log it
    child.stdout.on('data', (data) => {
        const stdoutChunk = data.toString();
        libreOfficeStdoutOutput += stdoutChunk;
        console.log(`[LibreOffice stdout]: ${stdoutChunk.trim()}`);
    });

    // Capture stderr, log it to console, and write to a dedicated log file
    const logStream = fs.createWriteStream(libreOfficeLogFilePath, { flags: 'a' });
    child.stderr.on('data', (data) => {
        const stderrChunk = data.toString();
        libreOfficeStderrOutput += stderrChunk;
        logStream.write(stderrChunk); // Write to file
        console.error(`[LibreOffice stderr]: ${stderrChunk.trim()}`); // Log to console immediately
    });

    // Handle process close/exit
    const conversionResult = await new Promise((resolve, reject) => {
        child.on('close', (code) => {
            logStream.end(); // Close the log file stream when process exits
            if (code === 0) {
                // Success (LibreOffice exited with code 0)
                resolve(true);
            } else {
                // Failure (LibreOffice exited with non-zero code)
                console.error(`[LibreOffice Error] Process exited with non-zero code ${code}.`);
                reject(new Error(`LibreOffice process exited with code ${code}. Check ${libreOfficeLogFilePath} for details.`));
            }
        });

        child.on('error', (err) => {
            logStream.end(); // Close the log file stream on error
            console.error(`[LibreOffice Error] Failed to start LibreOffice process: ${err.message}`);
            reject(new Error(`Failed to start LibreOffice process. Is LibreOffice installed and in system PATH? Error: ${err.message}`));
        });
    });

    // After LibreOffice process finishes, check if PDF was actually created
    if (conversionResult && fs.existsSync(outputFilePath)) {
      console.log(`[Conversion Process] PDF file successfully created: ${outputFilePath}`);
      res.json({ pdfUrl: `/converted_pdfs/${outputFileName}` });
    } else {
      console.error(`[Conversion Error] PDF output file not found even after LibreOffice process indicated success (code 0).`);
      console.error(`Expected output path: ${outputFilePath}`);
      // If LibreOffice exited cleanly (code 0) but no PDF, it's a deeper issue.
      throw new Error(`PDF conversion failed. Output file not found. LibreOffice stderr: "${libreOfficeStderrOutput.trim() || 'No specific error message.'}"`);
    }

  } catch (error) {
    console.error(`[Conversion Error] Caught exception during conversion: ${error.message}`);
    // Provide a more informative error to the client, including the LibreOffice stderr if available
    res.status(500).send(`Server error during file conversion: ${error.message}. Please check server logs in ${logDir} for more details.`);
  } finally {
    // Clean up the temporary uploaded file regardless of conversion success or failure
    if (fs.existsSync(inputFilePath)) {
        fs.unlink(inputFilePath, (err) => {
          if (err) console.error(`[Cleanup Error] Failed to delete temporary uploaded file ${inputFilePath}:`, err);
          else console.log(`[Cleanup] Deleted temporary uploaded file: ${inputFilePath}`);
        });
    } else {
        console.log(`[Cleanup] Temporary uploaded file not found for deletion: ${inputFilePath}`);
    }
  }
});

// --- Serve Static Files (Converted PDFs) ---
// This makes the 'converted_pdfs' directory accessible via HTTP requests
app.use('/converted_pdfs', express.static(convertedDir));

// --- Start the Server ---
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
  console.log(`Configured uploads directory: ${uploadDir}`);
  console.log(`Configured converted PDFs directory: ${convertedDir}`);
  console.log(`LibreOffice debug logs will be in: ${logDir}`);
});
