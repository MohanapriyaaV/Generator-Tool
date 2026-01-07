import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InvoiceContext } from '../../context/InvoiceContext';

const Home = () => {
  const [logo, setLogo] = useState(null);
  const [issueDate, setIssueDate] = useState("");
  const navigate = useNavigate();
  const { setCustomerDetails, setInvoiceNumber, setIssueDate: setIssueDateContext, setLogo: setLogoContext } = useContext(InvoiceContext);

  // Invoice number will be auto-generated in InvoiceFormSinglePage
  // Using a temporary placeholder here
  const invoiceNumber = 'INV0000';

  // Set invoice number and issue date in context when component mounts or values change
  useEffect(() => {
    setInvoiceNumber(invoiceNumber);
  }, [invoiceNumber, setInvoiceNumber]);

  useEffect(() => {
    if (issueDate) {
      setIssueDateContext(issueDate);
    }
  }, [issueDate, setIssueDateContext]);

  useEffect(() => {
    if (logo) {
      setLogoContext(logo);
    }
  }, [logo, setLogoContext]);

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogo(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleRemoveLogo = () => {
    setLogo(null);
  };

  return (
    <div className="bg-gradient-to-br from-violet-200 to-violet-400 min-h-screen flex flex-col items-center justify-center py-10 px-2">
      <div className="bg-white/90 shadow-xl rounded-2xl p-8 w-full max-w-lg flex flex-col items-center">
        <div className="text-3xl md:text-3xl font-extrabold text-violet-700 mb-8 tracking-tight text-center drop-shadow">VISTA Invoice Generator Tool</div>
        {/* Company Logo Upload */}
        <div className="w-full flex flex-col items-center mb-6">
          <div className="flex items-center w-full gap-3">
            <span className="text-violet-900 font-semibold whitespace-nowrap">Add Company Logo</span>
            <div className="flex-1 flex items-center gap-2">
              {logo && (
                <div className="relative">
                  <img src={logo} alt="Company Logo" className="h-16 w-16 object-contain rounded border border-violet-200 shadow-sm" />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 bg-white bg-opacity-90 rounded-full p-1 text-red-500 hover:bg-red-100 border border-red-300 shadow"
                    title="Remove logo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
                onChange={handleLogoChange}
                className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-100 file:text-violet-700 hover:file:bg-violet-200 focus:outline-none"
              />
            </div>
          </div>
        </div>
        {/* FROM Section */}
        <div className="w-full mb-4">
          {/* <div className="text-base font-semibold text-violet-900 mb-1">FROM</div> */}
        </div>
        {/* TO Section */}
        <div className="w-full mb-4">
          <div className="text-base font-semibold text-violet-900 mb-1">SHIPPING TO</div>
          <button className="w-full bg-violet-600 hover:bg-violet-700 transition text-white py-2 rounded-lg font-medium shadow" onClick={() => navigate('/customer')}>
            Add Customer Details
          </button>
        </div>
        {/* Issue Date */}
        <div className="w-full mb-4">
          <label className="block text-violet-900 font-semibold mb-1">Issue Date</label>
          <input
            type="date"
            value={issueDate}
            onChange={e => setIssueDate(e.target.value)}
            className="w-full px-3 py-2 border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-400 focus:outline-none shadow-sm"
          />
        </div>
        {/* Invoice Number (auto) */}
        <div className="w-full mb-2">
          <label className="block text-violet-900 font-semibold mb-1">Invoice Number</label>
          <div className="w-full px-3 py-2 border border-violet-200 rounded-lg bg-gray-100 text-gray-700 font-mono text-lg select-none">
            {invoiceNumber}
          </div>
        </div>
        {/* Add Purchase Item Details Button */}
        <div className="w-full mt-6 flex flex-col items-center gap-3">
          <button
            className="w-full bg-violet-500 hover:bg-violet-700 transition text-white py-2 rounded-lg font-semibold shadow-lg text-lg"
            onClick={() => navigate('/items')}
          >
            Add Purchase Item Details
          </button>
          
          {/* Create New Invoice Button */}
          <button
            onClick={() => {
              console.log("✅ Create New Invoice clicked from home - navigating with clearForm flag...");
              navigate('/invoice', { 
                state: { clearForm: true, timestamp: Date.now() },
                replace: false
              });
            }}
            className="w-full bg-green-600 hover:bg-green-700 transition text-white py-2 rounded-lg font-semibold shadow-lg text-lg"
          >
            🆕 Create New Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;