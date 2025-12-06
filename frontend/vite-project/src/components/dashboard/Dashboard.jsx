import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.jpg';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [showHistory, setShowHistory] = useState(false);

  const handleNavigation = (page) => {
    switch(page) {
      case 'invoice':
        navigate('/invoice');
        break;
      case 'quotation':
        navigate('/quotation-form');
        break;
      case 'proforma':
        navigate('/proforma-invoice');
        break;
      case 'purchase-order':
        navigate('/purchase-order');
        break;
      default:
        break;
    }
  };

  const handleHistoryNavigation = (type) => {
    switch(type) {
      case 'invoice':
        navigate('/history/invoice');
        break;
      case 'quotation':
        navigate('/history/quotation');
        break;
      case 'proforma-invoice':
        navigate('/history/proforma-invoice');
        break;
      case 'reference':
        navigate('/history/reference');
        break;
      case 'purchase-order':
        navigate('/history/purchase-order');
        break;
      default:
        break;
    }
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  return (
    <div className="dashboard-container">
      {/* Header Section */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-container">
            <img src={logo} alt="Vista Logo" className="logo" />
          </div>
          <div className="company-info">
            <h1 className="company-name">VISTA ENGG SOLUTIONS PRIVATE LIMITED</h1>
            <h2 className="app-heading">PURCHASE APP</h2>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="main-content-wrapper">
          <div className="buttons-container">
          <button 
            className="nav-button quotation-button"
            onClick={() => handleNavigation('quotation')}
          >
            <div className="button-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <span className="button-text">Quotation</span>
          </button>

          <button 
            className="nav-button proforma-button"
            onClick={() => handleNavigation('proforma')}
          >
            <div className="button-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h11.25c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <span className="button-text">Proforma Invoice</span>
          </button>

          <button 
            className="nav-button invoice-button"
            onClick={() => handleNavigation('invoice')}
          >
            <div className="button-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <span className="button-text">Invoice</span>
          </button>

          <button 
            className="nav-button purchase-order-button"
            onClick={() => handleNavigation('purchase-order')}
          >
            <div className="button-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3 .75A.75.75 0 1018 9a.75.75 0 000 1.5z" />
              </svg>
            </div>
            <span className="button-text">Purchase Order</span>
          </button>
        </div>

        {/* View History Button */}
        <div className="history-section">
          <button 
            className="history-toggle-button"
            onClick={toggleHistory}
          >
            <div className="history-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="history-toggle-text">
              {showHistory ? 'Hide History' : 'View History'}
            </span>
            <svg 
              className={`history-arrow ${showHistory ? 'rotated' : ''}`}
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={2} 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {/* History Buttons Container */}
          {showHistory && (
            <div className="history-buttons-container">
              <button 
                className="history-button history-quotation-button"
                onClick={() => handleHistoryNavigation('quotation')}
              >
                <div className="history-button-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span className="history-button-text">History of Quotation</span>
              </button>

              <button 
                className="history-button history-proforma-button"
                onClick={() => handleHistoryNavigation('proforma-invoice')}
              >
                <div className="history-button-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span className="history-button-text">History of Proforma Invoice</span>
              </button>

              <button 
                className="history-button history-invoice-button"
                onClick={() => handleHistoryNavigation('invoice')}
              >
                <div className="history-button-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span className="history-button-text">History of Invoice</span>
              </button>

              <button 
                className="history-button history-purchase-order-button"
                onClick={() => handleHistoryNavigation('purchase-order')}
              >
                <div className="history-button-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span className="history-button-text">History of Purchase Order</span>
              </button>

              <button 
                className="history-button history-reference-button"
                onClick={() => handleHistoryNavigation('reference')}
              >
                <div className="history-button-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
                <span className="history-button-text">Search</span>
              </button>
            </div>
          )}
        </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
