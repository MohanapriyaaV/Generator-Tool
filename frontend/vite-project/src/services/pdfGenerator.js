import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Generates PDF from proforma invoice data
 * Similar to purchase order PDF generator but works with invoice preview ref
 * 
 * @param {Object} data - Invoice data (used for filename generation)
 * @param {boolean} isGeneratingPDF - Loading state (not directly used)
 * @param {Function} onDownloadStateChange - Callback to update loading state
 */
export const generatePdfFromData = async (data, isGeneratingPDF, onDownloadStateChange) => {
  // Find the invoice preview element in the DOM
  // The invoiceRef is attached to an element with className "invoice-preview"
  const invoiceElement = document.querySelector('.invoice-preview');
  
  if (!invoiceElement) {
    alert("Invoice preview not found. Please try again.");
    if (onDownloadStateChange) onDownloadStateChange(false);
    return null;
  }

  try {
    if (onDownloadStateChange) onDownloadStateChange(true);

    // Temporarily apply fixed A4 width
    const A4_WIDTH_PX = 794; // 210mm at 96 dpi
    const originalWidth = invoiceElement.style.width;
    invoiceElement.style.width = A4_WIDTH_PX + "px";

    // Wait for styles to apply
    await new Promise((res) => setTimeout(res, 200));

    // Capture canvas
    const canvas = await html2canvas(invoiceElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");

    // Create PDF
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

    // Generate filename from invoice data
    const invoiceNumber = data?.invoiceNumber || data?.formData?.invoiceNumber || 'invoice';
    const fileName = `proforma_invoice_${invoiceNumber}.pdf`;

    // Save the PDF
    pdf.save(fileName);

    // Return blob for potential S3 upload
    const blob = pdf.output('blob');

    // Restore original width
    invoiceElement.style.width = originalWidth || "100%";

    if (onDownloadStateChange) onDownloadStateChange(false);

    return blob;
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
    if (onDownloadStateChange) onDownloadStateChange(false);
    return null;
  }
};

