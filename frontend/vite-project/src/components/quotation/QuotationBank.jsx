import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { QuotationContext } from "../../context/QuotationContext"; 

const QuotationBank = () => {
  const navigate = useNavigate();
  const { setBankDetails } = useContext(QuotationContext);

  const [bankDetails, setLocalBankDetails] = useState({
    bankName: "",
    accountNumber: "",
    branch: "",
    ifscCode: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalBankDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // ✅ Save to global context
    setBankDetails({
      bankName: bankDetails.bankName,
      accountNumber: bankDetails.accountNumber,
      branch: bankDetails.branch,
      ifscCode: bankDetails.ifscCode,
    });

    // ✅ Navigate back
    navigate("/quotation-home");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md border border-gray-200">
        <h2 className="text-2xl font-semibold text-indigo-700 mb-6 text-center">
          Bank Details
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Bank Name</label>
            <input
              type="text"
              name="bankName"
              value={bankDetails.bankName}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Enter Bank Name"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">Account Number</label>
            <input
              type="text"
              name="accountNumber"
              value={bankDetails.accountNumber}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Enter Account Number"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">Branch</label>
            <input
              type="text"
              name="branch"
              value={bankDetails.branch}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Enter Branch Name or Address"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">IFSC Code</label>
            <input
              type="text"
              name="ifscCode"
              value={bankDetails.ifscCode}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Enter IFSC Code"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition duration-200"
          >
            Save & Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuotationBank;
