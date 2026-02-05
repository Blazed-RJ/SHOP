
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
        // Optimization: Reduce scale to avoid "White Screen" OOM crashes
        // WAS: Math.min(window.devicePixelRatio || 2, 2)
        // NOW: Fixed 1.5 for balance, or 1 if very large
        const isLarge = element.scrollHeight > 2000;
        const scale = isLarge ? 1 : 1.5;

        console.log(`Capturing content: ${element.id} (${element.offsetWidth}x${element.offsetHeight}), Scale: ${scale}`);

        return await html2canvas(element, {
            scale: scale,
            useCORS: true,
            allowTaint: true,
            logging: true,
            backgroundColor: '#ffffff',
            imageTimeout: 10000,
            removeContainer: true,
            ignoreElements: (node) => {
                return node.classList.contains('no-print') || node.classList.contains('hide-on-pdf');
            },
            onclone: (clonedDoc) => {
                const clonedElement = clonedDoc.getElementById(element.id);
                if (clonedElement) {
                    // CRITICAL FIX: Remove heavy CSS filters that crash html2canvas
                    clonedElement.style.margin = '0';
                    clonedElement.style.padding = '20px';
                    clonedElement.style.filter = 'none';
                    clonedElement.style.backdropFilter = 'none'; // Remove glassmorphism
                    clonedElement.style.boxShadow = 'none';
                    clonedElement.style.transform = 'none';
                    clonedElement.style.animation = 'none';

                    // Force visible background since we removed backdrop
                    clonedElement.style.backgroundColor = '#ffffff';
                    clonedElement.style.color = '#000000';

                    // Ensure images load
                    const images = clonedElement.getElementsByTagName('img');
                    Array.from(images).forEach(img => {
                        if (!img.complete) {
                            img.crossOrigin = 'anonymous';
                        }
                        // Fix for some external images causing taint
                        try {
                            // img.src = img.src; // Trigger reload? No, risky.
                        } catch (e) { }
                    });
                }
            }
        });
    } catch (error) {
        console.error('Canvas capture error details:', error);
        throw error; // Re-throw to be caught by main handler
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
    // Check if device is mobile using User Agent
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Force download on Desktop/Laptop to avoid Windows Web Share API issues (e.g. Adobe "Zero length file" error)
    if (!isMobile) {
        console.log('Detected Desktop: Forcing download');
        // toast('Starting download...', { icon: '⬇️' }); // Debug feedback
        downloadFile(file);
        return;
    }

    // On Mobile, try Web Share API for native experience
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: title || 'Shared Document',
                text: text || 'Please find the attached PDF document.',
            });
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('User cancelled share');
                return;
            }
            // Fallback to download if share fails
            console.warn('Share API failed, falling back to download', error);
            downloadFile(file);
        }
    } else {
        // Fallback for unsupported devices
        downloadFile(file);
    }
};

/**
 * Triggers a browser download for the file.
 */
const downloadFile = (file) => {
    try {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up with a slight delay to ensure click processed
        setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
        console.error('Download failed:', error);
        toast.error('Failed to trigger download');
    }
};
