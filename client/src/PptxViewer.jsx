// src/PptxViewer.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Document, Page, pdfjs } from 'react-pdf';
import "react-pdf/dist/esm/Page/AnnotationLayer.css"; 
import "react-pdf/dist/esm/Page/TextLayer.css";   

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const PptxViewer = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('pptx', file);

    try {
      // This URL must point to your backend server.
      // We still need to create this backend separately.
      const backendUrl = 'http://localhost:3001/convert';
      const response = await axios.post(backendUrl, formData, { responseType: 'blob' });
      setPdfFile(URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' })));
    } catch (err) {
      alert('File conversion failed! Make sure your backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3>Upload a PPTX file to view</h3>
      <input type="file" accept=".pptx" onChange={handleFileChange} disabled={isLoading} />
      {isLoading && <p>Converting your file...</p>}
      {pdfFile && (
        <div style={{ border: '1px solid #ccc', marginTop: '1rem', maxHeight: '70vh', overflowY: 'auto' }}>
          <Document file={pdfFile} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
            {Array.from(new Array(numPages || 0), (el, index) => (
              <Page key={`page_${index + 1}`} pageNumber={index + 1} />
            ))}
          </Document>
        </div>
      )}
    </div>
  );
};

export default PptxViewer;