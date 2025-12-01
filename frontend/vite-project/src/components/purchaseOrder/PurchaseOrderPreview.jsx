import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.jpg';
import { generatePurchaseOrderPDF } from '../../services/purchaseOrderPdfGenerator';
import './PurchaseOrderPreview.css';

const PurchaseOrderPreview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const previewRef = useRef();
  const generatedPoNumeric = location.state?.generatedPoNumeric || null;

  // Helper to parse PO number to numeric
  const parseBackendPoToNumeric = (backendPo) => {
    if (!backendPo) return null;
    const m = backendPo.match(/(\d+)/);
    return m ? parseInt(m[0], 10) : null;
  };

  // Helper to format VIS PO
  const formatVISPo = (num) => {
    if (num === null || num === undefined) return '';
    return `VIS_PO_${String(num).padStart(4, '0')}`;
  };

  useEffect(() => {
    if (location.state?.data) {
      setData(location.state.data);
    } else {
      navigate('/purchase-order');
    }
  }, [location.state, navigate]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const { formData, items, tax } = data;

  const currencySymbolMap = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£'
  };

  const currencySymbol = currencySymbolMap[formData.currency] || '';

  const formatAmount = (value) => {
    return `${currencySymbol}${Number(value || 0).toFixed(2)}`;
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const cgstRate = tax?.cgstRate || 0;
  const sgstRate = tax?.sgstRate || 0;
  const igstRate = tax?.igstRate || 0;
  const taxTotal = parseFloat(tax?.taxAmount) || 0;
  const cgstAmount = (subtotal * (parseFloat(cgstRate) || 0)) / 100;
  const sgstAmount = (subtotal * (parseFloat(sgstRate) || 0)) / 100;
  const igstAmount = (subtotal * (parseFloat(igstRate) || 0)) / 100;
  const grandTotal = subtotal + taxTotal;

  const handleDownloadPDF = async () => {
<<<<<<< HEAD
    if (!previewRef.current) return;

    // Validate PO number before generating PDF
    const poNumber = formData.poNumber?.trim();
    if (!poNumber) {
      alert('PO number is required');
      return;
    }

    // Check format
    if (!poNumber.match(/^VIS_PO_\d{4}$/)) {
      alert('PO number must be in format VIS_PO_0001');
      return;
    }

    // Extract numeric part
    const numericPart = parseBackendPoToNumeric(poNumber);
    if (numericPart === null) {
      alert('Invalid PO number format');
      return;
    }

    // Check if it's in ascending order from generated number
    if (generatedPoNumeric !== null && numericPart < generatedPoNumeric) {
      alert(`PO number must be ${formatVISPo(generatedPoNumeric)} or higher`);
      return;
    }

    // Check uniqueness in database
    try {
      const { getAllPurchaseOrders } = await import('../../services/api.js');
      const allPOs = await getAllPurchaseOrders();
      const existingPO = allPOs.find(po => {
        const existingPoNumber = po.poNumber || po.fullPurchaseOrderData?.poNumber;
        return existingPoNumber && existingPoNumber.toUpperCase() === poNumber.toUpperCase();
      });

      if (existingPO) {
        alert('This PO number already exists. Please use a different number.');
        return;
      }
    } catch (error) {
      console.error('Error checking PO number uniqueness:', error);
      // Continue anyway, but warn user
      const proceed = window.confirm('Could not verify PO number uniqueness. Do you want to continue?');
      if (!proceed) return;
    }

    try {
      setIsGeneratingPDF(true);
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`purchase_order_${formData.poNumber || 'document'}.pdf`);

      // Also generate blob and upload to S3, then save purchase order record
      try {
        // jsPDF: use output('blob') to get a Blob
        const blob = pdf.output && typeof pdf.output === 'function' ? pdf.output('blob') : null;
        if (blob) {
          try {
            const { uploadPdfToS3, createPurchaseOrder } = await import('../../services/api.js');
            const fileName = `PurchaseOrder_${formData.poNumber || 'document'}_${new Date().toISOString().split('T')[0]}.pdf`;
            console.log('Uploading PO PDF to S3...');
            const uploadResult = await uploadPdfToS3(blob, fileName, 'PurchaseOrder');
            console.log('✅ PDF uploaded to S3:', uploadResult.url);

            // Build payload for creating purchase order record
            const payload = {
              poNumber: formData.poNumber || '',
              // ensure valid date is sent
              poDate: formData.poDate || new Date().toISOString(),
              totalAmount: Number((grandTotal) || 0),
              referenceNumber: formData.referenceNumber || '',
              projectName: formData.projectName || '',
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
              shipToAddress: {
                clientName: formData.shipToClientName || '',
                companyName: formData.shipToCompanyName || '',
                street: formData.shipToStreet || '',
                apartment: formData.shipToApartment || '',
                city: formData.shipToCity || '',
                zipCode: formData.shipToZipCode || '',
                country: formData.shipToCountryCode || '',
                state: formData.shipToStateCode || '',
                phoneNumber: formData.shipToPhoneNumber || '',
              },
              s3Url: uploadResult.url || '',
              fullPurchaseOrderData: { formData, items, tax }
            };

            try {
              const created = await createPurchaseOrder(payload);
              console.log('✅ Purchase order saved:', created.purchaseOrder?._id || created.purchaseOrder);
            } catch (dbError) {
              console.warn('⚠️ Could not save purchase order to DB:', dbError.message || dbError);
            }
          } catch (uploadError) {
            console.error('❌ Error uploading PO PDF to S3:', uploadError);
          }
        } else {
          console.warn('Could not create Blob from PDF (pdf.output not available)');
        }
      } catch (err) {
        console.warn('Could not generate blob from PDF for upload:', err);
      }
    } finally {
      setIsGeneratingPDF(false);
    }
=======
    await generatePurchaseOrderPDF(
      previewRef,
      formData,
      items,
      tax,
      grandTotal,
      setIsGeneratingPDF
    );
>>>>>>> 3068eb2e3eeb634b09f400d9185691ff1ea360d7
  };

  const handleEditPreview = () => {
    navigate('/purchase-order', { 
      state: { 
        initialData: formData, 
        items,
        generatedPoNumeric 
      } 
    });
  };

  const handleCreateNew = () => {
    navigate('/purchase-order');
  };

  const handleBackHome = () => {
    navigate('/');
  };

  const renderAddressBlock = (prefix) => {
    const addressParts = [
      formData[`${prefix}Street`],
      formData[`${prefix}Apartment`],
      formData[`${prefix}City`],
      formData[`${prefix}StateCode`],
      formData[`${prefix}ZipCode`]
    ].filter(Boolean);
    
    const addressLine = addressParts.length > 0 ? addressParts.join(', ') : '-';
    
    // Match table cell padding (6px 8px) - labels align with table content
    const labelStyle = { display: 'inline-block', width: '70px', fontWeight: 'bold' };
    const valueStyle = { display: 'inline-block' };
    
    return (
      <div style={{ lineHeight: '1.6', fontSize: 12 }}>
        <div style={{ marginBottom: 4 }}>
          <span style={labelStyle}>Name</span>
          <span style={valueStyle}>{formData[`${prefix}ClientName`] || '-'}</span>
        </div>
        <div style={{ marginBottom: 4 }}>
          <span style={labelStyle}>Company</span>
          <span style={valueStyle}>{formData[`${prefix}CompanyName`] || '-'}</span>
        </div>
        <div style={{ marginBottom: 4 }}>
          <span style={labelStyle}>Address</span>
          <span style={valueStyle}>{addressLine}</span>
        </div>
        <div style={{ marginBottom: 4 }}>
          <span style={labelStyle}>Country</span>
          <span style={valueStyle}>{(formData[`${prefix}CountryCode`] || '') || '-'}</span>
        </div>
        {prefix === 'billTo' && (
          <>
            <div style={{ marginBottom: 4 }}>
              <span style={labelStyle}>PAN</span>
              <span style={valueStyle}>{formData.billToPAN || '-'}</span>
            </div>
            <div style={{ marginBottom: 4 }}>
              <span style={labelStyle}>GSTIN</span>
              <span style={valueStyle}>{formData.billToGSTIN || '-'}</span>
            </div>
            <div style={{ marginBottom: 4 }}>
              <span style={labelStyle}>Phone</span>
              <span style={valueStyle}>{formData.billToPhoneNumber || '-'}</span>
            </div>
          </>
        )}
        {prefix === 'shipTo' && (
          <div style={{ marginBottom: 4 }}>
            <span style={labelStyle}>Phone</span>
            <span style={valueStyle}>{formData.shipToPhoneNumber || '-'}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 flex justify-center">
          <div className="bg-white shadow rounded-lg" ref={previewRef} style={{
            width: '794px',
            minHeight: '1123px',
            padding: '40px',
            boxSizing: 'border-box'
          }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-2 mb-3" style={{ position: 'relative' }}>
              <div>
                <img src={logo} alt="Vista Logo" style={{ width: 280, marginBottom: 12 }} />
                <div style={{ fontSize: 12, lineHeight: '1.5', textAlign: 'left' }}>
                  {formData.shipToCompanyName && (
                    <div style={{ fontWeight: 'bold', marginBottom: 3 }}>{formData.shipToCompanyName}</div>
                  )}
                  {(formData.shipToStreet || formData.shipToApartment || formData.shipToCity || formData.shipToStateCode) && (
                    <div style={{ marginBottom: 3 }}>
                      {[formData.shipToStreet, formData.shipToApartment, formData.shipToCity, formData.shipToStateCode].filter(Boolean).join(', ')}
                    </div>
                  )}
                  {(formData.shipToCountryCode || formData.shipToZipCode) && (
                    <div>
                      {[formData.shipToCountryCode, formData.shipToZipCode].filter(Boolean).join(' ')}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '60px', right: 0, fontSize: 28, letterSpacing: 2, fontWeight: 'bold', lineHeight: 1.2, color: '#333', textAlign: 'right' }}>
                  <div>PURCHASE</div>
                  <div>ORDER</div>
                </div>
                <div style={{ position: 'absolute', top: '170px', right: 0, textAlign: 'left', width: '100%' }}>
                  <div style={{ fontSize: 12, marginBottom: 3 }}><strong>PO Number:</strong> {formData.poNumber || '-'}</div>
                  <div style={{ fontSize: 12, marginBottom: 3 }}><strong>Reference:</strong> {formData.referenceNumber || '-'}</div>
                  <div style={{ fontSize: 11, marginTop: 3, marginBottom: 0, lineHeight: '1.4' }}>The above PO number & reference must appear on all related correspondence shipping papers and invoices</div>
                </div>
              </div>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" style={{ fontSize: 13 }}>
            <div className="border rounded" style={{ textAlign: 'left', padding: '6px 8px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: 12, fontSize: 13 }}>To:</div>
              {renderAddressBlock('billTo')}
            </div>
            <div className="border rounded" style={{ textAlign: 'left', padding: '6px 8px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: 12, fontSize: 13 }}>Ship To:</div>
              {renderAddressBlock('shipTo')}
            </div>
          </div>

          <table className="w-full mb-6 text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['P.O. Date', 'Requisitioner', 'Shipped Via', 'F.O.B Destination', 'Terms'].map((header) => (
                  <th key={header} style={{ border: '1px solid #000', padding: '6px 8px', background: '#f7f7f7' }}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{formData.poDate || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{formData.requisitionerName || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{formData.shippedVia || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{formData.fobDestination || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{formData.terms || '-'}</td>
              </tr>
            </tbody>
          </table>

          <table className="w-full text-sm mb-6" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Sl. No', 'Item', 'Qty', 'Unit Price', 'HSN/SAC', 'Total'].map((header) => (
                  <th key={header} style={{ border: '1px solid #000', padding: '6px 8px', background: '#f7f7f7', textAlign: 'center' }}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const qty = parseFloat(item.quantity) || 0;
                const price = parseFloat(item.unitPrice) || 0;
                const base = qty * price;
                const total = base;

                return (
                  <tr key={item.id}>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>
                      <div>{item.itemName || '-'}</div>
                      {item.description && <div style={{ color: '#555', fontSize: 12 }}>{item.description}</div>}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{qty}</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{formatAmount(price)}</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{item.hsn || '-'}</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{formatAmount(total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Terms and Conditions:</div>
              <div style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
                {formData.termsAndConditions}
              </div>
            </div>
            <div>
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px 8px' }}>Subtotal</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{formatAmount(subtotal)}</td>
                  </tr>
                  { (parseFloat(cgstRate) || 0) > 0 && (
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '6px 8px' }}>CGST ({cgstRate}%)</td>
                      <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{formatAmount(cgstAmount)}</td>
                    </tr>
                  )}
                  { (parseFloat(sgstRate) || 0) > 0 && (
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '6px 8px' }}>SGST ({sgstRate}%)</td>
                      <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{formatAmount(sgstAmount)}</td>
                    </tr>
                  )}
                  { (parseFloat(igstRate) || 0) > 0 && (
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '6px 8px' }}>IGST ({igstRate}%)</td>
                      <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{formatAmount(igstAmount)}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px 8px' }}>Total Tax</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{formatAmount(taxTotal)}</td>
                  </tr>
                  <tr style={{ background: '#0f172a', color: '#fff', fontWeight: 'bold' }}>
                    <td style={{ border: '1px solid #000', padding: '10px 12px' }}>Total</td>
                    <td style={{ border: '1px solid #000', padding: '10px 12px', textAlign: 'right' }}>{formatAmount(grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
              <div className="border" style={{ marginTop: '24px', width: '100%', minHeight: '200px', padding: '12px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 'bold', marginBottom: 12, textAlign: 'left' }}>Authorization</div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <div style={{ position: 'absolute', bottom: '50px', left: '50%', transform: 'translateX(-50%)', fontSize: 12, textAlign: 'center', width: 'calc(50% - 20px)' }}>
                    {formData.poDate ? new Date(formData.poDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  </div>
                </div>
                <div style={{ borderTop: '1px solid #000', paddingTop: 8, marginTop: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1, textAlign: 'left' }}>Authorized by</div>
                    <div style={{ width: '1px', height: '20px', backgroundColor: '#000', margin: '0 8px' }}></div>
                    <div style={{ flex: 1, textAlign: 'center' }}>Date</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#555', marginTop: '24px', paddingTop: '12px' }}>
            <div style={{ textAlign: 'left', flex: 1 }}>Indialand Tech Park, CHILSEZ Campus, Coimbatore, Tamil Nadu, India 641035</div>
            <div style={{ textAlign: 'center', flex: 1, color: '#22c55e' }}>www.vistaes.com</div>
            <div style={{ textAlign: 'right', flex: 1 }}>CIN: U72200TZ2011PTC017012</div>
          </div>
        </div>
        </div>

        <div className="w-full lg:w-64 flex flex-col gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className={`w-full px-4 py-3 rounded-lg font-semibold text-white ${isGeneratingPDF ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF'}
          </button>
          <button
            onClick={handleEditPreview}
            className="w-full px-4 py-3 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700"
          >
            Edit Preview
          </button>
          <button
            onClick={handleCreateNew}
            className="w-full px-4 py-3 rounded-lg font-semibold text-white bg-gray-600 hover:bg-gray-700"
          >
            Create New PO
          </button>
          <button
            onClick={handleBackHome}
            className="w-full px-4 py-3 rounded-lg font-semibold text-white bg-slate-800 hover:bg-slate-900"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderPreview;

