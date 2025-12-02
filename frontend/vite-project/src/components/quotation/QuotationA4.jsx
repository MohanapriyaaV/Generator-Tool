import React, { useContext, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Country, State } from "country-state-city";
import { QuotationContext } from "../../context/QuotationContext";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { createQuotation } from "../../services/api.js";

const QuotationA4 = () => {
  const {
    quotationFor,
    quotationFrom,
    bankDetails,
    quotationDetails,
    quotationItems,
    globalTaxes,
  } = useContext(QuotationContext);

  const navigate = useNavigate();
  const printRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Extract and calculate totals
  const cgst = Number(globalTaxes?.cgst || 0);
  const sgst = Number(globalTaxes?.sgst || 0);
  const igst = Number(globalTaxes?.igst || 0);

  const totalBaseAmount = quotationItems.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  );
  const cgstAmount = (totalBaseAmount * cgst) / 100;
  const sgstAmount = (totalBaseAmount * sgst) / 100;
  const igstAmount = (totalBaseAmount * igst) / 100;
  const grandTotal = totalBaseAmount + cgstAmount + sgstAmount + igstAmount;

  // Save quotation to database when component mounts and data is available
  useEffect(() => {
    const saveQuotation = async () => {
      if (isSaved) {
        console.log('Quotation already saved, skipping...');
        return; // Don't save multiple times
      }
      
      // Wait a bit for context to be fully loaded
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Debug: Log what data we have
      console.log('Attempting to save quotation with data:', {
        quotationNo: quotationDetails?.quotationNo,
        quotationDate: quotationDetails?.issueDate,
        fromCompanyName: quotationFrom?.companyName,
        toCompanyName: quotationFor?.companyName,
        totalAmount: grandTotal,
        fullContext: { quotationDetails, quotationFrom, quotationFor },
      });

      // Generate quotation number if not available
      let quotationNo = quotationDetails?.quotationNo;
      if (!quotationNo) {
        const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const randomPart = Math.floor(100 + Math.random() * 900);
        quotationNo = `QT-${datePart}-${randomPart}`;
        console.log('Generated quotation number:', quotationNo);
      }

      // Check if we have minimum required data
      if (!quotationFrom?.companyName) {
        console.warn('⚠️ Cannot save: quotationFrom.companyName is missing');
        console.warn('Available quotationFrom data:', quotationFrom);
        return;
      }
      
      try {
        const dbData = {
          quotationNo: quotationNo,
          quotationDate: quotationDetails?.issueDate || new Date().toISOString(),
          totalAmount: grandTotal || 0,
          referenceNo: quotationDetails?.referenceNo || '',
          projectName: quotationDetails?.projectName || '',
          fromAddress: {
            companyName: quotationFrom.companyName || '',
            street: quotationFrom.street || '',
            apartment: quotationFrom.apartment || '',
            zipCode: quotationFrom.zipCode || '',
            countryCode: quotationFrom.countryCode || '',
            stateCode: quotationFrom.stateCode || '',
            city: quotationFrom.city || '',
            pan: quotationFrom.pan || '',
            gstin: quotationFrom.gstin || '',
            // Keep address for backward compatibility
            address: quotationFrom.address || (quotationFrom.street ? `${quotationFrom.street}${quotationFrom.apartment ? ', ' + quotationFrom.apartment : ''}, ${quotationFrom.city}, ${quotationFrom.zipCode}` : ''),
          },
          toAddress: {
            personName: quotationFor?.personName || '',
            companyName: quotationFor?.companyName || '',
            street: quotationFor?.street || '',
            apartment: quotationFor?.apartment || '',
            zipCode: quotationFor?.zipCode || '',
            countryCode: quotationFor?.countryCode || '',
            stateCode: quotationFor?.stateCode || '',
            city: quotationFor?.city || '',
            // Keep address for backward compatibility
            address: quotationFor?.address || (quotationFor?.street ? `${quotationFor.street}${quotationFor.apartment ? ', ' + quotationFor.apartment : ''}, ${quotationFor.city}, ${quotationFor.zipCode}` : ''),
          },
          fullQuotationData: {
            quotationFor,
            quotationFrom,
            bankDetails,
            quotationDetails,
            quotationItems,
            globalTaxes,
          },
        };

        console.log('Sending quotation data to API:', dbData);
        const result = await createQuotation(dbData);
        console.log('✅ Quotation saved to database:', result);
        setIsSaved(true);
      } catch (error) {
        console.error('❌ Error saving quotation to database:', error);
        console.error('Error details:', error.message);
        if (error.stack) {
          console.error('Stack trace:', error.stack);
        }
        // Don't block the user - just log the error
      }
    };

    // Save quotation when component mounts
    saveQuotation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const today = new Date();
  const dateString = today.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Convert number to words (Indian system) - supports up to crores
  const numberToWords = (num) => {
    if (num === null || num === undefined) return "Zero Rupees";
    const value = Number(num) || 0;
    const n = Math.floor(value);
    const paise = Math.round((value - n) * 100);

    const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const inWords = (num) => {
      let str = "";
      if (num > 19) {
        str += b[Math.floor(num / 10)] + (num % 10 ? " " + a[num % 10] : "");
      } else {
        str += a[num];
      }
      return str;
    };

    const parts = [];
    const crore = Math.floor(n / 10000000);
    if (crore) {
      const cHundreds = Math.floor(crore / 100);
      const cRest = crore % 100;
      if (cHundreds) parts.push(a[cHundreds] + " Hundred");
      if (cRest) parts.push(inWords(cRest));
      parts.push("Crore");
    }
    const remainderAfterCrore = n % 10000000;
    const lakh = Math.floor(remainderAfterCrore / 100000);
    if (lakh) parts.push(inWords(lakh) + " Lakh");
    const thousand = Math.floor((remainderAfterCrore % 100000) / 1000);
    if (thousand) parts.push(inWords(thousand) + " Thousand");
    const hundred = Math.floor((remainderAfterCrore % 1000) / 100);
    if (hundred) parts.push(a[hundred] + " Hundred");
    const lastTwo = remainderAfterCrore % 100;
    if (lastTwo) parts.push(inWords(lastTwo));

    const words = parts.filter(Boolean).join(" ");
    const rupeesText = words ? words + " Rupees" : "Zero Rupees";
    const paiseText = paise ? (paise <= 19 ? a[paise] : (b[Math.floor(paise / 10)] + (paise % 10 ? " " + a[paise % 10] : ""))) + " Paise" : "";

    return paise ? `${rupeesText} and ${paiseText}` : rupeesText;
  };

  // ✅ Handle PDF export (excludes button)
  // const handleDownloadPdf = async () => {
  //   if (!printRef.current) return;
  //   try {
  //     setIsDownloading(true);

  //     const canvas = await html2canvas(printRef.current, {
  //       scale: 2,
  //       useCORS: true,
  //       backgroundColor: "#ffffff",
  //       ignoreElements: (el) => el.classList.contains("no-print"),
  //     });

  //     const imgData = canvas.toDataURL("image/png");
  //     const pdf = new jsPDF({ unit: "mm", format: "a4" });
  //     const pdfWidth = pdf.internal.pageSize.getWidth();
  //     const pdfHeight = pdf.internal.pageSize.getHeight();
  //     const imgProps = pdf.getImageProperties(imgData);
  //     const pxToMm = imgProps.width / pdfWidth;
  //     const imgHeightMm = imgProps.height / pxToMm;

  //     pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeightMm);
  //     let heightLeft = imgHeightMm - pdfHeight;
  //     while (heightLeft > 0) {
  //       pdf.addPage();
  //       pdf.addImage(imgData, "PNG", 0, -heightLeft, pdfWidth, imgHeightMm);
  //       heightLeft -= pdfHeight;
  //     }

  //     pdf.save(`quotation_${new Date().toISOString().slice(0, 10)}.pdf`);
  //   } catch (err) {
  //     console.error("PDF generation failed:", err);
  //     alert("Failed to generate PDF. Check console for details.");
  //   } finally {
  //     setIsDownloading(false);
  //   }
  // };

  const handleDownloadPdf = async () => {
  if (!printRef.current) return;

  // Add safe color overrides
  const safeColorStyle = document.createElement('style');
  safeColorStyle.innerHTML = `
    #quotation-pdf, #quotation-pdf * {
      color: rgb(0, 0, 0) !important;
      background-color: rgb(255, 255, 255) !important;
      border-color: rgb(0, 0, 0) !important;
    }
    #quotation-pdf .bg-sky-800 {
      background-color: rgb(7, 89, 133) !important;
      color: rgb(255, 255, 255) !important;
    }
    #quotation-pdf .text-sky-800 {
      color: rgb(7, 89, 133) !important;
    }
    #quotation-pdf .text-sky-900 {
      color: rgb(12, 74, 110) !important;
    }
    #quotation-pdf .text-pink-600 {
      color: rgb(219, 39, 119) !important;
    }
    #quotation-pdf .text-gray-700 {
      color: rgb(55, 65, 81) !important;
    }
    #quotation-pdf .border-sky-800 {
      border-color: rgb(7, 89, 133) !important;
    }
  `;
  document.head.appendChild(safeColorStyle);

  try {
    setIsDownloading(true);

    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      ignoreElements: (el) => el.classList.contains("no-print"),
      onclone: (clonedDoc) => {
        // Force reflow to ensure styles are applied
        clonedDoc.getElementById('quotation-pdf').offsetHeight;
      },
      logging: false
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ 
      unit: "mm", 
      format: "a4",
      orientation: "portrait"
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const pxToMm = imgProps.width / pdfWidth;
    const imgHeightMm = imgProps.height / pxToMm;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeightMm);

    // Handle multiple pages if content is too long
    let heightLeft = imgHeightMm - pdfHeight;
    let position = -pdfHeight;

    while (heightLeft > 0) {
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeightMm);
      heightLeft -= pdfHeight;
      position -= pdfHeight;
    }

    // Generate PDF as blob for S3 upload
    const pdfBlob = pdf.output('blob');
    const fileName = `quotation_${quotationDetails?.quotationNo || new Date().toISOString().slice(0, 10)}.pdf`;
    
    // Upload to S3
    try {
      const { uploadPdfToS3, updateQuotationS3Url } = await import('../../services/api.js');
      const uploadResult = await uploadPdfToS3(pdfBlob, fileName, 'Quotation');
      console.log('✅ Quotation PDF uploaded to S3:', uploadResult.url);

      // Update database with S3 URL
      if (quotationDetails?.quotationNo) {
        try {
          await updateQuotationS3Url(quotationDetails.quotationNo, uploadResult.url);
          console.log('✅ Database updated with S3 URL');
        } catch (dbError) {
          console.warn('⚠️ Could not update database with S3 URL:', dbError.message);
        }
      }
    } catch (uploadError) {
      console.error('❌ Error uploading PDF to S3:', uploadError);
      console.warn('PDF downloaded but not saved to S3. Error:', uploadError.message);
    }

    // Download the PDF to user's computer
    pdf.save(fileName);
    
    // Navigate back to form page after download
    setTimeout(() => {
      navigate('/quotation-form');
    }, 500);
  } catch (err) {
    console.error("PDF generation failed:", err);
    alert("Failed to generate PDF. Check console for details.");
  } finally {
    setIsDownloading(false);
    // Clean up - remove the temporary style element
    document.head.removeChild(safeColorStyle);
  }
};

  // Check if required data is available
  if (!quotationFrom || !quotationFrom.companyName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Missing Data</h2>
          <p className="text-gray-600 mb-6">
            Please fill in the quotation details before generating the document.
          </p>
          <button
            onClick={() => navigate('/quotation-form')}
            className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Go to Quotation Form
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Printable content */}
      <div
        ref={printRef}
        id="quotation-pdf"
        className="w-[794px] mx-auto bg-white text-[11px] leading-tight p-8 border border-gray-400"
      >
        {/* Header: three-column layout - logo, centered commercial proposal, company name */}
        <div className="grid grid-cols-3 items-start border-b-[3px] border-sky-800 pb-2 mb-4">
          <div>
            <h1 className="text-[38px] font-extrabold text-sky-800 leading-none tracking-tight">
              VISTA
            </h1>
            <p className="text-pink-600 text-xs font-semibold -mt-1">Innovation@work</p>
          </div>

          <div className="text-center">
            <p className="text-[20px] mt-12 text-gray-700 font-semibold">Commercial Proposal</p>
          </div>

          <div className="items-center text left">
            <h2 className="text-[13px] font-bold text-sky-900 uppercase">
              VISTA ENGINEERING SOLUTIONS PVT LTD
            </h2>
          </div>
        </div>

        {/* Quotation Info */}
        <div className="grid grid-cols-3 gap-6 mb-3 text-[11px]">
          <div>
            <h3 className="font-bold underline mb-1 text-sky-900">
              Quotation From
            </h3>
            <p>{quotationFrom.companyName || "-"}</p>
            {quotationFrom.street && <p>{quotationFrom.street}</p>}
            {quotationFrom.apartment && <p>{quotationFrom.apartment}</p>}
            <p>
              {[
                quotationFrom.city,
                quotationFrom.stateCode && quotationFrom.countryCode 
                  ? State.getStateByCodeAndCountry(quotationFrom.stateCode, quotationFrom.countryCode)?.name || quotationFrom.stateCode
                  : quotationFrom.stateCode,
                quotationFrom.zipCode
              ].filter(Boolean).join(", ")}
            </p>
            {quotationFrom.countryCode && (
              <p>{Country.getCountryByCode(quotationFrom.countryCode)?.name || quotationFrom.countryCode}</p>
            )}
            {quotationFrom.pan && (
              <p style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '2px' }}>
                <strong style={{ display: 'inline-block', width: '65px', flexShrink: 0 }}>PAN:</strong>
                <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{quotationFrom.pan}</span>
              </p>
            )}
            {quotationFrom.gstin && (
              <p style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '2px' }}>
                <strong style={{ display: 'inline-block', width: '65px', flexShrink: 0 }}>GSTIN:</strong>
                <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{quotationFrom.gstin}</span>
              </p>
            )}
            {/* Fallback to old address format if granular fields are not available */}
            {!quotationFrom.street && quotationFrom.address && (
              <p className="whitespace-pre-line">{quotationFrom.address}</p>
            )}
          </div>

          <div>
            <h3 className="font-bold underline mb-1 text-sky-900">
              Quotation For
            </h3>
            {quotationFor.personName && <p>{quotationFor.personName}</p>}
            <p>{quotationFor.companyName || "-"}</p>
            {quotationFor.street && <p>{quotationFor.street}</p>}
            {quotationFor.apartment && <p>{quotationFor.apartment}</p>}
            <p>
              {[
                quotationFor.city,
                quotationFor.stateCode && quotationFor.countryCode 
                  ? State.getStateByCodeAndCountry(quotationFor.stateCode, quotationFor.countryCode)?.name || quotationFor.stateCode
                  : quotationFor.stateCode,
                quotationFor.zipCode
              ].filter(Boolean).join(", ")}
            </p>
            {quotationFor.countryCode && (
              <p>{Country.getCountryByCode(quotationFor.countryCode)?.name || quotationFor.countryCode}</p>
            )}
            {quotationFor.pan && (
              <p style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '2px' }}>
                <strong style={{ display: 'inline-block', width: '65px', flexShrink: 0 }}>PAN:</strong>
                <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{quotationFor.pan}</span>
              </p>
            )}
            {quotationFor.gstin && (
              <p style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '2px' }}>
                <strong style={{ display: 'inline-block', width: '65px', flexShrink: 0 }}>GSTIN:</strong>
                <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{quotationFor.gstin}</span>
              </p>
            )}
            {quotationFor.phoneNumber && (
              <p style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '2px' }}>
                <strong style={{ display: 'inline-block', width: '65px', flexShrink: 0 }}>Phone:</strong>
                <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{quotationFor.phoneNumber}</span>
              </p>
            )}
            {/* Fallback to old address format if granular fields are not available */}
            {!quotationFor.street && quotationFor.address && (
              <p className="whitespace-pre-line">{quotationFor.address}</p>
            )}
          </div>

          <div className="flex justify-end">
            <div className="text-left" style={{ minWidth: '200px' }}>
              <p style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '3px' }}>
                <strong style={{ display: 'inline-block', width: '115px', flexShrink: 0 }}>Quotation No:</strong>
                <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{quotationDetails.quotationNo || "QT-XXXXXX"}</span>
              </p>
              <p style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '3px' }}>
                <strong style={{ display: 'inline-block', width: '115px', flexShrink: 0 }}>Date:</strong>
                <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{dateString}</span>
              </p>
              <p style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '3px' }}>
                <strong style={{ display: 'inline-block', width: '115px', flexShrink: 0 }}>Delivery:</strong>
                <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                  {quotationDetails.deliveryDays
                    ? `within ${quotationDetails.deliveryDays} days from PO`
                    : "-"}
                </span>
              </p>
              <p style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '3px' }}>
                <strong style={{ display: 'inline-block', width: '115px', flexShrink: 0 }}>Quote Validity:</strong>
                <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{quotationDetails.validityDays || "-"} days</span>
              </p>
              <p style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '3px' }}>
                <strong style={{ display: 'inline-block', width: '115px', flexShrink: 0 }}>Payment Terms:</strong>
                <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{quotationDetails.paymentDays || "-"} days</span>
              </p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full border border-black border-collapse text-[11px] mb-4">
          <thead>
            <tr className="bg-sky-800 text-white text-[11px]">
              <th className="border border-black px-2 py-[3px] w-10">Sl.</th>
              <th className="border border-black px-2 py-[3px]">Item</th>
              <th className="border border-black px-2 py-[3px] w-20">HSN/SAC</th>
              <th className="border border-black px-2 py-[3px] w-12">Qty</th>
              <th className="border border-black px-2 py-[3px] w-20">Rate</th>
              <th className="border border-black px-2 py-[3px] w-24">Amount</th>
            </tr>
          </thead>
          <tbody>
            {quotationItems.map((item, idx) => (
              <tr key={item.id || idx} className="text-[11px]">
                <td className="border border-black text-center py-[2px]">
                  {idx + 1}
                </td>
                <td className="border border-black px-2">{item.name}</td>
                <td className="border border-black text-center">
                  {item.hsn || "-"}
                </td>
                <td className="border border-black text-center">
                  {item.qty || "-"}
                </td>
                <td className="border border-black text-right px-2">
                  ₹ {Number(item.rate || 0).toFixed(2)}
                </td>
                <td className="border border-black text-right px-2">
                  ₹ {Number(item.amount || 0).toFixed(2)}
                </td>
              </tr>
            ))}

            {/* Totals */}
            <tr>
              <td colSpan="5" className="border border-black text-right px-2 font-semibold">
                Amount
              </td>
              <td className="border border-black text-right px-2">₹ {totalBaseAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan="5" className="border border-black text-right px-2">
                CGST ({cgst}%)
              </td>
              <td className="border border-black text-right px-2">
                ₹ {cgstAmount.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td colSpan="5" className="border border-black text-right px-2">
                SGST ({sgst}%)
              </td>
              <td className="border border-black text-right px-2">
                ₹ {sgstAmount.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td colSpan="5" className="border border-black text-right px-2">
                IGST ({igst}%)
              </td>
              <td className="border border-black text-right px-2">
                ₹ {igstAmount.toFixed(2)}
              </td>
            </tr>
            {/* Amount in words - shown left of the final numeric total */}
            <tr>
              <td colSpan="5" className="border border-black px-2">
                <strong>Amount (in words):</strong> {numberToWords(grandTotal)} only
              </td>
              <td className="border border-black text-right px-2"></td>
            </tr>

            <tr className="bg-gray-100 font-semibold">
              <td colSpan="5" className="border border-black text-right px-2">
                Total Amount (INR)
              </td>
              <td className="border border-black text-right px-2">₹ {grandTotal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* Bank Details */}
        <div className="text-[11px] mb-3">
          <p className="font-bold underline text-sky-900 mb-1">
            Company's Bank Details
          </p>
          <p style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '2px' }}>
            <strong style={{ display: 'inline-block', width: '120px', flexShrink: 0 }}>Bank Name:</strong>
            <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{bankDetails.bankName || "-"}</span>
          </p>
          <p style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '2px' }}>
            <strong style={{ display: 'inline-block', width: '120px', flexShrink: 0 }}>A/c No:</strong>
            <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{bankDetails.accountNumber || "-"}</span>
          </p>
          <p style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '2px' }}>
            <strong style={{ display: 'inline-block', width: '120px', flexShrink: 0 }}>Branch & IFSC:</strong>
            <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{bankDetails.branch || "-"}{" "}{bankDetails.ifscCode || "-"}</span>
          </p>
        </div>

        {/* Terms & Conditions */}
        <div className="text-[11px] mb-4">
          <p className="font-bold underline text-sky-900 mb-1">
            Terms & Conditions
          </p>
          <ol className="list-decimal ml-5 space-y-[1px]">
            <li>
              Our quotation is based on the SoW and technical details received
              from the client.
            </li>
            <li>
              The quotation is stated in Indian Rupees (INR) unless otherwise
              indicated.
            </li>
            <li>
              Pricing is inclusive of all GST taxes, fees and misc expenses.
            </li>
            <li>
              Customer is responsible for functional aspects of the product.
            </li>
            <li>
              Delivery period provided is from the date of receipt of the PO.
            </li>
            <li>
              Assumptions and other details are attached in the technical
              proposal.
            </li>
          </ol>
        </div>

        {/* Signature: place date under the authorized signatory on the right */}
        <div className="flex justify-between text-[11px] mb-4">
          <div />
          <div className="text-right">
            <p>Authorized Signatory</p>
            <p className="mt-2">Date: {dateString}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="grid grid-cols-4 gap-3 text-[10px] text-gray-700 border-t border-gray-400 pt-2">
          <div>
            #677, 1st Floor, Suite No. 755, 27th Main<br />
            13th Cross, HSR Layout, Sector 1<br />
            Bangalore, Karnataka 560102
          </div>
          <div>
            10A Anbul 2nd Street<br />
            Lakshmipuram, Peelamedu<br />
            Coimbatore, Tamil Nadu 641004
          </div>
          <div>
            1999 S. Bascom Ave<br />
            Ste 700, Campbell<br />
            California USA 95008
          </div>
          <div>
            VISTA GmbH<br />
            Wolframstr. 24<br />
            70191, Stuttgart, Germany
          </div>
        </div>

        <div className="mt-3 text-center text-[10px] text-sky-800 font-medium">
          info@vistaes.com | www.vistaes.com | Ph: +91 9585888855 | (+91)
          9566405555 | CIN: U72200TZ2011PTC017012
        </div>
      </div>

      {/* Download button (excluded from PDF) */}
      <div className="fixed bottom-4 right-4 z-50 no-print">
        <button
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          className="flex items-center space-x-2 bg-sky-700 hover:bg-sky-800 text-white px-4 py-2 rounded shadow-md disabled:opacity-60 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 3.5A1.5 1.5 0 014.5 2h11A1.5 1.5 0 0117 3.5V9a1 1 0 11-2 0V4H5v12h5a1 1 0 110 2H4.5A1.5 1.5 0 013 18.5v-15z"
              clipRule="evenodd"
            />
            <path d="M9 7a1 1 0 012 0v5.586l1.293-1.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 12.586V7z" />
          </svg>
          <span>{isDownloading ? "Preparing..." : "Download as PDF"}</span>
        </button>
        
        {/* Back to Home Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded shadow-md transition mt-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          <span>Back to Home</span>
        </button>
      </div>
    </>
  );
};

export default QuotationA4;

