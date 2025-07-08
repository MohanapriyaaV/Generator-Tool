import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Items from './components/Items';
import CustomerForm from './components/CustomerForm';
import BankDetailsForm from './components/BankDetailsForm';
import { InvoiceProvider } from './context/InvoiceContext';
import './App.css';

function App() {
  return (
    <InvoiceProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/items" element={<Items />} />
          <Route path="/customer" element={<CustomerForm />} />
          <Route path="/bank" element={<BankDetailsForm />} />
        </Routes>
      </Router>
    </InvoiceProvider>
  );
}

export default App;
