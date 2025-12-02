import React, { useRef, useState, useEffect } from "react";
// REMOVED: html2canvas and jsPDF imports
// ADDED: Import the new generator function
// InvoicePreview.jsx
import { generatePdfFromData } from '../../services/pdfGenerator';
import { Country } from 'country-state-city';
import { LOGO_BASE64_DATA } from '../../services/logoBase64';
import './InvoicePreview.css';

// The function is now simplified as it doesn't need to be async or handle core PDF logic
const InvoicePreview = ({ data, downloadRef, isGeneratingPDF, onDownloadStateChange }) => {
  const invoiceRef = useRef(null);

  if (!data) return null;

  // --- Wrapper Function to call the external generator ---
  const handleDownloadPDF = React.useCallback(() => {
    // FIX: Call the imported function directly
    if (data) {
      console.log('Downloading PDF with data:', data);
      generatePdfFromData(data, isGeneratingPDF, onDownloadStateChange);
    } else {
      console.error('No data available for PDF generation');
      alert('No data available for PDF generation. Please go back and try again.');
    }
  }, [data, isGeneratingPDF, onDownloadStateChange]);
  
  // Expose download handler to parent via ref
  useEffect(() => {
    if (downloadRef) {
      // Expose the function that triggers the PDF generation
      downloadRef.current = { handleDownloadPDF, invoiceRef };
    }
  }, [downloadRef, handleDownloadPDF]);

  // --- Helper functions from your original code (retained for preview display logic) ---
  
  // Helper function to format date (strip time if present)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    if (typeof dateString === 'string') {
      const datePart = dateString.split('T')[0];
      if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return datePart;
      }
    }
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      // Ignore
    }
    return dateString;
  };

  // Helper function to build invoiceFrom address from individual fields
  const buildInvoiceFromAddress = () => {
    const parts = [];
    
    if (data.invoiceFromCompanyName && data.invoiceFromCompanyName.trim()) {
      parts.push(data.invoiceFromCompanyName.trim());
    }
    if (data.invoiceFromStreet && data.invoiceFromStreet.trim()) {
      parts.push(data.invoiceFromStreet.trim());
    }
    if (data.invoiceFromApartment && data.invoiceFromApartment.trim()) {
      parts.push(data.invoiceFromApartment.trim());
    }
    if (data.invoiceFromCity && data.invoiceFromCity.trim()) {
      let cityLine = data.invoiceFromCity.trim();
      if (data.invoiceFromZipCode && data.invoiceFromZipCode.trim()) {
        cityLine += ' ' + data.invoiceFromZipCode.trim();
      }
      parts.push(cityLine);
    }
    
    if (data.invoiceFromCountryCode === 'IN') {
      parts.push('India');
    } 
    
    if (data.invoiceFromGSTIN && data.invoiceFromGSTIN.trim()) {
      parts.push(`GSTIN/UIN: ${data.invoiceFromGSTIN.trim()}`);
    }
    
    if (data.invoiceFromGSTIN && data.invoiceFromGSTIN.length >= 2) {
      const stateCodeNumber = data.invoiceFromGSTIN.substring(0, 2);
      parts.push(`State Name : Code : ${stateCodeNumber}`);
    }
    
    if (data.invoiceFromPAN && data.invoiceFromPAN.trim()) {
      parts.push(`PAN: ${data.invoiceFromPAN.trim()}`);
    }
    
    return parts.length > 0 ? parts.join('\n') : null;
  };

  // Helper function to format invoiceFrom address with company name bold
  const formatInvoiceFromAddress = (addressText) => {
    if (!addressText) return null;
    const lines = addressText.split('\n');
    if (lines.length === 0) return null;
    
    const companyName = lines[0];
    const restOfAddress = lines.slice(1).join('\n');
    
    return (
      <>
        <strong>{companyName}</strong>
        {restOfAddress && <><br />{restOfAddress}</>}
      </>
    );
  };
  
  // Helper function to build consignee address string
  const buildConsigneeAddressString = () => {
    const result = [];
    
    if (data.shipToClientName && data.shipToClientName.trim()) {
      result.push(data.shipToClientName.trim());
    }
    if (data.shipToCompanyName && data.shipToCompanyName.trim()) {
      result.push(data.shipToCompanyName.trim());
    }
    
    const addressParts = [];
    if (data.shipToStreet && data.shipToStreet.trim()) {
      addressParts.push(data.shipToStreet.trim());
    }
    if (data.shipToApartment && data.shipToApartment.trim()) {
      addressParts.push(data.shipToApartment.trim());
    }
    if (data.shipToCity && data.shipToCity.trim()) {
      let cityLine = data.shipToCity.trim();
      if (data.shipToZipCode && data.shipToZipCode.trim()) {
        cityLine += ' ' + data.shipToZipCode.trim();
      }
      addressParts.push(cityLine);
    }
    if (data.shipToCountryCode) {
      const countries = Country.getAllCountries();
      const country = countries.find(c => c.isoCode === data.shipToCountryCode);
      if (country) {
        addressParts.push(country.name);
      }
    }
    
    if (addressParts.length > 0) {
      result.push(addressParts.join(', '));
    }
    
    const hasGST = data.shipToGSTIN && data.shipToGSTIN.trim();
    const hasPAN = data.shipToPAN && data.shipToPAN.trim();
    
    if (hasGST || hasPAN) {
      result.push(''); 
    }
    
    if (hasGST) {
      result.push(`GSTIN/UIN: ${data.shipToGSTIN.trim()}`);
    }
    
    if (hasPAN) {
      result.push(`PAN: ${data.shipToPAN.trim()}`);
    }
    
    return result.length > 0 ? result.join('\n') : null;
  };

  // Helper function to format consignee address with client name and company name bold
  const formatConsigneeAddress = (addressText) => {
    if (!addressText) return null;
    const lines = addressText.split('\n');
    if (lines.length === 0) return null;
    
    const clientName = data.shipToClientName && data.shipToClientName.trim();
    const companyName = data.shipToCompanyName && data.shipToCompanyName.trim();
    
    return (
      <>
        {lines.map((line, index) => {
          const trimmedLine = line.trim();
          
          const isClientNameLine = index === 0 && clientName && trimmedLine === clientName;
          const companyNameIndex = clientName ? 1 : 0;
          const isCompanyNameLine = index === companyNameIndex && companyName && trimmedLine === companyName;
          
          if (isClientNameLine || isCompanyNameLine) {
            return (
              <React.Fragment key={index}>
                <strong>{line}</strong>
                {index < lines.length - 1 && <br />}
              </React.Fragment>
            );
          }
          
          return (
            <React.Fragment key={index}>
              {line}
              {index < lines.length - 1 && <br />}
            </React.Fragment>
          );
        })}
      </>
    );
  };

  // Helper function to build buyer address string
  const buildBuyerAddressString = () => {
    const result = [];
    
    if (data.billToClientName && data.billToClientName.trim()) {
      result.push(data.billToClientName.trim());
    }
    if (data.billToCompanyName && data.billToCompanyName.trim()) {
      result.push(data.billToCompanyName.trim());
    }
    
    const addressParts = [];
    if (data.billToStreet && data.billToStreet.trim()) {
      addressParts.push(data.billToStreet.trim());
    }
    if (data.billToApartment && data.billToApartment.trim()) {
      addressParts.push(data.billToApartment.trim());
    }
    if (data.billToCity && data.billToCity.trim()) {
      let cityLine = data.billToCity.trim();
      if (data.billToZipCode && data.billToZipCode.trim()) {
        cityLine += ' ' + data.billToZipCode.trim();
      }
      addressParts.push(cityLine);
    }
    if (data.billToCountryCode) {
      const countries = Country.getAllCountries();
      const country = countries.find(c => c.isoCode === data.billToCountryCode);
      if (country) {
        addressParts.push(country.name);
      }
    }
    
    if (addressParts.length > 0) {
      result.push(addressParts.join(', '));
    }
    
    const hasGST = data.billToGSTIN && data.billToGSTIN.trim();
    const hasPAN = data.billToPAN && data.billToPAN.trim();
    
    if (hasGST || hasPAN) {
      result.push(''); 
    }
    
    if (hasGST) {
      result.push(`GSTIN/UIN: ${data.billToGSTIN.trim()}`);
    }
    
    if (hasPAN) {
      result.push(`PAN: ${data.billToPAN.trim()}`);
    }
    
    return result.length > 0 ? result.join('\n') : null;
  };

  // Helper function to format buyer address with client name and company name bold
  const formatBuyerAddress = (addressText) => {
    if (!addressText) return null;
    const lines = addressText.split('\n');
    if (lines.length === 0) return null;
    
    const clientName = data.billToClientName && data.billToClientName.trim();
    const companyName = data.billToCompanyName && data.billToCompanyName.trim();
    
    return (
      <>
        {lines.map((line, index) => {
          const trimmedLine = line.trim();
          
          const isClientNameLine = index === 0 && clientName && trimmedLine === clientName;
          const companyNameIndex = clientName ? 1 : 0;
          const isCompanyNameLine = index === companyNameIndex && companyName && trimmedLine === companyName;
          
          if (isClientNameLine || isCompanyNameLine) {
            return (
              <React.Fragment key={index}>
                <strong>{line}</strong>
                {index < lines.length - 1 && <br />}
              </React.Fragment>
            );
          }
          
          return (
            <React.Fragment key={index}>
              {line}
              {index < lines.length - 1 && <br />}
            </React.Fragment>
          );
        })}
      </>
    );
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const getUniqueHSN = () => {
    if (!data.items || data.items.length === 0) return [];
    const hsnMap = new Map();
    data.items.forEach(item => {
      if (item.hsn) {
        const existing = hsnMap.get(item.hsn) || { hsn: item.hsn, taxableValue: 0 };
        existing.taxableValue += item.amount || 0;
        hsnMap.set(item.hsn, existing);
      }
    });
    return Array.from(hsnMap.values());
  };

  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertLessThanThousand = (n) => {
      if (n === 0) return '';
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      if (n < 1000) {
        const hundred = Math.floor(n / 100);
        const remainder = n % 100;
        return ones[hundred] + ' Hundred' + (remainder !== 0 ? ' ' + convertLessThanThousand(remainder) : '');
      }
      return '';
    };

    const convert = (n) => {
      if (n === 0) return 'Zero';
      if (n < 1000) return convertLessThanThousand(n);
      
      const crore = Math.floor(n / 10000000);
      const lakh = Math.floor((n % 10000000) / 100000);
      const thousand = Math.floor((n % 100000) / 1000);
      const remainder = n % 1000;

      let result = '';
      if (crore > 0) result += convertLessThanThousand(crore) + ' Crore ';
      if (lakh > 0) result += convertLessThanThousand(lakh) + ' Lakh ';
      if (thousand > 0) result += convertLessThanThousand(thousand) + ' Thousand ';
      if (remainder > 0) result += convertLessThanThousand(remainder);
      
      return result.trim();
    };

    const parts = num.toFixed(2).split('.');
    const rupees = parseInt(parts[0]);
    const paise = parseInt(parts[1]);

    let words = 'Indian Rupees ' + convert(rupees);
    if (paise > 0) {
      words += ' and ' + convertLessThanThousand(paise) + ' Paise';
    } else {
      words += ' and Zero Paise';
    }
    return words + ' Only';
  };

  const totalQuantity = data.calculations?.totalQuantity || data.items?.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0) || 0;
  
  // The rest of the JSX renders the full preview
  return (
    <>
      
      <div className="invoice-preview" ref={invoiceRef}>
      {/* Header with Logo and Company Name */}
      <div className="invoice-header">
        <div className="invoice-logo">
          {(() => {
            // Try to get logo from data first, then fallback to base64 logo, then public logo
            const logoSource = data.logo || LOGO_BASE64_DATA || '/logo.jpg';
            return (
              <img 
                src={logoSource} 
                alt="Company Logo" 
                className="logo-image"
                onError={(e) => {
                  // If image fails to load, try fallback
                  if (logoSource !== '/logo.jpg') {
                    e.target.src = '/logo.jpg';
                  } else if (logoSource !== LOGO_BASE64_DATA && LOGO_BASE64_DATA) {
                    e.target.src = LOGO_BASE64_DATA;
                  }
                }}
              />
            );
          })()}
        </div>
        <div className="invoice-company-name">
          <strong>VISTA ENGG SOLUTIONS PRIVATE LIMITED</strong>
        </div>
      </div>
      <div className="invoice-title-row">
        <h1 className="invoice-main-title">PROFORMA INVOICE</h1>
      </div>
      <table className="invoice-top-table">
        <tbody>
          <tr>
            {/* LEFT HALF: All addresses stacked */}
            <td className="invoice-left">
              <table className="address-table">
                <tbody>
                  <tr>
                    <td className="from-address-cell">
                      <div className="company-info-block">
                        {(() => {
                          let displayAddress = null;
                          if (data.invoiceFrom && typeof data.invoiceFrom === 'string' && data.invoiceFrom.trim().length > 0) {
                            displayAddress = data.invoiceFrom;
                          } else {
                            displayAddress = buildInvoiceFromAddress();
                          }
                          
                          if (displayAddress && displayAddress.trim().length > 0) {
                            const formatted = formatInvoiceFromAddress(displayAddress);
                            return formatted ? <div style={{ whiteSpace: 'pre-line' }}>{formatted}</div> : <div style={{ whiteSpace: 'pre-line' }}>{displayAddress}</div>;
                          }
                          
                          return <div style={{ whiteSpace: 'pre-line', color: '#999', fontStyle: 'italic' }}>Invoice From address not provided</div>;
                        })()}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="consignee-address-cell">
                      <div className="address-block">
                        <span className="italic-label-normal">Consignee (Ship to)</span>
                        <div className="address-value" style={{ whiteSpace: 'pre-line' }}>
                          {(() => {
                            let displayAddress = null;
                            
                            const builtAddress = buildConsigneeAddressString();
                            if (builtAddress) {
                              displayAddress = builtAddress;
                            } else if (data.consignee && typeof data.consignee === 'string' && data.consignee.trim().length > 0) {
                              displayAddress = data.consignee;
                            }
                            
                            if (displayAddress && displayAddress.trim().length > 0) {
                              const formatted = formatConsigneeAddress(displayAddress);
                              return formatted || displayAddress;
                            }
                            
                            return '';
                          })()}
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="buyer-address-cell">
                      <div className="address-block">
                        <span className="italic-label-normal">Buyer (Bill to)</span>
                        <div className="address-value" style={{ whiteSpace: 'pre-line' }}>
                          {(() => {
                            let displayAddress = null;
                            
                            const builtAddress = buildBuyerAddressString();
                            if (builtAddress) {
                              displayAddress = builtAddress;
                            } else if (data.buyer && typeof data.buyer === 'string' && data.buyer.trim().length > 0) {
                              displayAddress = data.buyer;
                            }
                            
                            if (displayAddress && displayAddress.trim().length > 0) {
                              const formatted = formatBuyerAddress(displayAddress);
                              return formatted || displayAddress;
                            }
                            
                            return '';
                          })()}
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
            {/* RIGHT HALF: Meta info and dispatch stacked */}
            <td className="invoice-right">
              <table className="meta-info-table">
                <tbody>
                  <tr>
                    <td>
                      <span className="field-label">Invoice No.</span>
                      <span className="field-value">{data.invoiceNumber}</span>
                    </td>
                    <td>
                      <span className="field-label">Invoice Date</span>
                      <span className="field-value">{formatDate(data.invoiceDate)}</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span className="field-label">Delivery Note</span>
                      <span className="field-value">{data.deliveryNote}</span>
                    </td>
                    <td>
                      <span className="field-label">Mode/Terms of Payment</span>
                      <span className="field-value">{data.paymentTerms}</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span className="field-label">Reference No</span>
                      <span className="field-value">{data.referenceNo}</span>
                    </td>
                    <td>
                      <span className="field-label">Other References</span>
                      <span className="field-value">{data.otherReferences}</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span className="field-label">Buyer's Order No.</span>
                      <span className="field-value">{data.buyersOrderNo}</span>
                    </td>
                    <td>
                      <span className="field-label">Purchase Date</span>
                      <span className="field-value">{formatDate(data.buyersOrderDate)}</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span className="field-label">Dispatch Doc No.</span>
                      <span className="field-value">{data.dispatchDocNo}</span>
                    </td>
                    <td>
                      <span className="field-label">Delivery Note Date</span>
                      <span className="field-value">{formatDate(data.deliveryNoteDate)}</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span className="field-label">Dispatched through</span>
                      <span className="field-value">{data.dispatchedThrough}</span>
                    </td>
                    <td>
                      <span className="field-label">Destination</span>
                      <span className="field-value">{data.destination}</span>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2}>
                      <span className="field-label">Terms of Delivery</span>
                      <span className="field-value">{data.termsOfDelivery}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Items Table */}
      <table className="items-table">
        <thead>
          <tr>
            <th>Description of Goods</th>
            <th>HSN/SAC</th>
            <th>Quantity</th>
            <th>Rate</th>
            <th>per</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.items && data.items.map((item, index) => (
            <tr key={index}>
              <td>{item.description}</td>
              <td>{item.hsn}</td>
              <td>{item.quantity ? `${item.quantity} nos` : ''}</td>
              <td className="text-right">{formatCurrency(item.rate)}</td>
              <td>nos</td>
              <td className="text-right">{formatCurrency(item.amount)}</td>
            </tr>
          ))}
          <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td className="text-right bold-cell">{formatCurrency(data.calculations?.subtotal || 0)}</td>
          </tr>
          {data.taxEnabled !== false && (() => {
            const gstType = data.calculations?.gstType;
            const isIntraState = gstType === 'intra-state';
            
            if (!gstType && data.calculations?.tax1 && data.calculations?.tax2) {
              return (
                <tr>
                  <td>IGST - 18%</td>
                  <td></td>
                  <td></td>
                  <td>18%</td>
                  <td></td>
                  <td className="text-right">{formatCurrency(data.calculations?.totalTax || 0)}</td>
                </tr>
              );
            }
            
            if (isIntraState) {
              return (
                <>
                  <tr>
                    <td>CGST - {data.calculations?.cgst?.rate || 9}%</td>
                    <td></td>
                    <td></td>
                    <td>{data.calculations?.cgst?.rate || 9}%</td>
                    <td></td>
                    <td className="text-right">{formatCurrency(data.calculations?.cgst?.amount || 0)}</td>
                  </tr>
                  <tr>
                    <td>SGST - {data.calculations?.sgst?.rate || 9}%</td>
                    <td></td>
                    <td></td>
                    <td>{data.calculations?.sgst?.rate || 9}%</td>
                    <td></td>
                    <td className="text-right">{formatCurrency(data.calculations?.sgst?.amount || 0)}</td>
                  </tr>
                </>
              );
            } else {
              return (
                <tr>
                  <td>IGST - {data.calculations?.igst?.rate || 18}%</td>
                  <td></td>
                  <td></td>
                  <td>{data.calculations?.igst?.rate || 18}%</td>
                  <td></td>
                  <td className="text-right">{formatCurrency(data.calculations?.igst?.amount || data.calculations?.totalTax || 0)}</td>
                </tr>
              );
            }
          })()}
          <tr className="total-row">
            <td className="bold-cell">Total</td>
            <td></td>
            <td className="bold-cell">{totalQuantity} nos</td>
            <td></td>
            <td></td>
            <td className="text-right bold-cell">{formatCurrency(data.calculations?.total || 0)}</td>
          </tr>
          <tr className="amount-words-row">
            <td colSpan={6} style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'left', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <span className="amount-label">Amount Chargeable (in words)</span>
                <span style={{ fontSize: '10px', fontWeight: 'normal' }}>E. & O.E</span>
              </div>
              <span className="amount-value bold-cell">{data.calculations?.amountInWords || numberToWords(data.calculations?.total || 0)}</span>
            </td>
          </tr>
        </tbody>
      </table>
      
      {/* Tax Summary Table - Only show if tax is enabled */}
      {data.taxEnabled !== false && (
      <table className="tax-summary-table">
        <thead>
          <tr>
            <th className="col-hsn" rowSpan={2}>HSN/SAC</th>
            <th className="col-taxable-value" rowSpan={2}>Taxable Value</th>
            {(() => {
              const isIntraState = data.calculations?.gstType === 'intra-state';
              if (isIntraState) {
                return (
                  <>
                    <th className="col-cgst" colSpan={2}>CGST</th>
                    <th className="col-sgst" colSpan={2}>SGST</th>
                    <th className="col-total-tax" rowSpan={2}>Total Tax Amount</th>
                  </>
                );
              } else {
                return (
                  <>
                    <th className="col-igst" colSpan={2}>IGST</th>
                    <th className="col-total-tax" rowSpan={2}>Total Tax Amount</th>
                  </>
                );
              }
            })()}
          </tr>
          <tr>
            {(() => {
              const isIntraState = data.calculations?.gstType === 'intra-state';
              if (isIntraState) {
                return (
                  <>
                    <th className="col-cgst-rate">Rate</th>
                    <th className="col-cgst-amount">Amount</th>
                    <th className="col-sgst-rate">Rate</th>
                    <th className="col-sgst-amount">Amount</th>
                  </>
                );
              } else {
                return (
                  <>
                    <th className="col-igst-rate">Rate</th>
                    <th className="col-igst-amount">Amount</th>
                  </>
                );
              }
            })()}
          </tr>
        </thead>
        <tbody>
          {getUniqueHSN().map((hsnData, index) => {
            const isIntraState = data.calculations?.gstType === 'intra-state';
            if (isIntraState) {
              const cgstRate = data.calculations?.cgst?.rate || 9;
              const sgstRate = data.calculations?.sgst?.rate || 9;
              const cgstAmount = (hsnData.taxableValue * cgstRate) / 100;
              const sgstAmount = (hsnData.taxableValue * sgstRate) / 100;
              return (
                <tr key={index}>
                  <td className="col-hsn">{hsnData.hsn}</td>
                  <td className="col-taxable-value text-right">{formatCurrency(hsnData.taxableValue)}</td>
                  <td className="col-cgst-rate" style={{ textAlign: 'center' }}>{cgstRate}%</td>
                  <td className="col-cgst-amount text-right">{formatCurrency(cgstAmount)}</td>
                  <td className="col-sgst-rate" style={{ textAlign: 'center' }}>{sgstRate}%</td>
                  <td className="col-sgst-amount text-right">{formatCurrency(sgstAmount)}</td>
                  <td className="col-total-tax text-right">{formatCurrency(cgstAmount + sgstAmount)}</td>
                </tr>
              );
            } else {
              const igstRate = data.calculations?.igst?.rate || 18;
              const igstAmount = (hsnData.taxableValue * igstRate) / 100;
              return (
                <tr key={index}>
                  <td className="col-hsn">{hsnData.hsn}</td>
                  <td className="col-taxable-value text-right">{formatCurrency(hsnData.taxableValue)}</td>
                  <td className="col-igst-rate" style={{ textAlign: 'center' }}>{igstRate}%</td>
                  <td className="col-igst-amount text-right">{formatCurrency(igstAmount)}</td>
                  <td className="col-total-tax text-right">{formatCurrency(igstAmount)}</td>
                </tr>
              );
            }
          })}
          {getUniqueHSN().length === 0 && (
            <tr>
              <td className="col-hsn">-</td>
              <td className="col-taxable-value text-right">-</td>
              {(() => {
                const isIntraState = data.calculations?.gstType === 'intra-state';
                if (isIntraState) {
                  return (
                    <>
                      <td className="col-cgst-rate text-right">-</td>
                      <td className="col-cgst-amount text-right">-</td>
                      <td className="col-sgst-rate text-right">-</td>
                      <td className="col-sgst-amount text-right">-</td>
                      <td className="col-total-tax text-right">-</td>
                    </>
                  );
                } else {
                  return (
                    <>
                      <td className="col-igst-rate text-right">-</td>
                      <td className="col-igst-amount text-right">-</td>
                      <td className="col-total-tax text-right">-</td>
                    </>
                  );
                }
              })()}
            </tr>
          )}
          <tr className="tax-total-row">
            <td className="col-hsn bold-cell">Total</td>
            <td className="col-taxable-value text-right bold-cell">{formatCurrency(data.calculations?.subtotal || 0)}</td>
            {data.taxEnabled !== false && (() => {
              const isIntraState = data.calculations?.gstType === 'intra-state';
              if (isIntraState) {
                return (
                  <>
                    <td className="col-cgst-rate"></td>
                    <td className="col-cgst-amount text-right bold-cell">{formatCurrency(data.calculations?.cgst?.amount || 0)}</td>
                    <td className="col-sgst-rate"></td>
                    <td className="col-sgst-amount text-right bold-cell">{formatCurrency(data.calculations?.sgst?.amount || 0)}</td>
                    <td className="col-total-tax text-right bold-cell">{formatCurrency(data.calculations?.totalTax || 0)}</td>
                  </>
                );
              } else if (data.calculations?.gstType === 'inter-state') {
                return (
                  <>
                    <td className="col-igst-rate"></td>
                    <td className="col-igst-amount text-right bold-cell">{formatCurrency(data.calculations?.igst?.amount || data.calculations?.totalTax || 0)}</td>
                    <td className="col-total-tax text-right bold-cell">{formatCurrency(data.calculations?.totalTax || 0)}</td>
                  </>
                );
              }
              return null;
            })()}
          </tr>
          {data.taxEnabled !== false && (
            <tr className="tax-words-row">
              {(() => {
                const isIntraState = data.calculations?.gstType === 'intra-state';
                const colSpan = isIntraState ? 7 : 5;
                return (
                  <td colSpan={colSpan} style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'left', fontSize: '11px', lineHeight: '1.4' }}>
                    <span className="tax-label">Tax Amount (in words):</span>
                    <span className="tax-value bold-cell"> {numberToWords(data.calculations?.totalTax || 0)}</span>
                  </td>
                );
              })()}
            </tr>
          )}
        </tbody>
      </table>
      )}
      {/* Bank Details from form data */}
      {(() => {
        // Use bank details from form data if available, otherwise fallback to auto-generated
        const getBankDetails = () => {
          // Check if bankDetails are provided in the data
          if (data.bankDetails && data.bankDetails.bankName) {
            return {
              bankName: data.bankDetails.bankName || '',
              accountNumber: data.bankDetails.accountNo || '',
              branchAndIFSC: `${data.bankDetails.pan || ''} & ${data.bankDetails.branchIfsc || ''}`.trim()
            };
          }
          
          // Fallback to auto-generated based on country (for backward compatibility)
          const countryCode = data.invoiceFromCountryCode || '';
          
          if (countryCode === 'IN') {
            // India - ICICI Bank
            return {
              bankName: 'ICICI Bank Limited',
              accountNumber: '058705002413',
              branchAndIFSC: 'Avinashi Road & ICIC0000587'
            };
          } else {
            // Default for other countries (USA, Germany, etc.) - HDFC Bank
            return {
              bankName: 'HDFC Bank Ltd',
              accountNumber: '00752560001860',
              branchAndIFSC: 'Old Airport Road & HDFC0000075'
            };
          }
        };

        const bankDetails = getBankDetails();
        
        return (
          <table className="bottom-section-table">
            <tbody>
              <tr>
                <td className="pan-cell">
                  <div className="pan-label bold-cell">Company&apos;s PAN:</div>
                  <div className="pan-value">{data.invoiceFromPAN || 'AADCT7719D'}</div>
                </td>
                <td className="bank-details-cell">
                  <div className="bank-label bold-cell">Company&apos;s Bank Details</div>
                  <div>Bank Name: {bankDetails.bankName}</div>
                  <div>A/c No.: {bankDetails.accountNumber}</div>
                  <div>Branch & IFS Code: {bankDetails.branchAndIFSC}</div>
                </td>
              </tr>
              <tr>
                <td className="declaration-cell">
                  <div className="declaration-label bold-cell">Declaration</div>
                  <div className="declaration-text">We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</div>
                </td>
                <td className="vista-company-cell">
                  <div className="vista-company-cell-inner">
                    <div className="vista-company-name">for Vista Engineering Solutions</div>
                    <div className="signatory-text">Authorised Signatory</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        );
      })()}

      {/* Footer */}
      <div className="invoice-footer">This is a Computer Generated Invoice</div>
    </div>       
    </>
  );
};

export default InvoicePreview;