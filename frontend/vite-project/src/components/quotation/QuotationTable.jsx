import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { QuotationContext } from "../../context/QuotationContext"; 

const QuotationTable = () => {
  const navigate = useNavigate();
  const {
    quotationItems,
    setQuotationItems,
    globalTaxes,
    setGlobalTaxes,
  } = useContext(QuotationContext);

  const [items, setItems] = useState(quotationItems || [
    { id: 1, name: "", hsn: "", qty: "", rate: "", amount: 0, total: 0 },
  ]);

  const [cgst, setCgst] = useState(globalTaxes.cgst || 0);
  const [sgst, setSgst] = useState(globalTaxes.sgst || 0);
  const [igst, setIgst] = useState(globalTaxes.igst || 0);

  const handleChange = (index, field, value) => {
    const updatedItems = [...items];
    if (["qty", "rate", "hsn"].includes(field)) {
      value = field === "hsn" ? value : value === "" ? "" : Number(value);
    }
    updatedItems[index][field] = value;

    // Calculate base amount per item
    const qty = Number(updatedItems[index].qty) || 0;
    const rate = Number(updatedItems[index].rate) || 0;
    updatedItems[index].amount = qty * rate;

    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      { id: items.length + 1, name: "", hsn: "", qty: "", rate: "", amount: 0, total: 0 },
    ]);
  };

  const handleSaveAndContinue = () => {
    // Calculate total for each item including taxes
    const updatedItems = items.map((item) => {
      const totalTax = (item.amount * (Number(cgst) + Number(sgst) + Number(igst))) / 100;
      return { ...item, total: item.amount + totalTax, cgst, sgst, igst };
    });

    // Save to context
    setQuotationItems(updatedItems);
    setGlobalTaxes({ cgst, sgst, igst });

    console.log("Quotation items saved to context:", updatedItems);
    navigate("/quotation-a4"); // Your A4 PDF preview page
  };

  // Totals
  const totalBaseAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const totalTax = (totalBaseAmount * (Number(cgst) + Number(sgst) + Number(igst))) / 100;
  const grandTotal = totalBaseAmount + totalTax;

  return (
    <div className="mt-10 p-4 max-w-6xl mx-auto border rounded shadow-md overflow-x-auto">
      <h2 className="text-xl font-semibold mb-4">Quotation Items</h2>
      <table className="w-full border-collapse border text-sm">
        <thead>
          <tr className="bg-blue-700 text-white">
            <th className="border px-2 py-1">Sl. No</th>
            <th className="border px-2 py-1">Item</th>
            <th className="border px-2 py-1">HSN/SAC</th>
            <th className="border px-2 py-1">Qty</th>
            <th className="border px-2 py-1">Rate</th>
            <th className="border px-2 py-1">Amount</th>
            <th className="border px-2 py-1">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id}>
              <td className="border px-2 py-1 text-center">{idx + 1}</td>
              <td className="border px-2 py-1">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => handleChange(idx, "name", e.target.value)}
                  className="w-full border rounded px-1 py-1"
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  type="number"
                  value={item.hsn}
                  onChange={(e) => handleChange(idx, "hsn", e.target.value)}
                  className="w-full border rounded px-1 py-1"
                  placeholder="Enter HSN/SAC"
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  type="number"
                  value={item.qty}
                  min="0"
                  onChange={(e) => handleChange(idx, "qty", e.target.value)}
                  className="w-full border rounded px-1 py-1"
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  type="number"
                  value={item.rate}
                  min="0"
                  onChange={(e) => handleChange(idx, "rate", e.target.value)}
                  className="w-full border rounded px-1 py-1"
                />
              </td>
              <td className="border px-2 py-1 text-right">₹ {item.amount.toFixed(2)}</td>
              <td className="border px-2 py-1 text-right font-medium">₹ {item.total.toFixed(2)}</td>
            </tr>
          ))}

          <tr className="font-semibold bg-gray-100">
            <td colSpan="5" className="border px-2 py-1 text-right">Total Amount (Before Tax)</td>
            <td colSpan="2" className="border px-2 py-1 text-right">₹ {totalBaseAmount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      {/* Global Tax Inputs */}
      <div className="mt-4 grid grid-cols-3 gap-4 max-w-md">
        <div>
          <label className="block font-medium mb-1">CGST (%)</label>
          <input
            type="number"
            value={cgst}
            min="0"
            onChange={(e) => setCgst(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">SGST (%)</label>
          <input
            type="number"
            value={sgst}
            min="0"
            onChange={(e) => setSgst(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">IGST (%)</label>
          <input
            type="number"
            value={igst}
            min="0"
            onChange={(e) => setIgst(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
      </div>

      <div className="mt-4 font-semibold text-right text-lg">
        <p>Total Tax: ₹ {totalTax.toFixed(2)}</p>
        <p>Grand Total: ₹ {grandTotal.toFixed(2)}</p>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={addItem}
          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
        >
          Add Item
        </button>
        <button
          onClick={handleSaveAndContinue}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          Preview PDF
        </button>
      </div>
    </div>
  );
};

export default QuotationTable;
