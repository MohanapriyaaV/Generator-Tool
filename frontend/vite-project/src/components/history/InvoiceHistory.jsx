import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllInvoices, getSignedUrl } from '../../services/api';
import './History.css';

const InvoiceHistory = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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
    const addressData = address || fullInvoiceData?.formData || fullInvoiceData?.billToAddress || {};
    
    // Get name and company name from various possible fields
    const clientName = addressData.name || 
                      addressData.clientName || 
                      addressData.billToClientName ||
                      fullInvoiceData?.billToAddress?.clientName ||
                      fullInvoiceData?.formData?.billToClientName || '';
                      
    const companyName = addressData.companyName || 
                       addressData.billToCompanyName ||
                       fullInvoiceData?.billToAddress?.companyName ||
                       fullInvoiceData?.formData?.billToCompanyName || '';
    
    // Build address parts (without name/company)
    const addressParts = [];
    
    // Street
    if (addressData.street || addressData.billToStreet || fullInvoiceData?.billToAddress?.street) {
      addressParts.push(addressData.street || addressData.billToStreet || fullInvoiceData?.billToAddress?.street);
    }
    
    // Apartment
    if (addressData.apartment || addressData.billToApartment || fullInvoiceData?.billToAddress?.apartment) {
      addressParts.push(addressData.apartment || addressData.billToApartment || fullInvoiceData?.billToAddress?.apartment);
    }
    
    // City, State, ZipCode
    const cityParts = [];
    if (addressData.city || addressData.billToCity || fullInvoiceData?.billToAddress?.city) {
      cityParts.push(addressData.city || addressData.billToCity || fullInvoiceData?.billToAddress?.city);
    }
    if (addressData.stateCode || addressData.billToStateCode || addressData.state || addressData.billToState || fullInvoiceData?.billToAddress?.state) {
      cityParts.push(addressData.stateCode || addressData.billToStateCode || addressData.state || addressData.billToState || fullInvoiceData?.billToAddress?.state);
    }
    if (addressData.zipCode || addressData.billToZipCode || fullInvoiceData?.billToAddress?.zipCode) {
      cityParts.push(addressData.zipCode || addressData.billToZipCode || fullInvoiceData?.billToAddress?.zipCode);
    }
    if (cityParts.length > 0) {
      addressParts.push(cityParts.join(', '));
    }
    
    // Country
    if (addressData.countryCode || addressData.billToCountryCode || addressData.country || addressData.billToCountry || fullInvoiceData?.billToAddress?.country) {
      addressParts.push(addressData.countryCode || addressData.billToCountryCode || addressData.country || addressData.billToCountry || fullInvoiceData?.billToAddress?.country);
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

  const normalizeText = (value) => {
    if (!value && value !== 0) return '';
    return String(value);
  };

  const rowMatchesSearch = (invoice) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();

    let actualInvoiceNumber = invoice.invoiceNumber;
    if (!actualInvoiceNumber || actualInvoiceNumber === 'Auto' || actualInvoiceNumber.trim() === '') {
      if (invoice.fullInvoiceData?.invoiceNumber && invoice.fullInvoiceData.invoiceNumber !== 'Auto') {
        actualInvoiceNumber = invoice.fullInvoiceData.invoiceNumber;
      } else if (invoice.fullInvoiceData?.invoiceDetails?.number && invoice.fullInvoiceData.invoiceDetails.number !== 'Auto') {
        actualInvoiceNumber = invoice.fullInvoiceData.invoiceDetails.number;
      } else if (invoice.fullInvoiceData?.invoiceNumber) {
        actualInvoiceNumber = invoice.fullInvoiceData.invoiceNumber;
      } else if (invoice._id) {
        const idStr = invoice._id.toString();
        actualInvoiceNumber = `INV-${idStr.slice(-6).toUpperCase()}`;
      } else {
        actualInvoiceNumber = '';
      }
    }

    const projectName = invoice.projectName ||
      invoice.fullInvoiceData?.projectName ||
      invoice.fullInvoiceData?.formData?.projectName || '';

    const referenceNo = invoice.referenceNo ||
      invoice.fullInvoiceData?.invoiceDetails?.referenceNo ||
      invoice.fullInvoiceData?.formData?.referenceNo || '';

    const vendorData = formatAddressData(invoice.toAddress, invoice.fullInvoiceData);
    const amountText = normalizeText(invoice.totalAmount);

    const searchable = [
      projectName,
      referenceNo,
      vendorData.name,
      vendorData.company,
      vendorData.address,
      actualInvoiceNumber,
      amountText,
    ].join(' ').toLowerCase();

    return searchable.includes(term);
  };

  const Highlight = ({ text }) => {
    if (!searchTerm.trim()) return <>{text}</>;

    const term = searchTerm;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = String(text ?? '').split(regex);

    return (
      <>
        {parts.map((part, idx) =>
          regex.test(part) ? (
            <span key={idx} className="highlight-match">{part}</span>
          ) : (
            <span key={idx}>{part}</span>
          )
        )}
      </>
    );
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
          <div className="history-search-wrapper">
            <input
              type="text"
              className="history-search-input"
              placeholder="Search by any word (project, vendor, number, amount...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
                {invoices.filter(rowMatchesSearch).map((invoice, index) => {
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
                  
                  // Get vendor address data - check both toAddress and billToAddress
                  const vendorData = formatAddressData(
                    invoice.toAddress || invoice.billToAddress, 
                    invoice.fullInvoiceData
                  );
                  const hasNameOrCompany = vendorData.name || vendorData.company;
                  const hasAddress = vendorData.address;
                  
                  return (
                  <tr key={invoice._id}>
                    <td className="serial-number">{index + 1}</td>
                    <td><Highlight text={projectName} /></td>
                    <td><Highlight text={referenceNo} /></td>
                    <td>
                      <div className="address-cell">
                        {hasNameOrCompany ? (
                          <>
                            {vendorData.name && <strong><Highlight text={vendorData.name} /></strong>}
                            {vendorData.name && vendorData.company && <br />}
                            {vendorData.company && <strong><Highlight text={vendorData.company} /></strong>}
                            {hasAddress && (hasNameOrCompany ? <br /> : '')}
                            {hasAddress && (
                              <span style={{ fontSize: '0.85em', color: '#666' }}>
                                <Highlight text={vendorData.address} />
                              </span>
                            )}
                            {!hasNameOrCompany && !hasAddress && '-'}
                          </>
                        ) : (
                          hasAddress ? (
                            <span style={{ fontSize: '0.85em', color: '#666' }}>
                              <Highlight text={vendorData.address} />
                            </span>
                          ) : '-'
                        )}
                      </div>
                    </td>
                    <td className="invoice-number">
                      <Highlight text={actualInvoiceNumber} />
                    </td>
                    <td className="amount-cell">
                      <Highlight text={formatAmount(invoice.totalAmount)} />
                    </td>
                    <td className="s3-url-cell">
                      {invoice.s3Url ? (
                        <a 
                          href="#" 
                          onClick={async (e) => {
                            e.preventDefault();
                            try {
                              const signedUrl = await getSignedUrl(invoice.s3Url);
                              window.open(signedUrl, '_blank', 'noopener,noreferrer');
                            } catch (error) {
                              console.error('Error getting signed URL:', error);
                              alert('Error opening PDF. Please try again.');
                            }
                          }}
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

