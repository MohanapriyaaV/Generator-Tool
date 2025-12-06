// Get API base URL from environment or use default
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    // If VITE_API_URL already includes /api, use it as is, otherwise append /api
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

// Log the API URL for debugging (remove in production)
console.log('🌐 API Base URL:', API_BASE_URL);

// ========== PROFORMA INVOICE API ==========

// Create a new proforma invoice
export const createProformaInvoice = async (invoiceData) => {
  try {
    console.log('Sending request to:', `${API_BASE_URL}/proforma-invoices`);
    const response = await fetch(`${API_BASE_URL}/proforma-invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating proforma invoice:', error);
    // Provide more specific error messages
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Cannot connect to server. Please make sure the backend server is running on ' + API_BASE_URL);
    }
    throw error;
  }
};

// Get all proforma invoices
export const getAllProformaInvoices = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/proforma-invoices`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch proforma invoices');
    }
    return data;
  } catch (error) {
    console.error('Error fetching proforma invoices:', error);
    throw error;
  }
};

// Get next proforma invoice number
export const getNextProformaInvoiceNumber = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/proforma-invoices/next-invoice-number`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch next proforma invoice number');
    }
    return data.invoiceNumber;
  } catch (error) {
    console.error('Error fetching next proforma invoice number:', error);
    throw error;
  }
};

// Get a single proforma invoice by ID
export const getProformaInvoiceById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/proforma-invoices/${id}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch proforma invoice');
    }
    return data;
  } catch (error) {
    console.error('Error fetching proforma invoice:', error);
    throw error;
  }
};

// Get a single proforma invoice by reference number
export const getProformaInvoiceByReferenceNo = async (referenceNo) => {
  try {
    const response = await fetch(`${API_BASE_URL}/proforma-invoices/by-reference/${referenceNo}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch proforma invoice by reference number');
    }
    return data;
  } catch (error) {
    console.error('Error fetching proforma invoice by reference number:', error);
    throw error;
  }
};

// Update a proforma invoice
export const updateProformaInvoice = async (id, invoiceData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/proforma-invoices/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update proforma invoice');
    }
    return data;
  } catch (error) {
    console.error('Error updating proforma invoice:', error);
    throw error;
  }
};

// Update proforma invoice S3 URL by invoice number
export const updateProformaInvoiceS3Url = async (invoiceNumber, s3Url) => {
  try {
    // First, find the invoice by invoice number
    const invoices = await getAllProformaInvoices();
    const invoice = invoices.find(inv => inv.invoiceNumber === invoiceNumber);
    
    if (!invoice) {
      throw new Error(`Proforma invoice with number ${invoiceNumber} not found`);
    }

    // Update the invoice with S3 URL
    return await updateProformaInvoice(invoice._id, { s3Url });
  } catch (error) {
    console.error('Error updating proforma invoice S3 URL:', error);
    throw error;
  }
};

// Delete a proforma invoice
export const deleteProformaInvoice = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/proforma-invoices/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete proforma invoice');
    }
    return data;
  } catch (error) {
    console.error('Error deleting proforma invoice:', error);
    throw error;
  }
};

// ========== QUOTATION API ==========

// Create a new quotation
export const createQuotation = async (quotationData) => {
  try {
    console.log('Sending request to:', `${API_BASE_URL}/quotations`);
    const response = await fetch(`${API_BASE_URL}/quotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quotationData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating quotation:', error);
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Cannot connect to server. Please make sure the backend server is running on ' + API_BASE_URL);
    }
    throw error;
  }
};

// Get all quotations
export const getAllQuotations = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/quotations`);
    const data = await response.json();
    if (!response.ok) { 
      throw new Error(data.error || 'Failed to fetch quotations');
    }
    return data;
  } catch (error) {
    console.error('Error fetching quotations:', error);
    // Provide more specific error messages
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED') || error.message.includes('ERR_CONNECTION_RESET')) {
      throw new Error('Cannot connect to server. Please make sure the backend server is running on ' + API_BASE_URL);
    }
    throw error;
  }
};

// Get next quotation number
export const getNextQuotationNumber = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/quotations/next-quotation-number`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch next quotation number');
    }
    return data.quotationNumber;
  } catch (error) {
    console.error('Error fetching next quotation number:', error);
    throw error;
  }
};

// Get a single quotation by ID
export const getQuotationById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/quotations/${id}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch quotation');
    }
    return data;
  } catch (error) {
    console.error('Error fetching quotation:', error);
    throw error;
  }
};

// Get quotation by reference number
export const getQuotationByReferenceNo = async (referenceNo) => {
  try {
    const quotations = await getAllQuotations();
    const quotation = quotations.find(q => 
      q.referenceNo === referenceNo || 
      q.fullQuotationData?.quotationDetails?.referenceNo === referenceNo
    );
    
    if (!quotation) {
      throw new Error(`Quotation with reference number ${referenceNo} not found`);
    }
    
    return quotation;
  } catch (error) {
    console.error('Error fetching quotation by reference number:', error);
    throw error;
  }
};

// Update a quotation
export const updateQuotation = async (id, quotationData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/quotations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quotationData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update quotation');
    }
    return data;
  } catch (error) {
    console.error('Error updating quotation:', error);
    throw error;
  }
};

// Update quotation S3 URL by quotation number
export const updateQuotationS3Url = async (quotationNo, s3Url) => {
  try {
    // First, find the quotation by quotation number
    const quotations = await getAllQuotations();
    const quotation = quotations.find(q => q.quotationNo === quotationNo);
    
    if (!quotation) {
      throw new Error(`Quotation with number ${quotationNo} not found`);
    }

    // Update the quotation with S3 URL
    return await updateQuotation(quotation._id, { s3Url });
  } catch (error) {
    console.error('Error updating quotation S3 URL:', error);
    throw error;
  }
};

// ========== INVOICE API ==========

// Create a new invoice (regular invoice, not proforma)
export const createInvoice = async (invoiceData) => {
  try {
    console.log('Sending request to:', `${API_BASE_URL}/invoices`);
    const response = await fetch(`${API_BASE_URL}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating invoice:', error);
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Cannot connect to server. Please make sure the backend server is running on ' + API_BASE_URL);
    }
    throw error;
  }
};

// Get all invoices (regular invoices)
export const getAllInvoices = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/invoices`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch invoices');
    }
    return data;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
};

// Get next invoice number
export const getNextInvoiceNumber = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/invoices/next-invoice-number`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch next invoice number');
    }
    return data.invoiceNumber;
  } catch (error) {
    console.error('Error fetching next invoice number:', error);
    throw error;
  }
};

// Get a single invoice by ID (regular invoice)
export const getInvoiceById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/invoices/${id}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch invoice');
    }
    return data;
  } catch (error) {
    console.error('Error fetching invoice:', error);
    throw error;
  }
};
// Update an invoice (regular invoice)
export const updateInvoice = async (id, invoiceData) => { 
  try {
    const response = await fetch(`${API_BASE_URL}/invoices/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update invoice');
    }
    return data;
  } catch (error) {
    console.error('Error updating invoice:', error);
    throw error;
  }
};

// Update invoice S3 URL by invoice number
export const updateInvoiceS3Url = async (invoiceNumber, s3Url) => {
  try {
    // First, find the invoice by invoice number
    const invoices = await getAllInvoices();
    const invoice = invoices.find(inv => inv.invoiceNumber === invoiceNumber);
    
    if (!invoice) {
      throw new Error(`Invoice with number ${invoiceNumber} not found`);
    }

    // Update the invoice with S3 URL
    return await updateInvoice(invoice._id, { s3Url });
  } catch (error) {
    console.error('Error updating invoice S3 URL:', error);
    throw error;
  }
};

// Delete an invoice (regular invoice)
export const deleteInvoice = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/invoices/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete invoice');
    }
    return data;
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
};

// ========== S3 UPLOAD API ==========

// Upload PDF to S3
// folder: "quotations", "invoices", or "proforma-invoices"
export const uploadPdfToS3 = async (pdfBlob, fileName, folder) => {
  try {
    const formData = new FormData();
    formData.append('file', pdfBlob, fileName);
    formData.append('folder', folder);

    const response = await fetch(`${API_BASE_URL}/upload/upload-pdf`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error uploading PDF to S3:', error);
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Cannot connect to server. Please make sure the backend server is running on ' + API_BASE_URL);
    }
    throw error;
  }
};

// ========== PURCHASE ORDER API ==========

// Create a new purchase order
export const createPurchaseOrder = async (purchaseOrderData) => {
  try {
    console.log('Sending request to:', `${API_BASE_URL}/purchase-orders`);
    const response = await fetch(`${API_BASE_URL}/purchase-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(purchaseOrderData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating purchase order:', error);
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Cannot connect to server. Please make sure the backend server is running on ' + API_BASE_URL);
    }
    throw error;
  }
};

// Get all purchase orders
export const getAllPurchaseOrders = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/purchase-orders`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch purchase orders');
    }
    return data;
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    throw error;
  }
};

// Update a purchase order
export const updatePurchaseOrder = async (id, purchaseOrderData) => {
  try {
    console.log('Sending update request to:', `${API_BASE_URL}/purchase-orders/${id}`);
    const response = await fetch(`${API_BASE_URL}/purchase-orders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(purchaseOrderData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating purchase order:', error);
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Cannot connect to server. Please make sure the backend server is running on ' + API_BASE_URL);
    }
    throw error;
  }
};

// Get next PO number (for auto-incrementing)
export const getNextPoNumber = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/purchase-orders/next-po-number`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch next PO number');
    }
    return data.poNumber;
  } catch (error) {
    console.error('Error fetching next PO number:', error);
    throw error;
  }
};
