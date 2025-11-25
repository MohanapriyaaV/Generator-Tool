import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllInvoices } from '../../services/api';
import './History.css';

const InvoiceHistory = () => {
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
      const data = await getAllInvoices();
      setInvoices(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err.message || 'Failed to fetch invoices');
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
    const clientName = addressData.name || addressData.clientName || addressData.billToClientName || '';
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
          <p>Loading invoices...</p>
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
        <h1 className="history-title">Invoice History</h1>
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <h2>No Invoices Found</h2>
            <p>There are no invoices in the database yet.</p>
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
                  // Get actual invoice number - check multiple sources
                  let actualInvoiceNumber = invoice.invoiceNumber;
                  
                  // If invoiceNumber is "Auto" or empty, try to get from fullInvoiceData
                  if (!actualInvoiceNumber || actualInvoiceNumber === 'Auto' || actualInvoiceNumber.trim() === '') {
                    // Try different paths in fullInvoiceData
                    if (invoice.fullInvoiceData?.invoiceNumber && invoice.fullInvoiceData.invoiceNumber !== 'Auto') {
                      actualInvoiceNumber = invoice.fullInvoiceData.invoiceNumber;
                    } else if (invoice.fullInvoiceData?.invoiceDetails?.number && invoice.fullInvoiceData.invoiceDetails.number !== 'Auto') {
                      actualInvoiceNumber = invoice.fullInvoiceData.invoiceDetails.number;
                    } else if (invoice.fullInvoiceData?.invoiceNumber) {
                      actualInvoiceNumber = invoice.fullInvoiceData.invoiceNumber;
                    } else {
                      // Generate invoice number from ID if available
                      if (invoice._id) {
                        // Use last 6 characters of MongoDB ID as invoice number
                        const idStr = invoice._id.toString();
                        actualInvoiceNumber = `INV-${idStr.slice(-6).toUpperCase()}`;
                      } else {
                        actualInvoiceNumber = '-';
                      }
                    }
                  }
                  
                  // Get project name from multiple possible locations
                  const projectName = invoice.projectName || 
                                     invoice.fullInvoiceData?.projectName ||
                                     invoice.fullInvoiceData?.formData?.projectName || '-';
                  
                  // Get reference number
                  const referenceNo = invoice.referenceNo || 
                                     invoice.fullInvoiceData?.invoiceDetails?.referenceNo ||
                                     invoice.fullInvoiceData?.formData?.referenceNo || '-';
                  
                  // Get vendor address data
                  const vendorData = formatAddressData(invoice.toAddress, invoice.fullInvoiceData);
                  const hasNameOrCompany = vendorData.name || vendorData.company;
                  const hasAddress = vendorData.address;
                  
                  return (
                  <tr key={invoice._id}>
                    <td className="serial-number">{index + 1}</td>
                    <td>{projectName}</td>
                    <td>{referenceNo}</td>
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
                    <td className="invoice-number">{actualInvoiceNumber}</td>
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

export default InvoiceHistory;

