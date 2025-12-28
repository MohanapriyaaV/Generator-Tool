import React, { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { generateInvoicePDF } from '../../services/InvoicePdfGenerator';
import { uploadPdfToS3, createInvoice } from '../../services/api.js';
import logo from '../../assets/logo.jpg';
import './InvoicePreview.css';

const InvoicePreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const previewRef = useRef(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const { formData, items, tax } = location.state || {};

  if (!formData || !items) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">No invoice data found</h2>
          <button onClick={() => navigate('/invoice')} className="bg-violet-600 text-white px-4 py-2 rounded hover:bg-violet-700">Back to Invoice Form</button>
        </div>
      </div>
    );
  }

  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || parseFloat(item.price) || 0;
    return sum + (qty * rate);
  }, 0);
  const cgstRate = parseFloat(tax?.cgst) || 0;
  const sgstRate = parseFloat(tax?.sgst) || 0;
  const igstRate = parseFloat(tax?.igst) || 0;
  const taxTotal = (subtotal * (cgstRate + sgstRate + igstRate)) / 100;
  const grandTotal = subtotal + taxTotal;

  // Determine if intra-state or inter-state
  const isIntraState = cgstRate > 0 && sgstRate > 0;

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // Helper function to get unique HSN codes and combine amounts
  const getUniqueHSN = () => {
    if (!items || items.length === 0) return [];
    const hsnMap = new Map();
    items.forEach(item => {
      const hsn = item.hsn || '';
      if (hsn) {
        const qty = parseFloat(item.quantity) || 0;
        const rate = parseFloat(item.price || item.rate) || 0;
        const amount = qty * rate;
        const existing = hsnMap.get(hsn) || { hsn: hsn, taxableValue: 0 };
        existing.taxableValue += amount;
        hsnMap.set(hsn, existing);
      }
    });
    return Array.from(hsnMap.values());
  };

  // Helper function to convert number to words
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

  // Helper function to format date
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

  // Helper function to build invoiceFrom address
  const buildInvoiceFromAddress = () => {
    const parts = [];
    
    if (formData.invoiceFromCompanyName && formData.invoiceFromCompanyName.trim()) {
      parts.push(formData.invoiceFromCompanyName.trim());
    }
    if (formData.invoiceFromStreet && formData.invoiceFromStreet.trim()) {
      parts.push(formData.invoiceFromStreet.trim());
    }
    if (formData.invoiceFromApartment && formData.invoiceFromApartment.trim()) {
      parts.push(formData.invoiceFromApartment.trim());
    }
    if (formData.invoiceFromCity && formData.invoiceFromCity.trim()) {
      let cityLine = formData.invoiceFromCity.trim();
      if (formData.invoiceFromZipCode && formData.invoiceFromZipCode.trim()) {
        cityLine += ' ' + formData.invoiceFromZipCode.trim();
      }
      parts.push(cityLine);
    }
    
    if (formData.invoiceFromCountryCode === 'IN') {
      parts.push('India');
    } 
    
    if (formData.invoiceFromGSTIN && formData.invoiceFromGSTIN.trim()) {
      parts.push(`GSTIN/UIN: ${formData.invoiceFromGSTIN.trim()}`);
    }
    
    if (formData.invoiceFromGSTIN && formData.invoiceFromGSTIN.length >= 2) {
      const stateCodeNumber = formData.invoiceFromGSTIN.substring(0, 2);
      parts.push(`State Name : Code : ${stateCodeNumber}`);
    }
    
    if (formData.invoiceFromPAN && formData.invoiceFromPAN.trim()) {
      parts.push(`PAN: ${formData.invoiceFromPAN.trim()}`);
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

  // Helper function to build consignee address (if available)
  const buildConsigneeAddressString = () => {
    if (!formData.shipToClientName && !formData.shipToCompanyName) return null;
    
    const result = [];
    
    if (formData.shipToClientName && formData.shipToClientName.trim()) {
      result.push(formData.shipToClientName.trim());
    }
    if (formData.shipToCompanyName && formData.shipToCompanyName.trim()) {
      result.push(formData.shipToCompanyName.trim());
    }
    
    const addressParts = [];
    if (formData.shipToStreet && formData.shipToStreet.trim()) {
      addressParts.push(formData.shipToStreet.trim());
    }
    if (formData.shipToApartment && formData.shipToApartment.trim()) {
      addressParts.push(formData.shipToApartment.trim());
    }
    if (formData.shipToCity && formData.shipToCity.trim()) {
      let cityLine = formData.shipToCity.trim();
      if (formData.shipToZipCode && formData.shipToZipCode.trim()) {
        cityLine += ' ' + formData.shipToZipCode.trim();
      }
      addressParts.push(cityLine);
    }
    if (formData.shipToCountryCode === 'IN') {
      addressParts.push('India');
    }
    
    if (addressParts.length > 0) {
      result.push(addressParts.join(', '));
    }
    
    const hasGST = formData.shipToGSTIN && formData.shipToGSTIN.trim();
    const hasPAN = formData.shipToPAN && formData.shipToPAN.trim();
    
    if (hasGST || hasPAN) {
      result.push(''); 
    }
    
    if (hasGST) {
      result.push(`GSTIN/UIN: ${formData.shipToGSTIN.trim()}`);
    }
    
    if (hasPAN) {
      result.push(`PAN: ${formData.shipToPAN.trim()}`);
    }
    
    return result.length > 0 ? result.join('\n') : null;
  };

  // Helper function to format consignee address
  const formatConsigneeAddress = (addressText) => {
    if (!addressText) return null;
    const lines = addressText.split('\n');
    if (lines.length === 0) return null;
    
    const clientName = formData.shipToClientName && formData.shipToClientName.trim();
    const companyName = formData.shipToCompanyName && formData.shipToCompanyName.trim();
    
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

  // Helper function to build buyer address
  const buildBuyerAddressString = () => {
    const result = [];
    
    if (formData.billToClientName && formData.billToClientName.trim()) {
      result.push(formData.billToClientName.trim());
    }
    if (formData.billToCompanyName && formData.billToCompanyName.trim()) {
      result.push(formData.billToCompanyName.trim());
    }
    
    const addressParts = [];
    if (formData.billToStreet && formData.billToStreet.trim()) {
      addressParts.push(formData.billToStreet.trim());
    }
    if (formData.billToApartment && formData.billToApartment.trim()) {
      addressParts.push(formData.billToApartment.trim());
    }
    if (formData.billToCity && formData.billToCity.trim()) {
      let cityLine = formData.billToCity.trim();
      if (formData.billToZipCode && formData.billToZipCode.trim()) {
        cityLine += ' ' + formData.billToZipCode.trim();
      }
      addressParts.push(cityLine);
    }
    if (formData.billToCountryCode === 'IN') {
      addressParts.push('India');
    }
    
    if (addressParts.length > 0) {
      result.push(addressParts.join(', '));
    }
    
    const hasGST = formData.billToGSTIN && formData.billToGSTIN.trim();
    const hasPAN = formData.billToPAN && formData.billToPAN.trim();
    
    if (hasGST || hasPAN) {
      result.push(''); 
    }
    
    if (hasGST) {
      result.push(`GSTIN/UIN: ${formData.billToGSTIN.trim()}`);
    }
    
    if (hasPAN) {
      result.push(`PAN: ${formData.billToPAN.trim()}`);
    }
    
    return result.length > 0 ? result.join('\n') : null;
  };

  // Helper function to format buyer address
  const formatBuyerAddress = (addressText) => {
    if (!addressText) return null;
    const lines = addressText.split('\n');
    if (lines.length === 0) return null;
    
    const clientName = formData.billToClientName && formData.billToClientName.trim();
    const companyName = formData.billToCompanyName && formData.billToCompanyName.trim();
    
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

  const handleDownloadPDF = async () => {
    if (!formData || !items) return;
    try {
      setIsGeneratingPDF(true);
      const fileName = `invoice_${formData.invoiceNumber || 'document'}.pdf`;
      const blob = await generateInvoicePDF(null, fileName, formData, items, tax);
      if (blob) {
        // Download the PDF
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        try {
          const s3FileName = `Invoice_${formData.invoiceNumber || 'document'}_${new Date().toISOString().split('T')[0]}.pdf`;
          const uploadResult = await uploadPdfToS3(blob, s3FileName, 'Invoice');
          const payload = {
            invoiceNumber: formData.invoiceNumber || 'INV-DEFAULT',
            invoiceDate: formData.invoiceDate || new Date().toISOString().split('T')[0],
            totalAmount: Number(grandTotal) || 0,
            referenceNo: formData.referenceNo || formData.referenceNumber || '',
            projectName: formData.projectName || '',
            fromAddress: {
              companyName: formData.invoiceFromCompanyName || '',
              street: formData.invoiceFromStreet || '',
              apartment: formData.invoiceFromApartment || '',
              city: formData.invoiceFromCity || '',
              zipCode: formData.invoiceFromZipCode || '',
              country: formData.invoiceFromCountryCode || '',
              state: formData.invoiceFromStateCode || '',
              pan: formData.invoiceFromPAN || '',
              gstin: formData.invoiceFromGSTIN || '',
            },
            billToAddress: {
              clientName: formData.billToClientName || '',
              companyName: formData.billToCompanyName || '',
              street: formData.billToStreet || '',
              apartment: formData.billToApartment || '',
              city: formData.billToCity || '',
              zipCode: formData.billToZipCode || '',
              country: formData.billToCountryCode || '',
              state: formData.billToStateCode || '',
              pan: formData.billToPAN || '',
              gstin: formData.billToGSTIN || '',
              phoneNumber: formData.billToPhoneNumber || '',
            },
            s3Url: uploadResult.url || '',
            fullInvoiceData: { formData, items, tax }
          };
          if (payload.invoiceNumber && payload.invoiceDate && payload.totalAmount !== null && payload.totalAmount !== undefined) {
            try {
              const created = await createInvoice(payload);
              console.log('✅ Invoice saved:', created.invoice?._id || created.invoice);
            } catch (dbError) {
              console.warn('⚠️ Could not save invoice to DB:', dbError.message || dbError);
            }
          }
        } catch (uploadError) {
          console.error('❌ Error uploading Invoice PDF to S3:', uploadError);
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleEditPreview = () => {
    navigate('/invoice', { state: { initialData: formData, items } });
  };

  const handleBackHome = () => {
    navigate('/');
  };

  const handleCreateNew = () => {
    navigate('/invoice');
  };

  return (
    <div className="invoice-preview">
      <div className="invoice-container">
        <div className="invoice-content">
          <div className="invoice-document" ref={previewRef}>
            {/* Header with Logo and Company Name */}
            <div className="invoice-header">
              <div className="invoice-logo">
                <img src={logo} alt="Company Logo" className="logo-image" />
              </div>
              <div className="invoice-company-name">
                <strong>VISTA ENGG SOLUTIONS PRIVATE LIMITED</strong>
              </div>
            </div>
            <div className="invoice-title-row">
              <h1 className="invoice-main-title">INVOICE</h1>
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
                                const displayAddress = buildInvoiceFromAddress();
                                if (displayAddress && displayAddress.trim().length > 0) {
                                  const formatted = formatInvoiceFromAddress(displayAddress);
                                  return formatted ? <div style={{ whiteSpace: 'pre-line' }}>{formatted}</div> : <div style={{ whiteSpace: 'pre-line' }}>{displayAddress}</div>;
                                }
                                return <div style={{ whiteSpace: 'pre-line', color: '#999', fontStyle: 'italic' }}>Invoice From address not provided</div>;
                              })()}
                            </div>
                          </td>
                        </tr>
                        {buildConsigneeAddressString() && (
                          <tr>
                            <td className="consignee-address-cell">
                              <div className="address-block">
                                <span className="italic-label-normal">Consignee (Ship to)</span>
                                <div className="address-value" style={{ whiteSpace: 'pre-line' }}>
                                  {(() => {
                                    const displayAddress = buildConsigneeAddressString();
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
                        )}
                        <tr>
                          <td className="buyer-address-cell">
                            <div className="address-block">
                              <span className="italic-label-normal">Buyer (Bill to)</span>
                              <div className="address-value" style={{ whiteSpace: 'pre-line' }}>
                                {(() => {
                                  const displayAddress = buildBuyerAddressString();
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
                            <span className="field-value">{formData.invoiceNumber || ''}</span>
                          </td>
                          <td>
                            <span className="field-label">Invoice Date</span>
                            <span className="field-value">{formatDate(formData.invoiceDate)}</span>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <span className="field-label">Delivery Note</span>
                            <span className="field-value">{formData.deliveryNote || ''}</span>
                          </td>
                          <td>
                            <span className="field-label">Mode/Terms of Payment</span>
                            <span className="field-value">{formData.paymentTerms || ''}</span>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <span className="field-label">Reference No</span>
                            <span className="field-value">{formData.referenceNo || ''}</span>
                          </td>
                          <td>
                            <span className="field-label">Other References</span>
                            <span className="field-value">{formData.otherReferences || ''}</span>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <span className="field-label">Buyer's Order No.</span>
                            <span className="field-value">{formData.buyersOrderNo || ''}</span>
                          </td>
                          <td>
                            <span className="field-label">Purchase Date</span>
                            <span className="field-value">{formatDate(formData.buyersOrderDate)}</span>
                          </td>
                        </tr>
                       
                        <tr>
                         
                        </tr>
                        <tr>
                          <td colSpan={2}>
                            <span className="field-label">Terms of Delivery</span>
                            <span className="field-value">{formData.termsOfDelivery || ''}</span>
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
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name || item.description}</td>
                    <td>{item.hsn || ''}</td>
                    <td>{item.quantity ? `${item.quantity} nos` : ''}</td>
                    <td className="text-right">{parseFloat(item.price || item.rate || 0).toFixed(2)}</td>
                    <td>nos</td>
                    <td className="text-right">{(parseFloat(item.quantity || 0) * parseFloat(item.price || item.rate || 0)).toFixed(2)}</td>
                  </tr>
                ))}
                <tr>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td className="text-right bold-cell">{subtotal.toFixed(2)}</td>
                </tr>
                {igstRate > 0 && (
                  <tr>
                    <td>IGST - {igstRate}%</td>
                    <td></td>
                    <td></td>
                    <td>{igstRate}%</td>
                    <td></td>
                    <td className="text-right">{((subtotal * igstRate) / 100).toFixed(2)}</td>
                  </tr>
                )}
                {cgstRate > 0 && (
                  <>
                    <tr>
                      <td>CGST - {cgstRate}%</td>
                      <td></td>
                      <td></td>
                      <td>{cgstRate}%</td>
                      <td></td>
                      <td className="text-right">{((subtotal * cgstRate) / 100).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>SGST - {sgstRate}%</td>
                      <td></td>
                      <td></td>
                      <td>{sgstRate}%</td>
                      <td></td>
                      <td className="text-right">{((subtotal * sgstRate) / 100).toFixed(2)}</td>
                    </tr>
                  </>
                )}
                <tr className="total-row">
                  <td className="bold-cell">Total</td>
                  <td></td>
                  <td className="bold-cell">{items.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0)} nos</td>
                  <td></td>
                  <td></td>
                  <td className="text-right bold-cell">{grandTotal.toFixed(2)}</td>
                </tr>
                <tr className="amount-words-row">
                  <td colSpan={6} style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'left', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <span className="amount-label">Amount Chargeable (in words)</span>
                      <span style={{ fontSize: '10px', fontWeight: 'normal' }}>E. & O.E</span>
                    </div>
                    <span className="amount-value bold-cell">Indian Rupees {grandTotal.toFixed(0)} Only</span>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Tax Summary Table */}
            {(cgstRate > 0 || sgstRate > 0 || igstRate > 0) && (
              <table className="tax-summary-table">
                <thead>
                  <tr>
                    <th className="col-hsn" rowSpan={2}>HSN/SAC</th>
                    <th className="col-taxable-value" rowSpan={2}>Taxable Value</th>
                    {isIntraState ? (
                      <>
                        <th className="col-cgst" colSpan={2}>CGST</th>
                        <th className="col-sgst" colSpan={2}>SGST</th>
                        <th className="col-total-tax" rowSpan={2}>Total Tax Amount</th>
                      </>
                    ) : (
                      <>
                        <th className="col-igst" colSpan={2}>IGST</th>
                        <th className="col-total-tax" rowSpan={2}>Total Tax Amount</th>
                      </>
                    )}
                  </tr>
                  <tr>
                    {isIntraState ? (
                      <>
                        <th className="col-cgst-rate">Rate</th>
                        <th className="col-cgst-amount">Amount</th>
                        <th className="col-sgst-rate">Rate</th>
                        <th className="col-sgst-amount">Amount</th>
                      </>
                    ) : (
                      <>
                        <th className="col-igst-rate">Rate</th>
                        <th className="col-igst-amount">Amount</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {getUniqueHSN().map((hsnData, index) => {
                    if (isIntraState) {
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
                      {isIntraState ? (
                        <>
                          <td className="col-cgst-rate text-right">-</td>
                          <td className="col-cgst-amount text-right">-</td>
                          <td className="col-sgst-rate text-right">-</td>
                          <td className="col-sgst-amount text-right">-</td>
                          <td className="col-total-tax text-right">-</td>
                        </>
                      ) : (
                        <>
                          <td className="col-igst-rate text-right">-</td>
                          <td className="col-igst-amount text-right">-</td>
                          <td className="col-total-tax text-right">-</td>
                        </>
                      )}
                    </tr>
                  )}
                  <tr className="tax-total-row">
                    <td className="col-hsn bold-cell">Total</td>
                    <td className="col-taxable-value text-right bold-cell">{formatCurrency(subtotal)}</td>
                    {isIntraState ? (
                      <>
                        <td className="col-cgst-rate"></td>
                        <td className="col-cgst-amount text-right bold-cell">{formatCurrency((subtotal * cgstRate) / 100)}</td>
                        <td className="col-sgst-rate"></td>
                        <td className="col-sgst-amount text-right bold-cell">{formatCurrency((subtotal * sgstRate) / 100)}</td>
                        <td className="col-total-tax text-right bold-cell">{formatCurrency(taxTotal)}</td>
                      </>
                    ) : (
                      <>
                        <td className="col-igst-rate"></td>
                        <td className="col-igst-amount text-right bold-cell">{formatCurrency((subtotal * igstRate) / 100)}</td>
                        <td className="col-total-tax text-right bold-cell">{formatCurrency(taxTotal)}</td>
                      </>
                    )}
                  </tr>
                  <tr className="tax-words-row">
                    <td colSpan={isIntraState ? 7 : 5} style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'left', fontSize: '11px', lineHeight: '1.4' }}>
                      <span className="tax-label">Tax Amount (in words):</span>
                      <span className="tax-value bold-cell"> {numberToWords(taxTotal)}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* Bottom Section - Bank Details, Declaration, and Signature */}
            {(() => {
              // Get bank details from formData or use defaults
              const getBankDetails = () => {
                // Check if bankDetails are provided in formData
                if (formData.bankDetails && formData.bankDetails.bankName) {
                  return {
                    bankName: formData.bankDetails.bankName || '',
                    accountNumber: formData.bankDetails.accountNo || formData.bankDetails.accountNumber || '',
                    branchAndIFSC: formData.bankDetails.branchIfsc || formData.bankDetails.branchAndIFSC || ''
                  };
                }
                
                // Fallback to auto-generated based on country
                const countryCode = formData.invoiceFromCountryCode || '';
                
                if (countryCode === 'IN') {
                  // India - ICICI Bank
                  return {
                    bankName: 'ICICI Bank Limited',
                    accountNumber: '058705002413',
                    branchAndIFSC: 'Avinashi Road & ICIC0000587'
                  };
                } else {
                  // Default for other countries - HDFC Bank
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
                        <div className="pan-value">{formData.invoiceFromPAN || 'AADCV6398Q'}</div>
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
                          <div className="vista-company-name">for VISTA ENGG SOLUTIONS PRIVATE LIMITED</div>
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
        </div>

        <div className="actions-sidebar">
          <div className="actions-panel">
            <h3 className="actions-title">Actions</h3>
            <div className="actions-buttons">
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className={`action-button download-button ${isGeneratingPDF ? 'disabled' : ''}`}
              >
                {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF'}
              </button>

              <button
                onClick={handleEditPreview}
                className="action-button edit-button"
              >
                Edit Preview
              </button>

              <button
                onClick={handleCreateNew}
                className="action-button create-button"
              >
                Create New Invoice
              </button>

              <button
                onClick={handleBackHome}
                className="action-button home-button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="home-icon">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;