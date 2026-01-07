import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, X } from "lucide-react"; 
import { QuotationContext } from "../../context/QuotationContext";
import { getNextQuotationNumber, getAllQuotations } from "../../services/api";
import { getCurrentFinancialYear, extractFinancialYear, extractSequenceNumber, buildDocumentNumber } from "../../utils/financialYear.js";

const QuotationHome = () => {
  const navigate = useNavigate();
  const { quotationFor, quotationFrom, bankDetails, quotationDetails, setQuotationDetails } = useContext(QuotationContext);


  const [quotationNumber, setQuotationNumber] = useState("");
  const [sequenceDigits, setSequenceDigits] = useState("0001");
  const [quotationError, setQuotationError] = useState("");
  const [generatedSequence, setGeneratedSequence] = useState(null);
  const [issueDate, setIssueDate] = useState("");
  const [showQuotationForModal, setShowQuotationForModal] = useState(false);
  const [showQuotationFromModal, setShowQuotationFromModal] = useState(false);
  const [showBankDetailsModal, setShowBankDetailsModal] = useState(false);
  const [showDeliveryDetailsModal, setShowDeliveryDetailsModal] = useState(false);

  useEffect(() => {
    const initializeQuotation = async () => {
      // Use quotation number from context if available, otherwise generate new one
      if (quotationDetails?.quotationNo) {
        const fullNumber = quotationDetails.quotationNo;
        setQuotationNumber(fullNumber);
        const seq = extractSequenceNumber(fullNumber);
        if (seq !== null) {
          setSequenceDigits(seq.toString().padStart(4, '0'));
          setGeneratedSequence(seq);
        }
      } else {
        try {
          const newQuotationNo = await getNextQuotationNumber();
          setQuotationNumber(newQuotationNo);
          const seq = extractSequenceNumber(newQuotationNo);
          if (seq !== null) {
            setSequenceDigits(seq.toString().padStart(4, '0'));
            setGeneratedSequence(seq);
          }
          setQuotationDetails(prev => ({ ...prev, quotationNo: newQuotationNo }));
        } catch (error) {
          console.error('Error generating quotation number:', error);
          // Fallback
          const financialYear = getCurrentFinancialYear();
          const fallbackNo = buildDocumentNumber('QT', financialYear, 1);
          setQuotationNumber(fallbackNo);
          setSequenceDigits('0001');
          setGeneratedSequence(1);
          setQuotationDetails(prev => ({ ...prev, quotationNo: fallbackNo }));
        }
      }
      
      // Use issue date from context if available
      if (quotationDetails?.issueDate) {
        setIssueDate(quotationDetails.issueDate);
      }
    };
    
    initializeQuotation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update full quotation number when sequence digits change
  useEffect(() => {
    if (quotationNumber && sequenceDigits) {
      const financialYear = extractFinancialYear(quotationNumber) || getCurrentFinancialYear();
      const newFullNumber = buildDocumentNumber('QT', financialYear, sequenceDigits);
      if (newFullNumber !== quotationNumber) {
        setQuotationNumber(newFullNumber);
        setQuotationDetails(prev => ({ ...prev, quotationNo: newFullNumber }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequenceDigits]);

  // Validate quotation number
  const validateQuotationNumber = async () => {
    const seq = parseInt(sequenceDigits, 10);
    if (isNaN(seq) || seq < 1 || seq > 9999) {
      setQuotationError('Sequence must be between 0001 and 9999');
      return false;
    }

    // Check ascending order
    if (generatedSequence !== null && seq < generatedSequence) {
      setQuotationError(`Sequence must be ${generatedSequence.toString().padStart(4, '0')} or higher`);
      return false;
    }

    // Check uniqueness
    try {
      const allQuotations = await getAllQuotations();
      const financialYear = extractFinancialYear(quotationNumber) || getCurrentFinancialYear();
      const checkNumber = buildDocumentNumber('QT', financialYear, seq);
      
      const existing = allQuotations.find(q => {
        const qNo = q.quotationNo || q.fullQuotationData?.quotationNo || '';
        return qNo === checkNumber;
      });

      if (existing) {
        setQuotationError('This quotation number already exists. Please use a different number.');
        return false;
      }
    } catch (error) {
      console.error('Error checking quotation number uniqueness:', error);
      setQuotationError('Could not verify quotation number uniqueness. Please check manually.');
      return false;
    }

    setQuotationError('');
    return true;
  };

  const handleSequenceChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setSequenceDigits(value.padStart(4, '0'));
    setQuotationError('');
  };

  const handleSequenceBlur = async () => {
    if (sequenceDigits) {
      await validateQuotationNumber();
    }
  };

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
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-gray-700">QT</span>
            <span className="text-lg font-semibold text-gray-700">
              {extractFinancialYear(quotationNumber) || getCurrentFinancialYear()}
            </span>
            <input
              type="text"
              value={sequenceDigits}
              onChange={handleSequenceChange}
              onBlur={handleSequenceBlur}
              maxLength={4}
              className="w-20 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="0001"
            />
          </div>
          {quotationError && (
            <p className="text-red-500 text-sm mt-1">{quotationError}</p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            Full Number: <strong>{quotationNumber}</strong>
          </p>
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
        
        {/* Create New Quotation Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              console.log("✅ Create New Quotation clicked from home - navigating with clearForm flag...");
              navigate('/quotation-form', { 
                state: { clearForm: true, timestamp: Date.now() },
                replace: false
              });
            }}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition duration-200 font-semibold"
          >
            🆕 Create New Quotation
          </button>
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
