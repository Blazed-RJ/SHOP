import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

/**
 * Generates a PDF from a DOM element and either shares it via Web Share API or downloads it.
 * @param {string} elementId - The ID of the DOM element to capture.
 * @param {string} fileName - The desired file name for the PDF.
 * @param {string} title - Title for the share dialog.
 * @param {string} text - Text for the share dialog.
 * @param {object} options - Optional configuration: { scale: number, forceDownload: boolean }
 */
export const sharePdf = async (elementId, fileName, title, text, options = {}) => {
    // Default scale: 2 for desktop, 1.5 for mobile/tablet to prevent crashes
    const isMobile = window.innerWidth < 768;
    const { scale = isMobile ? 1.5 : 2, forceDownload = false } = options;
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

    const loadToast = toast.loading('Generating High-Quality PDF...');

    try {
        // 1. Generate PDF with Retry Logic (Try high quality, fallback to low)
        const pdfFile = await generatePdfWithRetry(element, fileName, scale);

        // 2. Share or Download
        await handleShareOrDownload(pdfFile, title, text, forceDownload);

        toast.dismiss(loadToast);
        toast.success(forceDownload ? 'PDF Downloaded' : 'PDF Ready');

    } catch (error) {
        console.error('PDF Process Error:', error);
        toast.dismiss(loadToast);
        toast.error('Failed to generate PDF. Please try again.');
    }
};

/**
 * Attempts to generate PDF at requested scale, retries at scale 1 if it fails (OOM/Canvas limit).
 */
const generatePdfWithRetry = async (element, fileName, initialScale) => {
    // Retry strategy: Initial -> 1.5 (if higher) -> 1.0
    const strategies = [initialScale];
    if (initialScale > 1.5) strategies.push(1.5);
    if (initialScale > 1.0) strategies.push(1.0);

    // Deduplicate
    const uniqueScales = [...new Set(strategies)].sort((a, b) => b - a);

    for (const scale of uniqueScales) {
        try {
            console.log(`Attempting PDF generation at scale: ${scale}`);
            const canvas = await captureContent(element, scale);
            return generatePdfBox(canvas, fileName);
        } catch (error) {
            console.warn(`PDF generation failed at scale ${scale}.`, error);
            // If this was the last attempt, throw
            if (scale === uniqueScales[uniqueScales.length - 1]) throw error;
            // Otherwise loop continues to next scale
        }
    }
};

/**
 * Captures the DOM element using html2canvas with optimized settings.
 */
const captureContent = async (element, scale) => {
    try {
        return await html2canvas(element, {
            scale: scale,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff',
            imageTimeout: 10000,
            removeContainer: true,
            ignoreElements: (node) => {
                return node.classList.contains('no-print') || node.classList.contains('hide-on-pdf');
            },
            onclone: (clonedDoc) => {
                const clonedElement = clonedDoc.getElementById(element.id);
                if (clonedElement) {
                    // Reset harmful modifications
                    clonedElement.style.transform = 'none';
                    clonedElement.style.margin = '0';
                    clonedElement.style.padding = '20px'; // Consistent padding
                    clonedElement.style.width = '100%';
                    clonedElement.style.height = 'auto';

                    // Essential for vector-like quality
                    clonedElement.style.fontSmooth = 'always';
                    clonedElement.style.webkitFontSmoothing = 'antialiased';

                    // Ensure background is white
                    clonedElement.style.backgroundColor = '#ffffff';

                    // Force images to load
                    const images = clonedElement.getElementsByTagName('img');
                    Array.from(images).forEach(img => {
                        if (!img.complete) img.crossOrigin = 'anonymous';
                    });
                }
            }
        });
    } catch (error) {
        console.error('Canvas capture error:', error);
        throw error;
    }
};

/**
 * Converts canvas to PDF Blob/File.
 */
const generatePdfBox = (canvas, fileName) => {
    try {
        if (!canvas || canvas.width === 0 || canvas.height === 0) {
            throw new Error('Canvas is empty.');
        }

        // Use JPEG for better compression and performance (0.8 quality usually sufficient for text/docs)
        const imgData = canvas.toDataURL('image/jpeg', 0.8);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = 210;
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight, undefined, 'FAST');
        const pdfBlob = pdf.output('blob');

        if (!pdfBlob || pdfBlob.size === 0) {
            throw new Error('PDF blob is empty.');
        }

        return new File([pdfBlob], fileName, { type: 'application/pdf' });
    } catch (error) {
        throw new Error(`PDF generation failed: ${error.message}`);
    }
};

/**
 * Handles the logic to specific Web Share API or fallback to download.
 */
const handleShareOrDownload = async (file, title, text, forceDownload) => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // If download explicitly requested OR not mobile, download.
    if (forceDownload || !isMobile) {
        downloadFile(file);
        return;
    }

    // Try sharing on mobile
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: title,
                text: text,
            });
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.warn('Share failed, falling back to download', error);
                downloadFile(file);
            }
        }
    } else {
        downloadFile(file);
    }
};

const downloadFile = (file) => {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
};
