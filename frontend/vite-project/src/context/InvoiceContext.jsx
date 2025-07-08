import React, { createContext, useState } from 'react';

export const InvoiceContext = createContext();

export const InvoiceProvider = ({ children }) => {
  const [customerDetails, setCustomerDetails] = useState({ name: '', address: '' });
  const [bankDetails, setBankDetails] = useState({ bankName: '', accountNo: '', branchIfsc: '', pan: '' });
  const [items, setItems] = useState([{ name: '', quantity: 1, price: 0, cgst: 0, sgst: 0 }]);
  // You can add more shared state here (logo, company, etc.")
  return (
    <InvoiceContext.Provider value={{ customerDetails, setCustomerDetails, bankDetails, setBankDetails, items, setItems }}>
      {children}
    </InvoiceContext.Provider>
  );
};
