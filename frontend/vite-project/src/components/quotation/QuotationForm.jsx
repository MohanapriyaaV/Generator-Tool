import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuotationContext } from '../../context/QuotationContext';

const QuotationForm = () => {
  const {
    quotationFor,
    setQuotationFor,
    quotationFrom,
    setQuotationFrom,
    bankDetails,
    setBankDetails,
    quotationDetails,
    setQuotationDetails,
    quotationItems,
    setQuotationItems,
    globalTaxes,
    setGlobalTaxes,
  } = useContext(QuotationContext);

  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState('');
  const [terms, setTerms] = useState([
    "Our quotation is based on the SoW and technical details received from the client.",
    "The quotation is stated in Indian Rupees (INR) unless otherwise indicated.",
    "Pricing is inclusive of all GST taxes, fees and misc expenses.",
    "Customer is responsible for functional aspects of the product.",
    "Delivery period provided is from the date of receipt of the PO.",
    "Assumptions and other details are attached in the technical proposal."
  ]);

  const officeOptions = [
    {
      label: 'USA Head Office',
      companyName: 'VISTA Engg Solutions Inc',
      address: `1999 S, Bascom Ave, Ste 700\nCampbell, California, USA 95008`,
    },
    {
      label: 'USA Regional Office',
      companyName: 'VISTA Engg Solutions Inc',
      address: `41 Hutchin Drive, Building 3, PMB# 9206\nPortland, Maine, USA 04102`,
    },
    {
      label: 'Germany Office 1',
      companyName: 'VISTA Engg Solutions GmbH',
      address: `Wolframstr. 24,\n70191 Stuttgart, Germany`,
    },
    {
      label: 'Germany Office 2',
      companyName: 'VISTA Engg Solutions GmbH',
      address: `Friedrichstrasse 15,\nStuttgart, Germany`,
    },
    {
      label: 'India ODC Office',
      companyName: 'VISTA Engg Solutions Pvt Ltd',
      address: `IndiaLand Tech Park, CHIL-SEZ Campus\nCoimbatore, Tamil Nadu - 641035, India`,
    },
  ];

  // Generate quotation number and default issue date once
  useEffect(() => {
    if (!quotationDetails?.quotationNo) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const newQuotationNo = `QT${year}${month}${randomNum}`;
      setQuotationDetails(prev => ({ ...prev, quotationNo: newQuotationNo, issueDate: today.toISOString().split('T')[0] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLocationChange = (e) => {
    const selected = e.target.value;
    setSelectedLocation(selected);
    if (selected) {
      const office = officeOptions.find(o => o.label === selected);
      if (office) {
        setQuotationFrom({ ...quotationFrom, companyName: office.companyName, address: office.address });
      }
    }
  };

  const handleAddItem = () => {
    setQuotationItems([...quotationItems, { name: '', qty: 1, rate: 0, hsn: '', amount: 0 }]);
  };

  const handleRemoveItem = (index) => {
    const newItems = quotationItems.filter((_, idx) => idx !== index);
    setQuotationItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...quotationItems];
    const item = { ...newItems[index], [field]: value };
    if (field === 'rate' || field === 'qty') {
      const rate = Number(item.rate) || 0;
      const qty = Number(item.qty) || 0;
      item.amount = rate * qty;
    }
    newItems[index] = item;
    setQuotationItems(newItems);
  };

  const handleTermChange = (index, value) => {
    const newTerms = [...terms];
    newTerms[index] = value;
    setTerms(newTerms);
  };

  const subtotal = quotationItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const cgstAmount = subtotal * (Number(globalTaxes?.cgst || 0)) / 100;
  const sgstAmount = subtotal * (Number(globalTaxes?.sgst || 0)) / 100;
  const igstAmount = subtotal * (Number(globalTaxes?.igst || 0)) / 100;
  const totalTax = cgstAmount + sgstAmount + igstAmount;
  const grandTotal = subtotal + totalTax;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-lg p-6 shadow mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Quotation Builder</h1>
            <div className="text-right">
              <div className="text-sm opacity-90">Quotation No</div>
              <div className="font-semibold text-lg">{quotationDetails?.quotationNo || 'QT-XXXX'}</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end space-x-3">
            <label className="text-sm">Quotation Date</label>
            <input
              type="date"
              value={quotationDetails?.issueDate || ''}
              onChange={(e) => setQuotationDetails(prev => ({ ...prev, issueDate: e.target.value }))}
              className="bg-white text-slate-800 rounded px-2 py-1 border"
            />
          </div>
        </div>

     {/* Office Selection + Quotation Details */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

  {/* Select Company Office */}
  <div className="bg-white rounded-lg p-6 shadow">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Select Company Office
    </label>
    <select
      className="w-full p-2 border rounded focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
      value={selectedLocation}
      onChange={handleLocationChange}
    >
      <option value="">-- Select Office Location --</option>
      {officeOptions.map((office, i) => (
        <option key={i} value={office.label}>{office.label}</option>
      ))}
    </select>
  </div>

  {/* Quotation Details (now horizontal fields) */}
  <div className="bg-white rounded-lg p-6 shadow">
    <h3 className="text-lg font-semibold mb-4 text-gray-800">
      Quotation Details
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Delivery Days */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Delivery Days
        </label>
        <input
          type="number"
          className="w-full border rounded-md p-2"
          value={quotationDetails.deliveryDays || ""}
          onChange={(e) =>
            setQuotationDetails((prev) => ({
              ...prev,
              deliveryDays: e.target.value,
            }))
          }
        />
      </div>

      {/* Validity Days */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Validity Days
        </label>
        <input
          type="number"
          className="w-full border rounded-md p-2"
          value={quotationDetails.validityDays || ""}
          onChange={(e) =>
            setQuotationDetails((prev) => ({
              ...prev,
              validityDays: e.target.value,
            }))
          }
        />
      </div>

      {/* Payment Terms */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Payment Terms (days)
        </label>
        <input
          type="number"
          className="w-full border rounded-md p-2"
          value={quotationDetails.paymentDays || ""}
          onChange={(e) =>
            setQuotationDetails((prev) => ({
              ...prev,
              paymentDays: e.target.value,
            }))
          }
        />
      </div>
    </div>
  </div>

</div>


        {/* From / For Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Quotation From</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Company Name</label>
                <input 
                  className="w-full border rounded-md p-2" 
                  value={quotationFrom.companyName || ''} 
                  onChange={e => setQuotationFrom(prev => ({ ...prev, companyName: e.target.value }))} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
                <textarea 
                  className="w-full border rounded-md p-2" 
                  rows={3} 
                  value={quotationFrom.address || ''} 
                  onChange={e => setQuotationFrom(prev => ({ ...prev, address: e.target.value }))} 
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Quotation For</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Company Name</label>
                <input 
                  className="w-full border rounded-md p-2" 
                  value={quotationFor.companyName || ''} 
                  onChange={e => setQuotationFor(prev => ({ ...prev, companyName: e.target.value }))} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
                <textarea 
                  className="w-full border rounded-md p-2" 
                  rows={3} 
                  value={quotationFor.address || ''} 
                  onChange={e => setQuotationFor(prev => ({ ...prev, address: e.target.value }))} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="p-6 bg-gray-50 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Items</h3>
              <button 
                onClick={handleAddItem} 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
              >
                + Add Item
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">HSN/SAC</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quotationItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">
                      <input 
                        className="w-full border rounded p-2" 
                        value={item.name} 
                        onChange={e => handleItemChange(idx, 'name', e.target.value)} 
                        placeholder="Enter item name"
                      />
                    </td>
                    <td className="px-4 py-2 w-24">
                      <input 
                        type="number" 
                        className="w-full border rounded p-2" 
                        value={item.qty} 
                        onChange={e => handleItemChange(idx, 'qty', e.target.value)} 
                      />
                    </td>
                    <td className="px-4 py-2 w-32">
                      <input 
                        type="number" 
                        className="w-full border rounded p-2" 
                        value={item.rate} 
                        onChange={e => handleItemChange(idx, 'rate', e.target.value)} 
                      />
                    </td>
                    <td className="px-4 py-2 w-32">
                      <input 
                        className="w-full border rounded p-2" 
                        value={item.hsn} 
                        onChange={e => handleItemChange(idx, 'hsn', e.target.value)} 
                      />
                    </td>
                    <td className="px-4 py-2 text-right font-medium">₹{Number(item.amount || 0).toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <button 
                        onClick={() => handleRemoveItem(idx)} 
                        className="text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tax Details and Totals */}
          <div className="p-6 border-t bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Tax Inputs */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Tax Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">CGST (%)</label>
                    <input 
                      type="number" 
                      className="w-full border rounded-md p-2" 
                      value={globalTaxes?.cgst || ''} 
                      onChange={e => setGlobalTaxes(prev => ({ ...prev, cgst: e.target.value }))} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">SGST (%)</label>
                    <input 
                      type="number" 
                      className="w-full border rounded-md p-2" 
                      value={globalTaxes?.sgst || ''} 
                      onChange={e => setGlobalTaxes(prev => ({ ...prev, sgst: e.target.value }))} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">IGST (%)</label>
                    <input 
                      type="number" 
                      className="w-full border rounded-md p-2" 
                      value={globalTaxes?.igst || ''} 
                      onChange={e => setGlobalTaxes(prev => ({ ...prev, igst: e.target.value }))} 
                    />
                  </div>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {cgstAmount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span>CGST ({globalTaxes?.cgst}%):</span>
                      <span>₹{cgstAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {sgstAmount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span>SGST ({globalTaxes?.sgst}%):</span>
                      <span>₹{sgstAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {igstAmount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span>IGST ({globalTaxes?.igst}%):</span>
                      <span>₹{igstAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center text-gray-600">
                      <span>Tax Amount:</span>
                      <span>₹{totalTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold text-sky-900 mt-2 pt-2 border-t border-gray-200">
                      <span>Total:</span>
                      <span>₹{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

    

        {/* Bank Details */}
        <div className="bg-white rounded-lg p-6 shadow-md mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Bank Name</label>
              <input 
                type="text" 
                className="w-full border rounded-md p-2" 
                value={bankDetails.bankName || ''} 
                onChange={e => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Account Number</label>
              <input 
                type="text" 
                className="w-full border rounded-md p-2" 
                value={bankDetails.accountNumber || ''} 
                onChange={e => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Branch</label>
              <input 
                type="text" 
                className="w-full border rounded-md p-2" 
                value={bankDetails.branch || ''} 
                onChange={e => setBankDetails(prev => ({ ...prev, branch: e.target.value }))} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">IFSC Code</label>
              <input 
                type="text" 
                className="w-full border rounded-md p-2" 
                value={bankDetails.ifscCode || ''} 
                onChange={e => setBankDetails(prev => ({ ...prev, ifscCode: e.target.value }))} 
              />
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="bg-white rounded-lg p-6 shadow-md mb-20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Terms & Conditions</h3>
          </div>
          <div className="space-y-3">
            {terms.map((term, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="mt-2">{index + 1}.</span>
                <textarea
                  value={term}
                  onChange={(e) => handleTermChange(index, e.target.value)}
                  className="flex-1 border rounded-md p-2 min-h-[60px] text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Generate Document Button */}
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => navigate('/quotation-preview')}
            className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white px-8 py-3 rounded-lg shadow-lg hover:from-sky-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transform hover:scale-105 transition-all duration-200"
          >
            Generate Document
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuotationForm;