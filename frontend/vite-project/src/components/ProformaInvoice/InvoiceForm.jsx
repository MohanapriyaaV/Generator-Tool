import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Country, State, City } from 'country-state-city';
import { getQuotationByReferenceNo, getAllProformaInvoices, getNextProformaInvoiceNumber } from '../../services/api.js';
import { getCurrentFinancialYear, extractFinancialYear, extractSequenceNumber, buildDocumentNumber } from '../../utils/financialYear.js';
import './InvoiceForm.css';

// Auto-resize textarea component
const AutoResizeTextarea = React.memo(({ name, value, onChange, placeholder, className, required, maxLength, onKeyDown, rows = 1 }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  // Handle onChange to also trigger resize
  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
    // Auto-resize after change
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
      onKeyDown={onKeyDown}
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

// Office locations data - defined outside to prevent recreation
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

// AddressSection component - defined outside to prevent recreation
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
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-md shadow hover:from-blue-700 hover:to-indigo-700"
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
              value={formData[`${prefix}ClientName`]} 
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
            value={formData[`${prefix}CompanyName`]} 
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
            value={formData[`${prefix}Street`]} 
            onChange={handleChange} 
            required
            className="w-full border rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Apartment, suite</label>
          <AutoResizeTextarea 
            name={`${prefix}Apartment`} 
            value={formData[`${prefix}Apartment`]} 
            onChange={handleChange}
            className="w-full border rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Zip Code</label>
          <input 
            name={`${prefix}ZipCode`} 
            value={formData[`${prefix}ZipCode`]} 
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
            value={formData[`${prefix}PAN`]} 
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
            value={formData[`${prefix}GSTIN`]} 
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
              value={formData[`${prefix}PhoneNumber`]} 
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

const InvoiceForm = ({ onSubmit, loading = false, initialData = null }) => {
  const location = useLocation();
  const [items, setItems] = useState([{ id: 1, description: '', hsn: '', quantity: '', rate: '' }]);
  const [errors, setErrors] = useState({});
  const [selectedLocation, setSelectedLocation] = useState('');
  const [referenceNoError, setReferenceNoError] = useState('');
  const [isLoadingQuotation, setIsLoadingQuotation] = useState(false);
  const [sequenceDigits, setSequenceDigits] = useState('1');
  const [invoiceNumberError, setInvoiceNumberError] = useState('');
  const [generatedSequence, setGeneratedSequence] = useState(null);
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNo: '',
    branchIfsc: '',
    pan: ''
  });
  
  // Get all countries - memoized to prevent recreation
  const allCountries = useMemo(() => Country.getAllCountries(), []);
  
  // State for countries, states, and cities for each address section
  const [addressData, setAddressData] = useState({
    invoiceFrom: { states: [], cities: [] },
    billTo: { states: [], cities: [] },
    shipTo: { states: [], cities: [] }
  });

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
    // Ship To fields
    shipToClientName: '',
    shipToCompanyName: '',
    shipToStreet: '',
    shipToApartment: '',
    shipToZipCode: '',
    shipToCountryCode: '',
    shipToStateCode: '',
    shipToCity: '',
    shipToPAN: '',
    shipToGSTIN: '',
    shipToPhoneNumber: '',
    // Invoice details fields
    invoiceNumber: '',
    invoiceDate: '',
    deliveryNote: '',
    paymentTerms: '',
    referenceNo: '',
    otherReferences: '',
    buyersOrderNo: '',
    buyersOrderDate: '',
    dispatchDocNo: '',
    deliveryNoteDate: '',
    dispatchedThrough: '',
    destination: '',
    termsOfDelivery: '',
    // Reference number for quotation lookup
    quotationReferenceNo: '',
    projectName: ''
  });

  // Validation functions - memoized to prevent recreation
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

  // Clear handlers for individual sections
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

  const clearShipToFields = () => {
    setFormData(prev => ({
      ...prev,
      shipToClientName: '',
      shipToCompanyName: '',
      shipToStreet: '',
      shipToApartment: '',
      shipToZipCode: '',
      shipToCountryCode: '',
      shipToStateCode: '',
      shipToCity: '',
      shipToPAN: '',
      shipToGSTIN: '',
      shipToPhoneNumber: ''
    }));
  };

  const clearInvoiceDetailsFields = () => {
    setFormData(prev => ({
      ...prev,
      invoiceDate: '',
      deliveryNote: '',
      paymentTerms: '',
      referenceNo: '',
      otherReferences: '',
      buyersOrderNo: '',
      buyersOrderDate: '',
      dispatchDocNo: '',
      deliveryNoteDate: '',
      dispatchedThrough: '',
      destination: '',
      termsOfDelivery: '',
      quotationReferenceNo: '',
      projectName: ''
    }));
  };

  const clearItemsFields = () => {
    setItems([{ id: 1, description: '', hsn: '', quantity: '', rate: '' }]);
  };

  const clearBankDetailsFields = () => {
    setBankDetails({ bankName: '', accountNo: '', branchIfsc: '', pan: '' });
  };

  // Clear all fields (with optional parameter to skip confirmation)
  const clearAllFields = (skipConfirmation = false) => {
    console.log('clearAllFields called, skipConfirmation:', skipConfirmation);
    
    if (!skipConfirmation) {
      const warningMessage = '⚠️ WARNING: This will clear ALL form data including:\n\n• Invoice From details\n• Bill To details\n• Ship To details\n• Invoice details\n• All items\n• Bank details\n\nThis action cannot be undone. Are you sure you want to proceed?';
      console.log('Showing confirmation dialog...');
      const confirmed = window.confirm(warningMessage);
      console.log('User confirmed:', confirmed);
      if (!confirmed) {
        console.log('User cancelled, not clearing fields');
        return;
      }
    }
    
    console.log('Clearing all fields...');
    clearInvoiceFromFields();
    clearBillToFields();
    clearShipToFields();
    clearInvoiceDetailsFields();
    clearItemsFields();
    clearBankDetailsFields();
    setErrors({});
    console.log('All fields cleared');
  };

  // Effect to handle form clearing and PI number generation after download
  useEffect(() => {
    // Check if we should clear the form (coming back from download)
    if (location.state?.clearForm) {
      console.log('🔄 [InvoiceForm] Clearing form after download...');
      
      // Clear all fields without confirmation (inline to avoid dependency issues)
      clearInvoiceFromFields();
      clearBillToFields();
      clearShipToFields();
      clearInvoiceDetailsFields();
      clearItemsFields();
      clearBankDetailsFields();
      setErrors({});
      
      // Generate new PI number
      const generateInvoiceNumber = async () => {
        try {
          console.log('🔄 [InvoiceForm] Generating new invoice number after download...');
          const newNumber = await getNextProformaInvoiceNumber();
          console.log('✅ [InvoiceForm] Generated new invoice number:', newNumber);
          
          const seq = extractSequenceNumber(newNumber);
          if (seq !== null) {
            setSequenceDigits(seq.toString());
            setGeneratedSequence(seq);
          }
          
          setFormData(prev => ({
            ...prev,
            invoiceNumber: newNumber
          }));
        } catch (error) {
          console.error('❌ [InvoiceForm] Error generating invoice number:', error);
          // Fallback: generate with current financial year
          const financialYear = getCurrentFinancialYear();
          const fallbackNumber = buildDocumentNumber('PI', financialYear, 1);
          
          setSequenceDigits('1');
          setGeneratedSequence(1);
          
          setFormData(prev => ({
            ...prev,
            invoiceNumber: fallbackNumber
          }));
        }
      };
      
      generateInvoiceNumber();
      
      // Clear the location state to prevent re-triggering
      // Use replace to update the location state without adding to history
      if (location.state) {
        window.history.replaceState({ ...location.state, clearForm: false }, '');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.clearForm]);

  // Handle reference number lookup
  const handleReferenceNoLookup = useCallback(async () => {
    const refNo = formData.quotationReferenceNo?.trim();
    
    if (!refNo) {
      setReferenceNoError('');
      return;
    }
    
    setIsLoadingQuotation(true);
    setReferenceNoError('');
    
    try {
      const quotation = await getQuotationByReferenceNo(refNo);
      
      // Get the "To Address" from quotation (this is the "Quotation For" address)
      const quotationFor = quotation.fullQuotationData?.quotationFor || {};
      const toAddress = quotation.toAddress || {};
      
      // Extract all granular fields from quotation
      const personName = toAddress.personName || quotationFor.personName || '';
      const companyName = toAddress.companyName || quotationFor.companyName || '';
      const street = toAddress.street || quotationFor.street || '';
      const apartment = toAddress.apartment || quotationFor.apartment || '';
      const zipCode = toAddress.zipCode || quotationFor.zipCode || '';
      const countryCode = toAddress.countryCode || quotationFor.countryCode || '';
      const stateCode = toAddress.stateCode || quotationFor.stateCode || '';
      const city = toAddress.city || quotationFor.city || '';
      const pan = toAddress.pan || quotationFor.pan || '';
      const gstin = toAddress.gstin || quotationFor.gstin || '';
      const phoneNumber = toAddress.phoneNumber || quotationFor.phoneNumber || '';
      
      // Get projectName from quotation - check multiple possible locations
      // Priority: 1. Top level, 2. fullQuotationData.quotationDetails, 3. quotationDetails (direct)
      const projectName = quotation.projectName || 
                         quotation.fullQuotationData?.quotationDetails?.projectName ||
                         quotation.quotationDetails?.projectName ||
                         quotation.fullQuotationData?.projectName || '';
      
      console.log('Fetched quotation projectName:', {
        direct: quotation.projectName,
        fromFullDataQuotationDetails: quotation.fullQuotationData?.quotationDetails?.projectName,
        fromFullData: quotation.fullQuotationData?.projectName,
        fromQuotationDetails: quotation.quotationDetails?.projectName,
        final: projectName,
        fullQuotationData: quotation.fullQuotationData,
        quotationData: quotation
      });
      
      // Update Bill To fields with granular data and auto-fill referenceNo
      setFormData(prev => ({
        ...prev,
        billToClientName: personName,
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
        // Auto-fill referenceNo with the quotation reference number
        referenceNo: refNo,
        // Auto-fill projectName from quotation
        projectName: projectName
      }));
      
      // Load states and cities if country and state codes are available
      if (countryCode) {
        const states = State.getStatesOfCountry(countryCode);
        setAddressData(prev => ({
          ...prev,
          billTo: { states, cities: [] }
        }));
        
        if (stateCode) {
          const cities = City.getCitiesOfState(countryCode, stateCode);
          setAddressData(prev => ({
            ...prev,
            billTo: { states, cities }
          }));
        }
      }
      
    } catch (error) {
      console.error('Error fetching quotation:', error);
      setReferenceNoError(error.message || 'Reference number does not exist in quotation');
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
      setIsLoadingQuotation(false);
    }
  }, [formData.quotationReferenceNo]);

  const handleChange = useCallback((e) => {
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
      // Validate PAN format - but only set error after update
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
      // Validate GSTIN format - but only set error after update
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

  // Map country names to ISO codes
  const countryNameToCode = {
    'India': 'IN',
    'USA': 'US',
    'GERMANY': 'DE'
  };

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
      
      // Auto-fill bank details if India office is selected, otherwise clear them
      if (location.country === 'India') {
        setBankDetails({
          bankName: indiaBankDetails.bankName,
          accountNo: indiaBankDetails.accountNo,
          branchIfsc: indiaBankDetails.branchIfsc,
          pan: indiaBankDetails.pan
        });
      } else {
        // Clear bank details for non-India offices
        setBankDetails({
          bankName: '',
          accountNo: '',
          branchIfsc: '',
          pan: ''
        });
      }
      
      // Load states for the selected country
      if (countryCode) {
        const states = State.getStatesOfCountry(countryCode);
        setAddressData(prev => ({
          ...prev,
          invoiceFrom: { states, cities: [] }
        }));
        
        // Try to find and set state if provided
        if (location.state) {
          // First try exact match
          let state = states.find(s => s.name === location.state);
          
          // If no exact match, try case-insensitive match
          if (!state) {
            state = states.find(s => s.name.toLowerCase() === location.state.toLowerCase());
          }
          
          // If still no match, try variations (e.g., "Baden-Württemberg" vs "Baden-Wurttemberg")
          if (!state) {
            const normalizedLocationState = location.state.toLowerCase().replace(/[üöä]/g, (match) => {
              const map = { 'ü': 'u', 'ö': 'o', 'ä': 'a' };
              return map[match] || match;
            });
            state = states.find(s => {
              const normalizedStateName = s.name.toLowerCase().replace(/[üöä]/g, (match) => {
                const map = { 'ü': 'u', 'ö': 'o', 'ä': 'a' };
                return map[match] || match;
              });
              return normalizedStateName === normalizedLocationState;
            });
          }
          
          // If still no match, try partial match
          if (!state) {
            state = states.find(s => 
              s.name.toLowerCase().includes(location.state.toLowerCase()) ||
              location.state.toLowerCase().includes(s.name.toLowerCase())
            );
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
              invoiceFrom: { ...prev.invoiceFrom, cities }
            }));
            
            // Try to find and set the city from the loaded cities
            // Handle both "Bangalore" and "Bengaluru" as they're the same city
            if (location.city) {
              // First try exact match
              let cityMatch = cities.find(c => 
                c.name.toLowerCase() === location.city.toLowerCase()
              );
              
              // If no exact match, try common variations
              if (!cityMatch && location.city.toLowerCase() === 'bangalore') {
                cityMatch = cities.find(c => 
                  c.name.toLowerCase() === 'bengaluru'
                );
              } else if (!cityMatch && location.city.toLowerCase() === 'bengaluru') {
                cityMatch = cities.find(c => 
                  c.name.toLowerCase() === 'bangalore'
                );
              }
              
              // If still no match, try partial match
              if (!cityMatch) {
                cityMatch = cities.find(c => 
                  c.name.toLowerCase().includes(location.city.toLowerCase()) ||
                  location.city.toLowerCase().includes(c.name.toLowerCase())
                );
              }
              
              if (cityMatch) {
                setFormData(prev => ({
                  ...prev,
                  invoiceFromCity: cityMatch.name
                }));
              } else {
                // If no match found, set the original city name (it will still work in the form)
                setFormData(prev => ({
                  ...prev,
                  invoiceFromCity: location.city
                }));
              }
            }
          }
        }
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
      setBankDetails({
        bankName: '',
        accountNo: '',
        branchIfsc: '',
        pan: ''
      });
    }
  }, []);

  // Handle country change - load states for selected country
  const handleCountryChange = useCallback((prefix) => (e) => {
    const countryCode = e.target.value;
    
    setFormData(prev => ({
      ...prev,
      [`${prefix}CountryCode`]: countryCode,
      [`${prefix}StateCode`]: '', // Reset state when country changes
      [`${prefix}City`]: '' // Reset city when country changes
    }));
    
    // Auto-fill or clear bank details based on country for invoiceFrom
    if (prefix === 'invoiceFrom') {
      if (countryCode === 'IN') {
        // India - auto-fill bank details
        setBankDetails({
          bankName: indiaBankDetails.bankName,
          accountNo: indiaBankDetails.accountNo,
          branchIfsc: indiaBankDetails.branchIfsc,
          pan: indiaBankDetails.pan
        });
      } else {
        // Other countries - clear bank details
        setBankDetails({
          bankName: '',
          accountNo: '',
          branchIfsc: '',
          pan: ''
        });
      }
    }
    
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
      [`${prefix}City`]: '' // Reset city when state changes
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

  const handleBankChange = (field, value) => {
    setBankDetails(prev => ({ ...prev, [field]: value }));
  };

  // Generate unique invoice number on component mount (if not editing)
  // This effect depends on initialData and location.state to ensure it doesn't run before initialData is loaded
  useEffect(() => {
    // Check if we're editing - check both initialData prop and location.state
    const editingData = initialData || location.state?.initialData;
    
    // Skip if editing existing invoice
    if (editingData) {
      // If editingData exists, ensure we preserve the invoice number
      if (editingData.invoiceNumber) {
        const seq = extractSequenceNumber(editingData.invoiceNumber);
        if (seq !== null) {
          setSequenceDigits(seq.toString()); // No padding - show raw number
          setGeneratedSequence(seq);
        }
      }
      return;
    }
    
    // Also check if formData already has an invoice number (from previous state)
    if (formData.invoiceNumber && formData.invoiceNumber.trim() !== '') {
      const seq = extractSequenceNumber(formData.invoiceNumber);
      if (seq !== null) {
        setSequenceDigits(seq.toString()); // No padding - show raw number
        setGeneratedSequence(seq);
      }
      return;
    }

    const generateInvoiceNumber = async () => {
      try {
        console.log('🔄 [InvoiceForm] Starting invoice number generation...');
        const newNumber = await getNextProformaInvoiceNumber();
        console.log('✅ [InvoiceForm] Generated invoice number:', newNumber);
        
        const seq = extractSequenceNumber(newNumber);
        if (seq !== null) {
          setSequenceDigits(seq.toString()); // No padding - show raw number
          setGeneratedSequence(seq);
        }
        
        setFormData(prev => {
          const currentNumber = prev.invoiceNumber;
          console.log('📝 [InvoiceForm] Current invoice number in state:', currentNumber);
          
          // Only update if invoice number is still empty
          if (!currentNumber || currentNumber.trim() === '') {
            console.log('✏️ [InvoiceForm] Updating state with invoice number:', newNumber);
            return {
              ...prev,
              invoiceNumber: newNumber
            };
          }
          console.log('⏭️ [InvoiceForm] Invoice number already set, skipping update');
          return prev;
        });
      } catch (error) {
        console.error('❌ [InvoiceForm] Error generating invoice number:', error);
        // Fallback: generate with current financial year
        const financialYear = getCurrentFinancialYear();
        const fallbackNumber = buildDocumentNumber('PI', financialYear, 1);
        console.log('🔄 [InvoiceForm] Using fallback invoice number:', fallbackNumber);
        
        setSequenceDigits('1'); // No padding - show raw number
        setGeneratedSequence(1);
        
        setFormData(prev => {
          if (!prev.invoiceNumber || prev.invoiceNumber.trim() === '') {
            return {
              ...prev,
              invoiceNumber: fallbackNumber
            };
          }
          return prev;
        });
      }
    };

    // Generate invoice number only if we're not editing (check again at the end)
    if (!editingData) {
      generateInvoiceNumber();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, location.state?.initialData]);

  // Update full invoice number when sequence digits change
  // Only update if sequenceDigits is a valid number (not empty)
  useEffect(() => {
    if (formData.invoiceNumber && sequenceDigits && sequenceDigits.trim() !== '') {
      const seq = parseInt(sequenceDigits, 10);
      if (!isNaN(seq) && seq > 0) {
        const financialYear = extractFinancialYear(formData.invoiceNumber) || getCurrentFinancialYear();
        // Use padded digits only for building the full number format, but keep user input as-is
        const paddedDigits = sequenceDigits.padStart(4, '0');
        const newFullNumber = buildDocumentNumber('PI', financialYear, paddedDigits);
        if (newFullNumber !== formData.invoiceNumber) {
          setFormData(prev => ({ ...prev, invoiceNumber: newFullNumber }));
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
      const allInvoices = await getAllProformaInvoices();
      const financialYear = extractFinancialYear(formData.invoiceNumber) || getCurrentFinancialYear();
      // Use padded digits for building the full number format
      const paddedDigits = sequenceDigits.padStart(4, '0');
      const checkNumber = buildDocumentNumber('PI', financialYear, paddedDigits);
      
      console.log('🔍 [ProformaInvoice] Checking uniqueness for:', checkNumber);
      
      // Get current invoice ID and number if editing (to exclude it from uniqueness check)
      const currentInvoiceId = initialData?._id || location.state?.initialData?._id;
      const currentInvoiceNumber = initialData?.invoiceNumber || location.state?.initialData?.invoiceNumber;
      
      console.log('🔍 [ProformaInvoice] Current invoice being edited:', {
        currentInvoiceId,
        currentInvoiceNumber,
        checkNumber
      });
      
      const existing = allInvoices.find(inv => {
        // Skip the current invoice if editing (by ID or by number)
        if (currentInvoiceId && inv._id === currentInvoiceId) {
          console.log('⏭️ [ProformaInvoice] Skipping current invoice by ID:', inv._id);
          return false;
        }
        
        // Also skip if the invoice number matches the original invoice number being edited
        const invNo = inv.invoiceNumber || inv.fullInvoiceData?.invoiceNumber || '';
        if (currentInvoiceNumber && invNo === currentInvoiceNumber && invNo === checkNumber) {
          console.log('⏭️ [ProformaInvoice] Skipping current invoice by number:', invNo);
          return false;
        }
        
        return invNo === checkNumber;
      });

      if (existing) {
        console.log('❌ [ProformaInvoice] Duplicate found:', existing);
        setInvoiceNumberError('This invoice number already exists. Please use a different number.');
        return false;
      }
      
      console.log('✅ [ProformaInvoice] Number is unique');
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

  // Load initial data when provided (for editing)
  // Check both initialData prop and location.state
  useEffect(() => {
    const editingData = initialData || location.state?.initialData;
    if (editingData) {
      // Populate form data from editingData
      const newFormData = {
        // Invoice From fields
        invoiceFromCompanyName: editingData.invoiceFromCompanyName || '',
        invoiceFromStreet: editingData.invoiceFromStreet || '',
        invoiceFromApartment: editingData.invoiceFromApartment || '',
        invoiceFromZipCode: editingData.invoiceFromZipCode || '',
        invoiceFromCountryCode: editingData.invoiceFromCountryCode || '',
        invoiceFromStateCode: editingData.invoiceFromStateCode || '',
        invoiceFromCity: editingData.invoiceFromCity || '',
        invoiceFromPAN: editingData.invoiceFromPAN || '',
        invoiceFromGSTIN: editingData.invoiceFromGSTIN || '',
        // Bill To fields
        billToClientName: editingData.billToClientName || '',
        billToCompanyName: editingData.billToCompanyName || '',
        billToStreet: editingData.billToStreet || '',
        billToApartment: editingData.billToApartment || '',
        billToZipCode: editingData.billToZipCode || '',
        billToCountryCode: editingData.billToCountryCode || '',
        billToStateCode: editingData.billToStateCode || '',
        billToCity: editingData.billToCity || '',
        billToPAN: editingData.billToPAN || '',
        billToGSTIN: editingData.billToGSTIN || '',
        billToPhoneNumber: editingData.billToPhoneNumber || '',
        // Ship To fields
        shipToClientName: editingData.shipToClientName || '',
        shipToCompanyName: editingData.shipToCompanyName || '',
        shipToStreet: editingData.shipToStreet || '',
        shipToApartment: editingData.shipToApartment || '',
        shipToZipCode: editingData.shipToZipCode || '',
        shipToCountryCode: editingData.shipToCountryCode || '',
        shipToStateCode: editingData.shipToStateCode || '',
        shipToCity: editingData.shipToCity || '',
        shipToPAN: editingData.shipToPAN || '',
        shipToGSTIN: editingData.shipToGSTIN || '',
        shipToPhoneNumber: editingData.shipToPhoneNumber || '',
        // Invoice details fields
        invoiceNumber: editingData.invoiceNumber || '',
        invoiceDate: editingData.invoiceDate ? (typeof editingData.invoiceDate === 'string' ? editingData.invoiceDate.split('T')[0] : new Date(editingData.invoiceDate).toISOString().split('T')[0]) : '',
        deliveryNote: editingData.deliveryNote || '',
        paymentTerms: editingData.paymentTerms || '',
        referenceNo: editingData.referenceNo || '',
        otherReferences: editingData.otherReferences || '',
        buyersOrderNo: editingData.buyersOrderNo || '',
        buyersOrderDate: editingData.buyersOrderDate ? (typeof editingData.buyersOrderDate === 'string' ? editingData.buyersOrderDate.split('T')[0] : new Date(editingData.buyersOrderDate).toISOString().split('T')[0]) : '',
        dispatchDocNo: editingData.dispatchDocNo || '',
        deliveryNoteDate: editingData.deliveryNoteDate ? (typeof editingData.deliveryNoteDate === 'string' ? editingData.deliveryNoteDate.split('T')[0] : new Date(editingData.deliveryNoteDate).toISOString().split('T')[0]) : '',
        dispatchedThrough: editingData.dispatchedThrough || '',
        destination: editingData.destination || '',
        termsOfDelivery: editingData.termsOfDelivery || '',
        quotationReferenceNo: editingData.quotationReferenceNo || '',
        projectName: editingData.projectName || ''
      };
      
      setFormData(newFormData);
      
      // Extract sequence digits from invoice number if available
      if (editingData.invoiceNumber) {
        const seq = extractSequenceNumber(editingData.invoiceNumber);
        if (seq !== null) {
          setSequenceDigits(seq.toString()); // No padding - show raw number
          setGeneratedSequence(seq);
        }
      }
      
      // Load bank details from editingData if available
      if (editingData.bankDetails) {
        setBankDetails(editingData.bankDetails);
      } else if (editingData.fullInvoiceData?.bankDetails) {
        setBankDetails(editingData.fullInvoiceData.bankDetails);
      }
      
      // Populate items
      if (editingData.items && editingData.items.length > 0) {
        const populatedItems = editingData.items.map((item, index) => ({
          id: index + 1,
          description: item.description || '',
          hsn: item.hsn || '',
          quantity: item.quantity || '',
          rate: item.rate || ''
        }));
        setItems(populatedItems);
      }
      
      // Load states and cities for each address section
      const prefixes = ['invoiceFrom', 'billTo', 'shipTo'];
      const newAddressData = {
        invoiceFrom: { states: [], cities: [] },
        billTo: { states: [], cities: [] },
        shipTo: { states: [], cities: [] }
      };
      
      prefixes.forEach(prefix => {
        const countryCode = newFormData[`${prefix}CountryCode`];
        const stateCode = newFormData[`${prefix}StateCode`];
        
        if (countryCode) {
          const states = State.getStatesOfCountry(countryCode);
          newAddressData[prefix] = { states, cities: [] };
          
          if (stateCode && countryCode) {
            const cities = City.getCitiesOfState(countryCode, stateCode);
            newAddressData[prefix] = { states, cities };
          }
        }
      });
      
      setAddressData(newAddressData);
    }
  }, [initialData, location.state?.initialData]); // Run when initialData or location.state changes

  const handleItemChange = (id, field, value) => {
    let newValue = value;
    
    // HSN/SAC - accept all characters (alphanumeric and special characters)
    // No filtering needed for HSN/SAC
    
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: newValue } : item
    ));
  };

  const addItem = () => {
    setItems([...items, { id: Date.now(), description: '', hsn: '', quantity: '', rate: '' }]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const calculateItemAmount = (quantity, rate) => {
    const qty = parseFloat(quantity) || 0;
    const rt = parseFloat(rate) || 0;
    return qty * rt;
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      return sum + calculateItemAmount(item.quantity, item.rate);
    }, 0);
  };

  const calculateTax = (amount, rate) => {
    return (amount * rate) / 100;
  };

  // Check if Invoice From and Bill To are in the same state
  // Note: For GST calculation, we compare supplier (Invoice From) with buyer (Bill To) states
  const isSameState = () => {
    let invoiceFromState = formData.invoiceFromStateCode;
    let billToState = formData.billToStateCode;
    
    // Trim whitespace if present
    if (invoiceFromState) invoiceFromState = invoiceFromState.trim();
    if (billToState) billToState = billToState.trim();
    
    // Primary method: Use state codes from form
    // Fallback method: Extract state code from GSTIN if state code is missing
    // GSTIN format: First 2 digits = state code number (for India)
    
    // Get GSTIN state codes as fallback
    let invoiceFromGSTINState = null;
    let billToGSTINState = null;
    
    if (formData.invoiceFromGSTIN && formData.invoiceFromGSTIN.length >= 2) {
      invoiceFromGSTINState = formData.invoiceFromGSTIN.substring(0, 2);
    }
    
    if (formData.billToGSTIN && formData.billToGSTIN.length >= 2) {
      billToGSTINState = formData.billToGSTIN.substring(0, 2);
    }
    
    // Priority 1: Compare using state codes if both are available
    if (invoiceFromState && billToState && invoiceFromState !== '' && billToState !== '') {
      const sameState = invoiceFromState === billToState;
      console.log('Comparing state codes (from dropdowns):', {
        invoiceFromState,
        billToState,
        sameState,
        formData: {
          invoiceFromStateCode: formData.invoiceFromStateCode,
          billToStateCode: formData.billToStateCode
        }
      });
      return sameState;
    }
    
    // Priority 2: Compare using GSTIN state codes if both GSTINs are available
    if (invoiceFromGSTINState && billToGSTINState) {
      const sameState = invoiceFromGSTINState === billToGSTINState;
      console.log('Comparing states from GSTIN:', {
        invoiceFromGSTINState,
        billToGSTINState,
        sameState,
        invoiceFromGSTIN: formData.invoiceFromGSTIN,
        billToGSTIN: formData.billToGSTIN
      });
      return sameState;
    }
    
    // Priority 3: If one has state code and the other has GSTIN, try to match
    if (invoiceFromState && invoiceFromState !== '' && billToGSTINState) {
      // Try to find the state code's numeric equivalent (complex, skip for now)
      console.log('Mixed comparison - state code vs GSTIN:', {
        invoiceFromState,
        billToGSTINState,
        note: 'Cannot reliably compare, defaulting to inter-state'
      });
      return false;
    }
    
    if (invoiceFromGSTINState && billToState && billToState !== '') {
      console.log('Mixed comparison - GSTIN vs state code:', {
        invoiceFromGSTINState,
        billToState,
        note: 'Cannot reliably compare, defaulting to inter-state'
      });
      return false;
    }
    
    // If we can't determine, default to inter-state (IGST)
    console.log('Cannot determine state comparison:', {
      invoiceFromState,
      billToState,
      invoiceFromGSTINState,
      billToGSTINState,
      invoiceFromGSTIN: formData.invoiceFromGSTIN,
      billToGSTIN: formData.billToGSTIN,
      formDataStateCodes: {
        invoiceFromStateCode: formData.invoiceFromStateCode,
        billToStateCode: formData.billToStateCode
      },
      defaulting: 'inter-state (IGST)'
    });
    return false;
  };

  // Get GST calculation details
  const getGSTDetails = () => {
    const subtotal = calculateSubtotal();
    
    if (!taxEnabled) {
      return {
        type: 'no-tax',
        cgst: null,
        sgst: null,
        igst: null,
        totalTax: 0,
        total: subtotal
      };
    }
    
    const sameState = isSameState();
    
    console.log('getGSTDetails - Calculation:', {
      subtotal,
      sameState,
      invoiceFromStateCode: formData.invoiceFromStateCode,
      billToStateCode: formData.billToStateCode,
      invoiceFromGSTIN: formData.invoiceFromGSTIN,
      billToGSTIN: formData.billToGSTIN,
      willUseIntraState: sameState
    });
    
    if (sameState) {
      // Intra-state: CGST 9% + SGST 9%
      const cgst = calculateTax(subtotal, 9);
      const sgst = calculateTax(subtotal, 9);
      const result = {
        type: 'intra-state',
        cgst: { rate: 9, amount: cgst },
        sgst: { rate: 9, amount: sgst },
        igst: null,
        totalTax: cgst + sgst,
        total: subtotal + cgst + sgst
      };
      console.log('GST Details (Intra-state):', result);
      return result;
    } else {
      // Inter-state: IGST 18%
      const igst = calculateTax(subtotal, 18);
      const result = {
        type: 'inter-state',
        cgst: null,
        sgst: null,
        igst: { rate: 18, amount: igst },
        totalTax: igst,
        total: subtotal + igst
      };
      console.log('GST Details (Inter-state):', result);
      return result;
    }
  };

  const calculateTotal = () => {
    const gstDetails = getGSTDetails();
    return gstDetails.total;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertLessThanThousand = (n) => {
      if (n === 0) return '';
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      if (n < 1000) {
        const hundred = Math.floor(n / 100);
        const remainder = n % 100;
        return ones[hundred] + ' Hundred' + (remainder !== 0 ? ' ' + convertLessThanThousand(remainder) : '');
      }
      return '';
    };

    const convert = (n) => {
      if (n === 0) return 'Zero';
      if (n < 1000) return convertLessThanThousand(n);
      
      const crore = Math.floor(n / 10000000);
      const lakh = Math.floor((n % 10000000) / 100000);
      const thousand = Math.floor((n % 100000) / 1000);
      const remainder = n % 1000;

      let result = '';
      if (crore > 0) result += convertLessThanThousand(crore) + ' Crore ';
      if (lakh > 0) result += convertLessThanThousand(lakh) + ' Lakh ';
      if (thousand > 0) result += convertLessThanThousand(thousand) + ' Thousand ';
      if (remainder > 0) result += convertLessThanThousand(remainder);
      
      return result.trim();
    };

    const parts = num.toFixed(2).split('.');
    const rupees = parseInt(parts[0]);
    const paise = parseInt(parts[1]);

    let words = 'Indian Rupees ' + convert(rupees);
    if (paise > 0) {
      words += ' and ' + convertLessThanThousand(paise) + ' Paise';
    } else {
      words += ' and Zero Paise';
    }
    return words + ' Only';
  };

  const formatAddress = (prefix) => {
    const parts = [];
    
    // Client Name at the top (skip for Invoice From)
    if (prefix !== 'invoiceFrom' && formData[`${prefix}ClientName`]) {
      parts.push(formData[`${prefix}ClientName`]);
    }
    
    // Company Name - REQUIRED for Invoice From
    if (formData[`${prefix}CompanyName`]) {
      parts.push(formData[`${prefix}CompanyName`]);
    }
    
    // Street & Area
    if (formData[`${prefix}Street`]) {
      parts.push(formData[`${prefix}Street`]);
    }
    
    // Apartment, suite
    if (formData[`${prefix}Apartment`]) {
      parts.push(formData[`${prefix}Apartment`]);
    }
    
    // City, State, ZipCode
    if (formData[`${prefix}City`]) {
      let cityLine = formData[`${prefix}City`];
      const stateCode = formData[`${prefix}StateCode`];
      
      // Try to add state name if available
      if (stateCode && addressData[prefix] && addressData[prefix].states && addressData[prefix].states.length > 0) {
        const state = addressData[prefix].states.find(s => s.isoCode === stateCode);
        if (state) {
          cityLine += ', ' + state.name;
        }
      }
      
      // Add zip code
      if (formData[`${prefix}ZipCode`]) {
        cityLine += ' ' + formData[`${prefix}ZipCode`];
      }
      
      parts.push(cityLine);
    }
    
    // Country
    const countryCode = formData[`${prefix}CountryCode`];
    if (countryCode) {
      const country = allCountries.find(c => c.isoCode === countryCode);
      if (country) {
        parts.push(country.name);
      }
    }
    
    // GSTIN/UIN
    if (formData[`${prefix}GSTIN`]) {
      parts.push(`GSTIN/UIN: ${formData[`${prefix}GSTIN`]}`);
    }
    
    // For Invoice From, add State Name and Code after GSTIN
    if (prefix === 'invoiceFrom') {
      const stateCode = formData[`${prefix}StateCode`];
      if (stateCode) {
        // Try to find state in loaded states first
        let state = null;
        if (addressData[prefix] && addressData[prefix].states && addressData[prefix].states.length > 0) {
          state = addressData[prefix].states.find(s => s.isoCode === stateCode);
        }
        
        if (state) {
          // Get state code number from GSTIN
          let stateCodeNumber = '';
          if (formData[`${prefix}GSTIN`] && formData[`${prefix}GSTIN`].length >= 2) {
            stateCodeNumber = formData[`${prefix}GSTIN`].substring(0, 2);
          }
          if (stateCodeNumber) {
            parts.push(`State Name : ${state.name}, Code : ${stateCodeNumber}`);
          } else {
            parts.push(`State Name : ${state.name}`);
          }
        } else if (formData[`${prefix}GSTIN`] && formData[`${prefix}GSTIN`].length >= 2) {
          // Fallback: just use the GSTIN state code if state object not available
          const stateCodeNumber = formData[`${prefix}GSTIN`].substring(0, 2);
          parts.push(`State Name : Code : ${stateCodeNumber}`);
        }
      }
    }
    
    // PAN
    if (formData[`${prefix}PAN`]) {
      parts.push(`PAN: ${formData[`${prefix}PAN`]}`);
    }
    
    // Phone Number at the end (skip for Invoice From)
    if (prefix !== 'invoiceFrom' && formData[`${prefix}PhoneNumber`]) {
      parts.push(`Phone: ${formData[`${prefix}PhoneNumber`]}`);
    }
    
    // For Invoice From, use line breaks; for others use commas
    if (prefix === 'invoiceFrom') {
      const result = parts.join('\n');
      // Ensure we always return a non-empty string if there's at least company name
      return result || (formData[`${prefix}CompanyName`] || '');
    }
    return parts.join(', ');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate invoice number before submitting
    const isValid = await validateInvoiceNumber();
    if (!isValid) {
      return; // Don't proceed if validation fails
    }
    
    const subtotal = calculateSubtotal();
    const gstDetails = getGSTDetails();
    const total = calculateTotal();
    const totalQuantity = items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
    
    // Format all addresses
    const invoiceFromFormatted = formatAddress('invoiceFrom');
    const consigneeFormatted = formatAddress('shipTo');
    const buyerFormatted = formatAddress('billTo');
    
    // Ensure GST details are properly structured
    const calculationsData = {
      subtotal,
      gstType: gstDetails.type, // 'intra-state' or 'inter-state'
      totalTax: gstDetails.totalTax,
      total,
      totalQuantity,
      amountInWords: numberToWords(total)
    };
    
    // Add CGST/SGST or IGST based on type
    if (gstDetails.type === 'intra-state') {
      calculationsData.cgst = gstDetails.cgst;
      calculationsData.sgst = gstDetails.sgst;
      calculationsData.igst = null;
    } else {
      calculationsData.igst = gstDetails.igst;
      calculationsData.cgst = null;
      calculationsData.sgst = null;
    }
    
    const formattedData = {
      ...formData,
      invoiceFrom: invoiceFromFormatted,
      consignee: consigneeFormatted,
      buyer: buyerFormatted,
      items: items.map(item => ({
        ...item,
        amount: calculateItemAmount(item.quantity, item.rate)
      })),
      calculations: calculationsData,
      bankDetails: bankDetails,
      taxEnabled: taxEnabled
    };
    
    // Debug log to verify data structure - log full details
    console.log('Submitting invoice data - FULL DETAILS:', {
      hasInvoiceFrom: !!formattedData.invoiceFrom,
      invoiceFromLength: formattedData.invoiceFrom?.length,
      invoiceFromValue: formattedData.invoiceFrom,
      invoiceFromCompanyName: formattedData.invoiceFromCompanyName,
      invoiceFromStreet: formattedData.invoiceFromStreet,
      invoiceFromCity: formattedData.invoiceFromCity,
      invoiceFromGSTIN: formattedData.invoiceFromGSTIN,
      invoiceFromPAN: formattedData.invoiceFromPAN,
      invoiceFromStateCode: formattedData.invoiceFromStateCode,
      shipToStateCode: formattedData.shipToStateCode,
      gstType: formattedData.calculations.gstType,
      hasCGST: !!formattedData.calculations.cgst,
      hasSGST: !!formattedData.calculations.sgst,
      hasIGST: !!formattedData.calculations.igst,
      cgst: formattedData.calculations.cgst,
      sgst: formattedData.calculations.sgst,
      igst: formattedData.calculations.igst,
    });
    
    onSubmit(formattedData);
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6 shadow mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => window.location.href = '/'}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                  Back to Home
                </button>
                <h1 className="text-2xl font-bold">{initialData ? 'Edit Proforma Invoice' : 'Create Proforma Invoice'}</h1>
              </div>
              {formData.invoiceNumber && (
                <div className="text-right">
                  <div className="text-sm opacity-90">Invoice No</div>
                  <div className="font-semibold text-lg">{formData.invoiceNumber}</div>
                  <div className="text-sm opacity-90 mt-2">Project Name</div>
                  <div className="font-semibold text-lg">{formData.projectName || '-'}</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Proforma Invoice From Section */}
          <div className="bg-white rounded-lg p-6 shadow mb-8">
            <div className="address-form-container">
              <AddressSection 
                prefix="invoiceFrom"
                title="Proforma Invoice From"
                subTitle="Enter company details"
                showLocationSelect={true}
                onClear={clearInvoiceFromFields}
                formData={formData}
                errors={errors}
                handleChange={handleChange}
                handleLocationSelect={handleLocationSelect}
                handleCountryChange={handleCountryChange}
                handleStateChange={handleStateChange}
                countries={allCountries}
                states={addressData.invoiceFrom.states}
                cities={addressData.invoiceFrom.cities}
                selectedLocation={selectedLocation}
              />
            </div>
          </div>

          {/* Reference Number Section */}
          <div className="bg-white rounded-lg p-6 shadow mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Quotation Reference</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Reference Number (from Quotation)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.quotationReferenceNo || ''}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setFormData(prev => ({ 
                        ...prev, 
                        quotationReferenceNo: value,
                        // Auto-fill referenceNo with the same value
                        referenceNo: value
                      }));
                      setReferenceNoError('');
                    }}
                    onBlur={handleReferenceNoLookup}
                    placeholder="Enter reference number (e.g., VSREF0000)"
                    className={`flex-1 border rounded-md p-2 ${referenceNoError ? 'border-red-500' : ''}`}
                    disabled={isLoadingQuotation}
                  />
                  {isLoadingQuotation && (
                    <div className="flex items-center px-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                {referenceNoError && (
                  <p className="text-sm text-red-500 mt-1">{referenceNoError}</p>
                )}
                {!referenceNoError && formData.quotationReferenceNo && !isLoadingQuotation && (
                  <p className="text-sm text-green-600 mt-1">✓ Address auto-filled from quotation</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Project Name
                </label>
                <input 
                  type="text"
                  name="projectName" 
                  value={formData.projectName || ''} 
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                  placeholder="Enter project name"
                />
              </div>
            </div>
          </div>

          {/* Bill To & Ship To Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow">
              <AddressSection 
                prefix="billTo"
                title="Bill To"
                subTitle="Enter customer details"
                onClear={clearBillToFields}
                formData={formData}
                errors={errors}
                handleChange={handleChange}
                handleLocationSelect={handleLocationSelect}
                handleCountryChange={handleCountryChange}
                handleStateChange={handleStateChange}
                countries={allCountries}
                states={addressData.billTo.states}
                cities={addressData.billTo.cities}
              />
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <AddressSection 
                prefix="shipTo"
                title="Ship To"
                subTitle="Enter shipping details"
                onClear={clearShipToFields}
                formData={formData}
                errors={errors}
                handleChange={handleChange}
                handleLocationSelect={handleLocationSelect}
                handleCountryChange={handleCountryChange}
                handleStateChange={handleStateChange}
                countries={allCountries}
                states={addressData.shipTo.states}
                cities={addressData.shipTo.cities}
              />
            </div>
          </div>

          {/* Invoice Details Section */}
          <div className="bg-white rounded-lg p-6 shadow mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Invoice Details</h3>
              <button
                type="button"
                onClick={clearInvoiceDetailsFields}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-md shadow hover:from-blue-700 hover:to-indigo-700"
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
                    {formData.invoiceNumber ? (() => {
                      const financialYear = extractFinancialYear(formData.invoiceNumber) || getCurrentFinancialYear();
                      return `PI${financialYear}`;
                    })() : 'PI'}
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
                  Invoice Date <span className="text-red-500">*</span>
                </label>
                <input 
                  type="date" 
                  name="invoiceDate" 
                  value={formData.invoiceDate} 
                  onChange={handleChange} 
                  required 
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Delivery Note</label>
                <AutoResizeTextarea 
                  name="deliveryNote" 
                  value={formData.deliveryNote} 
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Mode/Terms of Payment <span className="text-red-500">*</span>
                </label>
                <AutoResizeTextarea 
                  name="paymentTerms" 
                  value={formData.paymentTerms} 
                  onChange={handleChange} 
                  required
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Reference No <span className="text-red-500">*</span>
                </label>
                <AutoResizeTextarea 
                  name="referenceNo" 
                  value={formData.referenceNo} 
                  onChange={handleChange} 
                  required
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Other References</label>
                <AutoResizeTextarea 
                  name="otherReferences" 
                  value={formData.otherReferences} 
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Buyer's Order No <span className="text-red-500">*</span>
                </label>
                <AutoResizeTextarea 
                  name="buyersOrderNo" 
                  value={formData.buyersOrderNo} 
                  onChange={handleChange} 
                  required
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Purchase Date <span className="text-red-500">*</span>
                </label>
                <input 
                  type="date" 
                  name="buyersOrderDate" 
                  value={formData.buyersOrderDate} 
                  onChange={handleChange} 
                  required 
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Dispatch Doc No</label>
                <AutoResizeTextarea 
                  name="dispatchDocNo" 
                  value={formData.dispatchDocNo} 
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Delivery Note Date</label>
                <input 
                  type="date" 
                  name="deliveryNoteDate" 
                  value={formData.deliveryNoteDate} 
                  onChange={handleChange} 
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Dispatched Through <span className="text-red-500">*</span>
                </label>
                <AutoResizeTextarea 
                  name="dispatchedThrough" 
                  value={formData.dispatchedThrough} 
                  onChange={handleChange} 
                  required
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Destination <span className="text-red-500">*</span>
                </label>
                <AutoResizeTextarea 
                  name="destination" 
                  value={formData.destination} 
                  onChange={handleChange} 
                  required
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Terms of Delivery</label>
                <AutoResizeTextarea 
                  name="termsOfDelivery" 
                  value={formData.termsOfDelivery} 
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                />
              </div>
            </div>
          </div>

          {/* Bank Details Section */}
          <div className="bg-white rounded-lg p-6 shadow mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Bank Details</h3>
              <button
                type="button"
                onClick={clearBankDetailsFields}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-md shadow hover:from-blue-700 hover:to-indigo-700"
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

          {/* Goods Details Section */}
          <div className="bg-white rounded-lg p-6 shadow mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Goods Details</h3>
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
                  type="button" 
                  onClick={addItem} 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  + Add Item
                </button>
                <button
                  type="button"
                  onClick={clearItemsFields}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-md shadow hover:from-blue-700 hover:to-indigo-700"
                >
                  Clear
                </button>
              </div>
            </div>
            {taxEnabled && (
              <div className="mb-4 text-sm text-gray-600">
                {isSameState() ? 'Same State: CGST 9% + SGST 9%' : 'Different States: IGST 18%'}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description of Goods</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">HSN/SAC</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rate</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">per</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2">
                        <AutoResizeTextarea
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          placeholder="Enter description"
                          rows={1}
                          className="w-full border rounded p-2"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={item.hsn}
                          onChange={(e) => handleItemChange(item.id, 'hsn', e.target.value)}
                          placeholder="Enter HSN/SAC"
                          className="w-full border rounded p-2"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                          placeholder="Qty"
                          min="0"
                          step="0.01"
                          className="w-full border rounded p-2"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)}
                          placeholder="Rate"
                          min="0"
                          step="0.01"
                          className="w-full border rounded p-2"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">nos</td>
                      <td className="px-4 py-2 text-right font-semibold">{formatCurrency(calculateItemAmount(item.quantity, item.rate))}</td>
                      <td className="px-4 py-2">
                        <button 
                          type="button" 
                          onClick={() => removeItem(item.id)} 
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

            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(calculateSubtotal())}</span>
                </div>
                {taxEnabled && (() => {
                  const gstDetails = getGSTDetails();
                  if (gstDetails.type === 'intra-state') {
                    return (
                      <>
                        <div className="flex justify-between items-center text-sm">
                          <span>CGST ({gstDetails.cgst.rate}%):</span>
                          <span className="font-semibold">{formatCurrency(gstDetails.cgst.amount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span>SGST ({gstDetails.sgst.rate}%):</span>
                          <span className="font-semibold">{formatCurrency(gstDetails.sgst.amount)}</span>
                        </div>
                      </>
                    );
                  } else if (gstDetails.type === 'inter-state') {
                    return (
                      <div className="flex justify-between items-center text-sm">
                        <span>IGST ({gstDetails.igst.rate}%):</span>
                        <span className="font-semibold">{formatCurrency(gstDetails.igst.amount)}</span>
                      </div>
                    );
                  }
                  return null;
                })()}
                <div className="pt-2 mt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center text-lg font-bold text-blue-900">
                    <span>Total:</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
                <div className="pt-2 mt-2 border-t border-gray-200">
                  <div className="text-sm">
                    <strong>Amount Chargeable (in words):</strong>
                    <div className="mt-1 text-gray-700">{numberToWords(calculateTotal())}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button + Clear All */}
          <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3">
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                clearAllFields();
              }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg shadow hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear All
            </button>
            <button 
              type="submit" 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-105 transition-all duration-200"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Preview Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;
