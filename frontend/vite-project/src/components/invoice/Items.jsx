import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { InvoiceContext } from '../../context/InvoiceContext';
import InvoiceA4 from './InvoiceA4';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Items = () => {
  const { items, setItems, customerDetails, bankDetails } = useContext(InvoiceContext);
  const [showInvoice, setShowInvoice] = React.useState(false);
  const [companyDetails] = React.useState({
    name: 'VISTA ENGG SOLUTIONS PRIVATE LIMITED',
    address: '677, 1st Floor, Spacelance, 27th Main Road, 13th Cross HSR Layout, Sector 1, Bangalore, Karnataka',
    gst: '29AADCV6388Q1ZA',
  });
  const [invoiceDetails] = React.useState({
    number: 'Auto',
    date: new Date().toISOString().slice(0, 10),
  });
  const [logo] = React.useState(null);
  const [isPdfMode, setIsPdfMode] = React.useState(false);
  const invoiceRef = React.useRef();
  const navigate = useNavigate();

  const handleChange = (idx, field, value) => {
    const updated = items.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    setItems(updated);
  };

  const handleAdd = () => {
    setItems([...items, { name: '', quantity: 1, price: 0, cgst: 0, sgst: 0 }]);
  };

  const handleDelete = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  // IGST = CGST + SGST
  const getIGST = (item) => Number(item.cgst) + Number(item.sgst);
  // Total Tax Amount = Quantity * Price * IGST % / 100
  const getTotalTaxAmount = (item) => {
    const base = Number(item.quantity) * Number(item.price);
    const igst = getIGST(item);
    return ((base * igst) / 100).toFixed(2);
  };
  // Total Amount = base + total tax amount
  const getTotalAmount = (item) => {
    const base = Number(item.quantity) * Number(item.price);
    const tax = Number(getTotalTaxAmount(item));
    return (base + tax).toFixed(2);
  };

  const handleDownloadPDF = async () => {
    // Hide the button before rendering to canvas
    setIsPdfMode(true);
    setTimeout(async () => {
      const input = invoiceRef.current;

      // Enhanced settings for html2canvas to prevent text overlapping
      const canvas = await html2canvas(input, {
        scale: 5, // Even higher scale for better quality and text clarity
        useCORS: true, // Enable CORS for images
        allowTaint: true,
        logging: false,
        letterRendering: false, // Disable letterRendering for better text rendering
        scrollX: 0,
        scrollY: 0,
        backgroundColor: '#ffffff', // White background to ensure clean render
        removeContainer: true, // Remove the temporary container after rendering
        // Improved text rendering settings
        textRendering: true,
        fontFace: 'Arial, Helvetica, sans-serif',
        x: 0,
        y: 0,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight
      });

      // Ensure canvas is properly rendered before proceeding
      await new Promise(resolve => setTimeout(resolve, 100));

      const imgWidth = 794; // A4 width in pixels at 96 DPI
      const pageHeight = 1123; // A4 height in pixels at 96 DPI
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Use higher quality JPEG for better text rendering
      const imgData = canvas.toDataURL('image/jpeg', 1.0);

      // Create PDF with higher quality settings
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4',
        hotfixes: ['px_scaling'], // Apply hotfix for better scaling
        compress: false // Disable compression for better text quality
      });

      // Calculate number of pages needed
      const pageCount = Math.ceil(imgHeight / pageHeight);

      // For single page documents
      if (pageCount <= 1) {
        // Add some margin to prevent content from touching edges
        pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth - 20, imgHeight - 20, undefined, 'FAST');
      } 
      // For multi-page documents, split the image across multiple pages
      else {
        let position = 0;

        // First page
        pdf.addImage(imgData, 'JPEG', 10, position, imgWidth - 20, imgHeight, undefined, 'FAST');

        // Add subsequent pages if needed
        for (let i = 1; i < pageCount; i++) {
          position = -pageHeight * i + 10; // Add slight margin
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 10, position, imgWidth - 20, imgHeight, undefined, 'FAST');
        }
      }

      pdf.save('invoice.pdf');
      setIsPdfMode(false);
    }, 800); // Further increased timeout to ensure elements are properly rendered
  };

  const InvoicePreview = () => (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="relative" style={{ transform: 'scale(0.85)', transformOrigin: 'top center', maxHeight: '90vh', overflow: 'auto' }}>
        <button
          className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-xl font-bold z-10"
          onClick={() => setShowInvoice(false)}
        >
          ×
        </button>
        <div className="text-2xl font-bold mb-4">Invoice Preview</div>
        <div ref={invoiceRef} className="bg-white" style={{ position: 'relative', width: '794px', margin: '0 auto' }}>
          <InvoiceA4
            customer={customerDetails}
            items={items}
            issueDate={invoiceDetails.date}
            invoiceNumber={invoiceDetails.number}
            logo={logo}
            onDownloadPDF={handleDownloadPDF}
            isPdfMode={isPdfMode}
            bankDetails={bankDetails}
          />
        </div>
      </div>
    </div>
  );

  // Calculate grand totals
  const grandTotalTax = items.reduce((sum, item) => sum + Number(getTotalTaxAmount(item)), 0);
  const grandTotalAmount = items.reduce((sum, item) => sum + Number(getTotalAmount(item)), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-200 to-violet-400 flex flex-col items-center justify-center py-10 px-2">
      <div className="w-full flex flex-col items-center p-8" style={{ maxWidth: 'none', background: 'none', boxShadow: 'none', borderRadius: 0 }}>
        <div className="text-2xl md:text-3xl font-extrabold text-violet-700 mb-8 tracking-tight text-center drop-shadow">Purchase Item Details</div>
        <div className="w-full">
          <table className="min-w-full table-auto border-collapse mb-4" style={{ minWidth: 1200 }}>
            <thead>
              <tr className="bg-violet-100 text-violet-800">
                <th className="px-3 py-2 border text-center align-middle">SNo</th>
                <th className="px-3 py-2 border text-center align-middle">Item Name</th>
                <th className="px-3 py-2 border text-center align-middle">Quantity</th>
                <th className="px-3 py-2 border text-center align-middle">Price/Qty</th>
                <th className="px-3 py-2 border text-center align-middle">CGST %</th>
                <th className="px-3 py-2 border text-center align-middle">SGST %</th>
                <th className="px-3 py-2 border text-center align-middle">Total tax (IGST) %</th>
                <th className="px-3 py-2 border text-center align-middle">Total Tax Amount</th>
                <th className="px-3 py-2 border text-center align-middle">Total Amount</th>
                <th className="px-3 py-2 border text-center align-middle">Delete</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="bg-white even:bg-violet-50">
                  <td className="px-3 py-2 border text-center align-middle">{idx + 1}</td>
                  <td className="px-3 py-2 border text-center align-middle">
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => handleChange(idx, 'name', e.target.value)}
                      className="w-40 md:w-56 px-2 py-1 border rounded text-center align-middle"
                      placeholder="Item name"
                    />
                  </td>
                  <td className="px-3 py-2 border text-center align-middle">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => handleChange(idx, 'quantity', e.target.value)}
                      className="w-16 md:w-20 px-2 py-1 border rounded text-center align-middle"
                    />
                  </td>
                  <td className="px-3 py-2 border text-center align-middle">
                    <input
                      type="number"
                      min="0"
                      value={item.price}
                      onChange={e => handleChange(idx, 'price', e.target.value)}
                      className="w-16 md:w-24 px-2 py-1 border rounded text-center align-middle"
                    />
                  </td>
                  <td className="px-3 py-2 border text-center align-middle">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.cgst}
                      onChange={e => handleChange(idx, 'cgst', e.target.value)}
                      className="w-12 md:w-16 px-2 py-1 border rounded text-center align-middle"
                      placeholder="CGST %"
                    />
                  </td>
                  <td className="px-3 py-2 border text-center align-middle">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.sgst}
                      onChange={e => handleChange(idx, 'sgst', e.target.value)}
                      className="w-12 md:w-16 px-2 py-1 border rounded text-center align-middle"
                      placeholder="SGST %"
                    />
                  </td>
                  <td className="px-3 py-2 border text-center align-middle font-semibold">
                    {getIGST(item)}
                  </td>
                  <td className="px-3 py-2 border text-center align-middle font-semibold">
                    {getTotalTaxAmount(item)}
                  </td>
                  <td className="px-3 py-2 border text-center align-middle font-semibold">
                    {getTotalAmount(item)}
                  </td>
                  <td className="px-3 py-2 border text-center align-middle">
                    <button
                      onClick={() => handleDelete(idx)}
                      className="text-red-500 hover:bg-red-100 rounded-full p-1 border border-red-200"
                      title="Delete"
                      disabled={items.length === 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7m3 4v6m4-6v6" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-violet-100 text-violet-800 font-bold">
                <td colSpan={7} className="px-3 py-2 border text-right">Grand Total</td>
                <td className="px-3 py-2 border text-center">{grandTotalTax.toFixed(2)}</td>
                <td className="px-3 py-2 border text-center">{grandTotalAmount.toFixed(2)}</td>
                <td className="px-3 py-2 border"></td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        {/* Add Purchase Item Details Button */}
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-violet-500 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-semibold shadow-lg text-base mt-2"
        >
          <span className="text-xl leading-none">+</span> Add Item
        </button>

      {/* Add Banking Details Button */}
        <button
          className="mt-8 p-8 bg-violet-500 hover:bg-violet-600 transition text-white py-2 rounded-lg font-semibold shadow-lg text-base mb-4"
          onClick={() => navigate('/bank')}
        >
          Add Banking Details
        </button>


        <button
          onClick={() => setShowInvoice(true)}
          className="mt-6 bg-violet-500 hover:bg-violet-800 text-white px-6 py-2 rounded-lg font-semibold shadow-lg text-base"
        >
          Generate Invoice Report
        </button>
      </div>
      {showInvoice && <InvoicePreview />}
    </div>
  );
};

export default Items;
