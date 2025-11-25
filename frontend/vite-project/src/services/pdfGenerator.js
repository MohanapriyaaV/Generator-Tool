import pdfMake from 'pdfmake/build/pdfmake.js';
import * as pdfFonts from 'pdfmake/build/vfs_fonts.js';
import { Country } from 'country-state-city';
import { LOGO_BASE64_DATA } from './logoBase64';

// Register the fonts (FINAL FIX)
pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.vfs;

// Define custom styles for the PDF
const styles = {
  header: { fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
  title: { fontSize: 14, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
  subheader: { fontSize: 10, bold: true, margin: [0, 5, 0, 5] },
  // MODIFIED: Removed color and fillColor for black & white
  tableHeader: { bold: true, fontSize: 9.5, alignment: 'center' }, 
  tableCell: { fontSize: 9, margin: [0, 2, 0, 2], alignment: 'left' },
  bold: { bold: true },
  addressBlock: { fontSize: 9, lineHeight: 1.3 },
  italicLabel: { fontSize: 9, italics: true },
  footerText: { fontSize: 8, alignment: 'center', margin: [0, 5, 0, 0], italics: true },
  textRight: { alignment: 'right' },
};

// --- Utility Functions ---

const formatDate = (dateString) => {
    if (!dateString) return '';
    if (typeof dateString === 'string') {
      const datePart = dateString.split('T')[0];
      if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return datePart;
      }
    }
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {}
    return dateString;
};

const getCountryName = (code) => {
    const country = Country.getAllCountries().find(c => c.isoCode === code);
    return country ? country.name : '';
}

const buildAddressParts = (addressData, isInvoiceFrom = false) => {
    const parts = [];
    
    // 1. Company/Client Name (Bold in PDFMake style)
    if (addressData.clientName && addressData.clientName.trim()) {
      parts.push({ text: addressData.clientName.trim(), style: 'bold' });
    }
    if (addressData.companyName && addressData.companyName.trim()) {
      const style = (!addressData.clientName) ? 'bold' : 'normal';
      parts.push({ text: addressData.companyName.trim(), style });
    }

    // 2. Address Lines (Street, Apartment, City, Zip)
    const addressLines = [];
    if (addressData.street && addressData.street.trim()) {
      addressLines.push(addressData.street.trim());
    }
    if (addressData.apartment && addressData.apartment.trim()) {
      addressLines.push(addressData.apartment.trim());
    }
    
    let cityLine = addressData.city && addressData.city.trim() ? addressData.city.trim() : '';
    if (cityLine && addressData.zipCode && addressData.zipCode.trim()) {
      cityLine += ' ' + addressData.zipCode.trim();
    }
    if (cityLine) {
      addressLines.push(cityLine);
    }

    if (addressLines.length > 0 && !isInvoiceFrom) {
        parts.push(addressLines.join(', '));
    } else if (addressLines.length > 0 && isInvoiceFrom) {
        addressLines.forEach(line => parts.push(line));
    }
    
    // 3. Country (on a new line)
    if (addressData.countryCode) {
      const countryName = getCountryName(addressData.countryCode);
      if (countryName) parts.push(countryName);
    }
    
    // 4. GST/PAN (on new lines)
    if (addressData.gstin && addressData.gstin.trim()) {
      parts.push(`GSTIN/UIN: ${addressData.gstin.trim()}`);
    }
    if (isInvoiceFrom && addressData.gstin && addressData.gstin.length >= 2) {
      const stateCodeNumber = addressData.gstin.substring(0, 2);
      parts.push(`State Name : Code : ${stateCodeNumber}`);
    }
    if (addressData.pan && addressData.pan.trim()) {
      parts.push(`PAN: ${addressData.pan.trim()}`);
    }

    return parts.filter(p => p !== null);
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
};

const numberToWords = (num) => {
    // ... (Use the numberToWords function from your previous code)
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

    const numValue = parseFloat(num || 0);
    const parts = numValue.toFixed(2).split('.');
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

const getUniqueHSN = (data) => {
    if (!data.items || data.items.length === 0) return [];
    const hsnMap = new Map();
    data.items.forEach(item => {
      if (item.hsn) {
        const itemAmount = parseFloat(item.amount) || 0;
        const existing = hsnMap.get(item.hsn) || { hsn: item.hsn, taxableValue: 0 };
        existing.taxableValue += itemAmount;
        hsnMap.set(item.hsn, existing);
      }
    });
    return Array.from(hsnMap.values());
};

// --- CORE PDF FUNCTION ---

export const generatePdfFromData = (data, isGeneratingPDF, onDownloadStateChange) => {
    console.log('generatePdfFromData called with:', { 
      hasData: !!data, 
      isGeneratingPDF, 
      hasOnDownloadStateChange: !!onDownloadStateChange 
    });
    
    if (isGeneratingPDF) {
      console.warn('PDF generation already in progress');
      return;
    }
    
    if (!data) {
      console.error('No data provided for PDF generation');
      alert('No data available for PDF generation. Please go back and try again.');
      return;
    }

    try {
      console.log('Starting PDF generation...');
      if (onDownloadStateChange) onDownloadStateChange(true);
      
      // Verify pdfMake is available
      if (!pdfMake || !pdfMake.createPdf) {
        console.error('pdfMake is not properly initialized');
        alert('PDF library not initialized. Please refresh the page and try again.');
        if (onDownloadStateChange) onDownloadStateChange(false);
        return;
      }
      
      // Ensure calculations object exists with defaults
      const calculations = data.calculations || {};
      calculations.subtotal = calculations.subtotal || 0;
      calculations.total = calculations.total || 0;
      calculations.totalTax = calculations.totalTax || 0;
      calculations.gstType = calculations.gstType || 'inter-state';
      calculations.cgst = calculations.cgst || { rate: 0, amount: 0 };
      calculations.sgst = calculations.sgst || { rate: 0, amount: 0 };
      calculations.igst = calculations.igst || { rate: 0, amount: 0 };
      calculations.amountInWords = calculations.amountInWords || '';
      
      // Ensure items array exists
      if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        console.warn('No items found, using empty array');
        data.items = [];
      }
      
      const isIntraState = calculations.gstType === 'intra-state';
      const totalQuantity = calculations.totalQuantity || data.items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0) || 0;
      
      // Address Data - ensure all values are strings, not undefined
      const invoiceFromData = {
        companyName: data.invoiceFromCompanyName || '', 
        street: data.invoiceFromStreet || '', 
        apartment: data.invoiceFromApartment || '', 
        city: data.invoiceFromCity || '', 
        zipCode: data.invoiceFromZipCode || '', 
        countryCode: data.invoiceFromCountryCode || '', 
        gstin: data.invoiceFromGSTIN || '', 
        pan: data.invoiceFromPAN || '',
      };
      const shipToData = {
        clientName: data.shipToClientName || '', 
        companyName: data.shipToCompanyName || '', 
        street: data.shipToStreet || '', 
        apartment: data.shipToApartment || '', 
        city: data.shipToCity || '', 
        zipCode: data.shipToZipCode || '', 
        countryCode: data.shipToCountryCode || '', 
        gstin: data.shipToGSTIN || '', 
        pan: data.shipToPAN || '',
      };
      const billToData = {
        clientName: data.billToClientName || '', 
        companyName: data.billToCompanyName || '', 
        street: data.billToStreet || '', 
        apartment: data.billToApartment || '', 
        city: data.billToCity || '', 
        zipCode: data.billToZipCode || '', 
        countryCode: data.billToCountryCode || '', 
        gstin: data.billToGSTIN || '', 
        pan: data.billToPAN || '',
      };

      // Bank Details
      const getBankDetails = () => {
        const countryCode = data.invoiceFromCountryCode || '';
        if (countryCode === 'IN') {
          return { bankName: 'ICICI Bank Limited', accountNumber: '058705002413', branchAndIFSC: 'Avinashi Road & ICIC0000587' };
        } else {
          return { bankName: 'HDFC Bank Ltd', accountNumber: '00752560001860', branchAndIFSC: 'Old Airport Road & HDFC0000075' };
        }
      };
      const bankDetails = getBankDetails();
      
      const hsnDataList = getUniqueHSN(data);

      // --- 1. ITEMS TABLE --- (All logic from your previous code goes here)
      const itemsTableBody = [
        // Table Header
        [
          { text: 'Description of Goods', style: 'tableHeader', alignment: 'left', minHeight: 40 },
          { text: 'HSN/SAC', style: 'tableHeader', alignment: 'center', minHeight: 40 },
          { text: 'Quantity', style: 'tableHeader', alignment: 'center', minHeight: 40 },
          { text: 'Rate', style: 'tableHeader', alignment: 'right', minHeight: 40 },
          { text: 'per', style: 'tableHeader', alignment: 'center', minHeight: 40 },
          { text: 'Amount', style: 'tableHeader', alignment: 'right', minHeight: 40 },
        ],
        // Item Rows
        ...(data.items || []).map(item => [
          { text: item.description || item.name || '', style: 'tableCell' },
          { text: item.hsn || '', style: 'tableCell', alignment: 'center' },
          { text: item.quantity ? `${item.quantity}` : '0', style: 'tableCell', alignment: 'center' },
          { text: formatCurrency(item.rate || 0), style: 'tableCell', alignment: 'right' },
          { text: 'nos', style: 'tableCell', alignment: 'center' },
          { text: formatCurrency(item.amount || 0), style: 'tableCell', alignment: 'right' },
        ]),
        // Empty row above subtotal
        // TO MODIFY SPACING: Add or remove '\n' characters below to adjust the height (currently 2 newlines)
        [
          { text: '\n', style: 'tableCell' },
          { text: '\n', style: 'tableCell' },
          { text: '\n', style: 'tableCell' },
          { text: '\n', style: 'tableCell' },
          { text: '\n', style: 'tableCell' },
          { text: '\n', style: 'tableCell' },
        ],
        // Subtotal Row
        [
          { text: 'Subtotal', style: 'bold', alignment: 'left', fontSize: 10 },
          { text: '', style: 'tableCell' },
          { text: '', style: 'tableCell' },
          { text: '', style: 'tableCell' },
          { text: '', style: 'tableCell' },
          { text: formatCurrency(calculations.subtotal || 0), style: 'bold', alignment: 'right', fontSize: 10 },
        ],
        // Tax Rows
        ...(() => {
          const taxRows = [];
          
          if (isIntraState) {
            taxRows.push([
              { text: `CGST - ${calculations.cgst?.rate || 9}%`, style: 'tableCell' },
              { text: '', style: 'tableCell' },
              { text: '', style: 'tableCell' },
              { text: '', style: 'tableCell' },
              { text: '', style: 'tableCell' },
              { text: formatCurrency(calculations.cgst?.amount || 0), style: 'tableCell', alignment: 'right' },
            ]);
            taxRows.push([
              { text: `SGST - ${calculations.sgst?.rate || 9}%`, style: 'tableCell' },
              { text: '', style: 'tableCell' },
              { text: '', style: 'tableCell' },
              { text: '', style: 'tableCell' },
              { text: '', style: 'tableCell' },
              { text: formatCurrency(calculations.sgst?.amount || 0), style: 'tableCell', alignment: 'right' },
            ]);
          } else {
            taxRows.push([
              { text: `IGST - ${calculations.igst?.rate || 18}%`, style: 'tableCell' },
              { text: '', style: 'tableCell' },
              { text: '', style: 'tableCell' },
              { text: '', style: 'tableCell' },
              { text: '', style: 'tableCell' },
              { text: formatCurrency(calculations.igst?.amount || calculations.totalTax || 0), style: 'tableCell', alignment: 'right' },
            ]);
          }
          return taxRows;
        })(),
        // Total Row
        [
          { text: 'Total', style: 'bold', alignment: 'left', fontSize: 10 },
          { text: '', style: 'tableCell' },
          { text: `${totalQuantity} nos`, style: 'bold', alignment: 'center', fontSize: 10 },
          { text: '', style: 'tableCell' },
          { text: '', style: 'tableCell' },
          { text: formatCurrency(calculations.total || 0), style: 'bold', alignment: 'right', fontSize: 10 },
        ],
        // Amount in Words Row - Last row: vertical borders (column lines) required, only bottom horizontal border
        [
          { 
            text: [
              { text: 'Amount Chargeable (in words)\n', style: 'bold', fontSize: 9 },
              { text: calculations.amountInWords || numberToWords(calculations.total || 0), style: 'bold', fontSize: 10 },
            ], 
            colSpan: 5, 
            alignment: 'left', 
            valign: 'top',
            margin: [2, 5, 2, 5],
            border: [true, false, false, true], // Left and bottom borders (no top, no right due to colSpan)
          },
          { text: '' }, // Empty cell for colSpan fill
          { text: '' }, // Empty cell for colSpan fill
          { text: '' }, // Empty cell for colSpan fill
          { text: '' }, // Empty cell for colSpan fill
          { 
            text: 'E. & O.E', 
            alignment: 'right', 
            valign: 'top',
            margin: [2, 2, 2, 2], 
            fontSize: 8, 
            border: [false, false, true, true] // Right and bottom borders
          },
        ]
      ];


      // --- 2. TAX SUMMARY TABLE --- (All logic from your previous code goes here)
      const taxTableHeaders = [
        [
          { text: 'HSN/SAC', style: 'tableHeader', alignment: 'center', rowSpan: 2 },
          { text: 'Taxable Value', style: 'tableHeader', alignment: 'center', rowSpan: 2 },
          ...(isIntraState ? [
            { text: 'CGST', style: 'tableHeader', alignment: 'center', colSpan: 2 },
            { text: '' },
            { text: 'SGST', style: 'tableHeader', alignment: 'center', colSpan: 2 },
            { text: '' },
            { text: 'Total Tax Amount', style: 'tableHeader', alignment: 'center', rowSpan: 2 },
          ] : [
            { text: 'IGST', style: 'tableHeader', alignment: 'center', colSpan: 2 },
            { text: '' },
            { text: 'Total Tax Amount', style: 'tableHeader', alignment: 'center', rowSpan: 2 },
          ]),
        ],
        [
          { text: '' }, // HSN
          { text: '' }, // Taxable Value
          ...(isIntraState ? [
            { text: 'Rate', style: 'tableHeader', alignment: 'center' },
            { text: 'Amount', style: 'tableHeader', alignment: 'center' },
            { text: 'Rate', style: 'tableHeader', alignment: 'center' },
            { text: 'Amount', style: 'tableHeader', alignment: 'center' },
            { text: '' }, // Total Tax
          ] : [
            { text: 'Rate', style: 'tableHeader', alignment: 'center' },
            { text: 'Amount', style: 'tableHeader', alignment: 'center' },
            { text: '' }, // Total Tax
          ]),
        ]
      ];
      
      const taxTableBody = [
        ...taxTableHeaders,
        // HSN Rows
        ...(hsnDataList.length > 0 ? hsnDataList.map(hsnData => {
            const row = [
              { text: hsnData.hsn, style: 'tableCell', alignment: 'center' },
              { text: formatCurrency(hsnData.taxableValue), style: 'tableCell', alignment: 'right' },
            ];
            
            if (isIntraState) {
              const cgstRate = calculations.cgst?.rate || 9;
              const sgstRate = calculations.sgst?.rate || 9;
              const cgstAmount = (hsnData.taxableValue * cgstRate) / 100;
              const sgstAmount = (hsnData.taxableValue * sgstRate) / 100;
              row.push(
                { text: `${cgstRate}%`, style: 'tableCell', alignment: 'center' },
                { text: formatCurrency(cgstAmount), style: 'tableCell', alignment: 'right' },
                { text: `${sgstRate}%`, style: 'tableCell', alignment: 'center' },
                { text: formatCurrency(sgstAmount), style: 'tableCell', alignment: 'right' },
                { text: formatCurrency(cgstAmount + sgstAmount), style: 'tableCell', alignment: 'right' }
              );
            } else {
              const igstRate = calculations.igst?.rate || 18;
              const igstAmount = (hsnData.taxableValue * igstRate) / 100;
              row.push(
                { text: `${igstRate}%`, style: 'tableCell', alignment: 'center' },
                { text: formatCurrency(igstAmount), style: 'tableCell', alignment: 'right' },
                { text: formatCurrency(igstAmount), style: 'tableCell', alignment: 'right' }
              );
            }
            return row;
          }) : [
            // No HSN data row
            [
              { text: '-', style: 'tableCell', alignment: 'center' },
              { text: '-', style: 'tableCell', alignment: 'right' },
              ...(isIntraState ? [
                { text: '-', style: 'tableCell', alignment: 'center' },
                { text: '-', style: 'tableCell', alignment: 'right' },
                { text: '-', style: 'tableCell', alignment: 'center' },
                { text: '-', style: 'tableCell', alignment: 'right' },
                { text: '-', style: 'tableCell', alignment: 'right' },
              ] : [
                { text: '-', style: 'tableCell', alignment: 'center' },
                { text: '-', style: 'tableCell', alignment: 'right' },
                { text: '-', style: 'tableCell', alignment: 'right' },
              ]),
            ]
          ]
        ),
        // Total Row
        (() => {
          const totalRow = [
            { text: 'Total', style: 'bold', alignment: 'center', fontSize: 10 },
            { text: formatCurrency(calculations.subtotal || 0), style: 'bold', alignment: 'right', fontSize: 10 },
          ];
          
          if (isIntraState) {
            totalRow.push(
              { text: '' },
              { text: formatCurrency(calculations.cgst?.amount || 0), style: 'bold', alignment: 'right', fontSize: 10 },
              { text: '' },
              { text: formatCurrency(calculations.sgst?.amount || 0), style: 'bold', alignment: 'right', fontSize: 10 },
              { text: formatCurrency(calculations.totalTax || 0), style: 'bold', alignment: 'right', fontSize: 10 }
            );
          } else {
            totalRow.push(
              { text: '' },
              { text: formatCurrency(calculations.igst?.amount || calculations.totalTax || 0), style: 'bold', alignment: 'right', fontSize: 8 },
              { text: formatCurrency(calculations.totalTax || 0), style: 'bold', alignment: 'right', fontSize: 10 }
            );
          }
          return totalRow;
        })(),
        // Tax Amount in Words Row
        [
          {
            text: [
              { text: 'Tax Amount (in words): ', style: 'bold', fontSize: 8 },
              { text: numberToWords(calculations.totalTax || 0), style: 'bold', fontSize: 8 },
            ],
            colSpan: isIntraState ? 7 : 5,
            alignment: 'left',
            margin: [2, 5, 2, 5],
          },
          // Colspan fill - number of empty cells must match (colSpan - 1)
          ...(isIntraState 
            ? [{ text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }] // 6 cells for colSpan 7
            : [{ text: '' }, { text: '' }, { text: '' }, { text: '' }] // 4 cells for colSpan 5
          ),
        ]
      ];

      // --- 3. BANK DETAILS/FOOTER ---
      const bottomTable = {
        table: {
          widths: ['50%', '50%'],
          body: [
            // Row 1: Company PAN (Col 1) and Bank Details (Col 2)
            [
              { 
                text: [
                  { text: 'Company\'s PAN:\n', style: 'bold', fontSize: 9 },
                  { text: data.invoiceFromPAN || 'AADCT7719D', fontSize: 9 }
                ],
                border: [true, true, true, true],
                padding: [4, 4, 4, 4],
                alignment: 'left',
                valign: 'top'
              },
              {
                text: [
                  { text: 'Company\'s Bank Details\n', style: 'bold', fontSize: 9 },
                  { text: `Bank Name: ${bankDetails.bankName}\n`, fontSize: 9 },
                  { text: `A/c No.: ${bankDetails.accountNumber}\n`, fontSize: 9 },
                  { text: `Branch & IFS Code: ${bankDetails.branchAndIFSC}`, fontSize: 9 }
                ],
                border: [true, true, true, true],
                padding: [4, 4, 4, 4],
                alignment: 'left',
                valign: 'top'
              }
            ],
            // Row 2: Declaration (Col 1) and Authorized Signatory (Col 2)
            [
              {
                stack: [
                  { text: 'Declaration', style: 'bold', fontSize: 9 },
                  { text: 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.', fontSize: 9 },
                  { text: '\n\n\n\n\n\n', fontSize: 9 } // Add empty lines to force height
                ],
                border: [true, true, true, true],
                padding: [4, 4, 4, 4],
                alignment: 'left',
                valign: 'top',
                minHeight: 180
              },
              {
                stack: [
                  { text: 'for Vista Engineering Solutions', style: 'bold', alignment: 'center', fontSize: 10, margin: [0, 0, 0, 0] },
                  { text: '\n\n\n\n\n\n\n\n', fontSize: 9 }, // Add empty lines to push signatory to bottom
                  { text: 'Authorised Signatory', alignment: 'center', fontSize: 9, margin: [0, 0, 0, 0] }
                ],
                border: [true, true, true, true],
                padding: [4, 10, 4, 10], // Top and bottom padding  
                alignment: 'center',
                valign: 'top',
                minHeight: 180
              }
            ]
          ]
        },
        layout: {
          hLineWidth: (i) => {
            // Top border (i === 0) - use 0.5 so it overlaps properly with tax summary table bottom border
            if (i === 0) return 0.5; // Overlaps with tax summary table bottom border (0.5) to create normal line
            // All other horizontal lines
            return 0.5;
          },
          vLineWidth: () => 0.5,
          hLineColor: () => '#000',
          vLineColor: () => '#000'
        },
        margin: [0, 0, 0, 0], // No top margin to eliminate space above
        unbreakable: true // Keep table together and move to next page if doesn't fit
      };


      // --- Document Definition ---
      const docDefinition = {
        pageSize: 'A4',
        pageMargins: [30, 100, 30, 40], // Increased top margin to accommodate PROFORMA INVOICE
        styles: styles,
        
        // MODIFIED: Header to include logo, center-aligned company name, and PROFORMA INVOICE heading (first page only)
        header: (currentPage, pageCount) => {
          const headerContent = [
            {
                columns: [
                // 1. Logo (Top-Left) - Increased size
                    {
                        image: LOGO_BASE64_DATA, 
                  width: 120,
                  fit: [120, 120], 
                        alignment: 'left',
                  margin: [30, 10, 0, 0], // Increased top margin to move down
                    },
                // 2. Company Name and PROFORMA INVOICE (Stacked, Center-aligned with slight left shift)
                {
                  stack: [
                    {
                        text: 'VISTA ENGG SOLUTIONS PRIVATE LIMITED', 
                        style: 'bold', 
                      alignment: 'center',
                      fontSize: 14, 
                      margin: [0, 30, 0, 0] // Increased top margin to move down
                    },
                    // Add PROFORMA INVOICE heading only on first page
                    ...(currentPage === 1 ? [{
                      text: 'PROFORMA INVOICE',
                      style: 'bold',
                      alignment: 'center',
                      fontSize: 14,
                      margin: [0, 10, 0, 15] // Increased bottom margin for spacing
                    }] : [])
                  ],
                  width: '*',
                  margin: [50, 0, 0, 0] // Shift right to better center with logo
                },
                // 3. Empty space to balance the logo on the right
                {
                  text: '',
                  width: 120,
                  margin: [0, 0, 30, 0]
                    }
                ],
                columnGap: 0, 
              margin: [0, 0, 0, 5] // Increased bottom margin for spacing
            }
          ];

          return headerContent;
        },

        // Footer on every page
        footer: (currentPage, pageCount) => ([
          { text: 'This is a Computer Generated Invoice', style: 'footerText' },
          { text: `Page ${currentPage} of ${pageCount}`, style: 'footerText', margin: [0, 0, 0, 10] }
        ]),

        content: [
          // Address and Meta Info Block (Mimics two-column table)
          {
            columns: [
              // LEFT HALF: Addresses Table (40% width)
              {
                width: '40%',
                table: {
                  widths: ['100%'],
                  body: [
                    // Row 1: Invoice From Address
                    [{
                      stack: buildAddressParts(invoiceFromData, true),
                      style: 'addressBlock',
                      border: [true, true, true, true],
                      padding: [4, 4, 4, 4]
                    }],
                    // Row 2: Consignee Address
                    [{
                      stack: [
                        { text: 'Consignee (Ship to)', style: 'italicLabel' },
                        ...buildAddressParts(shipToData)
                      ],
                      style: 'addressBlock',
                      border: [true, true, true, true],
                      padding: [4, 4, 4, 4]
                    }],
                    // Row 3: Buyer Address
                    [{
                stack: [
                        { text: 'Buyer (Bill to)', style: 'italicLabel' },
                        ...buildAddressParts(billToData)
                      ],
                      style: 'addressBlock',
                      border: [true, true, true, true],
                      padding: [4, 4, 4, 4]
                    }]
                  ]
                },
                layout: {
                  hLineWidth: () => 0.5,
                  vLineWidth: () => 0.5,
                  hLineColor: () => '#000',
                  vLineColor: () => '#000'
                }
              },
              // RIGHT HALF: Meta Info (60% width)
              {
                width: '60%',
                table: {
                  widths: ['50%', '50%'],
                  body: [
                    // Row 1: Invoice No. and Invoice Date
                    [
                      { 
                        stack: [
                          { text: 'Invoice No.', style: 'bold', fontSize: 8 },
                          { text: data.invoiceNumber || '', style: 'bold', fontSize: 9 }
                        ],
                        border: [true, true, true, true],
                        height: 30,
                        alignment: 'left',
                        valign: 'top'
                      },
                      { 
                        stack: [
                          { text: 'Invoice Date', style: 'bold', fontSize: 8 },
                          { text: formatDate(data.invoiceDate) || '', style: 'bold', fontSize: 9 }
                        ],
                        border: [true, true, true, true],
                        height: 30,
                        alignment: 'left',
                        valign: 'top'
                      }
                    ],
                    // Row 2: Delivery Note and Mode/Terms of Payment
                    [
                      { 
                        stack: [
                          { text: 'Delivery Note', style: 'bold', fontSize: 8 },
                          { text: data.deliveryNote || '', style: 'bold', fontSize: 9 }
                        ],
                        border: [true, true, true, true],
                        height: 30,
                        alignment: 'left',
                        valign: 'top'
                      },
                      { 
                        stack: [
                          { text: 'Mode/Terms of Payment', style: 'bold', fontSize: 8 },
                          { text: data.paymentTerms || '', style: 'bold', fontSize: 9 }
                        ],
                        border: [true, true, true, true],
                        height: 30,
                        alignment: 'left',
                        valign: 'top'
                      }
                    ],
                    // Row 3: Reference No and Other References
                    [
                      { 
                        stack: [
                          { text: 'Reference No', style: 'bold', fontSize: 8 },
                          { text: data.referenceNo || '', style: 'bold', fontSize: 9 }
                        ],
                        border: [true, true, true, true],
                        height: 30,
                        alignment: 'left',
                        valign: 'top'
                      },
                      { 
                        stack: [
                          { text: 'Other References', style: 'bold', fontSize: 8 },
                          { text: data.otherReferences || '', style: 'bold', fontSize: 9 }
                        ],
                        border: [true, true, true, true],
                        height: 30,
                        alignment: 'left',
                        valign: 'top'
                      }
                    ],
                    // Row 4: Buyer's Order No. and Purchase Date
                    [
                      { 
                        stack: [
                          { text: 'Buyer\'s Order No.', style: 'bold', fontSize: 8 },
                          { text: data.buyersOrderNo || '', style: 'bold', fontSize: 9 }
                        ],
                        border: [true, true, true, true],
                        height: 30,
                        alignment: 'left',
                        valign: 'top'
                      },
                      { 
                        stack: [
                          { text: 'Purchase Date', style: 'bold', fontSize: 8 },
                          { text: formatDate(data.buyersOrderDate) || '', style: 'bold', fontSize: 9 }
                        ],
                        border: [true, true, true, true],
                        height: 30,
                        alignment: 'left',
                        valign: 'top'
                      }
                    ],
                    // Row 5: Dispatch Doc No. and Delivery Note Date
                    [
                      { 
                        stack: [
                          { text: 'Dispatch Doc No.', style: 'bold', fontSize: 8 },
                          { text: data.dispatchDocNo || '', style: 'bold', fontSize: 9 }
                        ],
                        border: [true, true, true, true],
                        alignment: 'left',
                        valign: 'top',
                        margin: [0, 0, 0, 0]
                      },
                      { 
                        stack: [
                          { text: 'Delivery Note Date', style: 'bold', fontSize: 8 },
                          { text: formatDate(data.deliveryNoteDate) || '', style: 'bold', fontSize: 9 }
                        ],
                        border: [true, true, true, true],
                        alignment: 'left',
                        valign: 'top',
                        margin: [0, 0, 0, 0]
                      }
                    ],
                    // Row 6: Dispatched through and Destination
                    [
                      { 
                        stack: [
                          { text: 'Dispatched through', style: 'bold', fontSize: 8 },
                          { text: data.dispatchedThrough || '', style: 'bold', fontSize: 9 }
                        ],
                        border: [true, true, true, true],
                        height: 30,
                        alignment: 'left',
                        valign: 'top'
                      },
                      { 
                        stack: [
                          { text: 'Destination', style: 'bold', fontSize: 8 },
                          { text: data.destination || '', style: 'bold', fontSize: 9 }
                        ],
                        border: [true, true, true, true],
                        height: 30,
                        alignment: 'left',
                        valign: 'top'
                      }
                    ],
                    // Row 7: Terms of Delivery (spans both columns) - Height matches total height of left address table (3 rows)
                    [
                      { 
                        stack: [
                          { text: 'Terms of Delivery', style: 'bold', fontSize: 8 },
                          { text: data.termsOfDelivery || '', style: 'bold', fontSize: 9 }
                        ],
                        colSpan: 2,
                        border: [true, true, true, true],
                        alignment: 'left',
                        valign: 'top',
                        margin: [0, 0, 0, 0]
                      },
                      { text: '' }
                    ]
                  ],
                },
                layout: {
                  hLineWidth: () => 0.5,
                  vLineWidth: (i) => {
                    // Remove left border (i === 0) since address table has right border
                    if (i === 0) return 0;
                    // All other vertical lines
                    return 0.5;
                  },
                  hLineColor: () => '#000',
                  vLineColor: () => '#000',
                  paddingLeft: () => 4,
                  paddingRight: () => 4,
                  paddingTop: (i) => {
                    
                    return 3;
                  },
                  paddingBottom: (i) => {
                    // Row 5 (index 4) gets more padding, Row 7 (index 6) matches address table padding
                    if (i === 4) return 60;
                    if (i === 6) return 97; // Match address table padding
                    return 3;
                  },
                },
              }
            ],
            columnGap: 0, // No space between address and meta info tables
            margin: [0, 10, 0, 0] // Reduced bottom margin to eliminate space above items table
          },
          
          // Items Table
          {
            table: {
              headerRows: 1, 
              widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
              body: itemsTableBody,
            },
            layout: {
              // MODIFIED: Horizontal lines for header row (top and bottom) and last two rows
              hLineWidth: (i, node) => {
                // Header row (i === 0): top border
                if (i === 0) return 0.5;
                // Header row bottom (i === 1): bottom border of header row
                if (i === 1) return 1;
                // Second-to-last row: bottom border
                if (i === itemsTableBody.length - 1) return 1;
                // Last row: bottom border - use 0.5 so it overlaps properly with tax summary table top border
                if (i === itemsTableBody.length) return 0.5;
                // Intermediate rows: use 0.5 width (needed for hLineWhenBroken to work)
                // Will be colored white to be invisible on same page
                return 0.5;
              },
              vLineWidth: (i, node) => {
                // All rows: vertical lines (column separators)
                // Note: Empty row uses cell-level border: [false, false, false, false] to remove vertical lines
                return 0.5;
              },
              hLineColor: (i, node) => {
                // Use black for all lines - hLineWhenBroken will draw at page breaks
                // Note: This will show lines between all rows, but ensures page break lines are visible
                return '#000';
              },
              vLineColor: () => '#000',
              paddingLeft: () => 4,
              paddingRight: () => 4,
              paddingTop: (i) => (i === 0 ? 10 : 2), // Increased header row padding
              paddingBottom: (i) => (i === 0 ? 10 : 2), // Increased header row padding
              // Draw line when table breaks across pages
              // Note: This draws a line using the border system, so it needs borders to exist
              hLineWhenBroken: true
            },
            margin: [0, 0, 1, 0] // Small bottom margin to ensure bottom border is visible when table is split across pages
          },

          // Tax Summary Table
          {
            table: {
              headerRows: 2, 
              widths: isIntraState ? ['15%', '20%', '10%', '15%', '10%', '15%', '15%'] : ['20%', '25%', '15%', '25%', '15%'],
              body: taxTableBody,
              dontBreakRows: true, // Prevent rows from breaking across pages to avoid blank rows
            },
            layout: {
              // MODIFIED: Horizontal lines for header rows, last two rows, and page breaks
              hLineWidth: (i) => {
                // Header rows: top border (i === 0) - use 0.5 so it overlaps properly with items table bottom border
                if (i === 0) return 0.5; // Overlaps with items table bottom border (0.5) to create normal line
                if (i === 1 || i === 2) return 1;
                // Second-to-last row: bottom border
                if (i === taxTableBody.length - 1) return 1;
                // Last row: bottom border - always 0.5 to ensure it's visible even when footer moves to next page
                if (i === taxTableBody.length) return 0.5;
                // Intermediate rows: use 0.5 width (needed for hLineWhenBroken to work)
                return 0.5;
              },
              vLineWidth: () => 0.5, // Keep vertical lines for all rows
              hLineColor: () => '#000',
              vLineColor: () => '#000',
              paddingTop: (i) => (i < 2 ? 5 : 2),
              paddingBottom: (i) => (i < 2 ? 5 : 2),
              // Draw line when table breaks across pages
              hLineWhenBroken: true
            },
            margin: [0, 0, 1, 0] // Small bottom margin to ensure bottom border is visible when footer moves to next page
          },

          // Bottom Section (PAN, Bank, Declaration, Signatory)
          bottomTable,
        ],
      };

      // Create PDF document
      const invoiceNumber = data.invoiceNumber || 'invoice';
      const fileName = `Invoice_${invoiceNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      console.log('Creating PDF document...');
      console.log('Document definition:', JSON.stringify(docDefinition, null, 2).substring(0, 500));
      
      let pdfDoc;
      try {
        pdfDoc = pdfMake.createPdf(docDefinition);
        console.log('PDF document created successfully');
      } catch (createError) {
        console.error('Error creating PDF document:', createError);
        alert('Error creating PDF: ' + createError.message);
        if (onDownloadStateChange) onDownloadStateChange(false);
        return;
      }

      // Download the PDF immediately - use open() if download doesn't work
      console.log('Attempting to download PDF:', fileName);
      try {
        pdfDoc.download(fileName);
        console.log('PDF download method called');
        
        // Also try getBlob and create download link as fallback
        pdfDoc.getBlob((blob) => {
          console.log('PDF blob generated, size:', blob.size);
          
          // Create download link as fallback
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          console.log('PDF download link triggered');
          
          // Upload to S3 (non-blocking)
          (async () => {
            try {
              console.log('Uploading PDF to S3...');
              const { uploadPdfToS3, updateProformaInvoiceS3Url } = await import('./api.js');
              const uploadResult = await uploadPdfToS3(blob, fileName, 'ProformaInvoice');
              console.log('✅ PDF uploaded to S3:', uploadResult.url);

              // Update database with S3 URL
              try {
                await updateProformaInvoiceS3Url(invoiceNumber, uploadResult.url);
                console.log('✅ Database updated with S3 URL');
              } catch (dbError) {
                console.warn('⚠️ Could not update database with S3 URL:', dbError.message);
              }

              if (onDownloadStateChange) onDownloadStateChange(false);
            } catch (uploadError) {
              console.error('❌ Error uploading PDF to S3:', uploadError);
              if (onDownloadStateChange) onDownloadStateChange(false);
              console.warn('PDF downloaded but not saved to S3. Error:', uploadError.message);
            }
          })();
        });
      } catch (downloadError) {
        console.error('Error downloading PDF:', downloadError);
        alert('Error downloading PDF: ' + downloadError.message);
        if (onDownloadStateChange) onDownloadStateChange(false);
      }
      
      // Set a timeout to reset the generating state in case something goes wrong
      setTimeout(() => {
        if (onDownloadStateChange) {
          onDownloadStateChange(false);
        }
      }, 10000); // 10 second timeout
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
      if (onDownloadStateChange) onDownloadStateChange(false);
    }
};