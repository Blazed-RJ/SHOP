
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

/**
 * Generates a PDF from a DOM element and either shares it via Web Share API or downloads it.
 * @param {string} elementId - The ID of the DOM element to capture.
 * @param {string} fileName - The desired file name for the PDF.
 * @param {string} title - Title for the share dialog.
 * @param {string} text - Text for the share dialog.
 */
export const sharePdf = async (elementId, fileName, title, text) => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with ID '${elementId}' not found.`);
        toast.error('Content to share not found.');
        return;
    }

    // Validate element has content and dimensions
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
        console.error(`Element '${elementId}' has no visible dimensions (${rect.width}x${rect.height}).`);
        toast.error('The content appears to be hidden or empty. Please ensure the document is fully loaded.');
        return;
    }

    // Check if element has any visible content
    const hasContent = element.children.length > 0 || element.textContent.trim().length > 0;
    if (!hasContent) {
        console.error(`Element '${elementId}' appears to be empty.`);
        toast.error('The document appears to be empty. Please ensure data is loaded before generating PDF.');
        return;
    }

    const loadToast = toast.loading('Generating PDF...');

    try {
        // 1. Capture Content
        const canvas = await captureContent(element);

        // 2. Generate PDF
        const pdfFile = generatePdfBox(canvas, fileName);

        // 3. Share or Download
        await handleShareOrDownload(pdfFile, fileName, title, text);

        toast.dismiss(loadToast);
        toast.success({
            duration: 3000,
            message: navigator.canShare && navigator.canShare({ files: [pdfFile] })
                ? 'Shared successfully!'
                : 'PDF Downloaded'
        });

    } catch (error) {
        console.error('PDF Process Error:', error);
        toast.dismiss(loadToast);

        let errorMessage = 'Failed to generate PDF';
        if (error.message.includes('canvas')) errorMessage = 'Failed to capture screen';
        else if (error.message.includes('share')) errorMessage = 'Sharing failed';
        else if (error.message.includes('empty') || error.message.includes('dimensions')) {
            errorMessage = 'Content is empty or not visible';
        } else if (error.message.includes('0 bytes')) {
            errorMessage = 'PDF generation produced empty file';
        }

        toast.error(errorMessage);
    }
};

/**
 * Captures the DOM element using html2canvas with optimized settings.
 */
const captureContent = async (element) => {
    try {
        // Optimization: Use device pixel ratio or cap at 2 for performance vs quality balance
        const scale = Math.min(window.devicePixelRatio || 2, 2);

        return await html2canvas(element, {
            scale: scale,
            useCORS: true, // Crucial for external images (S3/Cloudinary/etc)
            allowTaint: true, // CRITICAL FOR PRODUCTION: Allow cross-origin images
            logging: false, // Reduce console noise
            backgroundColor: '#ffffff', // Ensure white background for PDF
            // Production-ready image handling
            proxy: undefined, // Don't use proxy unless specifically configured
            imageTimeout: 15000, // Wait up to 15 seconds for images to load
            removeContainer: true, // Clean up temporary container
            ignoreElements: (node) => {
                // Ignore elements specifically marked to be hidden from print/pdf
                return node.classList.contains('no-print') || node.classList.contains('hide-on-pdf');
            },
            onclone: (clonedDoc) => {
                // Formatting fixes for the cloned document before rendering
                const clonedElement = clonedDoc.getElementById(element.id);
                if (clonedElement) {
                    clonedElement.style.margin = '0';
                    clonedElement.style.padding = '20px'; // Add internal padding for better PDF look

                    // Ensure all images are loaded in cloned document
                    const images = clonedElement.getElementsByTagName('img');
                    Array.from(images).forEach(img => {
                        // Add crossorigin attribute for better CORS handling
                        if (!img.complete) {
                            img.crossOrigin = 'anonymous';
                        }
                        // Convert data URLs to inline if possible
                        if (img.src && img.src.startsWith('http')) {
                            // Mark external images with a data attribute for tracking
                            img.setAttribute('data-external', 'true');
                        }
                    });
                }
            }
        });
    } catch (error) {
        console.error('Canvas capture error details:', error);

        // Try fallback with more permissive settings if first attempt fails
        try {
            console.log('Attempting fallback capture with allowTaint only...');
            return await html2canvas(element, {
                scale: 1, // Lower quality for fallback
                allowTaint: true,
                logging: true, // Enable logging for debugging
                backgroundColor: '#ffffff',
                ignoreElements: (node) => {
                    return node.classList.contains('no-print') || node.classList.contains('hide-on-pdf');
                }
            });
        } catch (fallbackError) {
            throw new Error(`Canvas capture failed: ${error.message}. Fallback also failed: ${fallbackError.message}`);
        }
    }
};

/**
 * Converts canvas to PDF Blob/File.
 */
const generatePdfBox = (canvas, fileName) => {
    try {
        // Validate canvas has content
        if (!canvas || canvas.width === 0 || canvas.height === 0) {
            throw new Error('Canvas is empty or has no dimensions. The content may not have loaded properly.');
        }

        const imgData = canvas.toDataURL('image/png');

        // Validate image data is not empty
        if (!imgData || imgData === 'data:,') {
            throw new Error('Canvas captured but contains no image data. Check if the element has visible content.');
        }

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = 210; // A4 Width in mm

        // Calculate image dimensions to fit A4 width
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // Validate dimensions are reasonable
        if (imgHeight <= 0 || imgProps.width <= 0 || imgProps.height <= 0) {
            throw new Error(`Invalid image dimensions: ${imgProps.width}x${imgProps.height}. Content may be hidden or empty.`);
        }

        // Add image to PDF (Standard one-page or cut-off for now, as per simple invoice requirements)
        // For multi-page, we would compare imgHeight > pdfHeight and loop.
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);

        const pdfBlob = pdf.output('blob');

        // Final validation: Check if PDF blob is not empty
        if (!pdfBlob || pdfBlob.size === 0) {
            throw new Error('PDF blob is empty (0 bytes). Generation failed silently.');
        }

        return new File([pdfBlob], fileName, { type: 'application/pdf' });
    } catch (error) {
        console.error('PDF generation error:', error);
        throw new Error(`PDF generation failed: ${error.message}`);
    }
};

/**
 * Handles the logic to specific Web Share API or fallback to download.
 */
const handleShareOrDownload = async (file, fileName, title, text) => {
    // Check if Web Share API is supported and can share files
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: title || 'Shared Document',
                text: text || 'Please find the attached PDF document.',
            });
        } catch (error) {
            if (error.name === 'AbortError') {
                // User cancelled the share sheet - do nothing or log
                console.log('User cancelled share');
                return; // Don't throw, just exit
            }
            // Real share error - try fallback?
            // Usually if share fails technically, we might want to fallback or just throw.
            // Let's fallback to download for robustness if share crashes.
            console.warn('Share API failed, falling back to download', error);
            downloadFile(file);
        }
    } else {
        // Fallback for Desktop or unsupported devices
        downloadFile(file);
    }
};

/**
 * Triggers a browser download for the file.
 */
const downloadFile = (file) => {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
