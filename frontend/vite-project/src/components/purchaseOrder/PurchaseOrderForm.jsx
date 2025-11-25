import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Country, State, City } from 'country-state-city';
import './PurchaseOrderForm.css';

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

// AddressSection component for Bill To and Ship To
const AddressSection = React.memo(({ 
  prefix, 
  title, 
  subTitle, 
  showLocationSelect = false, 
  showPAN = false,
  showGSTIN = false,
  formData, 
  errors, 
  handleChange, 
  handleLocationSelect, 
  handleCountryChange, 
  handleStateChange, 
  countries, 
  states, 
  cities, 
  selectedLocation = '',
  onAdd
}) => {
  const countryCode = formData[`${prefix}CountryCode`] || '';
  const stateCode = formData[`${prefix}StateCode`] || '';
  
  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-600">{subTitle}</p>
        </div>
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
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
          <input 
            name={`${prefix}PhoneNumber`} 
            type="tel"
            value={formData[`${prefix}PhoneNumber`] || ''} 
            onChange={handleChange} 
            placeholder="+91"
            className="w-full border rounded-md p-2"
          />
        </div>
        {showPAN && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">PAN (case sensitive)</label>
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
        )}
        {showGSTIN && (
          <div className={showPAN ? '' : 'md:col-span-2'}>
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
        )}
      </div>
      {onAdd && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onAdd}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-semibold transition-colors"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
});

AddressSection.displayName = 'AddressSection';

const currencyMap = {
  IN: 'INR',
  US: 'USD',
  DE: 'EUR'
};

const PurchaseOrderForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState([{ id: 1, itemName: '', description: '', quantity: '', unitPrice: '', hsn: '', total: 0 }]);
  const [errors, setErrors] = useState({});
  const [selectedLocationShip, setSelectedLocationShip] = useState('');
  const [selectedLocationBill, setSelectedLocationBill] = useState('');
  const [cgstRate, setCgstRate] = useState('');
  const [sgstRate, setSgstRate] = useState('');
  const [igstRate, setIgstRate] = useState('');
  const [taxAmount, setTaxAmount] = useState(0);
  
  // Get all countries - memoized
  const allCountries = useMemo(() => Country.getAllCountries(), []);
  
  // State for countries, states, and cities for each address section
  const [addressData, setAddressData] = useState({
    billTo: { states: [], cities: [] },
    shipTo: { states: [], cities: [] }
  });

  const [formData, setFormData] = useState({
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
    shipToPhoneNumber: '',
    // Requisitioner Details
    requisitionerName: '',
    fobDestination: '',
    shippedVia: '',
    terms: '',
    // Additional Details
    poNumber: '',
    referenceNumber: '',
    dateTime: '',
    currency: '',
    poDate: '',
    projectName: '',
    // Terms and Conditions
    termsAndConditions: `1. Check Appendix A shows purchase agreement & Product spec

2. Send order confirmation and confirm your ability to deliver within timeline

3. After completion of project please send two copies of your invoice.

4. Enter this order in accordance with the prices, terms, delivery method, and specifications listed.

5. Please notify us immediately if you are unable to ship as specified.

6. Send all correspondence to:
   Name: Magesh Kumar
   Phone: 9585888855
   Email: info@vistaes.com`
  });

  // Map country names to ISO codes
  const countryNameToCode = {
    'India': 'IN',
    'USA': 'US',
    'GERMANY': 'DE'
  };

  // Handle location select for Bill To or Ship To
  const handleLocationSelect = useCallback((prefix) => (e) => {
    const locationValue = e.target.value;
    if (prefix === 'shipTo') setSelectedLocationShip(locationValue);
    if (prefix === 'billTo') setSelectedLocationBill(locationValue);

    if (locationValue && officeLocations[locationValue]) {
      const location = officeLocations[locationValue];
      const countryCode = countryNameToCode[location.country] || '';

      setFormData(prev => ({
        ...prev,
        [`${prefix}CompanyName`]: location.companyName,
        [`${prefix}Street`]: location.street,
        [`${prefix}Apartment`]: location.apartment,
        [`${prefix}City`]: location.city,
        [`${prefix}ZipCode`]: location.zipCode,
        [`${prefix}CountryCode`]: countryCode,
        // If officeLocations contains PAN/GSTIN, autofill for India addresses
        ...(location.PAN ? { [`${prefix}PAN`]: location.PAN } : {}),
        ...(location.GSTIN ? { [`${prefix}GSTIN`]: location.GSTIN } : {})
      }));

      // Load states for the selected country
      if (countryCode) {
        const states = State.getStatesOfCountry(countryCode);
        setAddressData(prev => ({
          ...prev,
          [prefix]: { states, cities: [] }
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
              [`${prefix}StateCode`]: state.isoCode
            }));

            // Load cities for the selected state
            const cities = City.getCitiesOfState(countryCode, state.isoCode);
            setAddressData(prev => ({
              ...prev,
              [prefix]: { states, cities }
            }));

            // Try to find and set city
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
                  [`${prefix}City`]: cityMatch.name
                }));
              } else {
                setFormData(prev => ({
                  ...prev,
                  [`${prefix}City`]: location.city
                }));
              }
            }
          }
        }
      }
    } else {
      // Clear all fields for the prefix when "Select Location" is selected
      setFormData(prev => ({
        ...prev,
        [`${prefix}CompanyName`]: '',
        [`${prefix}Street`]: '',
        [`${prefix}Apartment`]: '',
        [`${prefix}City`]: '',
        [`${prefix}ZipCode`]: '',
        [`${prefix}CountryCode`]: '',
        [`${prefix}StateCode`]: '',
        [`${prefix}PAN`]: '',
        [`${prefix}GSTIN`]: ''
      }));

      // Clear states and cities
      setAddressData(prev => ({
        ...prev,
        [prefix]: { states: [], cities: [] }
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

  // Handle form field changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    let newValue = value;
    
    // Zip Code validation - only numbers
    if (name.includes('ZipCode')) {
      newValue = value.replace(/[^0-9]/g, '');
    }
    
    // PAN validation - max 10 characters, alphanumeric uppercase
    if (name.includes('PAN')) {
      newValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    }
    
    // GSTIN validation - max 15 characters, alphanumeric uppercase
    if (name.includes('GSTIN')) {
      newValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    }
    
    setFormData(prev => ({ ...prev, [name]: newValue }));
  }, []);

  // populate form when editing from preview
  useEffect(() => {
    if (location.state?.initialData) {
      setFormData(location.state.initialData);
    }
    if (location.state?.items) {
      setItems(location.state.items);
    }
  }, [location.state]);

  // Auto set currency based on ship to country
  useEffect(() => {
    const countryCode = formData.shipToCountryCode;
    if (!countryCode || !currencyMap[countryCode]) {
      return;
    }
    const mappedCurrency = currencyMap[countryCode];
    if (formData.currency !== mappedCurrency) {
      setFormData(prev => ({
        ...prev,
        currency: mappedCurrency
      }));
    }
  }, [formData.shipToCountryCode, formData.currency]);

  // Handle item changes
  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        // Calculate total when quantity or unitPrice changes
        if (field === 'quantity' || field === 'unitPrice') {
          const qty = parseFloat(updatedItem.quantity) || 0;
          const price = parseFloat(updatedItem.unitPrice) || 0;
          const subtotal = qty * price;
          updatedItem.total = subtotal;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), itemName: '', description: '', quantity: '', unitPrice: '', hsn: '', total: 0 }]);
  };

  const handleDeleteItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  // Calculate totals
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return sum + (qty * price);
    }, 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const cgst = parseFloat(cgstRate) || 0;
    const sgst = parseFloat(sgstRate) || 0;
    const igst = parseFloat(igstRate) || 0;
    const totalRate = cgst + sgst + igst;
    const tax = (subtotal * totalRate) / 100;
    setTaxAmount(tax);
    return tax;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal + (parseFloat(taxAmount) || 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/purchase-order-preview', { state: { data: { formData, items, tax: { cgstRate, sgstRate, igstRate, taxAmount } } } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-purple-800 text-white rounded-lg p-6 shadow mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                  Back to Home
                </button>
                <h1 className="text-2xl font-bold">Purchase Order</h1>
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
                  showLocationSelect={true}
                  showPAN={true}
                  showGSTIN={true}
                  formData={formData}
                  errors={errors}
                  handleChange={handleChange}
                  handleLocationSelect={handleLocationSelect('billTo')}
                  handleCountryChange={handleCountryChange}
                  handleStateChange={handleStateChange}
                  countries={allCountries}
                  states={addressData.billTo.states}
                  cities={addressData.billTo.cities}
                  selectedLocation={selectedLocationBill}
                  onAdd={() => console.log('Bill To added')}
                />
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <AddressSection 
                prefix="shipTo"
                title="Ship To"
                subTitle="Enter shipping details"
                showLocationSelect={true}
                formData={formData}
                errors={errors}
                handleChange={handleChange}
                handleLocationSelect={handleLocationSelect('shipTo')}
                handleCountryChange={handleCountryChange}
                handleStateChange={handleStateChange}
                countries={allCountries}
                states={addressData.shipTo.states}
                cities={addressData.shipTo.cities}
                selectedLocation={selectedLocationShip}
                onAdd={() => console.log('Ship To added')}
              />
            </div>
          </div>

          {/* Requisitioner Details Section */}
          <div className="bg-white rounded-lg p-6 shadow mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Requisitioner Details</h3>
            <p className="text-sm text-gray-600 mb-4">Enter requisitioner details</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Requisitioner Name
                </label>
                <input
                  type="text"
                  name="requisitionerName"
                  value={formData.requisitionerName}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                  placeholder="Enter requisitioner name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  F.O.B Destination
                </label>
                <input
                  type="text"
                  name="fobDestination"
                  value={formData.fobDestination}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                  placeholder="Enter F.O.B destination"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Shipped Via
                </label>
                <input
                  type="text"
                  name="shippedVia"
                  value={formData.shippedVia}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                  placeholder="Enter shipping method"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Terms
                </label>
                <input
                  type="text"
                  name="terms"
                  value={formData.terms}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                  placeholder="Enter terms"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-semibold transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Additional Details Section */}
          <div className="bg-white rounded-lg p-6 shadow mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Additional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  PO number
                </label>
                <input
                  type="text"
                  name="poNumber"
                  value={formData.poNumber}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                  placeholder="Enter PO number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Reference number
                </label>
                <input
                  type="text"
                  name="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                  placeholder="Enter reference number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  PO date
                </label>
                <input
                  type="date"
                  name="poDate"
                  value={formData.poDate}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Date and Time
                </label>
                <input
                  type="datetime-local"
                  name="dateTime"
                  value={formData.dateTime}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                  placeholder="dd-mm-yyyy --:--"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Select Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                >
                  <option value="">-- Select Currency --</option>
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="p-6 bg-gray-50 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Item & Description</h3>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  + Add item
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Item & Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Unit Price</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">HSN/SAC</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2">
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={item.itemName}
                            onChange={(e) => handleItemChange(item.id, 'itemName', e.target.value)}
                            placeholder="Item name"
                            className="w-full border rounded p-2"
                          />
                          <AutoResizeTextarea
                            value={item.description}
                            onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                            placeholder="Description (Optional)"
                            rows={1}
                            className="w-full border rounded p-2"
                          />
                        </div>
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
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                          placeholder="Price"
                          min="0"
                          step="0.01"
                          className="w-full border rounded p-2"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={item.hsn}
                          onChange={(e) => handleItemChange(item.id, 'hsn', e.target.value)}
                          placeholder="HSN/SAC"
                          className="w-full border rounded p-2"
                        />
                      </td>
                      <td className="px-4 py-2 text-right font-semibold">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-800 text-xl font-bold"
                          disabled={items.length === 1}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tax Inputs & Financial Summary */}
          <div className="bg-white rounded-lg p-6 shadow mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Taxes</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">CGST (%)</label>
                <input
                  type="number"
                  value={cgstRate}
                  onChange={(e) => setCgstRate(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full border rounded-md p-2"
                  placeholder="e.g., 9"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">SGST (%)</label>
                <input
                  type="number"
                  value={sgstRate}
                  onChange={(e) => setSgstRate(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full border rounded-md p-2"
                  placeholder="e.g., 9"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">IGST (%)</label>
                <input
                  type="number"
                  value={igstRate}
                  onChange={(e) => setIgstRate(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full border rounded-md p-2"
                  placeholder="e.g., 18"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => calculateTax()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold"
                >
                  Calculate Tax
                </button>
                <button
                  type="button"
                  onClick={() => { setCgstRate(''); setSgstRate(''); setIgstRate(''); setTaxAmount(0); }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-semibold"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-white rounded-lg p-6 shadow mb-8">
            <div className="flex justify-end">
              <div className="w-full max-w-md space-y-2">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Tax:</span>
                  <span className="font-semibold">{formatCurrency(parseFloat(taxAmount) || 0)}</span>
                </div>
                <div className="pt-2 mt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                    <span>Total:</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terms and Conditions Section */}
          <div className="bg-white rounded-lg p-6 shadow mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Terms and Conditions</h3>
              <button
                type="button"
                className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
              >
                Edit
              </button>
            </div>
            <textarea
              name="termsAndConditions"
              value={formData.termsAndConditions}
              onChange={handleChange}
              rows={6}
              className="w-full border rounded-md p-2"
              placeholder="Enter terms and conditions"
            />
          </div>

          

          {/* Generate Document Button */}
          <div className="fixed bottom-6 right-6">
            <button
              type="submit"
              className="bg-gradient-to-r from-teal-600 to-purple-800 text-white px-8 py-3 rounded-lg shadow-lg hover:from-teal-700 hover:to-purple-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transform hover:scale-105 transition-all duration-200"
            >
              Generate Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseOrderForm;
