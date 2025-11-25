import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllQuotations, getAllProformaInvoices, getAllInvoices } from '../../services/api';
import './History.css';

const ReferenceHistory = () => {
  const navigate = useNavigate();
  const [referenceNo, setReferenceNo] = useState('');
  const [quotations, setQuotations] = useState([]);
  const [proformaInvoices, setProformaInvoices] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format address data for quotations
  const formatQuotationAddressData = (address, fullQuotationData) => {
    const addressData = address || fullQuotationData?.quotationFor || {};
    const personName = addressData.personName || '';
    const companyName = addressData.companyName || '';
    const addressParts = [];
    
    if (addressData.street) addressParts.push(addressData.street);
    if (addressData.apartment) addressParts.push(addressData.apartment);
    
    const cityParts = [];
    if (addressData.city) cityParts.push(addressData.city);
    if (addressData.stateCode || addressData.state) {
      cityParts.push(addressData.stateCode || addressData.state);
    }
    if (addressData.zipCode) cityParts.push(addressData.zipCode);
    if (cityParts.length > 0) addressParts.push(cityParts.join(', '));
    if (addressData.countryCode || addressData.country) {
      addressParts.push(addressData.countryCode || addressData.country);
    }
    
    const addressString = addressParts.length > 0 ? addressParts.join(', ') : '';
    if (addressData.address && addressParts.length === 0) {
      return {
        name: personName || companyName || '',
        company: companyName || '',
        address: addressData.address
      };
    }
    
    return {
      name: personName,
      company: companyName,
      address: addressString
    };
  };

  // Format address data for proforma invoices
  const formatProformaAddressData = (address, fullInvoiceData) => {
    const addressData = address || fullInvoiceData?.formData || {};
    const clientName = addressData.clientName || addressData.billToClientName || '';
    const companyName = addressData.companyName || addressData.billToCompanyName || '';
    const addressParts = [];
    
    if (addressData.street || addressData.billToStreet) {
      addressParts.push(addressData.street || addressData.billToStreet);
    }
    if (addressData.apartment || addressData.billToApartment) {
      addressParts.push(addressData.apartment || addressData.billToApartment);
    }
    
    const cityParts = [];
    if (addressData.city || addressData.billToCity) {
      cityParts.push(addressData.city || addressData.billToCity);
    }
    if (addressData.stateCode || addressData.billToStateCode || addressData.state || addressData.billToState) {
      cityParts.push(addressData.stateCode || addressData.billToStateCode || addressData.state || addressData.billToState);
    }
    if (addressData.zipCode || addressData.billToZipCode) {
      cityParts.push(addressData.zipCode || addressData.billToZipCode);
    }
    if (cityParts.length > 0) addressParts.push(cityParts.join(', '));
    if (addressData.countryCode || addressData.billToCountryCode || addressData.country || addressData.billToCountry) {
      addressParts.push(addressData.countryCode || addressData.billToCountryCode || addressData.country || addressData.billToCountry);
    }
    
    const addressString = addressParts.length > 0 ? addressParts.join(', ') : '';
    if (addressData.address && addressParts.length === 0) {
      return {
        name: clientName || companyName || '',
        company: companyName || '',
        address: addressData.address
      };
    }
    
    return {
      name: clientName,
      company: companyName,
      address: addressString
    };
  };

  // Format address data for invoices
  const formatInvoiceAddressData = (address, fullInvoiceData) => {
    const addressData = address || fullInvoiceData?.formData || {};
    const clientName = addressData.name || addressData.clientName || addressData.billToClientName || '';
    const companyName = addressData.companyName || addressData.billToCompanyName || '';
    const addressParts = [];
    
    if (addressData.street || addressData.billToStreet) {
      addressParts.push(addressData.street || addressData.billToStreet);
    }
    if (addressData.apartment || addressData.billToApartment) {
      addressParts.push(addressData.apartment || addressData.billToApartment);
    }
    
    const cityParts = [];
    if (addressData.city || addressData.billToCity) {
      cityParts.push(addressData.city || addressData.billToCity);
    }
    if (addressData.stateCode || addressData.billToStateCode || addressData.state || addressData.billToState) {
      cityParts.push(addressData.stateCode || addressData.billToStateCode || addressData.state || addressData.billToState);
    }
    if (addressData.zipCode || addressData.billToZipCode) {
      cityParts.push(addressData.zipCode || addressData.billToZipCode);
    }
    if (cityParts.length > 0) addressParts.push(cityParts.join(', '));
    if (addressData.countryCode || addressData.billToCountryCode || addressData.country || addressData.billToCountry) {
      addressParts.push(addressData.countryCode || addressData.billToCountryCode || addressData.country || addressData.billToCountry);
    }
    
    const addressString = addressParts.length > 0 ? addressParts.join(', ') : '';
    if (addressData.address && addressParts.length === 0) {
      return {
        name: clientName || companyName || '',
        company: companyName || '',
        address: addressData.address
      };
    }
    
    return {
      name: clientName,
      company: companyName,
      address: addressString
    };
  };

  const handleSearch = async () => {
    if (!referenceNo.trim()) {
      setError('Please enter a reference number');
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      // Fetch all data
      const [allQuotations, allProformaInvoices, allInvoices] = await Promise.all([
        getAllQuotations(),
        getAllProformaInvoices(),
        getAllInvoices()
      ]);

      // Filter by reference number
      const refNoUpper = referenceNo.trim().toUpperCase();
      
      const filteredQuotations = allQuotations.filter(q => {
        const refNo = q.referenceNo || q.fullQuotationData?.quotationDetails?.referenceNo || '';
        return refNo.toUpperCase() === refNoUpper;
      });

      const filteredProformaInvoices = allProformaInvoices.filter(pi => {
        const refNo = pi.referenceNo || '';
        return refNo.toUpperCase() === refNoUpper;
      });

      const filteredInvoices = allInvoices.filter(inv => {
        const refNo = inv.referenceNo || 
                      inv.fullInvoiceData?.invoiceDetails?.referenceNo ||
                      inv.fullInvoiceData?.formData?.referenceNo || '';
        return refNo.toUpperCase() === refNoUpper;
      });

      setQuotations(filteredQuotations);
      setProformaInvoices(filteredProformaInvoices);
      setInvoices(filteredInvoices);

      if (filteredQuotations.length === 0 && filteredProformaInvoices.length === 0 && filteredInvoices.length === 0) {
        setError('No records found with the given reference number');
      }
    } catch (err) {
      console.error('Error searching:', err);
      setError(err.message || 'Failed to search records');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const renderTable = (data, type) => {
    if (data.length === 0) return null;

    return (
      <div className="table-container" style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ 
          marginBottom: '1.25rem', 
          fontSize: '1.5rem', 
          fontWeight: '700', 
          color: '#374151',
          paddingBottom: '0.75rem',
          borderBottom: '2px solid #e5e7eb'
        }}>
          {type === 'quotation' ? 'Quotation' : type === 'proforma' ? 'Proforma Invoice' : 'Invoice'}
        </h2>
        <table className="history-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Project Name</th>
              <th>Reference Number</th>
              <th>Vendor Name</th>
              <th>{type === 'quotation' ? 'Quotation Number' : 'Invoice Number'}</th>
              <th>Total Amount</th>
              <th>PDF</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              let projectName, referenceNo, vendorData, documentNumber;
              
              if (type === 'quotation') {
                projectName = item.projectName || 
                             item.fullQuotationData?.quotationDetails?.projectName ||
                             item.quotationDetails?.projectName || '-';
                referenceNo = item.referenceNo || item.fullQuotationData?.quotationDetails?.referenceNo || '-';
                vendorData = formatQuotationAddressData(item.toAddress, item.fullQuotationData);
                documentNumber = item.quotationNo || '-';
              } else if (type === 'proforma') {
                projectName = item.projectName || 
                             item.fullInvoiceData?.projectName ||
                             item.fullInvoiceData?.formData?.projectName || '-';
                referenceNo = item.referenceNo || '-';
                vendorData = formatProformaAddressData(item.billToAddress, item.fullInvoiceData);
                documentNumber = item.invoiceNumber || '-';
              } else {
                projectName = item.projectName || 
                             item.fullInvoiceData?.projectName ||
                             item.fullInvoiceData?.formData?.projectName || '-';
                referenceNo = item.referenceNo || 
                             item.fullInvoiceData?.invoiceDetails?.referenceNo ||
                             item.fullInvoiceData?.formData?.referenceNo || '-';
                vendorData = formatInvoiceAddressData(item.toAddress, item.fullInvoiceData);
                let actualInvoiceNumber = item.invoiceNumber;
                if (!actualInvoiceNumber || actualInvoiceNumber === 'Auto' || actualInvoiceNumber.trim() === '') {
                  if (item.fullInvoiceData?.invoiceNumber && item.fullInvoiceData.invoiceNumber !== 'Auto') {
                    actualInvoiceNumber = item.fullInvoiceData.invoiceNumber;
                  } else if (item.fullInvoiceData?.invoiceDetails?.number && item.fullInvoiceData.invoiceDetails.number !== 'Auto') {
                    actualInvoiceNumber = item.fullInvoiceData.invoiceDetails.number;
                  } else if (item.fullInvoiceData?.invoiceNumber) {
                    actualInvoiceNumber = item.fullInvoiceData.invoiceNumber;
                  } else {
                    if (item._id) {
                      const idStr = item._id.toString();
                      actualInvoiceNumber = `INV-${idStr.slice(-6).toUpperCase()}`;
                    } else {
                      actualInvoiceNumber = '-';
                    }
                  }
                }
                documentNumber = actualInvoiceNumber;
              }

              const hasNameOrCompany = vendorData.name || vendorData.company;
              const hasAddress = vendorData.address;
              const s3Url = item.s3Url;

              return (
                <tr key={item._id}>
                  <td className="serial-number">{index + 1}</td>
                  <td>{projectName}</td>
                  <td className="invoice-number">{referenceNo}</td>
                  <td>
                    <div className="address-cell">
                      {hasNameOrCompany ? (
                        <>
                          {vendorData.name && <strong>{vendorData.name}</strong>}
                          {vendorData.name && vendorData.company && <br />}
                          {vendorData.company && <strong>{vendorData.company}</strong>}
                          {hasAddress && (hasNameOrCompany ? <br /> : '')}
                          {hasAddress && <span style={{ fontSize: '0.85em', color: '#666' }}>{vendorData.address}</span>}
                          {!hasNameOrCompany && !hasAddress && '-'}
                        </>
                      ) : (
                        hasAddress ? <span style={{ fontSize: '0.85em', color: '#666' }}>{vendorData.address}</span> : '-'
                      )}
                    </div>
                  </td>
                  <td className="invoice-number">{documentNumber}</td>
                  <td className="amount-cell">{formatAmount(item.totalAmount)}</td>
                  <td className="s3-url-cell">
                    {s3Url ? (
                      <a 
                        href={s3Url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="s3-link"
                        title={s3Url}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                        View PDF
                      </a>
                    ) : (
                      <span className="no-url">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="history-container">
      <div className="history-header">
        <button onClick={handleBack} className="back-button-header">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back
        </button>
        <h1 className="history-title">Search by Reference Number</h1>
        <div className="history-actions"></div>
      </div>

      <div className="history-content">
        <div style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
              Reference Number
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter reference number (e.g., VSREF0000)"
                style={{ 
                  flex: 1, 
                  border: '2px solid #e5e7eb', 
                  borderRadius: '8px', 
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                disabled={loading}
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
                  }
                }}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ 
              padding: '1rem', 
              marginBottom: '1.5rem', 
              background: '#fee2e2', 
              border: '1px solid #fecaca', 
              borderRadius: '8px',
              color: '#dc2626'
            }}>
              {error}
            </div>
          )}

          {loading && (
            <div className="loading-spinner" style={{ minHeight: '40vh' }}>
              <div className="spinner"></div>
              <p>Searching...</p>
            </div>
          )}

          {!loading && searched && (
            <>
              {quotations.length === 0 && proformaInvoices.length === 0 && invoices.length === 0 ? (
                <div className="empty-state">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h11.25c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                  <h2>No Records Found</h2>
                  <p>No records found with reference number: {referenceNo}</p>
                </div>
              ) : (
                <div style={{ paddingTop: '1rem' }}>
                  {renderTable(quotations, 'quotation')}
                  {renderTable(proformaInvoices, 'proforma')}
                  {renderTable(invoices, 'invoice')}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferenceHistory;

