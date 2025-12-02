import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllQuotations } from '../../services/api';
import './History.css';

const QuotationHistory = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const data = await getAllQuotations();
      setQuotations(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching quotations:', err);
      setError(err.message || 'Failed to fetch quotations');
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

  const formatAddressData = (address, fullQuotationData) => {
    // Get address data from multiple possible locations
    const addressData = address || fullQuotationData?.quotationFor || {};
    
    // Get name and company name
    const personName = addressData.personName || '';
    const companyName = addressData.companyName || '';
    
    // Build address parts (without name/company)
    const addressParts = [];
    
    // Street
    if (addressData.street) {
      addressParts.push(addressData.street);
    }
    
    // Apartment
    if (addressData.apartment) {
      addressParts.push(addressData.apartment);
    }
    
    // City, State, ZipCode
    const cityParts = [];
    if (addressData.city) cityParts.push(addressData.city);
    if (addressData.stateCode || addressData.state) {
      cityParts.push(addressData.stateCode || addressData.state);
    }
    if (addressData.zipCode) cityParts.push(addressData.zipCode);
    if (cityParts.length > 0) {
      addressParts.push(cityParts.join(', '));
    }
    
    // Country
    if (addressData.countryCode || addressData.country) {
      addressParts.push(addressData.countryCode || addressData.country);
    }
    
    const addressString = addressParts.length > 0 ? addressParts.join(', ') : '';
    
    // If we have a formatted address string and no granular data, parse it
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

  const handleBack = () => {
    navigate('/');
  };

  const normalizeText = (value) => {
    if (!value && value !== 0) return '';
    return String(value);
  };

  const rowMatchesSearch = (quotation) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();

    const referenceNo = quotation.referenceNo || quotation.fullQuotationData?.quotationDetails?.referenceNo || '';
    const projectName = quotation.projectName ||
      quotation.fullQuotationData?.quotationDetails?.projectName ||
      quotation.quotationDetails?.projectName || '';
    const vendorData = formatAddressData(quotation.toAddress, quotation.fullQuotationData);
    const quotationNo = quotation.quotationNo || '';
    const amountText = normalizeText(quotation.totalAmount);

    const searchable = [
      projectName,
      referenceNo,
      vendorData.name,
      vendorData.company,
      vendorData.address,
      quotationNo,
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
          <p>Loading quotations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-container">
        <div className="error-message">
          <h2>Connection Error</h2>
          <p>{error}</p>
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '4px', border: '1px solid #ffc107' }}>
            <strong>💡 Troubleshooting:</strong>
            <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
              <li>Make sure the backend server is running</li>
              <li>Check if the server is running on port 5000</li>
              <li>Try running: <code style={{ backgroundColor: '#f0f0f0', padding: '2px 4px', borderRadius: '2px' }}>cd backend && npm start</code></li>
            </ul>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <button onClick={fetchQuotations} className="retry-button">Retry</button>
            <button onClick={handleBack} className="back-button">Back to Dashboard</button>
          </div>
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
        <h1 className="history-title">Quotation History</h1>
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
          <button onClick={fetchQuotations} className="refresh-button">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="history-content">
        {quotations.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <h2>No Quotations Found</h2>
            <p>There are no quotations in the database yet.</p>
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
                  <th>Quotation Number</th>
                  <th>Total Amount</th>
                  <th>PDF</th>
                </tr>
              </thead>
              <tbody>
                {quotations.filter(rowMatchesSearch).map((quotation, index) => {
                  // Get reference number from direct field or nested in fullQuotationData
                  const referenceNo = quotation.referenceNo || quotation.fullQuotationData?.quotationDetails?.referenceNo || '-';
                  
                  // Get project name from multiple possible locations
                  const projectName = quotation.projectName || 
                                     quotation.fullQuotationData?.quotationDetails?.projectName ||
                                     quotation.quotationDetails?.projectName || '-';
                  
                  // Get vendor address data
                  const vendorData = formatAddressData(quotation.toAddress, quotation.fullQuotationData);
                  const hasNameOrCompany = vendorData.name || vendorData.company;
                  const hasAddress = vendorData.address;
                  
                  return (
                  <tr key={quotation._id}>
                    <td className="serial-number">{index + 1}</td>
                    <td><Highlight text={projectName} /></td>
                    <td className="invoice-number"><Highlight text={referenceNo} /></td>
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
                      <Highlight text={quotation.quotationNo || '-'} />
                    </td>
                    <td className="amount-cell">
                      <Highlight text={formatAmount(quotation.totalAmount)} />
                    </td>
                    <td className="s3-url-cell">
                      {quotation.s3Url ? (
                        <a 
                          href={quotation.s3Url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="s3-link"
                          title={quotation.s3Url}
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

export default QuotationHistory;

