import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { InvoiceContext } from '../context/InvoiceContext';

const BankDetailsForm = () => {
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [branchIfsc, setBranchIfsc] = useState('');
  const [pan, setPan] = useState('');
  const navigate = useNavigate();
  const { setBankDetails } = useContext(InvoiceContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    setBankDetails({ bankName, accountNo, branchIfsc, pan });
    navigate('/items'); // Go back to Purchase Items Details after saving
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-200 to-violet-400 flex flex-col items-center justify-center py-10 px-2">
      <form onSubmit={handleSubmit} className="bg-white/90 shadow-xl rounded-2xl p-8 w-full max-w-md flex flex-col items-center">
        <div className="text-2xl font-extrabold text-violet-700 mb-8 tracking-tight text-center drop-shadow">Company's Bank Details</div>
        <div className="w-full mb-4">
          <label className="block text-violet-900 font-semibold mb-1">Bank Name</label>
          <input
            type="text"
            value={bankName}
            onChange={e => setBankName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-400 focus:outline-none shadow-sm"
          />
        </div>
        <div className="w-full mb-4">
          <label className="block text-violet-900 font-semibold mb-1">A/C No.</label>
          <input
            type="text"
            value={accountNo}
            onChange={e => setAccountNo(e.target.value)}
            required
            className="w-full px-3 py-2 border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-400 focus:outline-none shadow-sm"
          />
        </div>
        <div className="w-full mb-4">
          <label className="block text-violet-900 font-semibold mb-1">Branch & IFS Code</label>
          <input
            type="text"
            value={branchIfsc}
            onChange={e => setBranchIfsc(e.target.value)}
            required
            className="w-full px-3 py-2 border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-400 focus:outline-none shadow-sm"
          />
        </div>
        <div className="w-full mb-4">
          <label className="block text-violet-900 font-semibold mb-1">Company's PAN</label>
          <input
            type="text"
            value={pan}
            onChange={e => setPan(e.target.value)}
            required
            className="w-full px-3 py-2 border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-400 focus:outline-none shadow-sm"
          />
        </div>
        <button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 transition text-white py-2 rounded-lg font-medium shadow">Save & Continue</button>
      </form>
    </div>
  );
};

export default BankDetailsForm;
