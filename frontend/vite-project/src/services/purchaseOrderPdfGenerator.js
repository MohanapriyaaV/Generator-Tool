import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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

  // --- STEP 3: create PDF ---
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

  pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight);

  // Save the PDF
  pdf.save(fileName);

  // Return blob for S3 upload
  const blob = pdf.output('blob');

  // Restore original width
  element.style.width = originalWidth || "100%";

  return blob;
};
