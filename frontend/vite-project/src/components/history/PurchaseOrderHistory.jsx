import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPurchaseOrders, getSignedUrl } from '../../services/api';
import './History.css';


const PurchaseOrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getAllPurchaseOrders();
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
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

  // Vendor info multi-line rendering
  const renderVendorInfo = (billToAddress) => {
    if (!billToAddress) return <span className="address-text">-</span>;
    
    // Build address line from available fields
    const addressParts = [
      billToAddress.street,
      billToAddress.apartment,
      billToAddress.city,
      billToAddress.state,
      billToAddress.zipCode
    ].filter(Boolean);
    const addressLine = addressParts.length > 0 ? addressParts.join(', ') : null;
    
    return (
      <div className="address-cell">
        <strong><Highlight text={billToAddress.companyName || '-'} /></strong>
        {billToAddress.clientName && (
          <span className="address-text">
            <Highlight text={billToAddress.clientName} />
          </span>
        )}
        {addressLine && (
          <span className="address-text">
            <Highlight text={addressLine} />
          </span>
        )}
        {billToAddress.country && (
          <span className="address-text">
            <Highlight text={billToAddress.country} />
          </span>
        )}
      </div>
    );
  };

  const normalizeText = (value) => {
    if (!value && value !== 0) return '';
    return String(value);
  };

  const rowMatchesSearch = (order) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();

    const vendor = order.billToAddress || {};
    const addressParts = [
      vendor.street,
      vendor.apartment,
      vendor.city,
      vendor.state,
      vendor.zipCode
    ].filter(Boolean);
    const addressLine = addressParts.join(', ');
    
    const searchable = [
      order.projectName || '',
      order.referenceNumber || '',
      order.poNumber || '',
      vendor.companyName || '',
      vendor.clientName || '',
      addressLine,
      vendor.city || '',
      vendor.state || '',
      vendor.country || '',
      normalizeText(order.totalAmount),
      formatDateTime(order.poDate || order.createdAt),
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

  return (
    <div className="history-container">
      <div className="history-header">
        <button className="back-button-header" onClick={() => navigate('/')}> 
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
          <span>Back</span>
        </button>
        <h1 className="history-title">Purchase Order History</h1>
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
          <button className="refresh-button" onClick={fetchOrders} disabled={loading}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0A8.003 8.003 0 0012 20a8.003 8.003 0 007.418-11" /></svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="history-content">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <h2>Error</h2>
            <p>{error}</p>
            <button className="retry-button" onClick={fetchOrders}>Retry</button>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5a3.375 3.375 0 00-3.375 3.375v2.625m9.75 0v2.625a3.375 3.375 0 01-3.375 3.375h-1.5a3.375 3.375 0 01-3.375-3.375v-2.625m9.75 0a3.375 3.375 0 00-3.375-3.375h-1.5a3.375 3.375 0 00-3.375 3.375v2.625" /></svg>
            <h2>No purchase orders found.</h2>
            <p>Purchase Order history will be displayed here.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Project Name</th>
                  <th>Reference Number</th>
                  <th>PO Number</th>
                  <th>Vendor Name</th>
                  <th>Date & Time</th>
                  <th className="amount-cell">Total Amount</th>
                  <th className="s3-url-cell">PDF</th>
                </tr>
              </thead>
              <tbody>
                {orders.filter(rowMatchesSearch).map((order, idx) => (
                  <tr key={order._id || idx}>
                    <td className="serial-number">{idx + 1}</td>
                    <td><Highlight text={order.projectName || '-'} /></td>
                    <td>
                      {order.referenceNumber ? (
                        <span className="invoice-number">
                          <Highlight text={order.referenceNumber} />
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      <Highlight text={order.poNumber || '-'} />
                    </td>
                    <td>{renderVendorInfo(order.billToAddress)}</td>
                    <td>
                      <Highlight text={formatDateTime(order.createdAt || order.poDate)} />
                    </td>
                    <td className="amount-cell">
                      <Highlight text={formatAmount(order.totalAmount)} />
                    </td>
                    <td className="s3-url-cell">
                      {order.s3Url ? (
                        <a 
                          href="#" 
                          onClick={async (e) => {
                            e.preventDefault();
                            try {
                              const signedUrl = await getSignedUrl(order.s3Url);
                              window.open(signedUrl, '_blank', 'noopener,noreferrer');
                            } catch (error) {
                              console.error('Error getting signed URL:', error);
                              alert('Error opening PDF. Please try again.');
                            }
                          }}
                          className="s3-link"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 0a2 2 0 002 2h2a2 2 0 002-2m-6 0V7a2 2 0 012-2h6a2 2 0 012 2v10" /></svg>
                          View PDF
                        </a>
                      ) : (
                        <span className="no-url">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrderHistory;

