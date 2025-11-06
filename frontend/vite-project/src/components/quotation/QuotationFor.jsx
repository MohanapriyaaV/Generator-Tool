import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { QuotationContext } from "../../context/QuotationContext"; 

export default function QuotationFor() {
  const { quotationFor, setQuotationFor } = useContext(QuotationContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setQuotationFor({ ...quotationFor, [name]: value });
  };

  const handleSaveAndContinue = () => {
    // You can validate fields here if needed
    navigate("/quotation-home");
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-2xl">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        Quotation For
      </h2>

      <form className="space-y-4">
        {/* Person Name */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Person Name
          </label>
          <input
            type="text"
            name="personName"
            value={quotationFor.personName}
            onChange={handleChange}
            placeholder="Enter person's name"
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Company Name
          </label>
          <input
            type="text"
            name="companyName"
            value={quotationFor.companyName}
            onChange={handleChange}
            placeholder="Enter company name"
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Address
          </label>
          <textarea
            name="address"
            value={quotationFor.address}
            onChange={handleChange}
            placeholder="Enter company address"
            rows="3"
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Save & Continue Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSaveAndContinue}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Save & Continue →
          </button>
        </div>
      </form>
    </div>
  );
}
