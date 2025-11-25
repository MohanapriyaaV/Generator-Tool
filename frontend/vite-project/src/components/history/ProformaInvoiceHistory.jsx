import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProformaInvoices } from '../../services/api';
import './History.css';

const ProformaInvoiceHistory = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await getAllProformaInvoices();
      setInvoices(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching proforma invoices:', err);
      setError(err.message || 'Failed to fetch proforma invoices');
    } finally {
      setLoading(false);
    }
  };

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

  const formatAddressData = (address, fullInvoiceData) => {
    // Get address data from multiple possible locations
    const addressData = address || fullInvoiceData?.formData || {};
    
    // Get name and company name
    const clientName = addressData.clientName || addressData.billToClientName || '';
    const companyName = addressData.companyName || addressData.billToCompanyName || '';
    
    // Build address parts (without name/company)
    const addressParts = [];
    
    // Street
    if (addressData.street || addressData.billToStreet) {
      addressParts.push(addressData.street || addressData.billToStreet);
    }
    
    // Apartment
    if (addressData.apartment || addressData.billToApartment) {
      addressParts.push(addressData.apartment || addressData.billToApartment);
    }
    
    // City, State, ZipCode
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
    if (cityParts.length > 0) {
      addressParts.push(cityParts.join(', '));
    }
    
    // Country
    if (addressData.countryCode || addressData.billToCountryCode || addressData.country || addressData.billToCountry) {
      addressParts.push(addressData.countryCode || addressData.billToCountryCode || addressData.country || addressData.billToCountry);
    }
    
    const addressString = addressParts.length > 0 ? addressParts.join(', ') : '';
    
    // If we have a formatted address string and no granular data, parse it
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

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="history-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading proforma invoices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchInvoices} className="retry-button">Retry</button>
          <button onClick={handleBack} className="back-button">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <button onClick={handleBack} className="back-button-header">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back
        </button>
        <h1 className="history-title">Proforma Invoice History</h1>
        <div className="history-actions">
          <button onClick={fetchInvoices} className="refresh-button">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="history-content">
        {invoices.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h11.25c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
            <h2>No Proforma Invoices Found</h2>
            <p>There are no proforma invoices in the database yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Project Name</th>
                  <th>Reference Number</th>
                  <th>Vendor Name</th>
                  <th>Invoice Number</th>
                  <th>Total Amount</th>
                  <th>PDF</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice, index) => {
                  // Get project name from multiple possible locations
                  const projectName = invoice.projectName || 
                                     invoice.fullInvoiceData?.projectName ||
                                     invoice.fullInvoiceData?.formData?.projectName || '-';
                  
                  // Get vendor address data
                  const vendorData = formatAddressData(invoice.billToAddress, invoice.fullInvoiceData);
                  const hasNameOrCompany = vendorData.name || vendorData.company;
                  const hasAddress = vendorData.address;
                  
                  return (
                  <tr key={invoice._id}>
                    <td className="serial-number">{index + 1}</td>
                    <td>{projectName}</td>
                    <td>{invoice.referenceNo || '-'}</td>
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
                    <td className="invoice-number">{invoice.invoiceNumber || '-'}</td>
                    <td className="amount-cell">{formatAmount(invoice.totalAmount)}</td>
                    <td className="s3-url-cell">
                      {invoice.s3Url ? (
                        <a 
                          href={invoice.s3Url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="s3-link"
                          title={invoice.s3Url}
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
        )}
      </div>
    </div>
  );
};

export default ProformaInvoiceHistory;

