import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, X } from "lucide-react"; 
import { QuotationContext } from "../../context/QuotationContext";

const QuotationHome = () => {
  const navigate = useNavigate();
  const { quotationFor, quotationFrom, bankDetails, quotationDetails, setQuotationDetails } = useContext(QuotationContext);


  const [quotationNumber, setQuotationNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [showQuotationForModal, setShowQuotationForModal] = useState(false);
  const [showQuotationFromModal, setShowQuotationFromModal] = useState(false);
  const [showBankDetailsModal, setShowBankDetailsModal] = useState(false);
  const [showDeliveryDetailsModal, setShowDeliveryDetailsModal] = useState(false);

  useEffect(() => {
    // Use quotation number from context if available, otherwise generate new one
    if (quotationDetails?.quotationNo) {
      setQuotationNumber(quotationDetails.quotationNo);
    } else {
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randomPart = Math.floor(100 + Math.random() * 900);
      const newQuotationNo = `QT-${datePart}-${randomPart}`;
      setQuotationNumber(newQuotationNo);
      // Save to context
      setQuotationDetails(prev => ({ ...prev, quotationNo: newQuotationNo }));
    }
    
    // Use issue date from context if available
    if (quotationDetails?.issueDate) {
      setIssueDate(quotationDetails.issueDate);
    }
  }, [quotationDetails, setQuotationDetails]);

  // Update context when issue date changes
  const handleIssueDateChange = (e) => {
    const newDate = e.target.value;
    setIssueDate(newDate);
    setQuotationDetails(prev => ({ ...prev, issueDate: newDate }));
  };

  const RowWithEye = ({ label, onClick, onEyeClick }) => (
    <div className="flex items-center space-x-3">
      <button
        onClick={onClick}
        className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition duration-200"
      >
        {label}
      </button>
      <button
        onClick={onEyeClick}
        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
      >
        <Eye size={20} className="text-gray-600" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <h1 className="text-3xl font-bold text-indigo-700 mb-8">
        VISTA Quotation Generator Tool
      </h1>

      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-2xl space-y-6 border border-gray-200">
        {/* Quotation For */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Quotation For
          </label>
          <RowWithEye
            label="Select Customer"
            onClick={() => navigate("/quotation-for")}
            onEyeClick={() => setShowQuotationForModal(true)}
          />
        </div>

        {/* Quotation From */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Quotation From
          </label>
          <RowWithEye
            label="Select Company"
            onClick={() => navigate("/quotation-from")}
            onEyeClick={() => setShowQuotationFromModal(true)}
          />
        </div>

        {/* Issue Date */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Issue Date
          </label>
          <input
            type="date"
            value={issueDate}
            onChange={handleIssueDateChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Bank Details */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Bank Details
          </label>
          <RowWithEye
            label="Add Bank Details"
            onClick={() => navigate("/quotation-bank")}
            onEyeClick={() => setShowBankDetailsModal(true)}
          />
        </div>

        {/* Quotation Number */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Quotation Number
          </label>
          <input
            type="text"
            value={quotationNumber}
            readOnly
            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed"
          />
        </div>

      {/* Delivery Details */}
      <div>
          <label className="block text-gray-700 font-medium mb-2">
            Delivery Details
          </label>
          <RowWithEye
            label="Add Delivery Details"
            onClick={() => navigate("/quotation-details")}
            onEyeClick={() => setShowDeliveryDetailsModal(true)}
          />
      </div>

        {/* Quotation Items */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Quotation Items
          </label>
          <RowWithEye
            label="Add Quotation Item Details"
            onClick={() => navigate("/quotation-table")}
            onEyeClick={() => alert("View added quotation items by pressing the Add Quotation Item Details button at left")}
          />
        </div>
      </div>

      {/* Modal for Quotation For */}
      {showQuotationForModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowQuotationForModal(false)}
              className="absolute top-3 right-3 p-1 rounded hover:bg-gray-200"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold mb-4">Quotation For Details</h2>
            <p><strong>Person Name:</strong> {quotationFor.personName || "-"}</p>
            <p><strong>Company Name:</strong> {quotationFor.companyName || "-"}</p>
            <p><strong>Address:</strong> {quotationFor.address || "-"}</p>
          </div>
        </div>
      )}

      {/* Modal for Quotation From */}
      {showQuotationFromModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowQuotationFromModal(false)}
              className="absolute top-3 right-3 p-1 rounded hover:bg-gray-200"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold mb-4">Quotation From Details</h2>
            <p><strong>Company Name:</strong> {quotationFrom.companyName || "-"}</p>
            <p><strong>Address:</strong> {quotationFrom.address || "-"}</p>
          </div>
        </div>
      )}

      {/* Modal for Bank Details */}
      {showBankDetailsModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowBankDetailsModal(false)}
              className="absolute top-3 right-3 p-1 rounded hover:bg-gray-200"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold mb-4">Bank Details</h2>
            <p><strong>Bank Name:</strong> {bankDetails.bankName || "-"}</p>
            <p><strong>Account Number:</strong> {bankDetails.accountNumber || "-"}</p>
            <p><strong>Branch:</strong> {bankDetails.branch || "-"}</p>
            <p><strong>IFSC Code:</strong> {bankDetails.ifscCode || "-"}</p>
          </div>
        </div>
      )}

      {showDeliveryDetailsModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowDeliveryDetailsModal(false)}
              className="absolute top-3 right-3 p-1 rounded hover:bg-gray-200"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold mb-4">Delivery & Payment Details</h2>
            <p><strong>Project Name:</strong> {quotationDetails.projectName || "-"}</p>
            <p><strong>Delivery Period:</strong> {quotationDetails.deliveryDays || "-"} days</p>
            <p><strong>Quotation Validity:</strong> {quotationDetails.validityDays || "-"} days</p>
            <p><strong>Payment Terms:</strong> {quotationDetails.paymentDays || "-"} days</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationHome;
