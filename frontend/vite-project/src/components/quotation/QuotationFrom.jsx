import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { QuotationContext } from "../../context/QuotationContext"; 

const QuotationFrom = () => {
  const navigate = useNavigate();
  const { setQuotationFrom } = useContext(QuotationContext);
  const [selectedOffice, setSelectedOffice] = useState("");

  const officeOptions = [
    {
      label: "USA Head Office",
      companyName: "VISTA Engg Solutions Inc",
      address: `1999 S, Bascom Ave, Ste 700
Campbell, California, USA 95008`,
    },
    {
      label: "USA Regional Office",
      companyName: "VISTA Engg Solutions Inc",
      address: `41 Hutchin Drive, Building 3, PMB# 9206
Portland, Maine, USA 04102`,
    },
    {
      label: "Germany Office 1",
      companyName: "VISTA Engg Solutions GmbH",
      address: `Wolframstr. 24,
70191 Stuttgart, Germany`,
    },
    {
      label: "Germany Office 2",
      companyName: "VISTA Engg Solutions GmbH",
      address: `Friedrichstrasse 15,
Stuttgart, Germany`,
    },
    {
      label: "India ODC Office",
      companyName: "VISTA Engg Solutions Pvt Ltd",
      address: `IndiaLand Tech Park, CHIL-SEZ Campus
Coimbatore, Tamil Nadu - 641035, India`,
    },
  ];

  const handleSave = () => {
    if (!selectedOffice) {
      alert("Please select an office location.");
      return;
    }

    const chosen = officeOptions.find((o) => o.label === selectedOffice);

    setQuotationFrom({
      companyName: chosen.companyName,
      address: chosen.address,
    });

    navigate("/quotation-home");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      {/* Title */}
      <h1 className="text-3xl font-bold text-indigo-700 mb-8">
        Quotation From — Select Company
      </h1>

      {/* Form Card */}
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-lg border border-gray-200 space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-3">
            Choose Company Office
          </label>
          <select
            value={selectedOffice}
            onChange={(e) => setSelectedOffice(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">-- Select Office Location --</option>
            {officeOptions.map((office, index) => (
              <option key={index} value={office.label}>
                {office.label}
              </option>
            ))}
          </select>
        </div>

        {/* Show Address */}
        {selectedOffice && (
          <div className="mt-4 bg-gray-100 rounded-lg p-4 border border-gray-300">
            <h3 className="font-semibold text-gray-800 mb-2">
              {selectedOffice} Address:
            </h3>
            <p className="text-gray-600 whitespace-pre-line">
              {
                officeOptions.find((o) => o.label === selectedOffice)
                  ?.address
              }
            </p>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSave}
            className="bg-indigo-600 text-white py-2 px-6 rounded-lg hover:bg-indigo-700 transition duration-200"
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuotationFrom;
