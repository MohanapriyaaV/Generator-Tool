import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Tailwind-safe, oklch-safe quotation PDF generator
 * Pixel perfect – one A4 page
 */
export const generateQuotationPDF = async (
  previewRef,
  fileName = "Quotation.pdf"
) => {
  if (!previewRef?.current) {
    alert("Quotation preview not ready");
    return;
  }

  const source = previewRef.current;

  /* ------------------ CLONE NODE ------------------ */
  const clone = source.cloneNode(true);
  clone.style.width = "794px";
  clone.style.background = "#ffffff";
  clone.style.position = "absolute";
  clone.style.left = "-100000px";
  clone.style.top = "0";

  document.body.appendChild(clone);

  /* ------------------ INLINE ALL STYLES ------------------ */
  const inlineStyles = (el) => {
    const computed = window.getComputedStyle(el);
    let cssText = "";

    for (let i = 0; i < computed.length; i++) {
      const prop = computed[i];
      const value = computed.getPropertyValue(prop);

      if (value && value !== "auto" && value !== "none") {
        cssText += `${prop}:${value};`;
      }
    }

    el.setAttribute("style", cssText);
    el.removeAttribute("class"); // 🔥 THIS REMOVES TAILWIND
  };

  inlineStyles(clone);
  clone.querySelectorAll("*").forEach(inlineStyles);

  /* ------------------ REMOVE GLOBAL CSS ------------------ */
  clone.querySelectorAll("style, link").forEach((el) => el.remove());

  await new Promise((r) => setTimeout(r, 100));

  /* ------------------ CANVAS ------------------ */
  const canvas = await html2canvas(clone, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });

  document.body.removeChild(clone);

  /* ------------------ PDF ------------------ */
  const imgData = canvas.toDataURL("image/png", 1.0);

  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const scale = imgHeight > pdfHeight ? pdfHeight / imgHeight : 1;

  pdf.addImage(
    imgData,
    "PNG",
    (pdfWidth - imgWidth * scale) / 2,
    0,
    imgWidth * scale,
    imgHeight * scale
  );

  pdf.save(fileName);

  return pdf.output("blob");
};
