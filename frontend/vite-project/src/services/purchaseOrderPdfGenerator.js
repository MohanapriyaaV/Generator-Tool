import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { WATERMARK_BASE64_DATA } from './watermarkBase64';

// Validate watermark data
const validateImageData = (data, name) => {
  if (!data || typeof data !== 'string') {
    console.warn(`${name} is missing or invalid`);
    return null;
  }
  if (!data.startsWith('data:image/')) {
    console.warn(`${name} does not appear to be a valid image data URL`);
    return null;
  }
  return data;
};

const WATERMARK_IMAGE_DATA = validateImageData(WATERMARK_BASE64_DATA, 'WATERMARK_BASE64_DATA');

/**
 * Generates a perfect one-page PDF from HTML
 * Automatically scales content to prevent overlap
 */
export const generatePurchaseOrderPDF = async (previewRef, fileName = "PO.pdf") => {
  if (!previewRef.current) {
    alert("Preview not ready");
    return null;
  }

  const element = previewRef.current;

  // --- STEP 1: temporarily apply fixed A4 width ---
  const A4_WIDTH_PX = 794;   // 210mm at 96 dpi
  const originalWidth = element.style.width;
  element.style.width = A4_WIDTH_PX + "px";

  // Wait for styles to apply
  await new Promise((res) => setTimeout(res, 200));

  // --- STEP 2: capture canvas ---
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");

  // --- STEP 3: create PDF with watermark ---
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  // Calculate scaling so image fits exactly into ONE page height
  const imgProps = pdf.getImageProperties(imgData);
  const imgWidthMM = pdfWidth;
  const imgHeightMM = (imgProps.height * imgWidthMM) / imgProps.width;

  // If content is too tall → scale down to fit one page
  let finalHeight = imgHeightMM;
  let finalWidth = imgWidthMM;

  if (imgHeightMM > pdfHeight) {
    const scale = pdfHeight / imgHeightMM;
    finalHeight = imgHeightMM * scale;
    finalWidth = imgWidthMM * scale;
  }

  const x = (pdfWidth - finalWidth) / 2;
  const y = 0;

  // Add watermark if available
  if (WATERMARK_IMAGE_DATA) {
    try {
      // Create watermark image and wait for it to load
      const watermarkImg = new Image();
      await new Promise((resolve, reject) => {
        watermarkImg.onload = resolve;
        watermarkImg.onerror = reject;
        watermarkImg.src = WATERMARK_IMAGE_DATA;
      });

      // Create canvas for watermark composition
      const watermarkCanvas = document.createElement('canvas');
      const watermarkCtx = watermarkCanvas.getContext('2d');
      watermarkCanvas.width = canvas.width;
      watermarkCanvas.height = canvas.height;
      
      // Draw main content first
      watermarkCtx.drawImage(canvas, 0, 0);
      
      // Draw watermark with opacity
      watermarkCtx.globalAlpha = 0.6;
      const watermarkSize = Math.min(canvas.width, canvas.height) * 0.4;
      const watermarkX = (canvas.width - watermarkSize) / 2;
      const watermarkY = (canvas.height - watermarkSize) / 2;
      watermarkCtx.drawImage(watermarkImg, watermarkX, watermarkY, watermarkSize, watermarkSize);
      
      // Use combined image
      const finalImgData = watermarkCanvas.toDataURL("image/png", 1.0);
      pdf.addImage(finalImgData, "PNG", x, y, finalWidth, finalHeight);
    } catch (error) {
      console.warn('Watermark failed, using original:', error);
      pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight);
    }
  } else {
    pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight);
  }

  // Save the PDF
  pdf.save(fileName);

  // Return blob for S3 upload
  const blob = pdf.output('blob');

  // Restore original width
  element.style.width = originalWidth || "100%";

  return blob;
};
