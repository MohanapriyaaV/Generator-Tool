// import React, { createContext, useState } from 'react';

// export const InvoiceContext = createContext();

// export const InvoiceProvider = ({ children }) => {
//   const [customerDetails, setCustomerDetails] = useState({ name: '', address: '' });
//   const [bankDetails, setBankDetails] = useState({ bankName: '', accountNo: '', branchIfsc: '', pan: '' });
//   const [items, setItems] = useState([{ name: '', quantity: 1, price: 0, cgst: 0, sgst: 0 }]);
//   // You can add more shared state here (logo, company, etc.")
//   return (
//     <InvoiceContext.Provider value={{ customerDetails, setCustomerDetails, bankDetails, setBankDetails, items, setItems }}>
//       {children}
//     </InvoiceContext.Provider>
//   );
// };


import React, { createContext, useState } from 'react';

export const InvoiceContext = createContext();

export const InvoiceProvider = ({ children }) => {
  // Customer details
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    address: '',
  });

  // Bank details
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNo: '',
    branchIfsc: '',
    pan: '',
  });

  // Item list
  const [items, setItems] = useState([
    { name: '', quantity: 1, price: 0, cgst: 0, sgst: 0 },
  ]);

  // Global invoice info
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');

  // Optional: store uploaded company logo globally (so it appears in InvoiceA4)
  const [logo, setLogo] = useState(null);

  return (
    <InvoiceContext.Provider
      value={{
        customerDetails,
        setCustomerDetails,
        bankDetails,
        setBankDetails,
        items,
        setItems,
        invoiceNumber,
        setInvoiceNumber,
        issueDate,
        setIssueDate,
        logo,
        setLogo,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
};
