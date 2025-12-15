import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.jpg';
import { generatePurchaseOrderPDF } from '../../services/purchaseOrderPdfGenerator';
import { createPurchaseOrder } from '../../services/api';
import './PurchaseOrderPreview.css';

const PurchaseOrderPreview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const previewRef = useRef();

  useEffect(() => {
    if (location.state?.data) {
      setData(location.state.data);
    } else {
      navigate('/purchase-order');
    }
  }, [location.state, navigate]);

  useEffect(() => {
    const savePurchaseOrder = async () => {
      if (!data || isSaved) return;
      
      try {
        const { formData, items, tax } = data;
        const dbData = {
          poNumber: formData.poNumber,
          poDate: formData.poDate,
          totalAmount: grandTotal,
          referenceNumber: formData.referenceNumber || '',
          projectName: formData.projectName || '',
          billToAddress: {
            clientName: formData.billToClientName || '',
            companyName: formData.billToCompanyName || '',
            street: formData.billToStreet || '',
            apartment: formData.billToApartment || '',
            city: formData.billToCity || '',
            zipCode: formData.billToZipCode || '',
            countryCode: formData.billToCountryCode || '',
            stateCode: formData.billToStateCode || '',
            pan: formData.billToPAN || '',
            gstin: formData.billToGSTIN || '',
            phoneNumber: formData.billToPhoneNumber || ''
          },
          shipToAddress: {
            clientName: formData.shipToClientName || '',
            companyName: formData.shipToCompanyName || '',
            street: formData.shipToStreet || '',
            apartment: formData.shipToApartment || '',
            city: formData.shipToCity || '',
            zipCode: formData.shipToZipCode || '',
            countryCode: formData.shipToCountryCode || '',
            stateCode: formData.shipToStateCode || '',
            pan: formData.shipToPAN || '',
            gstin: formData.shipToGSTIN || '',
            phoneNumber: formData.shipToPhoneNumber || ''
          },
          fullPurchaseOrderData: { formData, items, tax }
        };
        
        await createPurchaseOrder(dbData);
        console.log('✅ Purchase Order saved to database');
        setIsSaved(true);
      } catch (error) {
        console.error('❌ Error saving Purchase Order:', error);
      }
    };
    
    savePurchaseOrder();
  }, [data, isSaved]);

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
    setIsGeneratingPDF(true);
    const fileName = `PO_${formData.poNumber || 'Document'}.pdf`;
    const blob = await generatePurchaseOrderPDF(previewRef, fileName);
    
    if (blob) {
      try {
        const { uploadPdfToS3, updatePurchaseOrderS3Url } = await import('../../services/api.js');
        const uploadResult = await uploadPdfToS3(blob, fileName, 'PurchaseOrder');
        console.log('✅ PO PDF uploaded to S3:', uploadResult.url);
        
        if (formData.poNumber) {
          await updatePurchaseOrderS3Url(formData.poNumber, uploadResult.url);
          console.log('✅ Database updated with S3 URL');
        }
      } catch (error) {
        console.error('❌ Error uploading PDF to S3:', error);
      }
    }
    
    setIsGeneratingPDF(false);
  };

  const handleEditPreview = () => {
    navigate('/purchase-order', { state: { initialData: formData, items } });
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
    
    return (
      <div style={{ lineHeight: '1.6', fontSize: 12 }}>
        <div style={{ marginBottom: 4, display: 'flex' }}>
          <span style={{ width: '70px', fontWeight: 'bold', flexShrink: 0 }}>Name</span>
          <span style={{ flex: 1 }}>{formData[`${prefix}ClientName`] || '-'}</span>
        </div>
        <div style={{ marginBottom: 4, display: 'flex' }}>
          <span style={{ width: '70px', fontWeight: 'bold', flexShrink: 0 }}>Company</span>
          <span style={{ flex: 1 }}>{formData[`${prefix}CompanyName`] || '-'}</span>
        </div>
        <div style={{ marginBottom: 4, display: 'flex' }}>
          <span style={{ width: '70px', fontWeight: 'bold', flexShrink: 0 }}>Address</span>
          <span style={{ flex: 1 }}>{addressLine}</span>
        </div>
        <div style={{ marginBottom: 4, display: 'flex' }}>
          <span style={{ width: '70px', fontWeight: 'bold', flexShrink: 0 }}>Country</span>
          <span style={{ flex: 1 }}>{(formData[`${prefix}CountryCode`] || '') || '-'}</span>
        </div>
        {prefix === 'billTo' && (
          <>
            <div style={{ marginBottom: 4, display: 'flex' }}>
              <span style={{ width: '70px', fontWeight: 'bold', flexShrink: 0 }}>PAN</span>
              <span style={{ flex: 1 }}>{formData.billToPAN || '-'}</span>
            </div>
            <div style={{ marginBottom: 4, display: 'flex' }}>
              <span style={{ width: '70px', fontWeight: 'bold', flexShrink: 0 }}>GSTIN</span>
              <span style={{ flex: 1 }}>{formData.billToGSTIN || '-'}</span>
            </div>
            <div style={{ marginBottom: 4, display: 'flex' }}>
              <span style={{ width: '70px', fontWeight: 'bold', flexShrink: 0 }}>Phone</span>
              <span style={{ flex: 1 }}>{formData.billToPhoneNumber || '-'}</span>
            </div>
          </>
        )}
        {prefix === 'shipTo' && (
          <div style={{ marginBottom: 4, display: 'flex' }}>
            <span style={{ width: '70px', fontWeight: 'bold', flexShrink: 0 }}>Phone</span>
            <span style={{ flex: 1 }}>{formData.shipToPhoneNumber || '-'}</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-2 mb-3" style={{ position: 'relative', alignItems: 'flex-start' }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 28, letterSpacing: 2, fontWeight: 'bold', lineHeight: 1.2, color: '#333', textAlign: 'right', marginTop: '84px', marginBottom: 8, alignSelf: 'flex-end' }}>
                  <div>PURCHASE</div>
                  <div>ORDER</div>
                </div>
                <div style={{ textAlign: 'left', marginTop: 16, marginBottom: 8, width: '100%' }}>
                  <div style={{ fontSize: 12, marginBottom: 3, display: 'flex' }}>
                    <span style={{ width: '80px', fontWeight: 'bold', flexShrink: 0 }}>PO Number:</span>
                    <span style={{ flex: 1 }}>{formData.poNumber || '-'}</span>
                  </div>
                  <div style={{ fontSize: 12, marginBottom: 3, display: 'flex' }}>
                    <span style={{ width: '80px', fontWeight: 'bold', flexShrink: 0 }}>Reference:</span>
                    <span style={{ flex: 1 }}>{formData.referenceNumber || '-'}</span>
                  </div>
                </div>
                <div style={{ fontSize: 10, marginTop: 'auto', lineHeight: '1.5', textAlign: 'left', width: '100%' }}>The above PO number & reference must appear on all related correspondence, shipping papers and invoices</div>
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
                  <div style={{ position: 'absolute', bottom: '50px', right: 0, fontSize: 12, textAlign: 'center', width: '50%' }}>
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

