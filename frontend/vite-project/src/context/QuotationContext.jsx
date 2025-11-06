import React, { createContext, useState } from "react";

export const QuotationContext = createContext();

export const QuotationProvider = ({ children }) => {
  const [quotationFor, setQuotationFor] = useState({
    personName: "",
    companyName: "",
    address: "",
  });

  const [quotationFrom, setQuotationFrom] = useState({
    companyName: "",
    address: "",
  });

  const [bankDetails, setBankDetails] = useState({
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
  });

  const [quotationDetails, setQuotationDetails] = useState({
    quotationNo: "",
    issueDate: "",
    deliveryDays: "",
    validityDays: "",
    paymentDays: "",
  });

  const [quotationItems, setQuotationItems] = useState([
    { id: 1, name: "", hsn: "", qty: 0, rate: 0, cgst: 0, sgst: 0, igst: 0, amount: 0, total: 0 },
  ]);

  // Store global taxes separately
  const [globalTaxes, setGlobalTaxes] = useState({ cgst: 0, sgst: 0, igst: 0 });

  return (
    <QuotationContext.Provider
      value={{
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
      }}
    >
      {children}
    </QuotationContext.Provider>
  );
};
