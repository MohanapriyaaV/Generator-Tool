import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { QuotationProvider } from './context/QuotationContext';
import { InvoiceProvider } from './context/InvoiceContext';
import QuotationForm from './components/quotation/QuotationForm';
import QuotationA4 from './components/quotation/QuotationA4';
import './App.css';
import Dashboard from './components/dashboard/Dashboard';
import Home from './components/invoice/Home';
import InvoiceFormSinglePage from './components/invoice/InvoiceFormSinglePage';
import QuotationHome from './components/quotation/QuotationHome';
import InvoiceForm from './components/ProformaInvoice/InvoiceForm';
import InvoicePreview from './components/ProformaInvoice/InvoicePreview';
import CustomerForm from './components/invoice/CustomerForm';
import InvoiceHistory from './components/history/InvoiceHistory';
import QuotationHistory from './components/history/QuotationHistory';
import ProformaInvoiceHistory from './components/history/ProformaInvoiceHistory';
import ReferenceHistory from './components/history/ReferenceHistory';
import PurchaseOrderForm from './components/purchaseOrder/PurchaseOrderForm';
import PurchaseOrderHistory from './components/history/PurchaseOrderHistory';
import PurchaseOrderPreview from './components/purchaseOrder/PurchaseOrderPreview';
import Items from './components/invoice/Items';
import BankDetailsForm from './components/invoice/BankDetailsForm';
import QuotationFor from './components/quotation/QuotationFor';
import QuotationFrom from './components/quotation/QuotationFrom';
import QuotationBank from './components/quotation/QuotationBank';
import QuotationDetails from './components/quotation/QuotationDetails';
import QuotationTable from './components/quotation/QuotationTable';

// Wrapper component for InvoiceForm that handles navigation
const InvoiceFormWrapper = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [initialData, setInitialData] = React.useState(null);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    // Get initial data from location state if editing
    if (location.state?.initialData) {
      setInitialData(location.state.initialData);
    }
  }, [location.state]);

  const handleSubmit = async (formData) => {
    try {
      setIsSaving(true);
      
      // Prepare data for database
      const dbData = {
        invoiceNumber: formData.invoiceNumber || '',
        invoiceDate: formData.invoiceDate || new Date().toISOString(),
        referenceNo: formData.referenceNo || '',
        projectName: formData.projectName || '',
        fromAddress: {
          companyName: formData.invoiceFromCompanyName || '',
          street: formData.invoiceFromStreet || '',
          apartment: formData.invoiceFromApartment || '',
          city: formData.invoiceFromCity || '',
          zipCode: formData.invoiceFromZipCode || '',
          country: formData.invoiceFromCountryCode || '',
          state: formData.invoiceFromStateCode || '',
          pan: formData.invoiceFromPAN || '',
          gstin: formData.invoiceFromGSTIN || '',
        },
        billToAddress: {
          clientName: formData.billToClientName || '',
          companyName: formData.billToCompanyName || '',
          street: formData.billToStreet || '',
          apartment: formData.billToApartment || '',
          city: formData.billToCity || '',
          zipCode: formData.billToZipCode || '',
          country: formData.billToCountryCode || '', // Store country code
          state: formData.billToStateCode || '', // Store state code
          pan: formData.billToPAN || '',
          gstin: formData.billToGSTIN || '',
          phoneNumber: formData.billToPhoneNumber || '',
        },
        totalAmount: formData.calculations?.total || 0,
        fullInvoiceData: formData, // Store complete invoice data
      };

      // Import API functions dynamically
      const { createProformaInvoice, updateProformaInvoice, getAllProformaInvoices } = await import('./services/api.js');
      
      // Check if this is an edit (has _id in initialData or formData)
      const isEdit = initialData?._id || formData._id;
      let savedInvoice = null;
      
      // Try to save/update to database (non-blocking - won't prevent navigation)
      try {
        if (isEdit) {
          // Update existing invoice
          const invoiceId = initialData?._id || formData._id;
          console.log('🔄 Updating existing invoice with ID:', invoiceId);
          savedInvoice = await updateProformaInvoice(invoiceId, dbData);
          console.log('✅ Invoice updated in database:', savedInvoice);
          // Add _id to formData for future edits
          formData._id = invoiceId;
        } else {
          // Create new invoice
          console.log('🆕 Creating new invoice');
          savedInvoice = await createProformaInvoice(dbData);
          console.log('✅ Invoice saved to database:', savedInvoice);
          // Add _id to formData if returned
          if (savedInvoice?._id) {
            formData._id = savedInvoice._id;
          }
        }
      } catch (saveError) {
        // Log error but don't block the user from viewing preview
        console.warn('⚠️ Could not save/update invoice to database:', saveError.message);
        // Show a non-blocking notification
        const userWantsToContinue = window.confirm(
          `Warning: Could not save invoice to database.\n\n` +
          `Error: ${saveError.message}\n\n` +
          `Would you like to continue to preview anyway?\n\n` +
          `(Click OK to continue, Cancel to go back)`
        );
        if (!userWantsToContinue) {
          setIsSaving(false);
          return; // User chose to go back
        }
      }

      // Navigate to preview page with form data in location state (including _id if available)
      navigate('/invoice-preview', { state: { data: formData } });
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      alert('An error occurred: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return <InvoiceForm onSubmit={handleSubmit} initialData={initialData} loading={isSaving} />;
};

// Wrapper component for InvoicePreview that gets data from location state
const InvoicePreviewWrapper = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = React.useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);
  const downloadRef = React.useRef(null);

  React.useEffect(() => {
    // Get data from location state
    if (location.state?.data) {
      setData(location.state.data);
    } else {
      // If no data, redirect back to form
      navigate('/proforma-invoice');
    }
  }, [location.state, navigate]);

  const handleDownloadStateChange = (isGenerating) => {
    setIsGeneratingPDF(isGenerating);
  };

  const handleDownloadPDF = () => {
    if (downloadRef.current?.handleDownloadPDF) {
      downloadRef.current.handleDownloadPDF();
      // Navigate back to form page after download (with delay to allow download to complete)
      setTimeout(() => {
        navigate('/proforma-invoice', { state: { initialData: data } });
      }, 2000);
    }
  };

  const handleEditPreview = () => {
    // Navigate back to form with existing data
    navigate('/proforma-invoice', { state: { initialData: data } });
  };

  const handleCreateNew = () => {
    // Navigate to form without data
    navigate('/proforma-invoice');
  };

  if (!data) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Left side - Invoice Preview */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          backgroundColor: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          maxWidth: '210mm', // A4 width
          width: '100%',
          margin: '0 auto'
        }}>
          <InvoicePreview
            data={data}
            downloadRef={downloadRef}
            isGeneratingPDF={isGeneratingPDF}
            onDownloadStateChange={handleDownloadStateChange}
          />
        </div>
      </div>

      {/* Right side - Action Buttons */}
      <div style={{
        width: '250px',
        backgroundColor: 'white',
        padding: '20px',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto'
      }}>
        <h2 style={{
          margin: '0 0 20px 0',
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#333'
        }}>
          Actions
        </h2>

        {/* Download PDF Button */}
        <button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
          style={{
            width: '100%',
            padding: '12px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: isGeneratingPDF ? 'not-allowed' : 'pointer',
            opacity: isGeneratingPDF ? 0.6 : 1,
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => {
            if (!isGeneratingPDF) {
              e.target.style.backgroundColor = '#2563eb';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isGeneratingPDF) {
              e.target.style.backgroundColor = '#3b82f6';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }
          }}
        >
          {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF'}
        </button>

        {/* Edit Preview Button */}
        <button
          onClick={handleEditPreview}
          style={{
            width: '100%',
            padding: '12px 20px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#059669';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#10b981';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          }}
        >
          Edit Preview
        </button>

        {/* Create New Invoice Button */}
        <button
          onClick={handleCreateNew}
          style={{
            width: '100%',
            padding: '12px 20px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#4b5563';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#6b7280';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          }}
        >
          Create New Invoice
        </button>

        {/* Back to Home Button */}
        <button
          onClick={() => navigate('/')}
          style={{
            width: '100%',
            padding: '12px 20px',
            backgroundColor: '#374151',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '15px'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#1f2937';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#374151';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          Back to Home
        </button>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <InvoiceProvider>
        <QuotationProvider>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/invoice" element={<InvoiceFormSinglePage />} />
            <Route path="/quotation" element={<QuotationHome />} />
            <Route path="/quotation-home" element={<QuotationHome />} />
            <Route path="/quotation-form" element={<QuotationForm />} />
            <Route path="/proforma-invoice" element={<InvoiceFormWrapper />} />
            <Route path="/invoice-preview" element={<InvoicePreviewWrapper />} />
            <Route path="/quotation-preview" element={<QuotationA4 />} />
            <Route path="/purchase-order" element={<PurchaseOrderForm />} />
            <Route path="/purchase-order-preview" element={<PurchaseOrderPreview />} />
            {/* Invoice routes */}
            <Route path="/customer" element={<CustomerForm />} />
            <Route path="/items" element={<Items />} />
            <Route path="/bank" element={<BankDetailsForm />} />
            {/* Quotation routes */}
            <Route path="/quotation-for" element={<QuotationFor />} />
            <Route path="/quotation-from" element={<QuotationFrom />} />
            <Route path="/quotation-bank" element={<QuotationBank />} />
            <Route path="/quotation-details" element={<QuotationDetails />} />
            <Route path="/quotation-table" element={<QuotationTable />} />
            <Route path="/quotation-a4" element={<QuotationA4 />} />
            {/* History routes */}
            <Route path="/history/invoice" element={<InvoiceHistory />} />
            <Route path="/history/quotation" element={<QuotationHistory />} />
            <Route path="/history/proforma-invoice" element={<ProformaInvoiceHistory />} />
            <Route path="/history/reference" element={<ReferenceHistory />} />
            <Route path="/history/purchase-order" element={<PurchaseOrderHistory />} />
          </Routes>
        </QuotationProvider>
      </InvoiceProvider>
    </Router>
  );
}

export default App;
