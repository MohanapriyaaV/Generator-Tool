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

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    try {
      setIsGeneratingPDF(true);
      const fileName = `invoice_${formData.invoiceNumber || 'document'}.pdf`;
      const blob = await generateInvoicePDF(previewRef, fileName);
      if (blob) {
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
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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
            {/* Header */}
            <div className="invoice-header">
              <div className="invoice-logo">
                <img src={logo} alt="Vista Logo" className="logo-image" />
                <div className="company-name">VISTA ENGG SOLUTIONS PRIVATE LIMITED</div>
              </div>
              <div className="invoice-title">
                <h1 className="invoice-main-title">INVOICE</h1>
              </div>
            </div>
            
            {/* Top Section with Address and Meta Info */}
            <table className="invoice-top-section">
              <tbody>
                <tr>
                  {/* Left Side - Address Section */}
                  <td className="address-section">
                    <div>
                      <strong>{formData.invoiceFromCompanyName}</strong><br/>
                      {formData.invoiceFromStreet && <>{formData.invoiceFromStreet}<br/></>}
                      {formData.invoiceFromApartment && <>{formData.invoiceFromApartment}<br/></>}
                      {[formData.invoiceFromCity, formData.invoiceFromStateCode, formData.invoiceFromZipCode].filter(Boolean).join(', ')}<br/>
                      {formData.invoiceFromCountryCode && <>{formData.invoiceFromCountryCode === 'IN' ? 'India' : formData.invoiceFromCountryCode}<br/></>}
                      {formData.invoiceFromGSTIN && <>GSTIN/UIN: {formData.invoiceFromGSTIN}<br/></>}
                      {formData.invoiceFromGSTIN && <>State Name : Code : {formData.invoiceFromGSTIN.substring(0, 2)}<br/></>}
                      {formData.invoiceFromPAN && <>PAN: {formData.invoiceFromPAN}</>}
                    </div>
                    
                    <div style={{ marginTop: '5px', paddingTop: '5px', borderTop: '1px solid #000', marginLeft: '-4px', marginRight: '-4px', paddingLeft: '4px', paddingRight: '4px' }}>
                      <div className="italic-label">Buyer (Bill to)</div>
                      <div className="buyer-name">{formData.billToClientName}</div>
                      <div className="buyer-name">{formData.billToCompanyName}</div>
                      <div>{formData.billToStreet}, {formData.billToApartment}</div>
                      <div>{formData.billToCity}, {formData.billToZipCode}</div>
                      <div>{formData.billToCountryCode === 'IN' ? 'India' : formData.billToCountryCode}</div>
                      {formData.billToGSTIN && <div>GSTIN/UIN: {formData.billToGSTIN}</div>}
                      {formData.billToPAN && <div>PAN: {formData.billToPAN}</div>}
                    </div>
                  </td>
                  
                  {/* Right Side - Meta Info Section */}
                  <td className="meta-info-section">
                    <table className="meta-info-table">
                      <tbody>
                        <tr>
                          <td><span className="field-label">Invoice No.</span><br/><span className="field-value">{formData.invoiceNumber}</span></td>
                          <td><span className="field-label">Invoice Date</span><br/><span className="field-value">{formData.invoiceDate}</span></td>
                        </tr>
                        <tr>
                          <td colSpan="2"><span className="field-label">Mode/Terms of Payment</span><br/><span className="field-value">{formData.paymentTerms || ''}</span></td>
                        </tr>
                        <tr>
                          <td><span className="field-label">Reference No. & Date</span><br/><span className="field-value">{formData.referenceNo}</span></td>
                          <td><span className="field-label">Other References</span><br/><span className="field-value">{formData.otherReferences || ''}</span></td>
                        </tr>
                        <tr>
                          <td><span className="field-label">Buyer's Order No.</span><br/><span className="field-value">{formData.buyersOrderNo || ''}</span></td>
                          <td><span className="field-label">Date</span><br/><span className="field-value">{formData.buyersOrderDate || ''}</span></td>
                        </tr>
                        <tr>
                          <td colSpan="2"><span className="field-label">Terms of Delivery</span><br/><span className="field-value">{formData.termsOfDelivery || ''}</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            <table className="items-table">
              <thead>
                <tr>
                  <th>Description of Goods</th>
                  <th className="text-center">HSN/SAC</th>
                  <th className="text-center">Quantity</th>
                  <th className="text-center">Rate</th>
                  <th className="text-center">per</th>
                  <th className="text-center">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name || item.description}</td>
                    <td className="text-center">{item.hsn}</td>
                    <td className="text-center">{item.quantity} nos</td>
                    <td className="text-right">{parseFloat(item.price || item.rate || 0).toFixed(2)}</td>
                    <td className="text-center">nos</td>
                    <td className="text-right">{(parseFloat(item.quantity || 0) * parseFloat(item.price || item.rate || 0)).toFixed(2)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan="5" className="text-right"></td>
                  <td className="text-right bold-cell">{subtotal.toFixed(2)}</td>
                </tr>
                {igstRate > 0 && (
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>IGST - {igstRate}%</td>
                    <td colSpan="3" style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{igstRate}%</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}></td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>{((subtotal * igstRate) / 100).toFixed(2)}</td>
                  </tr>
                )}
                {cgstRate > 0 && (
                  <>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>CGST - {cgstRate}%</td>
                      <td colSpan="3" style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{cgstRate}%</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}></td>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>{((subtotal * cgstRate) / 100).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>SGST - {sgstRate}%</td>
                      <td colSpan="3" style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{sgstRate}%</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}></td>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>{((subtotal * sgstRate) / 100).toFixed(2)}</td>
                    </tr>
                  </>
                )}
                <tr className="total-row">
                  <td className="bold-cell">Total</td>
                  <td></td>
                  <td className="text-center bold-cell">{items.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0)} nos</td>
                  <td colSpan="2"></td>
                  <td className="text-right bold-cell">{grandTotal.toFixed(2)}</td>
                </tr>
                <tr className="amount-words-row">
                  <td colSpan="6">
                    <div className="amount-words-content">
                      <div>
                        <span className="amount-label">Amount Chargeable (in words)</span>
                        <div className="amount-value">Indian Rupees {grandTotal.toFixed(0)} Only</div>
                      </div>
                      <div className="eoe-text">E. & O.E</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

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