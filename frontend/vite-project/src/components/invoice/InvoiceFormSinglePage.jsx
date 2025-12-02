import React, { useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Country, State, City } from 'country-state-city';
import { InvoiceContext } from '../../context/InvoiceContext';
import InvoiceA4 from './InvoiceA4';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { createInvoice, getAllInvoices, getProformaInvoiceByReferenceNo, getNextInvoiceNumber } from '../../services/api.js';
import { getCurrentFinancialYear, extractFinancialYear, extractSequenceNumber, buildDocumentNumber } from '../../utils/financialYear.js';

// Auto-resize textarea component
const AutoResizeTextarea = React.memo(({ name, value, onChange, placeholder, className, required, maxLength, rows = 1 }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, 0);
  };

  return (
    <textarea
      ref={textareaRef}
      name={name}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      required={required}
      maxLength={maxLength}
      rows={rows}
      style={{
        minHeight: '38px',
        resize: 'none',
        overflow: 'hidden'
      }}
    />
  );
});

AutoResizeTextarea.displayName = 'AutoResizeTextarea';

// Office locations data
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
    city: 'Bangalore',
    state: 'Karnataka',
    zipCode: '560102',
    country: 'India',
    PAN: 'AADCV6398Q',
    GSTIN: '29AADCV6398Q1Z4'
  }
};

// Bank details for India offices
const indiaBankDetails = {
  bankName: 'ICICI Bank Limited',
  accountNo: '058705002413',
  branchIfsc: 'ICIC0000587',
  pan: 'Avinashi Road'
};

// AddressSection component
const AddressSection = React.memo(({ prefix, title, subTitle, showLocationSelect = false, onClear = null, formData, errors, handleChange, handleLocationSelect, handleCountryChange, handleStateChange, countries, states, cities, selectedLocation = '' }) => {
  const countryCode = formData[`${prefix}CountryCode`] || '';
  const stateCode = formData[`${prefix}StateCode`] || '';
  
  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-600">{subTitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {showLocationSelect && (
            <select 
              onChange={handleLocationSelect} 
              value={selectedLocation}
              className="border rounded-md p-2 text-sm"
            >
              <option value="">Select Location</option>
              {Object.keys(officeLocations).map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          )}
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="bg-gradient-to-r from-violet-600 to-violet-800 text-white px-3 py-1 rounded-md shadow hover:from-violet-700 hover:to-violet-900"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prefix !== 'invoiceFrom' && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Client Name
            </label>
            <AutoResizeTextarea 
              name={`${prefix}ClientName`} 
              value={formData[`${prefix}ClientName`] || ''} 
              onChange={handleChange} 
              className="w-full border rounded-md p-2"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Company name <span className="text-red-500">*</span>
          </label>
          <AutoResizeTextarea 
            name={`${prefix}CompanyName`} 
            value={formData[`${prefix}CompanyName`] || ''} 
            onChange={handleChange} 
            required
            className="w-full border rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Street & Area <span className="text-red-500">*</span>
          </label>
          <AutoResizeTextarea 
            name={`${prefix}Street`} 
            value={formData[`${prefix}Street`] || ''} 
            onChange={handleChange} 
            required
            className="w-full border rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Apartment, suite</label>
          <AutoResizeTextarea 
            name={`${prefix}Apartment`} 
            value={formData[`${prefix}Apartment`] || ''} 
            onChange={handleChange}
            className="w-full border rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Zip Code</label>
          <input 
            name={`${prefix}ZipCode`} 
            value={formData[`${prefix}ZipCode`] || ''} 
            onChange={handleChange}
            className="w-full border rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Country <span className="text-red-500">*</span>
          </label>
          <select 
            name={`${prefix}CountryCode`} 
            value={countryCode} 
            onChange={handleCountryChange(prefix)} 
            required
            className="w-full border rounded-md p-2"
          >
            <option value="">Select Country</option>
            {countries.map(country => (
              <option key={country.isoCode} value={country.isoCode}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">State/Province</label>
          <select 
            name={`${prefix}StateCode`} 
            value={stateCode} 
            onChange={handleStateChange(prefix)} 
            disabled={!countryCode}
            className="w-full border rounded-md p-2 disabled:bg-gray-100"
          >
            <option value="">Select State</option>
            {states.map(state => (
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
            name={`${prefix}City`} 
            value={formData[`${prefix}City`] || ''} 
            onChange={handleChange} 
            disabled={!stateCode}
            required
            className="w-full border rounded-md p-2 disabled:bg-gray-100"
          >
            <option value="">Select City</option>
            {cities.map(city => (
              <option key={city.name} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">PAN</label>
          <input 
            name={`${prefix}PAN`} 
            value={formData[`${prefix}PAN`] || ''} 
            onChange={handleChange}
            maxLength={10}
            placeholder="10 characters (e.g., ABCDE1234F)"
            className={`w-full border rounded-md p-2 ${errors[`${prefix}PAN`] ? 'border-red-500' : ''}`}
          />
          {formData[`${prefix}PAN`] && (
            <span className="text-xs" style={{ 
              color: formData[`${prefix}PAN`].length === 10 ? '#10b981' : '#666' 
            }}>
              {formData[`${prefix}PAN`].length}/10
            </span>
          )}
          {errors[`${prefix}PAN`] && (
            <p className="text-xs text-red-500 mt-1">
              {errors[`${prefix}PAN`]}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">GSTIN (case sensitive)</label>
          <input 
            name={`${prefix}GSTIN`} 
            value={formData[`${prefix}GSTIN`] || ''} 
            onChange={handleChange}
            maxLength={15}
            placeholder="15 characters (e.g., 22ABCDE1234F1Z5)"
            className={`w-full border rounded-md p-2 ${errors[`${prefix}GSTIN`] ? 'border-red-500' : ''}`}
          />
          {formData[`${prefix}GSTIN`] && (
            <span className="text-xs" style={{ 
              color: formData[`${prefix}GSTIN`].length === 15 ? '#10b981' : '#666' 
            }}>
              {formData[`${prefix}GSTIN`].length}/15
            </span>
          )}
          {errors[`${prefix}GSTIN`] && (
            <p className="text-xs text-red-500 mt-1">
              {errors[`${prefix}GSTIN`]}
            </p>
          )}
        </div>
        {prefix !== 'invoiceFrom' && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
            <input 
              name={`${prefix}PhoneNumber`} 
              type="tel"
              value={formData[`${prefix}PhoneNumber`] || ''} 
              onChange={handleChange} 
              placeholder="Enter phone number"
              className="w-full border rounded-md p-2"
            />
          </div>
        )}
      </div>
    </div>
  );
});

AddressSection.displayName = 'AddressSection';

const InvoiceFormSinglePage = () => {
  const {
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
  } = useContext(InvoiceContext);

  const navigate = useNavigate();
  const [showInvoice, setShowInvoice] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isPdfMode, setIsPdfMode] = useState(false);
  const invoiceRef = useRef();
  const [sequenceDigits, setSequenceDigits] = useState('1');
  const [invoiceNumberError, setInvoiceNumberError] = useState('');
  const [generatedSequence, setGeneratedSequence] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [errors, setErrors] = useState({});
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [proformaReferenceNo, setProformaReferenceNo] = useState('');
  const [proformaReferenceError, setProformaReferenceError] = useState('');
  const [isLoadingProforma, setIsLoadingProforma] = useState(false);
  
  // Get all countries - memoized
  const allCountries = useMemo(() => Country.getAllCountries(), []);
  
  // State for countries, states, and cities for each address section
  const [addressData, setAddressData] = useState({
    invoiceFrom: { states: [], cities: [] },
    billTo: { states: [], cities: [] }
  });

  // Granular address form data
  const [formData, setFormData] = useState({
    // Invoice From fields
    invoiceFromCompanyName: '',
    invoiceFromStreet: '',
    invoiceFromApartment: '',
    invoiceFromZipCode: '',
    invoiceFromCountryCode: '',
    invoiceFromStateCode: '',
    invoiceFromCity: '',
    invoiceFromPAN: '',
    invoiceFromGSTIN: '',
    // Bill To fields
    billToClientName: '',
    billToCompanyName: '',
    billToStreet: '',
    billToApartment: '',
    billToZipCode: '',
    billToCountryCode: '',
    billToStateCode: '',
    billToCity: '',
    billToPAN: '',
    billToGSTIN: '',
    billToPhoneNumber: '',
    // Invoice Details fields
    invoiceDate: '',
    paymentTerms: '',
    referenceNo: '',
    otherReferences: '',
    buyersOrderNo: '',
    buyersOrderDate: '',
    termsOfDelivery: '',
    projectName: ''
  });

  // Clear section handlers
  const clearInvoiceFromFields = () => {
    setFormData(prev => ({
      ...prev,
      invoiceFromCompanyName: '',
      invoiceFromStreet: '',
      invoiceFromApartment: '',
      invoiceFromZipCode: '',
      invoiceFromCountryCode: '',
      invoiceFromStateCode: '',
      invoiceFromCity: '',
      invoiceFromPAN: '',
      invoiceFromGSTIN: ''
    }));
    setSelectedLocation('');
  };

  const clearBillToFields = () => {
    setFormData(prev => ({
      ...prev,
      billToClientName: '',
      billToCompanyName: '',
      billToStreet: '',
      billToApartment: '',
      billToZipCode: '',
      billToCountryCode: '',
      billToStateCode: '',
      billToCity: '',
      billToPAN: '',
      billToGSTIN: '',
      billToPhoneNumber: ''
    }));
  };

  const clearInvoiceDetailsFields = () => {
    setFormData(prev => ({
      ...prev,
      invoiceDate: '',
      paymentTerms: '',
      referenceNo: '',
      otherReferences: '',
      buyersOrderNo: '',
      buyersOrderDate: '',
      termsOfDelivery: '',
      projectName: ''
    }));
  };

  const clearItemsFields = () => {
    setItems([{ id: 1, description: '', hsn: '', quantity: '', rate: '' }]);
  };

  const clearBankDetailsFields = () => {
    setBankDetails({ bankName: '', accountNo: '', branchIfsc: '', pan: '' });
  };

  // Clear all fields handler
  const clearAllFields = () => {
    const confirmed = window.confirm('Clear all fields? This will reset the form.');
    if (!confirmed) return;

    clearInvoiceFromFields();
    clearBillToFields();
    clearInvoiceDetailsFields();
    clearItemsFields();
    clearBankDetailsFields();
    setCustomerDetails({ name: '', address: '' });
    setSelectedLocation('');
    setErrors({});
  };

  // Generate unique invoice number in INV25260001 format
  useEffect(() => {
    const generateInvoiceNumber = async () => {
      // Check if invoice number already exists in context or state
      const existingNumber = invoiceNumber;
      
      // Only generate if invoice number is empty or default
      // Check if invoice number already exists and is in correct format
      if (existingNumber && existingNumber !== 'Auto' && existingNumber.trim() !== '') {
        // Check if it already has the new format
        const financialYear = extractFinancialYear(existingNumber);
        if (financialYear && existingNumber.startsWith('INV')) {
          const seq = extractSequenceNumber(existingNumber);
          if (seq !== null) {
            setSequenceDigits(seq.toString()); // No padding - show raw number
            setGeneratedSequence(seq);
            setInvoiceNumber(existingNumber);
            // Number already exists, don't regenerate
            return;
          }
        }
      }
      
      // If we reach here, invoice number doesn't exist or is invalid, so generate new one

      try {
        console.log('🔄 [InvoiceForm] Starting invoice number generation...');
        const newNumber = await getNextInvoiceNumber();
        console.log('✅ [InvoiceForm] Generated invoice number:', newNumber);
        
        const seq = extractSequenceNumber(newNumber);
        if (seq !== null) {
          setSequenceDigits(seq.toString()); // No padding - show raw number
          setGeneratedSequence(seq);
        }
        
        setInvoiceNumber(newNumber);
      } catch (error) {
        console.error('❌ [InvoiceForm] Error generating invoice number:', error);
        // Fallback: generate from existing invoices
        try {
          const invoices = await getAllInvoices();
          const existingNumbers = invoices
            .map(inv => inv.invoiceNumber || inv.fullInvoiceData?.invoiceNumber)
            .filter(num => num && typeof num === 'string' && num.startsWith('INV'));
          
          const financialYear = getCurrentFinancialYear();
          const currentYearNumbers = existingNumbers
            .filter(num => {
              const year = extractFinancialYear(num);
              return year === financialYear && num.startsWith('INV');
            });
          
          const sequenceNumbers = currentYearNumbers
            .map(num => extractSequenceNumber(num))
            .filter(num => num !== null);
          
          const maxSequence = sequenceNumbers.length > 0 ? Math.max(...sequenceNumbers) : 0;
          const nextSequence = maxSequence + 1;
          
          const fallbackNumber = buildDocumentNumber('INV', financialYear, nextSequence);
          console.log('🔄 [InvoiceForm] Using fallback invoice number:', fallbackNumber);
          
          setSequenceDigits(nextSequence.toString()); // No padding - show raw number
          setGeneratedSequence(nextSequence);
          setInvoiceNumber(fallbackNumber);
        } catch (fallbackError) {
          console.error('❌ [InvoiceForm] Fallback invoice generation failed:', fallbackError);
          const financialYear = getCurrentFinancialYear();
          const fallbackNumber = buildDocumentNumber('INV', financialYear, 1);
          setSequenceDigits('1'); // No padding - show raw number
          setGeneratedSequence(1);
          setInvoiceNumber(fallbackNumber);
        }
      }
    };

    // Only generate if invoice number doesn't exist
    if (!invoiceNumber || invoiceNumber === 'Auto' || invoiceNumber.trim() === '') {
      generateInvoiceNumber();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceNumber]);

  // Update full invoice number when sequence digits change
  useEffect(() => {
    if (invoiceNumber && sequenceDigits && sequenceDigits.trim() !== '') {
      const seq = parseInt(sequenceDigits, 10);
      if (!isNaN(seq) && seq > 0) {
        const financialYear = extractFinancialYear(invoiceNumber) || getCurrentFinancialYear();
        // Use padded digits only for building the full number format, but keep user input as-is
        const paddedDigits = sequenceDigits.padStart(4, '0');
        const newFullNumber = buildDocumentNumber('INV', financialYear, paddedDigits);
        if (newFullNumber !== invoiceNumber) {
          setInvoiceNumber(newFullNumber);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequenceDigits]);

  // Validate invoice number
  const validateInvoiceNumber = async () => {
    const seq = parseInt(sequenceDigits, 10);
    if (isNaN(seq) || seq < 1 || seq > 9999) {
      setInvoiceNumberError('Sequence must be between 1 and 9999');
      return false;
    }

    // Check uniqueness only
    try {
      const allInvoices = await getAllInvoices();
      const financialYear = extractFinancialYear(invoiceNumber) || getCurrentFinancialYear();
      // Use padded digits for building the full number format
      const paddedDigits = sequenceDigits.padStart(4, '0');
      const checkNumber = buildDocumentNumber('INV', financialYear, paddedDigits);
      
      console.log('🔍 [Invoice] Checking uniqueness for:', checkNumber);
      
      // Get current invoice number if editing (to exclude it from uniqueness check)
      const currentInvoiceNumber = invoiceNumber;
      
      const existing = allInvoices.find(inv => {
        const invNo = inv.invoiceNumber || inv.fullInvoiceData?.invoiceNumber || '';
        // Skip if this is the current invoice being edited (same number)
        if (currentInvoiceNumber && invNo === currentInvoiceNumber && invNo === checkNumber) {
          return false;
        }
        return invNo === checkNumber;
      });

      if (existing) {
        console.log('❌ [Invoice] Duplicate found:', existing);
        setInvoiceNumberError('This invoice number already exists. Please use a different number.');
        return false;
      }
      
      console.log('✅ [Invoice] Number is unique');
    } catch (error) {
      console.error('Error checking invoice number uniqueness:', error);
      setInvoiceNumberError('Could not verify invoice number uniqueness. Please check manually.');
      return false;
    }

    setInvoiceNumberError('');
    return true;
  };

  const handleSequenceChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    // Allow user to edit freely - no padding, no constraints during typing
    setSequenceDigits(value);
    setInvoiceNumberError('');
  };

  const handleSequenceBlur = async () => {
    // Validate only when user finishes editing
    if (sequenceDigits && sequenceDigits.trim() !== '') {
      await validateInvoiceNumber();
    } else {
      setInvoiceNumberError('Sequence number is required');
    }
  };

  // Initialize items if empty
  useEffect(() => {
    if (!items || items.length === 0) {
      setItems([{ name: '', hsn: '', quantity: 1, price: 0, cgst: 0, sgst: 0 }]);
    }
  }, [items, setItems]);

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogo(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleRemoveLogo = () => {
    setLogo(null);
  };

  // Map country names to ISO codes
  const countryNameToCode = {
    'India': 'IN',
    'USA': 'US',
    'GERMANY': 'DE'
  };

  // Handle location select for Invoice From
  const handleLocationSelect = useCallback((e) => {
    const locationValue = e.target.value;
    setSelectedLocation(locationValue);
    
    if (locationValue && officeLocations[locationValue]) {
      const location = officeLocations[locationValue];
      const countryCode = countryNameToCode[location.country] || '';
      
      setFormData(prev => ({
        ...prev,
        invoiceFromCompanyName: location.companyName,
        invoiceFromStreet: location.street,
        invoiceFromApartment: location.apartment,
        invoiceFromCity: location.city,
        invoiceFromZipCode: location.zipCode,
        invoiceFromCountryCode: countryCode,
        invoiceFromPAN: location.PAN || '',
        invoiceFromGSTIN: location.GSTIN || ''
      }));
      
      // Load states for the selected country
      if (countryCode) {
        const states = State.getStatesOfCountry(countryCode);
        setAddressData(prev => ({
          ...prev,
          invoiceFrom: { states, cities: [] }
        }));
        
        // Try to find and set state
        if (location.state) {
          let state = states.find(s => s.name === location.state);
          if (!state) {
            state = states.find(s => s.name.toLowerCase() === location.state.toLowerCase());
          }
          
          if (state) {
            setFormData(prev => ({
              ...prev,
              invoiceFromStateCode: state.isoCode
            }));
            
            // Load cities for the selected state
            const cities = City.getCitiesOfState(countryCode, state.isoCode);
            setAddressData(prev => ({
              ...prev,
              invoiceFrom: { states, cities }
            }));
            
            // Try to find and set city - handle both "Bangalore" and "Bengaluru"
            if (location.city) {
              let cityMatch = cities.find(c => 
                c.name.toLowerCase() === location.city.toLowerCase()
              );
              
              if (!cityMatch && location.city.toLowerCase() === 'bangalore') {
                cityMatch = cities.find(c => c.name.toLowerCase() === 'bengaluru');
              } else if (!cityMatch && location.city.toLowerCase() === 'bengaluru') {
                cityMatch = cities.find(c => c.name.toLowerCase() === 'bangalore');
              }
              
              if (cityMatch) {
                setFormData(prev => ({
                  ...prev,
                  invoiceFromCity: cityMatch.name
                }));
              } else {
                setFormData(prev => ({
                  ...prev,
                  invoiceFromCity: location.city
                }));
              }
            }
          }
        }
      }
      
      // Auto-fill bank details if India office is selected, otherwise clear them
      if (location.country === 'India') {
        setBankDetails(prev => ({
          ...prev,
          bankName: indiaBankDetails.bankName,
          accountNo: indiaBankDetails.accountNo,
          branchIfsc: indiaBankDetails.branchIfsc,
          pan: indiaBankDetails.pan
        }));
      } else {
        // Clear bank details for non-India offices
        setBankDetails(prev => ({
          ...prev,
          bankName: '',
          accountNo: '',
          branchIfsc: '',
          pan: ''
        }));
      }
    } else {
      // Clear all invoice from fields when "Select Location" is selected
      setFormData(prev => ({
        ...prev,
        invoiceFromCompanyName: '',
        invoiceFromStreet: '',
        invoiceFromApartment: '',
        invoiceFromCity: '',
        invoiceFromZipCode: '',
        invoiceFromCountryCode: '',
        invoiceFromStateCode: '',
        invoiceFromPAN: '',
        invoiceFromGSTIN: ''
      }));
      
      // Clear states and cities
      setAddressData(prev => ({
        ...prev,
        invoiceFrom: { states: [], cities: [] }
      }));
      
      // Clear bank details
      setBankDetails(prev => ({
        ...prev,
        bankName: '',
        accountNo: '',
        branchIfsc: '',
        pan: ''
      }));
    }
  }, []);

  // Handle country change - load states for selected country
  const handleCountryChange = useCallback((prefix) => (e) => {
    const countryCode = e.target.value;
    
    setFormData(prev => ({
      ...prev,
      [`${prefix}CountryCode`]: countryCode,
      [`${prefix}StateCode`]: '',
      [`${prefix}City`]: ''
    }));
    
    // Load states for the selected country
    if (countryCode) {
      const states = State.getStatesOfCountry(countryCode);
      setAddressData(prev => ({
        ...prev,
        [prefix]: { states, cities: [] }
      }));
    } else {
      setAddressData(prev => ({
        ...prev,
        [prefix]: { states: [], cities: [] }
      }));
    }
  }, []);

  // Handle state change - load cities for selected state
  const handleStateChange = useCallback((prefix) => (e) => {
    const stateCode = e.target.value;
    const countryCode = formData[`${prefix}CountryCode`] || '';
    
    setFormData(prev => ({
      ...prev,
      [`${prefix}StateCode`]: stateCode,
      [`${prefix}City`]: ''
    }));
    
    // Load cities for the selected state
    if (countryCode && stateCode) {
      const cities = City.getCitiesOfState(countryCode, stateCode);
      setAddressData(prev => ({
        ...prev,
        [prefix]: { ...prev[prefix], cities }
      }));
    } else {
      setAddressData(prev => ({
        ...prev,
        [prefix]: { ...prev[prefix], cities: [] }
      }));
    }
  }, [formData]);

  // Validation functions for PAN and GSTIN
  const validatePAN = useCallback((value, fieldName) => {
    if (!value) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
      return true; // Empty is okay (optional field)
    }
    
    if (value.length !== 10) {
      setErrors(prev => ({ ...prev, [fieldName]: 'PAN must be exactly 10 characters' }));
      return false;
    }
    
    // PAN format: 5 letters, 4 numbers, 1 letter (e.g., ABCDE1234F)
    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panPattern.test(value)) {
      setErrors(prev => ({ ...prev, [fieldName]: 'Invalid PAN format. Format: AAAAA9999A (5 letters, 4 numbers, 1 letter)' }));
      return false;
    }
    
    setErrors(prev => ({ ...prev, [fieldName]: '' }));
    return true;
  }, []);

  const validateGSTIN = useCallback((value, fieldName) => {
    if (!value) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
      return true; // Empty is okay (optional field)
    }
    
    if (value.length !== 15) {
      setErrors(prev => ({ ...prev, [fieldName]: 'GSTIN must be exactly 15 characters' }));
      return false;
    }
    
    // GSTIN format: 2 digits (state code) + 10 chars (PAN) + 3 chars (entity + checksum)
    const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$/;
    if (!gstinPattern.test(value)) {
      setErrors(prev => ({ ...prev, [fieldName]: 'Invalid GSTIN format. Format: 22AAAAA0000A1Z5' }));
      return false;
    }
    
    setErrors(prev => ({ ...prev, [fieldName]: '' }));
    return true;
  }, []);

  // Handle form field changes
  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    let newValue = value;
    let errorMessage = '';
    
    // Zip Code validation - only numbers
    if (name.includes('ZipCode')) {
      newValue = value.replace(/[^0-9]/g, '');
    }
    
    // PAN validation - max 10 characters, alphanumeric uppercase
    if (name.includes('PAN')) {
      newValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
      // Validate PAN format
      if (newValue) {
        if (newValue.length !== 10) {
          errorMessage = 'PAN must be exactly 10 characters';
        } else {
          const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
          if (!panPattern.test(newValue)) {
            errorMessage = 'Invalid PAN format. Format: AAAAA9999A (5 letters, 4 numbers, 1 letter)';
          }
        }
      }
    }
    
    // GSTIN validation - max 15 characters, alphanumeric uppercase
    if (name.includes('GSTIN')) {
      newValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
      // Validate GSTIN format
      if (newValue) {
        if (newValue.length !== 15) {
          errorMessage = 'GSTIN must be exactly 15 characters';
        } else {
          const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$/;
          if (!gstinPattern.test(newValue)) {
            errorMessage = 'Invalid GSTIN format. Format: 22AAAAA0000A1Z5';
          }
        }
      }
    }
    
    // Batch state updates to prevent focus loss
    setFormData(prev => ({ ...prev, [name]: newValue }));
    
    // Only update errors if it's a PAN/GSTIN field and the error message changed
    if (name.includes('PAN') || name.includes('GSTIN')) {
      setErrors(prev => {
        // Only update if error message actually changed to prevent unnecessary re-renders
        if (prev[name] !== errorMessage) {
          return { ...prev, [name]: errorMessage };
        }
        return prev;
      });
    }
  }, []);

  const handleBankChange = (field, value) => {
    setBankDetails(prev => ({ ...prev, [field]: value }));
  };

  // Handle proforma invoice reference number lookup
  const handleProformaReferenceLookup = useCallback(async () => {
    const refNo = proformaReferenceNo?.trim();
    
    if (!refNo) {
      setProformaReferenceError('');
      return;
    }
    
    setIsLoadingProforma(true);
    setProformaReferenceError('');
    
    try {
      const proformaInvoice = await getProformaInvoiceByReferenceNo(refNo);
      
      // Get the Bill To address from proforma invoice
      const billToAddress = proformaInvoice.billToAddress || {};
      const fullInvoiceData = proformaInvoice.fullInvoiceData || {};
      const formDataFromFull = fullInvoiceData.formData || {};
      
      // Extract all granular fields from proforma invoice
      // Prefer fullInvoiceData.formData (granular) over billToAddress (may be names)
      const clientName = formDataFromFull.billToClientName || billToAddress.clientName || '';
      const companyName = formDataFromFull.billToCompanyName || billToAddress.companyName || '';
      const street = formDataFromFull.billToStreet || billToAddress.street || '';
      const apartment = formDataFromFull.billToApartment || billToAddress.apartment || '';
      const zipCode = formDataFromFull.billToZipCode || billToAddress.zipCode || '';
      const city = formDataFromFull.billToCity || billToAddress.city || '';
      // Check multiple possible property names for PAN, GSTIN, and PhoneNumber
      // Try formData first (most reliable), then billToAddress as fallback
      const pan = formDataFromFull.billToPAN || formDataFromFull.billToPan || billToAddress.pan || billToAddress.PAN || '';
      const gstin = formDataFromFull.billToGSTIN || formDataFromFull.billToGstin || billToAddress.gstin || billToAddress.GSTIN || '';
      const phoneNumber = formDataFromFull.billToPhoneNumber || formDataFromFull.billToPhone || billToAddress.phoneNumber || billToAddress.phone || '';
      
      // Handle country - prefer countryCode from formData, fallback to country name
      let countryCode = formDataFromFull.billToCountryCode || '';
      if (!countryCode && billToAddress.country) {
        // Map country name to ISO code
        const countryNameToCode = {
          'India': 'IN',
          'USA': 'US',
          'GERMANY': 'DE'
        };
        countryCode = countryNameToCode[billToAddress.country] || billToAddress.country || '';
      }
      
      // Handle state - prefer stateCode from formData, fallback to state name
      let stateCode = formDataFromFull.billToStateCode || '';
      if (!stateCode && billToAddress.state) {
        stateCode = billToAddress.state; // Will be matched later
      }
      
      // Get projectName from proforma invoice
      const projectName = proformaInvoice.projectName || formDataFromFull.projectName || '';
      
      // Update Bill To fields with granular data
      setFormData(prev => ({
        ...prev,
        billToClientName: clientName,
        billToCompanyName: companyName,
        billToStreet: street,
        billToApartment: apartment,
        billToZipCode: zipCode,
        billToCountryCode: countryCode,
        billToStateCode: stateCode,
        billToCity: city,
        billToPAN: pan,
        billToGSTIN: gstin,
        billToPhoneNumber: phoneNumber,
        // Auto-fill referenceNo in Invoice Details
        referenceNo: refNo,
        // Auto-fill projectName from proforma invoice
        projectName: projectName
      }));
      
      // Load states and cities if country code is available
      if (countryCode) {
        const states = State.getStatesOfCountry(countryCode);
        setAddressData(prev => ({
          ...prev,
          billTo: { states, cities: [] }
        }));
        
        if (stateCode) {
          // Try to find state by code or name
          let stateObj = states.find(s => s.isoCode === stateCode);
          if (!stateObj) {
            stateObj = states.find(s => s.name === stateCode);
          }
          
          if (stateObj) {
            setFormData(prev => ({
              ...prev,
              billToStateCode: stateObj.isoCode
            }));
            
            // Load cities for the selected state
            const cities = City.getCitiesOfState(countryCode, stateObj.isoCode);
            setAddressData(prev => ({
              ...prev,
              billTo: { states, cities }
            }));
            
            // Try to find and set city
            if (city) {
              const cityMatch = cities.find(c => 
                c.name.toLowerCase() === city.toLowerCase()
              );
              
              if (cityMatch) {
                setFormData(prev => ({
                  ...prev,
                  billToCity: cityMatch.name
                }));
              } else {
                setFormData(prev => ({
                  ...prev,
                  billToCity: city
                }));
              }
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Error fetching proforma invoice:', error);
      setProformaReferenceError(error.message || 'Reference number does not exist in proforma invoice');
      // Clear the bill to fields if reference number is invalid
      setFormData(prev => ({
        ...prev,
        billToClientName: '',
        billToCompanyName: '',
        billToStreet: '',
        billToApartment: '',
        billToCity: '',
        billToZipCode: '',
        billToCountryCode: '',
        billToStateCode: '',
        billToPAN: '',
        billToGSTIN: '',
        billToPhoneNumber: ''
      }));
    } finally {
      setIsLoadingProforma(false);
    }
  }, [proformaReferenceNo]);

  const handleItemChange = (idx, field, value) => {
    const updated = items.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([...items, { name: '', hsn: '', quantity: 1, price: 0, cgst: 0, sgst: 0 }]);
  };

  const handleDeleteItem = (idx) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    }
  };

  // Check if Invoice From and Bill To are in the same state
  const isSameState = () => {
    const fromState = formData.invoiceFromStateCode;
    const toState = formData.billToStateCode;
    
    // Get GSTIN state codes as fallback
    let fromGSTINState = null;
    let toGSTINState = null;
    
    if (formData.invoiceFromGSTIN && formData.invoiceFromGSTIN.length >= 2) {
      fromGSTINState = formData.invoiceFromGSTIN.substring(0, 2);
    }
    
    if (formData.billToGSTIN && formData.billToGSTIN.length >= 2) {
      toGSTINState = formData.billToGSTIN.substring(0, 2);
    }
    
    // Priority 1: Compare using state codes if both are available
    if (fromState && toState) {
      return fromState === toState;
    }
    
    // Priority 2: Compare using GSTIN state codes if both GSTINs are available
    if (fromGSTINState && toGSTINState) {
      return fromGSTINState === toGSTINState;
    }
    
    // If we can't determine, default to inter-state (IGST)
    return false;
  };

  // Auto-update tax on items when addresses change
  useEffect(() => {
    if (taxEnabled) {
      const sameState = isSameState();
      const updatedItems = items.map(item => {
        if (sameState) {
          // Intra-state: CGST 9% + SGST 9%
          return { ...item, cgst: 9, sgst: 9 };
        } else {
          // Inter-state: IGST 18% (CGST 0, SGST 0, IGST = 18)
          return { ...item, cgst: 0, sgst: 0 };
        }
      });
      setItems(updatedItems);
    } else {
      // Disable tax: set all to 0
      const updatedItems = items.map(item => ({ ...item, cgst: 0, sgst: 0 }));
      setItems(updatedItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.invoiceFromStateCode, formData.billToStateCode, formData.invoiceFromGSTIN, formData.billToGSTIN, taxEnabled]);

  // IGST = CGST + SGST (or 18% if inter-state)
  const getIGST = (item) => {
    if (!taxEnabled) return 0;
    const sameState = isSameState();
    if (sameState) {
      return Number(item.cgst) + Number(item.sgst);
    } else {
      return 18; // Inter-state IGST 18%
    }
  };
  
  // Total Tax Amount = Quantity * Price * IGST % / 100
  const getTotalTaxAmount = (item) => {
    if (!taxEnabled) return 0;
    const base = Number(item.quantity) * Number(item.price);
    const igst = getIGST(item);
    return ((base * igst) / 100).toFixed(2);
  };
  
  // Total Amount = base + total tax amount
  const getTotalAmount = (item) => {
    const base = Number(item.quantity) * Number(item.price);
    const tax = taxEnabled ? Number(getTotalTaxAmount(item)) : 0;
    return (base + tax).toFixed(2);
  };

  // Calculate grand totals
  const grandTotalTax = taxEnabled ? items.reduce((sum, item) => sum + Number(getTotalTaxAmount(item)), 0) : 0;
  const grandTotalAmount = items.reduce((sum, item) => sum + Number(getTotalAmount(item)), 0);

  const actualInvoiceNumber = invoiceNumber || '001';
  const actualInvoiceDate = formData.invoiceDate || issueDate || new Date().toISOString().split('T')[0];

  const handleDownloadPDF = async () => {
    // Validate invoice number before generating PDF
    const isValid = await validateInvoiceNumber();
    if (!isValid) {
      return; // Don't proceed if validation fails
    }
    
    setIsPdfMode(true);
    setTimeout(async () => {
      const input = invoiceRef.current;

      const canvas = await html2canvas(input, {
        scale: 5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        letterRendering: false,
        scrollX: 0,
        scrollY: 0,
        backgroundColor: '#ffffff',
        removeContainer: true,
        textRendering: true,
        fontFace: 'Arial, Helvetica, sans-serif',
        x: 0,
        y: 0,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const imgWidth = 794;
      const pageHeight = 1123;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const imgData = canvas.toDataURL('image/jpeg', 1.0);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4',
        hotfixes: ['px_scaling'],
        compress: false
      });

      const pageCount = Math.ceil(imgHeight / pageHeight);

      if (pageCount <= 1) {
        pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth - 20, imgHeight - 20, undefined, 'FAST');
      } else {
        let position = 0;
        pdf.addImage(imgData, 'JPEG', 10, position, imgWidth - 20, imgHeight, undefined, 'FAST');
        for (let i = 1; i < pageCount; i++) {
          position = -pageHeight * i + 10;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 10, position, imgWidth - 20, imgHeight, undefined, 'FAST');
        }
      }

      const pdfBlob = pdf.output('blob');
      const fileName = `invoice_${actualInvoiceNumber || new Date().toISOString().slice(0, 10)}.pdf`;
      
      try {
        const { uploadPdfToS3, updateInvoiceS3Url } = await import('../../services/api.js');
        const uploadResult = await uploadPdfToS3(pdfBlob, fileName, 'Invoice');
        console.log('✅ Invoice PDF uploaded to S3:', uploadResult.url);

        if (actualInvoiceNumber && actualInvoiceNumber !== 'Auto' && actualInvoiceNumber.trim() !== '') {
          try {
            const { updateInvoice, getAllInvoices } = await import('../../services/api.js');
            
            // Check if this is an edit (has _id in context or formData)
            const invoiceContext = useContext(InvoiceContext);
            const invoiceId = invoiceContext?.invoiceData?._id || formData?._id;
            
            if (invoiceId) {
              // Update full invoice data
              const dbData = {
                invoiceNumber: actualInvoiceNumber,
                invoiceDate: formData.invoiceDate || issueDate || new Date().toISOString(),
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
                  country: formData.billToCountryCode || '',
                  state: formData.billToStateCode || '',
                  pan: formData.billToPAN || '',
                  gstin: formData.billToGSTIN || '',
                  phoneNumber: formData.billToPhoneNumber || '',
                },
                totalAmount: grandTotalAmount || 0,
                s3Url: uploadResult.url || '',
                fullInvoiceData: {
                  formData,
                  items,
                  taxEnabled,
                  calculations: {
                    subtotal: grandTotalBase,
                    totalTax: grandTotalTax,
                    total: grandTotalAmount
                  }
                },
              };
              
              await updateInvoice(existingInvoice._id, dbData);
              console.log('✅ Database updated with full invoice data and S3 URL');
            } else {
              // Just update S3 URL if no existing invoice found
              await updateInvoiceS3Url(actualInvoiceNumber, uploadResult.url);
              console.log('✅ Database updated with S3 URL for invoice:', actualInvoiceNumber);
            }
          } catch (dbError) {
            console.warn('⚠️ Could not update database:', dbError.message);
          }
        }
      } catch (uploadError) {
        console.error('❌ Error uploading PDF to S3:', uploadError);
      }

      pdf.save(fileName);
      setIsPdfMode(false);
      
      // Navigate back to form page after download
      setTimeout(() => {
        navigate('/invoice');
      }, 500);
    }, 800);
  };

  // Format address from granular fields
  const formatAddress = (prefix) => {
    const parts = [];
    
    if (prefix !== 'invoiceFrom' && formData[`${prefix}ClientName`]) {
      parts.push(formData[`${prefix}ClientName`]);
    }
    
    if (formData[`${prefix}CompanyName`]) {
      parts.push(formData[`${prefix}CompanyName`]);
    }
    
    if (formData[`${prefix}Street`]) {
      parts.push(formData[`${prefix}Street`]);
    }
    
    if (formData[`${prefix}Apartment`]) {
      parts.push(formData[`${prefix}Apartment`]);
    }
    
    if (formData[`${prefix}City`]) {
      let cityLine = formData[`${prefix}City`];
      const stateCode = formData[`${prefix}StateCode`];
      
      if (stateCode && addressData[prefix] && addressData[prefix].states && addressData[prefix].states.length > 0) {
        const state = addressData[prefix].states.find(s => s.isoCode === stateCode);
        if (state) {
          cityLine += ', ' + state.name;
        }
      }
      
      if (formData[`${prefix}ZipCode`]) {
        cityLine += ' ' + formData[`${prefix}ZipCode`];
      }
      
      parts.push(cityLine);
    }
    
    const countryCode = formData[`${prefix}CountryCode`];
    if (countryCode) {
      const country = allCountries.find(c => c.isoCode === countryCode);
      if (country) {
        parts.push(country.name);
      }
    }
    
    if (formData[`${prefix}GSTIN`]) {
      parts.push(`GSTIN/UIN: ${formData[`${prefix}GSTIN`]}`);
    }
    
    if (formData[`${prefix}PAN`]) {
      parts.push(`PAN: ${formData[`${prefix}PAN`]}`);
    }
    
    if (prefix !== 'invoiceFrom' && formData[`${prefix}PhoneNumber`]) {
      parts.push(`Phone: ${formData[`${prefix}PhoneNumber`]}`);
    }
    
    return parts.join(', ');
  };

  // Sync invoiceDate with issueDate when formData changes
  useEffect(() => {
    if (formData.invoiceDate && formData.invoiceDate !== issueDate) {
      setIssueDate(formData.invoiceDate);
    }
  }, [formData.invoiceDate, issueDate, setIssueDate]);

  // Save invoice to database when preview is shown
  useEffect(() => {
    const saveInvoice = async () => {
      if (!showInvoice || isSaved) return;
      
      const actualInvoiceNumber = invoiceNumber || '001';
      const actualInvoiceDate = formData.invoiceDate || issueDate || new Date().toISOString().split('T')[0];
      const actualTotalAmount = grandTotalAmount || 0;
      
      if (!actualInvoiceNumber || actualInvoiceNumber === 'Auto') {
        console.warn('⚠️ Cannot save: Invoice number is missing or invalid');
        return;
      }
      
      if (!actualInvoiceDate) {
        console.warn('⚠️ Cannot save: Invoice date is missing');
        return;
      }
      
      if (!actualTotalAmount || actualTotalAmount <= 0) {
        console.warn('⚠️ Cannot save: Total amount is missing or invalid');
        return;
      }
      
      if (!formData.invoiceFromCompanyName) {
        console.warn('⚠️ Cannot save: Invoice From company name is missing');
        return;
      }
      
      try {
        // Format addresses
        const invoiceFromFormatted = formatAddress('invoiceFrom');
        const billToFormatted = formatAddress('billTo');
        
        const dbData = {
          invoiceNumber: actualInvoiceNumber,
          invoiceDate: actualInvoiceDate,
          referenceNo: formData.referenceNo || '',
          projectName: formData.projectName || '',
          totalAmount: Number(actualTotalAmount),
          fromAddress: {
            companyName: formData.invoiceFromCompanyName || '',
            street: formData.invoiceFromStreet || '',
            apartment: formData.invoiceFromApartment || '',
            zipCode: formData.invoiceFromZipCode || '',
            countryCode: formData.invoiceFromCountryCode || '',
            stateCode: formData.invoiceFromStateCode || '',
            city: formData.invoiceFromCity || '',
            pan: formData.invoiceFromPAN || '',
            gstin: formData.invoiceFromGSTIN || '',
            address: invoiceFromFormatted
          },
          toAddress: {
            clientName: formData.billToClientName || '',
            companyName: formData.billToCompanyName || '',
            street: formData.billToStreet || '',
            apartment: formData.billToApartment || '',
            zipCode: formData.billToZipCode || '',
            countryCode: formData.billToCountryCode || '',
            stateCode: formData.billToStateCode || '',
            city: formData.billToCity || '',
            pan: formData.billToPAN || '',
            gstin: formData.billToGSTIN || '',
            phoneNumber: formData.billToPhoneNumber || '',
            name: formData.billToClientName || formData.billToCompanyName || '',
            address: billToFormatted
          },
          fullInvoiceData: {
            formData,
            bankDetails,
            invoiceDetails: {
              number: actualInvoiceNumber,
              date: actualInvoiceDate,
              paymentTerms: formData.paymentTerms || '',
              referenceNo: formData.referenceNo || '',
              otherReferences: formData.otherReferences || '',
              buyersOrderNo: formData.buyersOrderNo || '',
              buyersOrderDate: formData.buyersOrderDate || '',
              termsOfDelivery: formData.termsOfDelivery || ''
            },
            items,
          },
        };

        await createInvoice(dbData);
        console.log('✅ Invoice saved to database');
        setIsSaved(true);
      } catch (error) {
        console.error('❌ Error saving invoice to database:', error);
      }
    };

    if (showInvoice && formData.invoiceFromCompanyName && formData.billToCompanyName) {
      saveInvoice();
    }
  }, [showInvoice, isSaved, invoiceNumber, issueDate, grandTotalAmount, formData, items, bankDetails, allCountries, addressData]);

  const InvoicePreview = () => (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="relative" style={{ transform: 'scale(0.85)', transformOrigin: 'top center', maxHeight: '90vh', overflow: 'auto' }}>
        <button
          className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-xl font-bold z-10"
          onClick={() => setShowInvoice(false)}
        >
          ×
        </button>
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-bold">Invoice Preview</div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            Back to Home
          </button>
        </div>
        <div ref={invoiceRef} className="bg-white" style={{ position: 'relative', width: '794px', margin: '0 auto' }}>
          <InvoiceA4
            customer={{
              name: formData.billToClientName || formData.billToCompanyName || '',
              address: formatAddress('billTo')
            }}
            items={items}
            issueDate={actualInvoiceDate}
            invoiceNumber={actualInvoiceNumber}
            projectName={formData.projectName || ''}
            logo={logo}
            onDownloadPDF={handleDownloadPDF}
            isPdfMode={isPdfMode}
            bankDetails={bankDetails}
            taxEnabled={taxEnabled}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-violet-800 text-white rounded-lg p-6 shadow mb-8">
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
              <h1 className="text-2xl font-bold">Invoice Builder</h1>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">Invoice No</div>
              <div className="font-semibold text-lg">{actualInvoiceNumber}</div>
              <div className="text-sm opacity-90 mt-2">Project Name</div>
              <div className="font-semibold text-lg">{formData.projectName || '-'}</div>
            </div>
          </div>
        </div>

        {/* Invoice From Section */}
        <div className="bg-white rounded-lg p-6 shadow mb-8">
          <AddressSection 
            prefix="invoiceFrom"
            title="Invoice From"
            subTitle="Enter company details"
            showLocationSelect={true}
            onClear={clearInvoiceFromFields}
            formData={formData}
            errors={errors}
            handleChange={handleFormChange}
            handleLocationSelect={handleLocationSelect}
            handleCountryChange={handleCountryChange}
            handleStateChange={handleStateChange}
            countries={allCountries}
            states={addressData.invoiceFrom.states}
            cities={addressData.invoiceFrom.cities}
            selectedLocation={selectedLocation}
          />
        </div>

        {/* Proforma Invoice Reference Section */}
        <div className="bg-white rounded-lg p-6 shadow mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Proforma Invoice Reference</h3>
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Proforma Invoice Reference Number
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={proformaReferenceNo}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  setProformaReferenceNo(value);
                  setProformaReferenceError('');
                }}
                onBlur={handleProformaReferenceLookup}
                placeholder="Enter proforma invoice reference number"
                className={`flex-1 border rounded-md p-2 ${proformaReferenceError ? 'border-red-500' : ''}`}
                disabled={isLoadingProforma}
              />
              {isLoadingProforma && (
                <div className="flex items-center px-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-600"></div>
                </div>
              )}
            </div>
            {proformaReferenceError && (
              <p className="text-sm text-red-500 mt-1">{proformaReferenceError}</p>
            )}
            {!proformaReferenceError && proformaReferenceNo && !isLoadingProforma && (
              <p className="text-sm text-green-600 mt-1">✓ Address auto-filled from proforma invoice</p>
            )}
          </div>
        </div>

        {/* Bill To Section */}
        <div className="bg-white rounded-lg p-6 shadow mb-8">
          <AddressSection 
            prefix="billTo"
            title="Bill To"
            subTitle="Enter customer details"
            onClear={clearBillToFields}
            formData={formData}
            errors={errors}
            handleChange={handleFormChange}
            handleLocationSelect={handleLocationSelect}
            handleCountryChange={handleCountryChange}
            handleStateChange={handleStateChange}
            countries={allCountries}
            states={addressData.billTo.states}
            cities={addressData.billTo.cities}
          />
        </div>

        {/* Invoice Details Section */}
        <div className="bg-white rounded-lg p-6 shadow mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Invoice Details</h3>
            <button
              type="button"
              onClick={clearInvoiceDetailsFields}
              className="bg-gradient-to-r from-violet-600 to-violet-800 text-white px-3 py-1 rounded-md shadow hover:from-violet-700 hover:to-violet-900"
            >
              Clear
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Invoice Number <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 border rounded-md p-2 bg-gray-50 text-gray-700">
                  {invoiceNumber ? (() => {
                    const financialYear = extractFinancialYear(invoiceNumber) || getCurrentFinancialYear();
                    return `INV${financialYear}`;
                  })() : 'INV'}
                </div>
                <input
                  type="text"
                  value={sequenceDigits}
                  onChange={handleSequenceChange}
                  onBlur={handleSequenceBlur}
                  maxLength={4}
                  className="w-20 border rounded-md p-2 text-center"
                  placeholder="1"
                />
              </div>
              {invoiceNumberError && (
                <div className="text-xs text-red-500 mt-1">{invoiceNumberError}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Dated <span className="text-red-500">*</span>
              </label>
              <input 
                type="date" 
                name="invoiceDate" 
                value={formData.invoiceDate || issueDate || ''} 
                onChange={handleFormChange} 
                required 
                className="w-full border rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Mode/Terms of Payment <span className="text-red-500">*</span>
              </label>
              <AutoResizeTextarea 
                name="paymentTerms" 
                value={formData.paymentTerms || ''} 
                onChange={handleFormChange} 
                required
                className="w-full border rounded-md p-2"
                placeholder="Enter payment terms"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Reference No <span className="text-red-500">*</span>
              </label>
              <AutoResizeTextarea 
                name="referenceNo" 
                value={formData.referenceNo || ''} 
                onChange={handleFormChange} 
                required
                className="w-full border rounded-md p-2"
                placeholder="Enter reference number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Other References</label>
              <AutoResizeTextarea 
                name="otherReferences" 
                value={formData.otherReferences || ''} 
                onChange={handleFormChange}
                className="w-full border rounded-md p-2"
                placeholder="Enter other references"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Buyer's Order No <span className="text-red-500">*</span>
              </label>
              <AutoResizeTextarea 
                name="buyersOrderNo" 
                value={formData.buyersOrderNo || ''} 
                onChange={handleFormChange} 
                required
                className="w-full border rounded-md p-2"
                placeholder="Enter buyer's order number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Dated <span className="text-red-500">*</span>
              </label>
              <input 
                type="date" 
                name="buyersOrderDate" 
                value={formData.buyersOrderDate || ''} 
                onChange={handleFormChange} 
                required 
                className="w-full border rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Terms of Delivery</label>
              <AutoResizeTextarea 
                name="termsOfDelivery" 
                value={formData.termsOfDelivery || ''} 
                onChange={handleFormChange}
                className="w-full border rounded-md p-2"
                placeholder="Enter terms of delivery"
              />
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="p-6 bg-gray-50 border-b">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Items</h3>
              <div className="flex items-center gap-2">
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
                <button
                  onClick={handleAddItem}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
                >
                  + Add Item
                </button>
                <button
                  type="button"
                  onClick={clearItemsFields}
                  className="bg-gradient-to-r from-violet-600 to-violet-800 text-white px-3 py-1 rounded-md shadow hover:from-violet-700 hover:to-violet-900"
                >
                  Clear
                </button>
              </div>
            </div>
            {taxEnabled && (
              <div className="text-sm text-gray-600">
                {isSameState() ? 'Same State: CGST 9% + SGST 9%' : 'Different States: IGST 18%'}
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">SNo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Item Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">HSN/SAC</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Price/Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">CGST %</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">SGST %</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total Tax (IGST) %</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total Tax Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total Amount</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">{idx + 1}</td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                        className="w-full border rounded p-2"
                        placeholder="Item name"
                      />
                    </td>
                    <td className="px-4 py-2 w-32">
                      <input
                        type="text"
                        value={item.hsn || ''}
                        onChange={(e) => handleItemChange(idx, 'hsn', e.target.value)}
                        className="w-full border rounded p-2"
                        placeholder="HSN/SAC"
                      />
                    </td>
                    <td className="px-4 py-2 w-24">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full border rounded p-2"
                      />
                    </td>
                    <td className="px-4 py-2 w-32">
                      <input
                        type="number"
                        min="0"
                        value={item.price}
                        onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                        className="w-full border rounded p-2"
                      />
                    </td>
                    <td className="px-4 py-2 w-24">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.cgst}
                        onChange={(e) => handleItemChange(idx, 'cgst', e.target.value)}
                        className={`w-full border rounded p-2 ${taxEnabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        placeholder="CGST %"
                        readOnly={taxEnabled}
                        disabled={taxEnabled}
                      />
                    </td>
                    <td className="px-4 py-2 w-24">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.sgst}
                        onChange={(e) => handleItemChange(idx, 'sgst', e.target.value)}
                        className={`w-full border rounded p-2 ${taxEnabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        placeholder="SGST %"
                        readOnly={taxEnabled}
                        disabled={taxEnabled}
                      />
                    </td>
                    <td className="px-4 py-2 text-center font-semibold">{getIGST(item)}</td>
                    <td className="px-4 py-2 text-right font-semibold">{getTotalTaxAmount(item)}</td>
                    <td className="px-4 py-2 text-right font-semibold">{getTotalAmount(item)}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleDeleteItem(idx)}
                        className="text-red-600 hover:text-red-800"
                        disabled={items.length === 1}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={8} className="px-4 py-2 text-right">Grand Total</td>
                  <td className="px-4 py-2 text-right">{grandTotalTax.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">{grandTotalAmount.toFixed(2)}</td>
                  <td className="px-4 py-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white rounded-lg p-6 shadow-md mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Bank Details</h3>
            <button
              type="button"
              onClick={clearBankDetailsFields}
              className="bg-gradient-to-r from-violet-600 to-violet-800 text-white px-3 py-1 rounded-md shadow hover:from-violet-700 hover:to-violet-900"
            >
              Clear
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Bank Name</label>
              <input
                type="text"
                value={bankDetails.bankName || ''}
                onChange={(e) => handleBankChange('bankName', e.target.value)}
                className="w-full border rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">A/C No.</label>
              <input
                type="text"
                value={bankDetails.accountNo || ''}
                onChange={(e) => handleBankChange('accountNo', e.target.value)}
                className="w-full border rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">IFSC Code</label>
              <input
                type="text"
                value={bankDetails.branchIfsc || ''}
                onChange={(e) => handleBankChange('branchIfsc', e.target.value)}
                className="w-full border rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">MICR Number</label>
              <input
                type="text"
                value={bankDetails.pan || ''}
                onChange={(e) => handleBankChange('pan', e.target.value)}
                className="w-full border rounded-md p-2"
              />
            </div>
          </div>
        </div>

        {/* Generate Invoice Button */}
        <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3">
          <button
            type="button"
            onClick={clearAllFields}
            className="bg-gradient-to-r from-violet-600 to-violet-800 text-white px-6 py-2 rounded-lg shadow hover:from-violet-700 hover:to-violet-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
          >
            Clear All
          </button>
          <button
            onClick={() => setShowInvoice(true)}
            className="bg-gradient-to-r from-violet-600 to-violet-800 text-white px-8 py-3 rounded-lg shadow-lg hover:from-violet-700 hover:to-violet-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transform hover:scale-105 transition-all duration-200"
          >
            Generate Invoice
          </button>
        </div>
      </div>
      {showInvoice && <InvoicePreview />}
    </div>
  );
};

export default InvoiceFormSinglePage;

