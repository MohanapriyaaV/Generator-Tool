import React, { useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Country, State, City } from 'country-state-city';
import { QuotationContext } from '../../context/QuotationContext';
import { getAllQuotations, getNextQuotationNumber } from '../../services/api.js';
import { getCurrentFinancialYear, extractFinancialYear, extractSequenceNumber, buildDocumentNumber } from '../../utils/financialYear.js';

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
    taxEnabled,
    setTaxEnabled,
  } = useContext(QuotationContext);

  const navigate = useNavigate();
  const [terms, setTerms] = useState([
    "Our quotation is based on the SoW and technical details received from the client.",
    "The quotation is stated in Indian Rupees (INR) unless otherwise indicated.",
    "Pricing is inclusive of all GST taxes, fees and misc expenses.",
    "Customer is responsible for functional aspects of the product.",
    "Delivery period provided is from the date of receipt of the PO.",
    "Assumptions and other details are attached in the technical proposal."
  ]);
  
  // Quotation number state
  const [sequenceDigits, setSequenceDigits] = useState('1');
  const [quotationError, setQuotationError] = useState('');
  const [generatedSequence, setGeneratedSequence] = useState(null);
  
  // Ref to track if we're initializing to prevent circular updates
  const isInitializing = useRef(true);
  const isUpdatingFromSequence = useRef(false);

  // Get all countries - memoized to prevent recreation
  const allCountries = useMemo(() => Country.getAllCountries(), []);
  
  // State for countries, states, and cities for quotationFor address
  const [addressData, setAddressData] = useState({
    states: [],
    cities: []
  });

  // State for countries, states, and cities for quotationFrom address
  const [fromAddressData, setFromAddressData] = useState({
    states: [],
    cities: []
  });

  // Office locations data - same as ProformaInvoice
  const officeLocations = {
    'USA Head Office': {
      companyName: 'VISTA Engineering Solutions Inc',
      street: '1999 S, Bascom Ave, Ste 700',
      apartment: '',
      city: 'Campbell',
      state: 'California',
      zipCode: '95008',
      country: 'USA',
      PAN: '',
      GSTIN: ''
    },
    'Regional Office': {
      companyName: 'VISTA Engineering Solutions Inc',
      street: '41 Hutchins Drive, Building 3, PMB# 9206',
      apartment: '',
      city: 'Portland',
      state: 'Maine',
      zipCode: '04102',
      country: 'USA',
      PAN: '',
      GSTIN: ''
    },
    'Germany Head Office': {
      companyName: 'VISTA Engineering Solutions Inc',
      street: 'Wolframstr. 24',
      apartment: '',
      city: 'Stuttgart',
      state: 'Baden-Württemberg',
      zipCode: '70191',
      country: 'GERMANY',
      PAN: '',
      GSTIN: ''
    },
    'Germany Sales Office': {
      companyName: 'VISTA Engineering Solutions Inc',
      street: 'Friedrichstrasse 15',
      apartment: '',
      city: 'Stuttgart',
      state: 'Baden-Württemberg',
      zipCode: '70174',
      country: 'GERMANY',
      PAN: '',
      GSTIN: ''
    },
    'India Registered Office': {
      companyName: 'VISTA Engg Solutions Private Limited',
      street: '10A, VISTA, ANDAL NAGAR, II STREET, LAKSHMIPURAM, PEELAMEDU',
      apartment: '',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      zipCode: '641004',
      country: 'India',
      PAN: 'AADCV6398Q',
      GSTIN: '33AADCV6398Q1ZF'
    },
    'India ODC Office': {
      companyName: 'VISTA Engg Solutions Private Limited',
      street: 'Indialand Tech Park, CHIL-SEZ Campus',
      apartment: '',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      zipCode: '641035',
      country: 'India',
      PAN: 'AADCV6398Q',
      GSTIN: '33AADCV6398Q2ZE'
    },
    'India Sales Office': {
      companyName: 'VISTA Engg Solutions Private Limited',
      street: '#677, 1st Floor, Suite No. 755',
      apartment: '27th Maine, 13th Cross, HSR Layout, Sector 1',
      city: 'Bengaluru',
      state: 'Karnataka',
      zipCode: '560102',
      country: 'India',
      PAN: 'AADCV6398Q',
      GSTIN: '29AADCV6398Q1Z4'
    }
  };

  // Map country names to ISO codes
  const countryNameToCode = {
    'India': 'IN',
    'USA': 'US',
    'GERMANY': 'DE'
  };

  // Bank details for India offices
  const indiaBankDetails = {
    bankName: 'ICICI Bank Limited',
    accountNumber: '058705002413',
    ifscCode: 'ICIC0000587',
    branch: 'Avinashi Road'
  };

  const [selectedFromLocation, setSelectedFromLocation] = useState('');

  // Generate unique reference number
  const generateUniqueReferenceNo = async () => {
    try {
      // Get all existing quotations
      const existingQuotations = await getAllQuotations();
      const existingRefNos = existingQuotations
        .map(q => q.referenceNo || (q.fullQuotationData?.quotationDetails?.referenceNo))
        .filter(ref => ref && ref.startsWith('VSREF'));
      
      let newRefNo;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 100;
      
      while (!isUnique && attempts < maxAttempts) {
        // Generate a random 4-digit number
        const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        newRefNo = `VSREF${randomNum}`;
        
        // Check if it's unique
        if (!existingRefNos.includes(newRefNo)) {
          isUnique = true;
        }
        attempts++;
      }
      
      if (!isUnique) {
        console.warn('Could not generate unique reference number after', maxAttempts, 'attempts');
        // Fallback: use timestamp-based number
        const timestamp = Date.now().toString().slice(-4);
        newRefNo = `VSREF${timestamp}`;
      }
      
      return newRefNo;
    } catch (error) {
      console.error('Error generating reference number:', error);
      // Fallback: use timestamp-based number
      const timestamp = Date.now().toString().slice(-4);
      return `VSREF${timestamp}`;
    }
  };

  // Generate quotation number, reference number and default issue date once
  // Load states and cities when country/state codes are available for quotationFor
  useEffect(() => {
    if (quotationFor.countryCode) {
      const states = State.getStatesOfCountry(quotationFor.countryCode);
      setAddressData(prev => ({ ...prev, states }));
      
      if (quotationFor.stateCode) {
        const cities = City.getCitiesOfState(quotationFor.countryCode, quotationFor.stateCode);
        setAddressData(prev => ({ ...prev, cities }));
      } else {
        setAddressData(prev => ({ ...prev, cities: [] }));
      }
    } else {
      setAddressData({ states: [], cities: [] });
    }
  }, [quotationFor.countryCode, quotationFor.stateCode]);

  // Load states and cities when country/state codes are available for quotationFrom
  useEffect(() => {
    if (quotationFrom.countryCode) {
      const states = State.getStatesOfCountry(quotationFrom.countryCode);
      setFromAddressData(prev => ({ ...prev, states }));
      
      if (quotationFrom.stateCode) {
        const cities = City.getCitiesOfState(quotationFrom.countryCode, quotationFrom.stateCode);
        setFromAddressData(prev => ({ ...prev, cities }));
      } else {
        setFromAddressData(prev => ({ ...prev, cities: [] }));
      }
    } else {
      setFromAddressData({ states: [], cities: [] });
    }
  }, [quotationFrom.countryCode, quotationFrom.stateCode]);

  // Handle office location selection for quotationFrom
  const handleFromLocationSelect = (e) => {
    const locationValue = e.target.value;
    setSelectedFromLocation(locationValue);
    
    // Clear all fields when "Select Location" is clicked (empty value)
    if (!locationValue) {
      setQuotationFrom(prev => ({
        ...prev,
        companyName: '',
        street: '',
        apartment: '',
        city: '',
        zipCode: '',
        countryCode: '',
        stateCode: '',
        pan: '',
        gstin: ''
      }));
      setBankDetails(prev => ({
        ...prev,
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        branch: ''
      }));
      setFromAddressData({ states: [], cities: [] });
      return;
    }
    
    if (locationValue && officeLocations[locationValue]) {
      const location = officeLocations[locationValue];
      const countryCode = countryNameToCode[location.country] || '';
      
      // Update quotationFrom with location data
      setQuotationFrom(prev => ({
        ...prev,
        companyName: location.companyName,
        street: location.street,
        apartment: location.apartment,
        city: location.city,
        zipCode: location.zipCode,
        countryCode: countryCode,
        pan: location.PAN || '',
        gstin: location.GSTIN || ''
      }));
      
      // Load states for the selected country
      if (countryCode) {
        const states = State.getStatesOfCountry(countryCode);
        setFromAddressData(prev => ({ ...prev, states, cities: [] }));
        
        // Try to find and set state code
        const stateObj = states.find(s => s.name === location.state);
        if (stateObj) {
          setQuotationFrom(prev => ({ ...prev, stateCode: stateObj.isoCode }));
          
          // Load cities for the state
          const cities = City.getCitiesOfState(countryCode, stateObj.isoCode);
          setFromAddressData(prev => ({ ...prev, cities }));
          
          // Try to find and set city - handle both "Bangalore" and "Bengaluru"
          const cityName = location.city === 'Bangalore' ? 'Bengaluru' : location.city;
          const cityObj = cities.find(c => 
            c.name === location.city || 
            c.name === cityName ||
            c.name.toLowerCase() === location.city.toLowerCase() ||
            (location.city === 'Bangalore' && c.name === 'Bengaluru')
          );
          if (cityObj) {
            setQuotationFrom(prev => ({ ...prev, city: cityObj.name }));
          } else if (location.city === 'Bangalore') {
            // If exact match not found but it's Bangalore, try to set Bengaluru
            const bengaluruCity = cities.find(c => c.name === 'Bengaluru');
            if (bengaluruCity) {
              setQuotationFrom(prev => ({ ...prev, city: 'Bengaluru' }));
            }
          }
        }
      }
      
      // Auto-fill bank details if India office is selected, otherwise clear them
      if (location.country === 'India') {
        setBankDetails(prev => ({
          ...prev,
          bankName: indiaBankDetails.bankName,
          accountNumber: indiaBankDetails.accountNumber,
          ifscCode: indiaBankDetails.ifscCode,
          branch: indiaBankDetails.branch
        }));
      } else {
        // Clear bank details for non-India offices
        setBankDetails(prev => ({
          ...prev,
          bankName: '',
          accountNumber: '',
          ifscCode: '',
          branch: ''
        }));
        // Also clear PAN and GSTIN for non-India offices
        setQuotationFrom(prev => ({
          ...prev,
          pan: '',
          gstin: ''
        }));
      }
    } else {
      // If no location is selected, clear bank details
      setBankDetails(prev => ({
        ...prev,
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        branch: ''
      }));
    }
  };

  useEffect(() => {
    const initializeQuotation = async () => {
      // Skip if we're updating from sequence digits change (to prevent loop)
      if (isUpdatingFromSequence.current) {
        isUpdatingFromSequence.current = false;
        return;
      }
      
      const today = new Date();
      
      // Generate quotation number if not exists
      // Check if quotation number already exists and is valid
      if (quotationDetails?.quotationNo && quotationDetails.quotationNo.trim() !== '') {
        // Extract sequence if it exists
        const seq = extractSequenceNumber(quotationDetails.quotationNo);
        if (seq !== null) {
          // Only update if sequenceDigits is not already set to this value to prevent loops
          const currentSeq = parseInt(sequenceDigits, 10);
          if (isNaN(currentSeq) || currentSeq !== seq) {
            isInitializing.current = true;
            setSequenceDigits(seq.toString()); // No padding - show raw number
            setGeneratedSequence(seq);
            isInitializing.current = false;
          }
        }
        // Quotation number already exists, don't regenerate
        return;
      }
      
      // Only generate if quotation number doesn't exist
      if (!quotationDetails?.quotationNo) {
        try {
          isInitializing.current = true;
          const newQuotationNo = await getNextQuotationNumber();
          setQuotationDetails(prev => ({ ...prev, quotationNo: newQuotationNo }));
          const seq = extractSequenceNumber(newQuotationNo);
          if (seq !== null) {
            setSequenceDigits(seq.toString()); // No padding - show raw number
            setGeneratedSequence(seq);
          }
          isInitializing.current = false;
        } catch (error) {
          console.error('Error generating quotation number:', error);
          // Fallback: generate with current financial year
          isInitializing.current = true;
          const financialYear = getCurrentFinancialYear();
          const fallbackNo = buildDocumentNumber('QT', financialYear, 1);
          setQuotationDetails(prev => ({ ...prev, quotationNo: fallbackNo }));
          setSequenceDigits('1'); // No padding - show raw number
          setGeneratedSequence(1);
          isInitializing.current = false;
        }
      }
      
      // Generate reference number if not exists
      if (!quotationDetails?.referenceNo) {
        const newRefNo = await generateUniqueReferenceNo();
        setQuotationDetails(prev => ({ ...prev, referenceNo: newRefNo }));
      }
      
      // Set issue date if not exists
      if (!quotationDetails?.issueDate) {
        setQuotationDetails(prev => ({ ...prev, issueDate: today.toISOString().split('T')[0] }));
      }
    };

    initializeQuotation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotationDetails?.quotationNo]);

  // Update full quotation number when sequence digits change
  // Only update if sequenceDigits is a valid number and would result in a different quotation number
  useEffect(() => {
    // Skip if we're still initializing or if quotationNo doesn't exist yet
    if (isInitializing.current || !quotationDetails?.quotationNo) {
      return;
    }
    
    if (sequenceDigits && sequenceDigits.trim() !== '') {
      const seq = parseInt(sequenceDigits, 10);
      if (!isNaN(seq) && seq > 0) {
        const financialYear = extractFinancialYear(quotationDetails.quotationNo) || getCurrentFinancialYear();
        // Use padded digits only for building the full number format
        const paddedDigits = sequenceDigits.padStart(4, '0');
        const newFullNumber = buildDocumentNumber('QT', financialYear, paddedDigits);
        
        // Extract current sequence from quotationNo to compare
        const currentSeq = extractSequenceNumber(quotationDetails.quotationNo);
        
        // Only update if the new number is actually different AND the sequence actually changed
        // This prevents infinite loops when the number is already correct
        if (newFullNumber !== quotationDetails.quotationNo && currentSeq !== seq) {
          isUpdatingFromSequence.current = true;
          setQuotationDetails(prev => ({ ...prev, quotationNo: newFullNumber }));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequenceDigits]);

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

  // Clear handlers for sections
  // Note: clearing details should NOT regenerate quotationNo/referenceNo/issueDate.
  const clearQuotationDetails = () => {
    setQuotationDetails(prev => ({
      ...prev,
      projectName: '',
      deliveryDays: '',
      validityDays: '',
      paymentDays: ''
    }));
  };

  const clearQuotationFrom = () => {
    setQuotationFrom({
      companyName: '',
      street: '',
      apartment: '',
      zipCode: '',
      countryCode: '',
      stateCode: '',
      city: '',
      pan: '',
      gstin: ''
    });
    setFromAddressData({ states: [], cities: [] });
    setSelectedFromLocation('');
  };

  const clearQuotationFor = () => {
    setQuotationFor({
      personName: '',
      companyName: '',
      street: '',
      apartment: '',
      zipCode: '',
      countryCode: '',
      stateCode: '',
      city: '',
      address: ''
    });
    setAddressData({ states: [], cities: [] });
  };

  const clearItems = () => {
    setQuotationItems([{ name: '', qty: 1, rate: 0, hsn: '', amount: 0 }]);
  };

  const clearBankDetails = () => {
    setBankDetails({ bankName: '', accountNumber: '', ifscCode: '', branch: '' });
  };

  // Clear only the text content of terms, preserve number of text boxes
  const clearTerms = () => {
    setTerms(prev => (prev.length > 0 ? prev.map(() => '') : ['']));
  };

  const addTerm = () => {
    setTerms(prev => [...prev, '']);
  };

  const removeTerm = (index) => {
    setTerms(prev => {
      const arr = [...prev];
      arr.splice(index, 1);
      return arr.length > 0 ? arr : [''];
    });
  };

  const clearAll = () => {
    const confirmed = window.confirm('Clear all sections? This will reset form fields but keep generated IDs.');
    if (!confirmed) return;
    clearQuotationDetails();
    clearQuotationFrom();
    clearQuotationFor();
    clearItems();
    clearBankDetails();
    clearTerms();
    setGlobalTaxes({ cgst: 0, sgst: 0, igst: 0 });
  };

  // Check if Quotation From and Quotation For are in the same state
  const isSameState = () => {
    const fromState = quotationFrom.stateCode;
    const forState = quotationFor.stateCode;
    
    // Get GSTIN state codes as fallback
    let fromGSTINState = null;
    let forGSTINState = null;
    
    if (quotationFrom.gstin && quotationFrom.gstin.length >= 2) {
      fromGSTINState = quotationFrom.gstin.substring(0, 2);
    }
    
    if (quotationFor.gstin && quotationFor.gstin.length >= 2) {
      forGSTINState = quotationFor.gstin.substring(0, 2);
    }
    
    // Priority 1: Compare using state codes if both are available
    if (fromState && forState) {
      return fromState === forState;
    }
    
    // Priority 2: Compare using GSTIN state codes if both GSTINs are available
    if (fromGSTINState && forGSTINState) {
      return fromGSTINState === forGSTINState;
    }
    
    // If we can't determine, default to inter-state (IGST)
    return false;
  };

  // Auto-calculate tax based on same/different states
  const calculateAutoTax = () => {
    const subtotal = quotationItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    
    if (!taxEnabled) {
      return { cgst: 0, sgst: 0, igst: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, totalTax: 0 };
    }
    
    const cgstAmount = (subtotal * (parseFloat(globalTaxes.cgst) || 0)) / 100;
    const sgstAmount = (subtotal * (parseFloat(globalTaxes.sgst) || 0)) / 100;
    const igstAmount = (subtotal * (parseFloat(globalTaxes.igst) || 0)) / 100;
    
    return { 
      cgst: globalTaxes.cgst, 
      sgst: globalTaxes.sgst, 
      igst: globalTaxes.igst, 
      cgstAmount, 
      sgstAmount, 
      igstAmount, 
      totalTax: cgstAmount + sgstAmount + igstAmount 
    };
  };

  // Auto-update tax when addresses change
  useEffect(() => {
    if (taxEnabled) {
      const autoTax = calculateAutoTax();
      setGlobalTaxes({ cgst: autoTax.cgst, sgst: autoTax.sgst, igst: autoTax.igst });
    } else {
      setGlobalTaxes({ cgst: 0, sgst: 0, igst: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotationFrom.stateCode, quotationFor.stateCode, quotationFrom.gstin, quotationFor.gstin, taxEnabled, quotationItems]);

  const subtotal = quotationItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const autoTax = calculateAutoTax();
  const cgstAmount = autoTax.cgstAmount;
  const sgstAmount = autoTax.sgstAmount;
  const igstAmount = autoTax.igstAmount;
  const totalTax = autoTax.totalTax;
  const grandTotal = subtotal + totalTax;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-lg p-6 shadow mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                Back to Home
              </button>
              <h1 className="text-2xl font-bold">Quotation Builder</h1>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">Quotation No</div>
              <div className="font-semibold text-lg">{quotationDetails?.quotationNo || 'QT-XXXX'}</div>
              {quotationDetails?.referenceNo && (
                <>
                  <div className="text-sm opacity-90 mt-1">Reference No</div>
                  <div className="font-semibold text-lg">{quotationDetails.referenceNo}</div>
                </>
              )}
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

     {/* Quotation Details */}
  <div className="bg-white rounded-lg p-6 shadow mb-8">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-gray-800">Quotation Details</h3>
      <button
        onClick={clearQuotationDetails}
        className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white px-3 py-1 rounded-md shadow hover:from-sky-700 hover:to-indigo-700"
      >
        Clear
      </button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      {/* Quotation Number */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Quotation Number <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 border rounded-md p-2 bg-gray-50 text-gray-700">
            {quotationDetails?.quotationNo ? (() => {
              const financialYear = extractFinancialYear(quotationDetails.quotationNo) || getCurrentFinancialYear();
              return `QT${financialYear}`;
            })() : 'QT'}
          </div>
          <input
            type="text"
            value={sequenceDigits}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 4);
              // Allow user to edit freely - no padding, no constraints during typing
              setSequenceDigits(value);
              setQuotationError('');
            }}
            onBlur={async () => {
              // Validate only when user finishes editing
              if (sequenceDigits && sequenceDigits.trim() !== '') {
                const seq = parseInt(sequenceDigits, 10);
                if (isNaN(seq) || seq < 1 || seq > 9999) {
                  setQuotationError('Sequence must be between 1 and 9999');
                  return;
                }

                // Check uniqueness only
                try {
                  const allQuotations = await getAllQuotations();
                  const financialYear = extractFinancialYear(quotationDetails?.quotationNo) || getCurrentFinancialYear();
                  // Use padded digits for building the full number format
                  const paddedDigits = sequenceDigits.padStart(4, '0');
                  const checkNumber = buildDocumentNumber('QT', financialYear, paddedDigits);
                  
                  console.log('🔍 [Quotation] Checking uniqueness for:', checkNumber);
                  
                  // Get current quotation ID if editing (to exclude it from uniqueness check)
                  // Check if we have the current quotation in context
                  const currentQuotationId = quotationDetails?._id;
                  const currentQuotationNo = quotationDetails?.quotationNo;
                  
                  const existing = allQuotations.find(q => {
                    // Skip the current quotation if editing (by ID or by number)
                    if (currentQuotationId && q._id === currentQuotationId) {
                      return false;
                    }
                    if (currentQuotationNo) {
                      const qNo = q.quotationNo || q.fullQuotationData?.quotationNo || '';
                      if (qNo === currentQuotationNo && qNo === checkNumber) {
                        return false; // Same quotation being edited
                      }
                    }
                    const qNo = q.quotationNo || q.fullQuotationData?.quotationNo || '';
                    return qNo === checkNumber;
                  });

                  if (existing) {
                    console.log('❌ [Quotation] Duplicate found:', existing);
                    setQuotationError('This quotation number already exists. Please use a different number.');
                    return;
                  }
                  
                  console.log('✅ [Quotation] Number is unique');
                  
                  setQuotationError('');
                } catch (error) {
                  console.error('Error checking quotation number uniqueness:', error);
                  setQuotationError('Could not verify quotation number uniqueness. Please check manually.');
                }
              } else {
                setQuotationError('Sequence number is required');
              }
            }}
            maxLength={4}
            className="w-20 border rounded-md p-2 text-center"
            placeholder="1"
          />
        </div>
        {quotationError && (
          <div className="text-xs text-red-500 mt-1">{quotationError}</div>
        )}
      </div>
      {/* Project Name */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Project Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className="w-full border rounded-md p-2"
          value={quotationDetails.projectName || ""}
          onChange={(e) =>
            setQuotationDetails((prev) => ({
              ...prev,
              projectName: e.target.value,
            }))
          }
          placeholder="Enter project name"
          required
        />
      </div>
    </div>
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

        {/* From / For Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Quotation From</h3>
                <div className="flex items-center gap-2">
                  <select 
                    onChange={handleFromLocationSelect} 
                    value={selectedFromLocation}
                    className="border rounded-md p-2 text-sm"
                  >
                <option value="">Select Location</option>
                {Object.keys(officeLocations).map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
                  <button
                    onClick={clearQuotationFrom}
                    className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white px-3 py-1 rounded-md shadow hover:from-sky-700 hover:to-indigo-700"
                  >
                    Clear
                  </button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input 
                  className="w-full border rounded-md p-2" 
                  value={quotationFrom.companyName || ''} 
                  onChange={e => setQuotationFrom(prev => ({ ...prev, companyName: e.target.value }))} 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Street & Area <span className="text-red-500">*</span>
                </label>
                <textarea 
                  className="w-full border rounded-md p-2" 
                  rows={2}
                  value={quotationFrom.street || ''} 
                  onChange={e => setQuotationFrom(prev => ({ ...prev, street: e.target.value }))} 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Apartment, suite</label>
                <textarea 
                  className="w-full border rounded-md p-2" 
                  rows={2}
                  value={quotationFrom.apartment || ''} 
                  onChange={e => setQuotationFrom(prev => ({ ...prev, apartment: e.target.value }))} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Zip Code</label>
                <input 
                  type="text"
                  className="w-full border rounded-md p-2" 
                  value={quotationFrom.zipCode || ''} 
                  onChange={e => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setQuotationFrom(prev => ({ ...prev, zipCode: value }));
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <select 
                  className="w-full border rounded-md p-2" 
                  value={quotationFrom.countryCode || ''} 
                  onChange={(e) => {
                    const countryCode = e.target.value;
                    setQuotationFrom(prev => ({ 
                      ...prev, 
                      countryCode, 
                      stateCode: '', 
                      city: '',
                      // Clear PAN and GSTIN if not India
                      pan: countryCode === 'IN' ? prev.pan : '',
                      gstin: countryCode === 'IN' ? prev.gstin : ''
                    }));
                    
                    // Clear bank details if not India
                    if (countryCode !== 'IN') {
                      setBankDetails(prev => ({
                        ...prev,
                        bankName: '',
                        accountNumber: '',
                        ifscCode: '',
                        branch: ''
                      }));
                    }
                    
                    // Load states for the selected country
                    if (countryCode) {
                      const states = State.getStatesOfCountry(countryCode);
                      setFromAddressData(prev => ({ states, cities: [] }));
                    } else {
                      setFromAddressData({ states: [], cities: [] });
                    }
                  }}
                  required
                >
                  <option value="">Select Country</option>
                  {allCountries.map(country => (
                    <option key={country.isoCode} value={country.isoCode}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">State/Province</label>
                <select 
                  className="w-full border rounded-md p-2 disabled:bg-gray-100" 
                  value={quotationFrom.stateCode || ''} 
                  onChange={(e) => {
                    const stateCode = e.target.value;
                    const countryCode = quotationFrom.countryCode || '';
                    setQuotationFrom(prev => ({ ...prev, stateCode, city: '' }));
                    
                    // Load cities for the selected state
                    if (countryCode && stateCode) {
                      const cities = City.getCitiesOfState(countryCode, stateCode);
                      setFromAddressData(prev => ({ ...prev, cities }));
                    } else {
                      setFromAddressData(prev => ({ ...prev, cities: [] }));
                    }
                  }}
                  disabled={!quotationFrom.countryCode}
                >
                  <option value="">Select State</option>
                  {fromAddressData.states.map(state => (
                    <option key={state.isoCode} value={state.isoCode}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <select 
                  className="w-full border rounded-md p-2 disabled:bg-gray-100" 
                  value={quotationFrom.city || ''} 
                  onChange={e => setQuotationFrom(prev => ({ ...prev, city: e.target.value }))} 
                  disabled={!quotationFrom.stateCode}
                  required
                >
                  <option value="">Select City</option>
                  {fromAddressData.cities.map(city => (
                    <option key={city.name} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Show PAN and GSTIN only for India offices */}
              {quotationFrom.countryCode === 'IN' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">PAN</label>
                    <input 
                      type="text"
                      className="w-full border rounded-md p-2" 
                      value={quotationFrom.pan || ''} 
                      onChange={e => {
                        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
                        setQuotationFrom(prev => ({ ...prev, pan: value }));
                      }}
                      maxLength={10}
                      placeholder="10 characters (e.g., ABCDE1234F)"
                    />
                    {quotationFrom.pan && (
                      <span className="text-xs" style={{ 
                        color: quotationFrom.pan.length === 10 ? '#10b981' : '#666' 
                      }}>
                        {quotationFrom.pan.length}/10
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">GSTIN (case sensitive)</label>
                    <input 
                      type="text"
                      className="w-full border rounded-md p-2" 
                      value={quotationFrom.gstin || ''} 
                      onChange={e => {
                        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
                        setQuotationFrom(prev => ({ ...prev, gstin: value }));
                      }}
                      maxLength={15}
                      placeholder="15 characters (e.g., 22ABCDE1234F1Z5)"
                    />
                    {quotationFrom.gstin && (
                      <span className="text-xs" style={{ 
                        color: quotationFrom.gstin.length === 15 ? '#10b981' : '#666' 
                      }}>
                        {quotationFrom.gstin.length}/15
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Quotation For</h3>
              <button
                onClick={clearQuotationFor}
                className="text-sm text-gray-500 hover:text-gray-800 border px-3 py-1 rounded-md"
              >
                Clear
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Client Name
                </label>
                <input 
                  className="w-full border rounded-md p-2" 
                  value={quotationFor.personName || ''} 
                  onChange={e => setQuotationFor(prev => ({ ...prev, personName: e.target.value }))} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input 
                  className="w-full border rounded-md p-2" 
                  value={quotationFor.companyName || ''} 
                  onChange={e => setQuotationFor(prev => ({ ...prev, companyName: e.target.value }))} 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Street & Area <span className="text-red-500">*</span>
                </label>
                <textarea 
                  className="w-full border rounded-md p-2" 
                  rows={2}
                  value={quotationFor.street || ''} 
                  onChange={e => setQuotationFor(prev => ({ ...prev, street: e.target.value }))} 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Apartment, suite</label>
                <textarea 
                  className="w-full border rounded-md p-2" 
                  rows={2}
                  value={quotationFor.apartment || ''} 
                  onChange={e => setQuotationFor(prev => ({ ...prev, apartment: e.target.value }))} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Zip Code</label>
                <input 
                  type="text"
                  className="w-full border rounded-md p-2" 
                  value={quotationFor.zipCode || ''} 
                  onChange={e => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setQuotationFor(prev => ({ ...prev, zipCode: value }));
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <select 
                  className="w-full border rounded-md p-2" 
                  value={quotationFor.countryCode || ''} 
                  onChange={(e) => {
                    const countryCode = e.target.value;
                    setQuotationFor(prev => ({ ...prev, countryCode, stateCode: '', city: '' }));
                    
                    // Load states for the selected country
                    if (countryCode) {
                      const states = State.getStatesOfCountry(countryCode);
                      setAddressData(prev => ({ states, cities: [] }));
                    } else {
                      setAddressData({ states: [], cities: [] });
                    }
                  }}
                  required
                >
                  <option value="">Select Country</option>
                  {allCountries.map(country => (
                    <option key={country.isoCode} value={country.isoCode}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">State/Province</label>
                <select 
                  className="w-full border rounded-md p-2 disabled:bg-gray-100" 
                  value={quotationFor.stateCode || ''} 
                  onChange={(e) => {
                    const stateCode = e.target.value;
                    const countryCode = quotationFor.countryCode || '';
                    setQuotationFor(prev => ({ ...prev, stateCode, city: '' }));
                    
                    // Load cities for the selected state
                    if (countryCode && stateCode) {
                      const cities = City.getCitiesOfState(countryCode, stateCode);
                      setAddressData(prev => ({ ...prev, cities }));
                    } else {
                      setAddressData(prev => ({ ...prev, cities: [] }));
                    }
                  }}
                  disabled={!quotationFor.countryCode}
                >
                  <option value="">Select State</option>
                  {addressData.states.map(state => (
                    <option key={state.isoCode} value={state.isoCode}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <select 
                  className="w-full border rounded-md p-2 disabled:bg-gray-100" 
                  value={quotationFor.city || ''} 
                  onChange={e => setQuotationFor(prev => ({ ...prev, city: e.target.value }))} 
                  disabled={!quotationFor.stateCode}
                  required
                >
                  <option value="">Select City</option>
                  {addressData.cities.map(city => (
                    <option key={city.name} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="p-6 bg-gray-50 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Items</h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleAddItem} 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                >
                  + Add Item
                </button>
                <button
                  onClick={clearItems}
                  className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white px-3 py-1 rounded-md shadow hover:from-sky-700 hover:to-indigo-700"
                >
                  Clear
                </button>
              </div>
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
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Tax Details</h3>
                  <button
                    type="button"
                    onClick={() => setTaxEnabled(!taxEnabled)}
                    className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                      taxEnabled
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-400 text-white hover:bg-gray-500'
                    }`}
                  >
                    {taxEnabled ? 'Disable Tax' : 'Enable Tax'}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">CGST (%)</label>
                    <input 
                      type="number" 
                      className="w-full border rounded-md p-2" 
                      value={globalTaxes.cgst || ''} 
                      onChange={(e) => setGlobalTaxes(prev => ({ ...prev, cgst: parseFloat(e.target.value) || 0 }))}
                      disabled={!taxEnabled}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">SGST (%)</label>
                    <input 
                      type="number" 
                      className="w-full border rounded-md p-2" 
                      value={globalTaxes.sgst || ''} 
                      onChange={(e) => setGlobalTaxes(prev => ({ ...prev, sgst: parseFloat(e.target.value) || 0 }))}
                      disabled={!taxEnabled}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">IGST (%)</label>
                    <input 
                      type="number" 
                      className="w-full border rounded-md p-2" 
                      value={globalTaxes.igst || ''} 
                      onChange={(e) => setGlobalTaxes(prev => ({ ...prev, igst: parseFloat(e.target.value) || 0 }))}
                      disabled={!taxEnabled}
                    />
                  </div>
                </div>
                {taxEnabled && (
                  <div className="mt-2 text-xs text-gray-600">
                    {globalTaxes.cgst > 0 || globalTaxes.sgst > 0 ? `Same State: CGST ${globalTaxes.cgst}% + SGST ${globalTaxes.sgst}%` : globalTaxes.igst > 0 ? `Different States: IGST ${globalTaxes.igst}%` : 'No tax applied'}
                  </div>
                )}
              </div>

              {/* Totals Summary */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {taxEnabled && cgstAmount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span>CGST ({autoTax.cgst}%):</span>
                      <span>₹{cgstAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {taxEnabled && sgstAmount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span>SGST ({autoTax.sgst}%):</span>
                      <span>₹{sgstAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {taxEnabled && igstAmount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span>IGST ({autoTax.igst}%):</span>
                      <span>₹{igstAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {taxEnabled && (
                    <div className="pt-2 mt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center text-gray-600">
                        <span>Tax Amount:</span>
                        <span>₹{totalTax.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-lg font-bold text-sky-900 mt-2 pt-2 border-t border-gray-200">
                    <span>Total:</span>
                    <span>₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white rounded-lg p-6 shadow-md mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Bank Details</h3>
            <button
              onClick={clearBankDetails}
              className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white px-3 py-1 rounded-md shadow hover:from-sky-700 hover:to-indigo-700"
            >
              Clear
            </button>
          </div>
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
            <div className="flex items-center gap-2">
              <button
                onClick={addTerm}
                className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white px-3 py-1 rounded-md shadow hover:from-sky-700 hover:to-indigo-700"
              >
                + Add
              </button>
              <button
                onClick={clearTerms}
                className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white px-3 py-1 rounded-md shadow hover:from-sky-700 hover:to-indigo-700"
              >
                Clear
              </button>
            </div>
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
                <button
                  onClick={() => removeTerm(index)}
                  className="ml-2 text-red-600 hover:text-red-800 text-lg font-bold"
                  title="Remove term"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Generate Document Button + Clear All */}
        <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3">
          <button
            onClick={clearAll}
            className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white px-6 py-2 rounded-lg shadow hover:from-sky-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
          >
            Clear All
          </button>
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