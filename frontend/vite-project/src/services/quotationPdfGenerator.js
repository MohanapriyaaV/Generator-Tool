import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { WATERMARK_BASE64_DATA } from './watermarkBase64';

// Validate watermark data
const validateImageData = (data, name) => {
  if (!data) {
    console.error(`ERROR: ${name} is missing!`);
    return '';
  }
  if (!data.startsWith('data:image/')) {
    console.warn(`WARNING: ${name} does not appear to be a valid data URI`);
  }
  return data;
};

const WATERMARK_IMAGE_DATA = validateImageData(WATERMARK_BASE64_DATA, 'WATERMARK_BASE64_DATA');

/**
 * Inlines styles and forces resets for PDF layout
 */
const inlineComputedStyles = (element, skipPadding = false) => {
  const processElement = (el, isRoot = false) => {
    try {
      const computed = window.getComputedStyle(el);
      let inlineStyle = "";
      for (let i = 0; i < computed.length; i++) {
        const prop = computed[i];
        try {
          // Skip padding for the root to prevent double-margining
          if (isRoot && skipPadding && prop.startsWith('padding')) continue;
          // Skip vertical-align to allow our explicit setting later
          if (prop === 'vertical-align' || prop === 'verticalAlign') continue;
          
          const value = computed.getPropertyValue(prop);
          if (value && value.trim() !== "" && !value.includes("oklch")) {
            const camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            inlineStyle += `${camelProp}: ${value}; `;
          }
        } catch (e) {}
      }
      if (inlineStyle) {
        const existingStyle = el.getAttribute("style") || "";
        el.setAttribute("style", existingStyle + " " + inlineStyle);
      }
    } catch (e) {}
  };

  processElement(element, true);
  element.querySelectorAll("*").forEach((el) => processElement(el, false));
};

/**
 * Fixes the header layout to ensure logo and company name are on same row,
 * with Commercial Proposal below them
 */
const fixHeaderLayout = (clone) => {
  // Find the header container (the div with border-bottom)
  const headerContainer = clone.querySelector('[style*="border"]') || 
                         Array.from(clone.querySelectorAll('div')).find(div => 
                           div.style.borderBottomWidth || 
                           div.style.borderBottom || 
                           div.getAttribute('style')?.includes('border')
                         );
  
  if (headerContainer) {
    // Ensure header container has proper styles
    headerContainer.style.borderBottom = '3px solid #0c4a6e';
    headerContainer.style.paddingBottom = '8px';
    headerContainer.style.marginBottom = '12px';
    headerContainer.style.width = '100%';
    headerContainer.style.boxSizing = 'border-box';

    // Find the top row (logo and company name row) - should be first child
    const topRow = headerContainer.children[0];
    if (topRow) {
      // Ensure flex layout for top row - logo and company name side by side
      topRow.style.display = 'flex';
      topRow.style.alignItems = 'center';
      topRow.style.gap = '20px';
      topRow.style.width = '100%';
      topRow.style.marginTop = '5px';
      topRow.style.flexDirection = 'row';
      
      // Find logo container (first child of topRow)
      const logoContainer = topRow.children[0];
      if (logoContainer) {
        logoContainer.style.flexShrink = '0';
        logoContainer.style.marginTop = '8px';
        const logoImg = logoContainer.querySelector('img');
        if (logoImg) {
          logoImg.style.maxHeight = '120px'; // Increased from 100px
          logoImg.style.maxWidth = '260px'; // Increased from 220px
          logoImg.style.display = 'block';
        }
      }
      
      // Find company name container (second child of topRow)
      const companyNameContainer = topRow.children[1];
      if (companyNameContainer) {
        companyNameContainer.style.flex = '1';
        companyNameContainer.style.textAlign = 'left';
        companyNameContainer.style.marginLeft = '30px'; // Move text a little bit to the right
        const companyNameText = companyNameContainer.querySelector('h2');
        if (companyNameText) {
          companyNameText.style.fontSize = '28px'; // Increased from 24px
          companyNameText.style.fontWeight = 'bold';
          companyNameText.style.color = '#0c4a6e';
          companyNameText.style.margin = '0';
          companyNameText.style.lineHeight = '1.2';
          companyNameText.style.textTransform = 'uppercase';
          companyNameText.style.whiteSpace = 'nowrap';
        }
      }
    }

    // Find the Commercial Proposal row (should be second child of headerContainer)
    const commercialProposalRow = headerContainer.children[1];
    if (commercialProposalRow) {
      // Ensure it's on a new line below the logo and company name
      commercialProposalRow.style.display = 'block';
      commercialProposalRow.style.textAlign = 'center';
      commercialProposalRow.style.marginTop = '5px';
      commercialProposalRow.style.marginBottom = '16px'; // Increased spacing after Commercial Proposal
      commercialProposalRow.style.width = '100%';
      
      const commercialProposalText = commercialProposalRow.querySelector('p');
      if (commercialProposalText) {
        commercialProposalText.style.fontSize = '22px'; // Increased from 20px
        commercialProposalText.style.color = '#374151';
        commercialProposalText.style.margin = '0';
        commercialProposalText.style.fontWeight = '600';
      }
    }
  }

  // Fix the quotation info section to display 3 columns side by side
  const quotationInfoSection = clone.querySelector('.quotation-info-section') ||
                               Array.from(clone.querySelectorAll('div')).find(div => 
                                 div.className && div.className.includes('quotation-info-section')
                               );
  
  if (quotationInfoSection) {
    // Ensure 3-column grid layout
    quotationInfoSection.style.display = 'grid';
    quotationInfoSection.style.gridTemplateColumns = '1fr 1fr 1fr'; // 3 equal columns
    quotationInfoSection.style.gap = '16px'; // Space between columns
    quotationInfoSection.style.width = '100%';
    quotationInfoSection.style.marginTop = '12px'; // Space after header border
    quotationInfoSection.style.marginBottom = '20px'; // Increased space after quotation sections
    
    // Ensure all children are properly displayed
    Array.from(quotationInfoSection.children).forEach((child, index) => {
      child.style.display = 'block';
      child.style.width = '100%';
      
      // Find and style the headings (Quotation From, Quotation For)
      if (index < 2) { // First two columns
        const heading = child.querySelector('h3');
        if (heading) {
          heading.style.color = '#0c4a6e'; // Blue color (sky-900)
          heading.style.textDecoration = 'underline';
          heading.style.fontWeight = 'bold';
          heading.style.marginBottom = '4px'; // Reduced spacing
        }
        
        // Reduce line spacing for all paragraphs in these sections
        const paragraphs = child.querySelectorAll('p');
        paragraphs.forEach(p => {
          p.style.marginTop = '0';
          p.style.marginBottom = '0';
          p.style.lineHeight = '1.2'; // Tighter line height
        });
        
        // Add more space after Quotation From and Quotation For sections
        child.style.marginBottom = '16px';
      } else if (index === 2) {
        // Quotation Details column (third column) - remove spacing between lines
        const paragraphs = child.querySelectorAll('p');
        paragraphs.forEach(p => {
          p.style.marginTop = '0';
          p.style.marginBottom = '0';
          p.style.lineHeight = '1.2'; // Tighter line height
        });
      }
    });
  }

  // Fix table styling - add borders, blue header, gray total row
  const table = clone.querySelector('.quotation-items-table') ||
                clone.querySelector('table');
  
  if (table) {
    // Remove any global styles that might interfere with vertical alignment
    table.style.verticalAlign = 'middle';
    table.style.setProperty('vertical-align', 'middle', 'important');
    
    // Add spacing before and after the table
    table.style.marginTop = '16px';
    table.style.marginBottom = '16px';
    
    // Ensure table has borders
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.style.border = '1px solid #000';
    
    // Style header row - blue background with white text
    const headerRow = table.querySelector('thead tr');
    if (headerRow) {
      headerRow.style.backgroundColor = '#0c4a6e'; // sky-800 blue
      headerRow.style.color = '#ffffff';
      const headerCells = headerRow.querySelectorAll('th');
      headerCells.forEach((cell, index) => {
        cell.style.border = '1px solid #000';
        cell.style.padding = '6px 10px'; // Increased padding for better spacing
        // Force vertical center alignment with !important to override any global styles
        cell.style.setProperty('vertical-align', 'middle', 'important');
        cell.style.setProperty('verticalAlign', 'middle', 'important');
        cell.style.whiteSpace = 'nowrap'; // Prevent text wrapping
        
        // Horizontal alignment based on column - all headers center aligned
        cell.style.textAlign = 'center';
      });
    }
    
    // Style all body rows and cells - ensure borders and proper spacing
    const bodyRows = table.querySelectorAll('tbody tr');
    bodyRows.forEach((row, index) => {
      // Check if this is the "Amount in words" row
      const isAmountInWordsRow = row.textContent && row.textContent.includes('Amount (in words)');
      
      const cells = row.querySelectorAll('td');
      cells.forEach((cell, cellIndex) => {
        cell.style.border = '1px solid #000';
        cell.style.padding = '4px 6px'; // Reduced padding for smaller cells
        // Force vertical center alignment with !important to override any global styles
        cell.style.setProperty('vertical-align', 'middle', 'important');
        cell.style.setProperty('verticalAlign', 'middle', 'important');
        // Remove any conflicting alignment styles
        cell.style.removeProperty('align');
        cell.removeAttribute('valign');
        cell.style.wordWrap = 'break-word'; // Allow text to wrap if needed
        cell.style.overflowWrap = 'break-word';
        cell.style.height = '28px'; // Reduced height for smaller cells
        cell.style.lineHeight = '1.2';
        
        // Handle regular data rows
        if (cells.length === 6) { // Regular item rows have 6 cells
          // Horizontal alignment: Sl. (0) = center, Item (1) = left, HSN/SAC (2) = center, Qty (3) = center, Rate (4) = right, Amount (5) = right
          if (cellIndex === 1) { // Item column - left aligned
            cell.style.textAlign = 'left';
            cell.style.width = 'auto';
            cell.style.minWidth = '200px';
          } else if (cellIndex === 4 || cellIndex === 5) { // Rate and Amount columns - right aligned
            cell.style.textAlign = 'right';
          } else { // Sl., HSN/SAC, Qty - center aligned
            cell.style.textAlign = 'center';
          }
        } else if (cells.length === 2) { // Summary rows (colSpan + value)
          // First cell has colSpan, second cell is the value
          if (cellIndex === 0) {
            // Label cell - check if it's "Amount in words"
            if (isAmountInWordsRow) {
              cell.style.textAlign = 'left'; // Amount in words - left aligned
            } else {
              cell.style.textAlign = 'right'; // Amount, CGST, SGST, Total Amount labels - right aligned
            }
          } else if (cellIndex === 1) {
            // Value cell - right aligned for Amount, CGST, SGST, Total Amount
            if (!isAmountInWordsRow) {
              cell.style.textAlign = 'right';
            }
          }
        }
      });
      
      // Style the last row (Total Amount) with light gray background
      if (index === bodyRows.length - 1) {
        row.style.backgroundColor = '#f3f4f6'; // gray-100
        row.style.fontWeight = 'bold';
      }
    });
  }
  
  // Also add spacing to the table container if it exists
  const tableContainer = clone.querySelector('.quotation-items-section');
  if (tableContainer) {
    tableContainer.style.marginTop = '16px';
    tableContainer.style.marginBottom = '16px';
  }

  // Fix bank details section
  const bankDetailsSection = clone.querySelector('.quotation-bank-details') ||
                            Array.from(clone.querySelectorAll('div')).find(div => 
                              div.textContent && div.textContent.includes("Company's Bank Details")
                            );
  
  if (bankDetailsSection) {
    // Find and style the heading
    const heading = bankDetailsSection.querySelector('p') || 
                   Array.from(bankDetailsSection.children).find(el => 
                     el.textContent && el.textContent.includes("Company's Bank Details")
                   );
    
    if (heading) {
      heading.style.color = '#0c4a6e'; // Blue color
      heading.style.textDecoration = 'underline';
      heading.style.fontWeight = 'bold';
      heading.style.marginBottom = '4px';
    }
    
    // Reduce line spacing for all paragraphs in bank details
    const paragraphs = bankDetailsSection.querySelectorAll('p');
    paragraphs.forEach(p => {
      p.style.marginTop = '0';
      p.style.marginBottom = '0';
      p.style.lineHeight = '1.2';
    });
  }

  // Footer layout is now fixed in generateQuotationPDF after forceFooterToBottom
};

/**
 * Forces footer sections to the bottom of the page
 * Uses CSS positioning to ensure footer is at bottom
 */
const forceFooterToBottom = (clone) => {
  const main = clone.querySelector("#quotation-pdf") || clone;
  if (!main) return;

  // A4 height @ 96dpi (1123px) - matching pdfMake's page height
  const A4_HEIGHT = 1123;
  
  // Set main container height and positioning - allow footer to go to bottom
  main.style.position = "relative";
  main.style.height = A4_HEIGHT + "px";
  main.style.minHeight = A4_HEIGHT + "px";
  main.style.overflow = "visible";
  main.style.setProperty("position", "relative", "important");
  main.style.setProperty("height", A4_HEIGHT + "px", "important");
  main.style.setProperty("min-height", A4_HEIGHT + "px", "important");
  main.style.setProperty("overflow", "visible", "important");

  // Collect all footer blocks
  const footerBlocks = [
    ".quotation-terms",
    ".quotation-signature", 
    ".quotation-footer-addresses",
    ".quotation-footer-contact",
  ]
    .map(sel => clone.querySelector(sel))
    .filter(Boolean);

  if (!footerBlocks.length) return;

  // Create footer wrapper and position it at bottom
  const doc = clone.ownerDocument || document;
  let footerWrapper = main.querySelector('.quotation-footer-wrapper');
  
  if (!footerWrapper) {
    footerWrapper = doc.createElement("div");
    footerWrapper.className = "quotation-footer-wrapper";
    
    // Move all footer blocks into wrapper
    footerBlocks.forEach(el => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
      footerWrapper.appendChild(el);
    });

    main.appendChild(footerWrapper);
  }
  
  // Position footer at bottom with absolute positioning - use top instead of bottom
  footerWrapper.style.position = "absolute";
  footerWrapper.style.top = "1050px"; // Move down a bit more
  footerWrapper.style.left = "20px";
  footerWrapper.style.right = "20px";
  footerWrapper.style.width = "auto";
  footerWrapper.style.setProperty("position", "absolute", "important");
  footerWrapper.style.setProperty("top", "950px", "important");
  footerWrapper.style.setProperty("left", "20px", "important");
  footerWrapper.style.setProperty("right", "20px", "important");
};

/**
 * Fixes the footer layout: Terms & Conditions, Authorized Signatory, Addresses, Contact Info
 */
const fixFooterLayout = (clone) => {
  // Find footer wrapper first (created by forceFooterToBottom)
  const footerWrapper = clone.querySelector('.quotation-footer-wrapper');
  const searchRoot = footerWrapper || clone;
  
  // 1. Fix Terms & Conditions section - improve list alignment
  const termsSection = searchRoot.querySelector('.quotation-terms') ||
                      Array.from(searchRoot.querySelectorAll('div')).find(div => 
                        div.textContent && div.textContent.includes('Terms & Conditions')
                      );
  
  if (termsSection) {
    // Find and style the heading
    const heading = termsSection.querySelector('p') || 
                   Array.from(termsSection.children).find(el => 
                     el.textContent && el.textContent.includes('Terms & Conditions')
                   );
    
    if (heading) {
      heading.style.color = '#0c4a6e'; // Blue color
      heading.style.textDecoration = 'underline';
      heading.style.fontWeight = 'bold';
      heading.style.marginBottom = '8px';
    }
    
    // Fix ordered list alignment by replacing with flex divs
    const orderedList = termsSection.querySelector('ol');
    if (orderedList) {
      const listItems = orderedList.querySelectorAll('li');
      const doc = clone.ownerDocument || document;
      
      // Create container div
      const container = doc.createElement('div');
      
      // Convert each li to a flex div
      listItems.forEach((li, index) => {
        const itemDiv = doc.createElement('div');
        itemDiv.style.display = 'flex';
        itemDiv.style.alignItems = 'flex-start';
        itemDiv.style.marginBottom = '2px';
        
        const numberSpan = doc.createElement('span');
        numberSpan.textContent = `${index + 1}.`;
        numberSpan.style.minWidth = '20px';
        numberSpan.style.marginRight = '8px';
        numberSpan.style.flexShrink = '0';
        
        const textSpan = doc.createElement('span');
        textSpan.textContent = li.textContent;
        textSpan.style.flex = '1';
        textSpan.style.lineHeight = '1.3';
        
        itemDiv.appendChild(numberSpan);
        itemDiv.appendChild(textSpan);
        container.appendChild(itemDiv);
      });
      
      // Replace the ordered list with the container
      orderedList.parentNode.replaceChild(container, orderedList);
    }
  }

  // 2. Fix Authorized Signatory section
  const signatureSection = searchRoot.querySelector('.quotation-signature') ||
                          Array.from(searchRoot.querySelectorAll('div')).find(div => 
                            div.textContent && div.textContent.includes('Authorized Signatory')
                          );
  
  if (signatureSection) {
    signatureSection.style.display = 'flex';
    signatureSection.style.justifyContent = 'flex-end';
    signatureSection.style.marginTop = '16px';
    signatureSection.style.marginBottom = '8px';
    
    const signatureDiv = signatureSection.querySelector('div:last-child');
    if (signatureDiv) {
      signatureDiv.style.textAlign = 'right';
      const paragraphs = signatureDiv.querySelectorAll('p');
      paragraphs.forEach(p => {
        p.style.margin = '0';
        p.style.marginBottom = '4px';
      });
    }
  }

  // 3. Add horizontal line between Authorized Signatory and address block
  // The line should be between signature section and footer addresses
  const footerAddressesForLine = searchRoot.querySelector('.quotation-footer-addresses');
  if (signatureSection && footerAddressesForLine) {
    // Check if they're in the same parent (should be footer wrapper now)
    const signatureParent = signatureSection.parentNode;
    const addressesParent = footerAddressesForLine.parentNode;
    
    // Use the clone's ownerDocument to create elements
    const doc = clone.ownerDocument || document;
    const horizontalLine = doc.createElement('div');
    horizontalLine.style.borderTop = '1px solid #9ca3af'; // gray-400
    horizontalLine.style.marginTop = '8px';
    horizontalLine.style.marginBottom = '8px';
    horizontalLine.style.width = '100%';
    horizontalLine.style.height = '0';
    
    // Insert the line right before footer addresses (after signature section)
    if (signatureParent === addressesParent) {
      // They're siblings in the same parent (footer wrapper), insert line between them
      addressesParent.insertBefore(horizontalLine, footerAddressesForLine);
    } else if (signatureSection.nextSibling) {
      // Insert after signature section
      signatureSection.parentNode.insertBefore(horizontalLine, signatureSection.nextSibling);
    }
  }

  // 4. Fix Footer Addresses - 4 columns in gray color
  const footerAddresses = clone.querySelector('.quotation-footer-addresses') ||
                         Array.from(clone.querySelectorAll('div')).find(div => 
                           div.className && div.className.includes('quotation-footer-addresses')
                         );
  
  if (footerAddresses) {
    footerAddresses.style.display = 'grid';
    footerAddresses.style.gridTemplateColumns = '1fr 1fr 1fr 1fr'; // 4 equal columns
    footerAddresses.style.gap = '8px';
    footerAddresses.style.width = '100%';
    footerAddresses.style.color = '#6b7280'; // gray-500
    footerAddresses.style.fontSize = '11px';
    footerAddresses.style.marginTop = '8px';
    footerAddresses.style.marginBottom = '8px';
    
    // Remove border-top if it exists (we'll add our own line above)
    footerAddresses.style.borderTop = 'none';
    footerAddresses.style.paddingTop = '0';
    
    // Style each address div
    const addressDivs = footerAddresses.querySelectorAll('div');
    addressDivs.forEach(div => {
      div.style.color = '#6b7280'; // gray-500
      div.style.lineHeight = '1.4';
    });
  }

  // 5. Fix Footer Contact Info - keep it in footer wrapper but at bottom
  const footerContact = clone.querySelector('.quotation-footer-contact') ||
                        Array.from(clone.querySelectorAll('div')).find(div => 
                          div.className && div.className.includes('quotation-footer-contact')
                        );
  
  if (footerContact) {
    // Don't remove from parent, just style it to appear at bottom
    footerContact.style.position = "relative";
    footerContact.style.marginTop = "20px"; // Add space above contact info
    footerContact.style.textAlign = 'center';
    footerContact.style.color = '#0c4a6e';
    footerContact.style.fontWeight = '500';
    footerContact.style.fontSize = '11px';
    footerContact.style.padding = '8px 0';
    footerContact.style.backgroundColor = 'white';
    footerContact.style.width = "100%";
    footerContact.style.setProperty("margin-top", "20px", "important");
  }
};

export const generateQuotationPDF = async (
  previewRef,
  fileName = "Quotation.pdf"
) => {
  if (!previewRef?.current) throw new Error("Quotation preview not ready");

  const element = previewRef.current;
  let iframe = null; // Declare iframe outside try block

  try {
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 1. Setup isolated Iframe
    iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.left = "-9999px";
    // Standard width to ensure the header doesn't wrap/stack
    const targetWidth = 1100; 
    iframe.style.width = targetWidth + "px";
    iframe.style.height = (element.offsetHeight + 100) + "px";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    const iframeBody = iframeDoc.body;

    // 2. Clone and Reset Alignment
    const clone = element.cloneNode(true);
    inlineComputedStyles(clone, true);

    // Force content to start at the very left of the canvas
    clone.style.setProperty("padding", "0px", "important");
    clone.style.setProperty("margin", "0px", "important");
    clone.style.setProperty("width", "100%", "important");
    clone.style.setProperty("display", "block", "important");

    // Clear any existing left-padding/margin strings from the style attribute
    let styleAttr = clone.getAttribute("style") || "";
    styleAttr = styleAttr.replace(/padding-[^;]+;?/g, "").replace(/margin-[^;]+;?/g, "");
    clone.setAttribute("style", styleAttr + " padding: 0 !important; margin: 0 !important; width: 100% !important;");

    iframeBody.style.margin = "0";
    iframeBody.style.padding = "0";
    iframeBody.style.minHeight = "1700px"; // Increase height further
    iframeBody.style.position = "relative";
    iframeBody.style.overflow = "visible";
    iframeBody.style.setProperty("min-height", "1700px", "important");
    iframeBody.style.setProperty("position", "relative", "important");
    iframeBody.style.setProperty("overflow", "visible", "important");
    
    // Set iframe document styles with flexible height
    iframeDoc.documentElement.style.minHeight = "1700px";
    iframeDoc.documentElement.style.overflow = "visible";
    
    iframeBody.appendChild(clone);

    // Fix header layout to ensure proper alignment
    fixHeaderLayout(clone);
    
    // Force footer to bottom FIRST - this groups footer sections
    forceFooterToBottom(clone);
    
    // Then fix footer layout (styling and horizontal line) - this must be AFTER grouping
    // This will style the footer sections that are now in the wrapper
    fixFooterLayout(clone);
    
    // CRITICAL: Wait for layout to settle
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    // FINAL FIX: Ensure footer is positioned at the bottom
    const footerWrapper = clone.querySelector('.quotation-footer-wrapper');
    
    if (footerWrapper) {
      // Use only top positioning to move footer to bottom
      footerWrapper.style.position = "absolute";
      footerWrapper.style.top = "1250px";
      footerWrapper.style.left = "20px";
      footerWrapper.style.right = "20px";
      footerWrapper.style.setProperty("position", "absolute", "important");
      footerWrapper.style.setProperty("top", "1250px", "important");
      footerWrapper.style.setProperty("left", "20px", "important");
      footerWrapper.style.setProperty("right", "20px", "important");
    }
    
    // Force vertical alignment on all table cells AFTER all styles are inlined
    // This must be done after fixHeaderLayout to ensure it takes precedence
    const table = clone.querySelector('.quotation-items-table') || clone.querySelector('table');
    if (table) {
      // Get all cells (both th and td)
      const allCells = table.querySelectorAll('th, td');
      allCells.forEach(cell => {
        // Remove any existing vertical-align from style attribute string
        let currentStyle = cell.getAttribute('style') || '';
        // Remove vertical-align in various formats
        currentStyle = currentStyle.replace(/vertical-align\s*:\s*[^;]+;?/gi, '');
        currentStyle = currentStyle.replace(/verticalAlign\s*:\s*[^;]+;?/gi, '');
        cell.setAttribute('style', currentStyle.trim());
        
        // Now set vertical-align with !important using multiple methods
        cell.style.setProperty('vertical-align', 'middle', 'important');
        cell.style.verticalAlign = 'middle';
        
        // Ensure the cell is displayed as table-cell
        cell.style.display = 'table-cell';
        cell.style.setProperty('display', 'table-cell', 'important');
        
        // Also set on the row to ensure consistency
        const row = cell.parentElement;
        if (row && row.tagName === 'TR') {
          row.style.verticalAlign = 'middle';
          row.style.setProperty('vertical-align', 'middle', 'important');
        }
      });
    }

    // 3. Load Images
    const cloneImages = clone.querySelectorAll("img");
    await Promise.all(Array.from(cloneImages).map(img => {
      return new Promise(res => {
        if (img.complete) res();
        else { img.onload = res; img.onerror = res; }
      });
    }));

    // 4. Capture Canvas with extended height to include footer
    const canvas = await html2canvas(iframeBody, {
    scale: 2,
      useCORS: true,
    backgroundColor: "#ffffff",
      width: targetWidth,
      height: 1700, // Increase to capture all footer content
  });

    // 5. Generate PDF with watermark if available
  const imgData = canvas.toDataURL("image/png", 1.0);
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

    // Add padding to PDF
    const padding = 10; // 10mm padding on all sides
    const imgWidth = pdfWidth - (padding * 2);
    const imgHeight = pdfHeight - (padding * 2);

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
        const x = (canvas.width - watermarkSize) / 2;
        const y = (canvas.height - watermarkSize) / 2;
        watermarkCtx.drawImage(watermarkImg, x, y, watermarkSize, watermarkSize);
        
        // Use combined image with padding
        const finalImgData = watermarkCanvas.toDataURL("image/png", 1.0);
        pdf.addImage(finalImgData, "PNG", padding, padding, imgWidth, imgHeight);
      } catch (error) {
        console.warn('Watermark failed, using original:', error);
        pdf.addImage(imgData, "PNG", padding, padding, imgWidth, imgHeight);
      }
    } else {
      pdf.addImage(imgData, "PNG", padding, padding, imgWidth, imgHeight);
    }

  pdf.save(fileName);

    // Upload PDF to AWS S3 and update database
    try {
      console.log('Generating PDF blob for AWS upload...');
      const pdfBlob = pdf.output('blob');
      console.log('PDF blob generated, size:', pdfBlob.size);
      
      // Upload to AWS S3
      const { uploadPdfToS3, updateQuotationS3Url } = await import('./api.js');
      const uploadResult = await uploadPdfToS3(pdfBlob, fileName, 'Quotation');
      console.log('✅ PDF uploaded to S3:', uploadResult.url);
      
      // Update database with S3 URL
      // Filename format: QT25260021_2026-01-07.pdf
      // Extract quotation number (part before the first underscore, remove .pdf extension)
      const quotationNo = fileName.split('_')[0].replace('.pdf', ''); 
      console.log('Extracted quotation number for database update:', quotationNo);
      await updateQuotationS3Url(quotationNo, uploadResult.url);
      console.log('✅ Database updated with S3 URL for quotation:', quotationNo);
    } catch (uploadError) {
      console.warn('⚠️ Could not upload PDF to S3 or update database:', uploadError.message);
      // Don't throw error - PDF was still downloaded successfully
    }

  } catch (error) {
    console.error("PDF generation failed:", error);
    throw error;
  } finally {
    // Cleanup
    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }
};