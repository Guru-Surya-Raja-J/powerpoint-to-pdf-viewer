import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// --- CRITICAL for Vite & react-pdf ---
// Configure react-pdf's worker. This ensures it can load correctly in Vite.
// It points to the 'pdf.worker.min.mjs' file within the 'pdfjs-dist' package.
// For Canvas/local testing, using unpkg is reliable.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Inline CSS for the React component to make it self-contained for Canvas
const appCss = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

  body {
    margin: 0;
    font-family: 'Inter', sans-serif;
    background-color: #f0f2f5; /* Light gray background */
    color: #333;
    line-height: 1.6;
  }

  .App {
    padding: 2.5rem; /* Increased padding */
    max-width: 1000px; /* Slightly wider */
    margin: 3rem auto; /* More vertical margin */
    background-color: #ffffff;
    border-radius: 1rem; /* More rounded corners */
    /* Enhanced shadow for a sleek look */
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative; /* Needed for potential absolute positioning of elements */
    overflow: hidden; /* Ensures rounded corners look good with shadow */
  }

  h1 {
    color: #2c3e50;
    margin-bottom: 2rem; /* More space */
    font-size: 2.5em; /* Larger heading */
    font-weight: 700; /* Bolder */
    letter-spacing: -0.02em;
  }

  /* Custom styled file input */
  .file-input-wrapper {
    position: relative;
    overflow: hidden;
    display: inline-block;
    margin-bottom: 2rem;
    border-radius: 0.5rem; /* Rounded corners */
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); /* Subtle shadow */
  }

  .file-input-wrapper input[type="file"] {
    position: absolute;
    left: 0;
    top: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
    height: 100%;
  }

  .file-input-button {
    background-image: linear-gradient(to right, #4a90e2 0%, #63a4ff 100%); /* Gradient blue */
    color: white;
    padding: 0.8rem 1.8rem; /* Generous padding */
    border: none;
    border-radius: 0.5rem; /* Rounded corners */
    cursor: pointer;
    font-size: 1.1em;
    font-weight: 600;
    transition: all 0.3s ease; /* Smooth transition for all properties */
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 4px 10px rgba(74, 144, 226, 0.3); /* Shadow matching gradient */
  }

  .file-input-button:hover {
    background-position: right center; /* Move gradient on hover */
    box-shadow: 0 6px 15px rgba(74, 144, 226, 0.4); /* Enhanced shadow on hover */
    transform: translateY(-3px); /* Slightly more pronounced lift */
  }

  .file-input-button:active {
    transform: translateY(0);
    box-shadow: 0 2px 5px rgba(74, 144, 226, 0.2);
  }

  .file-name-display {
    margin-top: 1rem;
    font-size: 0.95em;
    color: #555;
    background-color: #f8f8f8;
    padding: 0.6rem 1rem;
    border-radius: 0.4rem;
    border: 1px solid #eee;
  }


  .viewer-container {
    margin-top: 2.5rem;
    padding: 2rem;
    border: 1px solid #e0e6e9;
    border-radius: 1rem; /* More rounded */
    background-color: #fcfdff;
    box-shadow: inset 0 1px 5px rgba(0, 0, 0, 0.03); /* Softer inset shadow */
    width: 100%; /* Take full width of parent */
    box-sizing: border-box; /* Include padding in width */
    position: relative; /* For positioning fullscreen button relative to this container */
  }

  .loading-message, .error-message {
    padding: 1.2rem;
    margin-top: 1.5rem;
    border-radius: 0.6rem; /* Rounded */
    font-size: 1.1em;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.8rem;
  }

  .loading-message {
    background-color: #e6f7ff; /* Light blue */
    color: #006bb3;
    border: 1px solid #91d5ff;
  }

  .error-message {
    background-color: #fff0f6; /* Light pink */
    color: #d93025;
    border: 1px solid #ffadad;
  }

  .pdf-display {
    margin-top: 2rem;
  }

  .pdf-canvas-wrapper {
    border: 1px solid #d0d0d0;
    border-radius: 0.75rem; /* Rounded */
    overflow: auto; /* Hide scrollbars if content is too large */
    max-height: 50vh; /* Adjusted for mini-view to show nav buttons without scroll */
    background-color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.5rem 0; /* More padding */
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05); /* Subtle shadow for the viewer */
    transition: all 0.3s ease-in-out; /* Smooth transition for fullscreen */
    position: relative; /* Crucial for positioning fullscreen icon *inside* */

    /* Custom Scrollbar Styles */
    scrollbar-width: thin; /* Firefox */
    scrollbar-color: #a0a0a0 #f1f1f1; /* Firefox */
  }

  /* Webkit (Chrome, Safari, Edge) scrollbar styles */
  .pdf-canvas-wrapper::-webkit-scrollbar {
    width: 8px; /* Width of the vertical scrollbar */
    height: 8px; /* Height of the horizontal scrollbar */
  }

  .pdf-canvas-wrapper::-webkit-scrollbar-track {
    background: #f1f1f1; /* Color of the scrollbar track */
    border-radius: 10px;
  }

  .pdf-canvas-wrapper::-webkit-scrollbar-thumb {
    background: #a0a0a0; /* Color of the scrollbar thumb */
    border-radius: 10px;
  }

  .pdf-canvas-wrapper::-webkit-scrollbar-thumb:hover {
    background: #707070; /* Color of the scrollbar thumb on hover */
  }

  /* Fullscreen specific styles */
  .pdf-canvas-wrapper.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    max-height: 100vh; /* Override max-height */
    z-index: 1000; /* Ensure it's on top of other content */
    background-color: #333; /* Darker background for full screen */
    border-radius: 0; /* No rounded corners in full screen */
    padding: 0; /* No padding in full screen */
    display: flex;
    flex-direction: column; /* Stack pages vertically */
    justify-content: flex-start; /* Align pages to the top */
    align-items: center;   /* Center pages horizontally */
    overflow-y: auto; /* Allow vertical scrolling */
    overflow-x: hidden; /* Hide horizontal scrollbar */
  }

  /* Adjust page margins/sizing within fullscreen if needed */
  .pdf-canvas-wrapper.fullscreen .react-pdf__Document {
    padding: 1rem 0; /* Reduced padding to maximize page view */
    width: auto; /* Let content dictate width, or max-width 95% */
    max-width: 95vw; /* Limit document width in fullscreen */
  }

  .pdf-canvas-wrapper.fullscreen .react-pdf__Page {
    margin-bottom: 0.5rem; /* Reduced space between pages in fullscreen */
    box-shadow: 0 0 20px rgba(0,0,0,0.5); /* Stronger shadow in fullscreen */
    border: 1px solid #555; /* Darker border in dark mode */
  }

  .react-pdf__Document {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  .react-pdf__Page {
    margin-bottom: 1.5rem; /* More space between pages */
    box-shadow: 0 4px 15px rgba(0,0,0,0.15); /* Stronger shadow for pages */
    border: 1px solid #eee;
    border-radius: 0.5rem; /* Rounded pages */
    overflow: hidden; /* Important for shadow on rounded corners */
  }

  .react-pdf__Page canvas {
    border-radius: 0.5rem; /* Ensure canvas itself is rounded */
  }

  .control-button {
    background-color: #28a745; /* Green for clear/upload another */
    color: white;
    padding: 0.8rem 1.8rem;
    border: none;
    border-radius: 0.5rem; /* Rounded */
    cursor: pointer;
    font-size: 1.1em;
    font-weight: 600;
    margin-top: 1.5rem;
    transition: background-color 0.3s ease, transform 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex; /* For icon alignment */
    align-items: center;
    gap: 0.5rem;
  }

  .control-button:hover {
    background-color: #218838;
    transform: translateY(-2px);
  }

  .control-button:active {
    transform: translateY(0);
  }

  .button-group {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem; /* Space between buttons */
    margin-top: 1.5rem;
  }

  .fullscreen-button {
    background-color: #007bff; /* Blue for full screen button */
  }

  .fullscreen-button:hover {
    background-color: #0056b3;
  }

  /* New style for the fullscreen icon button */
  .fullscreen-icon-button {
    position: absolute; /* Position relative to .pdf-canvas-wrapper */
    top: 15px; /* From top */
    right: 15px; /* From right */
    background-color: rgba(0, 0, 0, 0.7); /* More opaque background */
    border-radius: 50%; /* Make it circular */
    width: 40px; /* Size of the button */
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.2s ease;
    z-index: 100; /* Ensure it's above the PDF pages and other elements */
    border: 2px solid rgba(255, 255, 255, 0.5); /* More visible white border */
    box-shadow: 0 2px 5px rgba(0,0,0,0.4); /* Stronger shadow for depth */
  }

  .fullscreen-icon-button:hover {
    background-color: rgba(0, 0, 0, 0.9);
    transform: scale(1.05); /* Slight enlarge on hover */
  }

  .fullscreen-icon-button:active {
    transform: scale(1);
  }

  .fullscreen-icon-button svg {
    color: white;
    width: 24px;
    height: 24px;
  }

  /* Adjust position in fullscreen mode */
  /* When the wrapper itself is fullscreen, the button should still be visible and positioned */
  .pdf-canvas-wrapper.fullscreen .fullscreen-icon-button {
    position: fixed; /* Fixed relative to viewport when parent is fullscreen */
    top: 20px;
    right: 20px;
    background-color: rgba(255, 255, 255, 0.3); /* Lighter background in dark fullscreen */
    border: 2px solid rgba(0, 0, 0, 0.4);
  }

  .pdf-canvas-wrapper.fullscreen .fullscreen-icon-button svg {
    color: #f0f0f0; /* Lighter icon in dark fullscreen */
  }


  .nav-button-group {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 1.5rem;
    gap: 0.8rem;
  }

  .nav-button {
    background-color: #6c757d; /* Gray for nav buttons */
    color: white;
    padding: 0.6rem 1.2rem;
    border: none;
    border-radius: 0.4rem;
    cursor: pointer;
    font-size: 1em;
    transition: background-color 0.3s ease;
    display: flex; /* Added for icon alignment */
    align-items: center; /* Added for icon alignment */
    justify-content: center; /* Center content horizontally */
    gap: 0.3rem; /* Added for icon spacing */
  }

  .nav-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  .nav-button:hover:not(:disabled) {
    background-color: #5a6268;
  }

  .page-info {
    font-size: 1.1em;
    font-weight: 600;
    color: #4a4a4a;
    margin: 0 1rem;
    white-space: nowrap; /* Prevent text wrapping */
    display: flex; /* To center text vertically if needed */
    align-items: center; /* To center text vertically if needed */
  }

  p {
    font-size: 1.0em;
    color: #555;
    line-height: 1.6;
    margin-top: 1rem;
  }

  .total-pages-info {
    font-size: 1.1em;
    font-weight: 600;
    color: #4a4a4a;
    margin-top: 1.5rem;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .App {
      margin: 1.5rem auto;
      padding: 1.5rem;
      border-radius: 0.75rem;
    }
    h1 {
      font-size: 2em;
      margin-bottom: 1.5rem;
    }
    .file-input-button, .control-button, .nav-button {
      padding: 0.7rem 1.4rem;
      font-size: 1em;
    }
    .viewer-container {
      padding: 1.5rem;
      margin-top: 2rem;
      border-radius: 0.75rem;
    }
    .pdf-canvas-wrapper {
      padding: 1rem 0;
      border-radius: 0.5rem;
    }
    .react-pdf__Page {
      margin-bottom: 1rem;
    }
    .button-group, .nav-button-group {
      flex-direction: column;
      gap: 0.8rem;
    }
    .fullscreen-button {
      margin-left: 0; /* Remove horizontal margin in column layout */
    }
    .fullscreen-icon-button { /* Adjust for smaller screens */
      top: 10px;
      right: 10px;
      width: 36px;
      height: 36px;
    }
    .fullscreen-icon-button svg {
      width: 20px;
      height: 20px;
    }
  }

  @media (max-width: 480px) {
    .App {
      margin: 1rem auto;
      padding: 1rem;
      border-radius: 0.5rem;
    }
    h1 {
      font-size: 1.8em;
      margin-bottom: 1rem;
    }
    .file-input-button, .control-button, .nav-button {
      padding: 0.6rem 1.2rem;
      font-size: 0.9em;
    }
    .viewer-container {
      padding: 1rem;
      margin-top: 1.5rem;
      border-radius: 0.5rem;
    }
    .pdf-canvas-wrapper {
      max-height: 60vh;
    }
  }
`;

function App() {
  // State variables for managing file, PDF display, loading, and errors
  const [uploadedFile, setUploadedFile] = useState(null); // Stores the uploaded file object
  const [pdfDisplayUrl, setPdfDisplayUrl] = useState(null); // URL of the converted PDF to display
  const [numPages, setNumPages] = useState(null);         // Total number of pages in the PDF
  const [currentPage, setCurrentPage] = useState(1);      // Current page number for navigation
  const [isLoading, setIsLoading] = useState(false);      // Loading indicator for conversion
  const [errorMessage, setErrorMessage] = useState(null); // Stores any error messages
  const [isFullScreen, setIsFullScreen] = useState(false); // State for full screen mode
  
  // Ref to clear the file input field easily after selection/upload
  const fileInputRef = useRef(null);
  // Ref to the PDF viewer container for full screen toggling
  const pdfViewerRef = useRef(null);

  // State to store the calculated width for PDF pages to fit the viewer
  const [pageWidth, setPageWidth] = useState(0);

  // Effect to calculate page width based on viewer container size
  const calculatePageWidth = useCallback(() => {
    if (pdfViewerRef.current) {
      // Get the current width of the PDF viewer container
      const containerWidth = pdfViewerRef.current.clientWidth;
      // Set page width to be slightly less than container width for padding/margin
      // Adjust this factor (e.g., 0.95 or 0.9) to control how much space is around the page
      // In full screen, use a larger percentage of the window width
      // Ensure a minimum width to prevent pages from becoming too small
      setPageWidth(Math.max(300, isFullScreen ? window.innerWidth * 0.95 : containerWidth * 0.9));
    }
  }, [isFullScreen]);

  // Use ResizeObserver for more robust width recalculation
  useEffect(() => {
    let resizeObserver;
    if (pdfViewerRef.current) {
      resizeObserver = new ResizeObserver(entries => {
        // Trigger recalculation if the container's width changes
        // or if the full screen state changes (as it affects target width)
        calculatePageWidth(); 
      });
      resizeObserver.observe(pdfViewerRef.current);
    }

    // Also listen to window resize for broader changes (e.g., full screen toggle)
    window.addEventListener('resize', calculatePageWidth);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', calculatePageWidth);
    };
  }, [calculatePageWidth]); // Removed isFullScreen from dependencies here as calculatePageWidth already depends on it


  // Apply the inline CSS when the component mounts
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = appCss;
    document.head.appendChild(styleSheet);

    // Event listener for exiting full screen via ESC key or browser controls
    const handleFullScreenChange = () => {
      // Check if any element is in full screen mode (document.fullscreenElement will be null if not)
      if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
        setIsFullScreen(true);
      } else {
        setIsFullScreen(false);
      }
      // Recalculate page width after fullscreen state changes to adjust PDF scaling
      // This is now handled by ResizeObserver and window resize, but keeping this for robustness
      // as fullscreenchange might not always trigger a direct resize event on the element.
      calculatePageWidth(); 
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange); // For Safari
    document.addEventListener('mozfullscreenchange', handleFullScreenChange);   // For Firefox
    document.addEventListener('MSFullscreenChange', handleFullScreenChange);    // For IE/Edge

    // Cleanup function to remove the style tag and event listeners when component unmounts
    return () => {
      document.head.removeChild(styleSheet);
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullScreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullScreenChange);
    };
  }, [calculatePageWidth]); // Added calculatePageWidth to dependencies


  // Function to handle file selection and upload
  const handleFileChange = async (event) => {
    const file = event.target.files[0]; // Get the first selected file

    // Define acceptable MIME types for both .pptx and .ppt files
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // Official MIME type for .pptx
      'application/vnd.ms-powerpoint'                                              // Official MIME type for .ppt
    ];

    // Get file extension as a string (e.g., 'ppt', 'pptx')
    const fileExtension = file ? file.name.split('.').pop().toLowerCase() : '';

    // Log the detected file's MIME type and extension for debugging
    console.log('Detected file name:', file ? file.name : 'No file');
    console.log('Detected file MIME type:', file ? file.mimetype : 'No file');
    console.log('Detected file extension:', fileExtension);

    // Validate the selected file based on its existence, MIME type, or file extension
    // This handles cases where browser might return 'undefined' for mimetype
    if (file && (allowedMimeTypes.includes(file.mimetype) || fileExtension === 'ppt' || fileExtension === 'pptx')) {
      // Reset states for a new upload
      setUploadedFile(null); // Clear previous file state immediately
      setPdfDisplayUrl(null);
      setNumPages(null);
      setCurrentPage(1); // Reset to first page for new document
      setIsLoading(true); // Start loading
      setErrorMessage(null); // Clear any previous errors

      // Prepare form data to send the file to the backend
      const formData = new FormData();
      formData.append('presentationFile', file); // 'presentationFile' is the field name expected by Multer on the backend

      try {
        // Send the file to the backend's conversion endpoint
        // '/api/convert-presentation' is proxied by vite.config.js (if running locally)
        // or directly accessed if backend is on same domain.
        const response = await fetch('/api/convert-presentation', {
          method: 'POST',
          body: formData, // FormData automatically sets the correct 'Content-Type' header
        });

        // Check if the server response was successful
        if (response.ok) {
          const data = await response.json();
          setUploadedFile(file); // Set uploaded file only after successful backend response
          setPdfDisplayUrl(data.pdfUrl); // Set the URL for react-pdf to display
        } else {
          // Read and display the error message from the server
          const errorText = await response.text();
          console.error('Server responded with an error:', errorText);
          setErrorMessage(`Conversion failed: ${errorText || 'Unknown server error.'}`);
          setPdfDisplayUrl(null); // Clear PDF URL on error
        }
      } catch (err) {
        // Catch any network errors or uncaught exceptions during the fetch operation
        console.error('Network or unexpected error during file upload/conversion:', err);
        setErrorMessage(`An unexpected error occurred: ${err.message}. Please ensure the backend server is running and configured correctly.`);
        setPdfDisplayUrl(null); // Clear PDF URL on error
      } finally {
        setIsLoading(false); // Stop loading
      }
    } else {
      // If no file or invalid file type, show an alert and reset input
      alert('Please upload a valid PowerPoint (.ppt) or PowerPoint Open XML (.pptx) file.');
      setUploadedFile(null);
      setPdfDisplayUrl(null);
      setErrorMessage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear the selected file from the input
      }
    }
  };

  // Callback function for react-pdf when a document successfully loads
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages); // Update the total number of pages
    setCurrentPage(1); // Always start on the first page
    calculatePageWidth(); // Recalculate width once document is loaded
  };

  // Function to clear the displayed file and reset the input
  const handleClearFile = () => {
    setUploadedFile(null);
    setPdfDisplayUrl(null);
    setNumPages(null);
    setCurrentPage(1); // Reset page number
    setIsLoading(false);
    setErrorMessage(null);
    // Exit full screen if currently in it
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear the selected file from the input
    }
  };

  // Functions for page navigation
  const goToPrevPage = () => {
    setCurrentPage(prevPage => Math.max(prevPage - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prevPage => Math.min(prevPage + 1, numPages));
  };

  // Function to toggle full screen mode
  const toggleFullScreen = () => {
    if (!pdfViewerRef.current) return; // Ensure ref is available

    if (!document.fullscreenElement) {
      // Request full screen
      if (pdfViewerRef.current.requestFullscreen) {
        pdfViewerRef.current.requestFullscreen();
      } else if (pdfViewerRef.current.mozRequestFullScreen) { /* Firefox */
        pdfViewerRef.current.mozRequestFullScreen();
      } else if (pdfViewerRef.current.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
        pdfViewerRef.current.webkitRequestFullscreen();
      } else if (pdfViewerRef.current.msRequestFullscreen) { /* IE/Edge */
        pdfViewerRef.current.msRequestFullscreen();
      }
    } else {
      // Exit full screen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) { /* Firefox */
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { /* IE/Edge */
        document.msExitFullscreen();
      }
    }
  };

  return (
    <div className="App">
      <h1>PowerPoint (.ppt/.pptx) to PDF Viewer</h1>

      {/* File input for uploading */}
      <div className="file-input-wrapper">
        <input
          type="file"
          // The 'accept' attribute helps the browser filter files
          accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          onChange={handleFileChange}
          ref={fileInputRef} // Attach ref to enable clearing the input
        />
        <button className="file-input-button">
          {/* SVG for upload icon (Lucide icon) */}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
          {uploadedFile && pdfDisplayUrl ? 'Change File' : 'Choose File'} {/* Text changes based on file loaded */}
        </button>
      </div>
      {uploadedFile && !isLoading && !errorMessage && (
        <div className="file-name-display">
          {uploadedFile.name}
        </div>
      )}

      {/* Display loading message */}
      {isLoading && (
        <p className="loading-message">
          {/* SVG for loader icon (Lucide icon) */}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-loader-2 animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          Converting file to PDF, please wait...
        </p>
      )}

      {/* Display error message */}
      {errorMessage && (
        <p className="error-message">
          {/* SVG for error icon (Lucide icon) */}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-x"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
          {errorMessage}
        </p>
      )}

      {/* Conditional rendering for displaying file info and PDF viewer */}
      {uploadedFile && !isLoading && !errorMessage ? (
        <div className="viewer-container">
          {/* Main control buttons (Upload Another File, Full Screen) */}
          {/* Full screen button (icon only) - positioned inside viewer-container */}
          {pdfDisplayUrl && ( // Only show if PDF URL is available
            <button
              onClick={toggleFullScreen}
              className="fullscreen-icon-button"
              aria-label={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"} // Accessibility
            >
              {isFullScreen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-minimize-2"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" x2="20" y1="10" y2="4"/><line x1="10" x2="4" y1="14" y2="20"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-maximize-2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/></svg>
                )}
            </button>
          )}

          {pdfDisplayUrl ? (
            <div className="pdf-display">
              <h2>Converted Document Preview:</h2>
              <div ref={pdfViewerRef} className={`pdf-canvas-wrapper ${isFullScreen ? 'fullscreen' : ''}`}>
                {/* react-pdf Document component */}
                <Document
                  file={pdfDisplayUrl} // Pass the URL of the converted PDF
                  onLoadSuccess={onDocumentLoadSuccess} // Callback on successful PDF load
                  onLoadError={(err) => setErrorMessage(`Error loading PDF: ${err.message}`)} // Error during PDF loading
                  loading="Loading PDF pages..." // Message while PDF is loading
                  noData="No PDF data to display." // Message if no PDF data is provided
                >
                  {/* Conditional rendering of pages: all pages in fullscreen, single page otherwise */}
                  {isFullScreen && numPages ? (
                    Array.from(new Array(numPages), (el, index) => (
                      <Page
                        key={`page_${index + 1}`}
                        pageNumber={index + 1}
                        // Adjust width for full screen to fit better, maintaining aspect ratio
                        width={pageWidth} // Use dynamic pageWidth calculated from ref
                        renderAnnotationLayer={true}
                        renderTextLayer={true}
                      />
                    ))
                  ) : (
                    <Page
                      pageNumber={currentPage}
                      // Set page width relative to viewer container width for mini-view optimization
                      width={pageWidth} // Use dynamic pageWidth calculated from ref
                      renderAnnotationLayer={true}
                      renderTextLayer={true}
                    />
                  )}
                </Document>
              </div>

              {/* Page Navigation Controls (only visible when not in full screen) */}
              {numPages > 0 && !isFullScreen && (
                <div className="nav-button-group">
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage <= 1}
                    className="nav-button"
                    aria-label="Previous Page" // Accessibility
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
                    Prev
                  </button>
                  <span className="page-info">
                    Page {currentPage} of {numPages}
                  </span>
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage >= numPages}
                    className="nav-button"
                    aria-label="Next Page" // Accessibility
                  >
                    Next
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Message when file is uploaded but PDF URL is not yet available
            <p>Awaiting PDF conversion. If this takes too long, please check your backend server console for errors.</p>
          )}
        </div>
      ) : (
        // Initial prompt when no file is selected
        !isLoading && !errorMessage && (
          <p>Upload a PowerPoint (.ppt) or PowerPoint Open XML (.pptx) file to convert and view it as a PDF.</p>
        )
      )}
    </div>
  );
}

export default App;
