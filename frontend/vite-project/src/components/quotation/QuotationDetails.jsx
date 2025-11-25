import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QuotationContext } from "../../context/QuotationContext"; 

const QuotationDetails = () => {
  const navigate = useNavigate();
  const { quotationDetails, setQuotationDetails } = useContext(QuotationContext);

  const [details, setDetails] = useState({
    projectName: quotationDetails?.projectName || "",
    deliveryDays: quotationDetails?.deliveryDays || "",
    validityDays: quotationDetails?.validityDays || "",
    paymentDays: quotationDetails?.paymentDays || "",
  });

  // Sync state when quotationDetails from context changes
  useEffect(() => {
    if (quotationDetails) {
      setDetails({
        projectName: quotationDetails.projectName || "",
        deliveryDays: quotationDetails.deliveryDays || "",
        validityDays: quotationDetails.validityDays || "",
        paymentDays: quotationDetails.paymentDays || "",
      });
    }
  }, [quotationDetails]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // ✅ Allow only numbers for numeric fields, allow text for projectName
    if (name === 'projectName' || /^\d*$/.test(value)) {
      setDetails((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // ✅ Save details to context
    setQuotationDetails({
      projectName: details.projectName,
      deliveryDays: details.deliveryDays,
      validityDays: details.validityDays,
      paymentDays: details.paymentDays,
    });

    // ✅ Navigate back
    navigate("/quotation-home");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md border border-gray-200">
        <h2 className="text-2xl font-semibold text-indigo-700 mb-6 text-center">
          Delivery & Payment Details
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Project Name
            </label>
            <input
              type="text"
              name="projectName"
              value={details.projectName}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Enter project name"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Delivery Period (in days)
            </label>
            <input
              type="text"
              name="deliveryDays"
              value={details.deliveryDays}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Enter delivery days"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Quotation Validity (in days)
            </label>
            <input
              type="text"
              name="validityDays"
              value={details.validityDays}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Enter validity days"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Payment Terms (in days)
            </label>
            <input
              type="text"
              name="paymentDays"
              value={details.paymentDays}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Enter payment days"
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

export default QuotationDetails;
