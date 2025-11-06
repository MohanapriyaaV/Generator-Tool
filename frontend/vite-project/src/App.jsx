import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QuotationProvider } from './context/QuotationContext';
import QuotationForm from './components/quotation/QuotationForm';
import QuotationA4 from './components/quotation/QuotationA4';
import './App.css';


// function App() {
//   return (
//     // <InvoiceProvider>
//     //   <Router>
//     //     <Routes>
//     //       <Route path="/" element={<Home />} />
//     //       <Route path="/items" element={<Items />} />
//     //       <Route path="/customer" element={<CustomerForm />} />
//     //       <Route path="/bank" element={<BankDetailsForm />} />
//     //     </Routes>
//     //   </Router>
//     // </InvoiceProvider>
//     // <VistaLoc/>
//     // <QuotationHome />
//   );
// }

function App() {
  return (
    <QuotationProvider>
      <Router>
        <Routes>
          <Route path="/" element={<QuotationForm />} />
          <Route path="/quotation-preview" element={<QuotationA4 />} />
        </Routes>
      </Router>
    </QuotationProvider>
  );
}


export default App;
