import pdfMake from 'pdfmake/build/pdfmake.js';
import * as pdfFonts from 'pdfmake/build/vfs_fonts.js';
import { Country } from 'country-state-city';
import { LOGO_BASE64_DATA } from './logoBase64';
import { WATERMARK_BASE64_DATA } from './watermarkBase64';

// Register the fonts
pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.vfs;

// Define custom styles for the PDF
const styles = {
  header: { fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
  title: { fontSize: 14, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
  subheader: { fontSize: 10, bold: true, margin: [0, 5, 0, 5] },
  tableHeader: { bold: true, fontSize: 8.5, alignment: 'center' }, 
  tableCell: { fontSize: 8, margin: [0, 1, 0, 1], alignment: 'left' },
  bold: { bold: true },
  addressBlock: { fontSize: 8, lineHeight: 1.3 },
  italicLabel: { fontSize: 8, italics: true },
  footerText: { fontSize: 8, alignment: 'center', margin: [0, 5, 0, 0], italics: true },
  textRight: { alignment: 'right' },
<<<<<<< HEAD
};


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
    
    // 1. Company/Client Name - always include client name line (empty if not present)
    if (!isInvoiceFrom) {
      if (addressData.clientName && addressData.clientName.trim()) {
        parts.push({ text: addressData.clientName.trim(), style: 'bold' });
      } else {
        parts.push({ text: ' ', fontSize: 8 }); // Empty line for client name
      }
    }
    if (addressData.companyName && addressData.companyName.trim()) {
      const style = (!addressData.clientName || isInvoiceFrom) ? 'bold' : 'normal';
      parts.push({ text: addressData.companyName.trim(), style });
    }

    // 2. Address Lines
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
    
    // 3. Country
    if (addressData.countryCode) {
      const countryName = getCountryName(addressData.countryCode);
      if (countryName) parts.push(countryName);
    }
    
    // 4. GST/PAN
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
      
      if (!pdfMake || !pdfMake.createPdf) {
        console.error('pdfMake is not properly initialized');
        alert('PDF library not initialized. Please refresh the page and try again.');
        if (onDownloadStateChange) onDownloadStateChange(false);
        return;
      }
      
      const calculations = data.calculations || {};
      calculations.subtotal = calculations.subtotal || 0;
      calculations.total = calculations.total || 0;
      calculations.totalTax = calculations.totalTax || 0;
      calculations.gstType = calculations.gstType || 'inter-state';
      calculations.cgst = calculations.cgst || { rate: 0, amount: 0 };
      calculations.sgst = calculations.sgst || { rate: 0, amount: 0 };
      calculations.igst = calculations.igst || { rate: 0, amount: 0 };
      calculations.amountInWords = calculations.amountInWords || '';
      
      if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        console.warn('No items found, using empty array');
        data.items = [];
      }
      
      const isIntraState = calculations.gstType === 'intra-state';
      const totalQuantity = calculations.totalQuantity || data.items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0) || 0;
      
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

      // --- ITEMS TABLE ---
      const itemsTableBody = [
        [
          { text: 'Description of Goods', style: 'tableHeader', alignment: 'left', minHeight: 22 },
          { text: 'HSN/SAC', style: 'tableHeader', alignment: 'center', minHeight: 22 },
          { text: 'Quantity', style: 'tableHeader', alignment: 'center', minHeight: 22 },
          { text: 'Rate', style: 'tableHeader', alignment: 'right', minHeight: 22 },
          { text: 'per', style: 'tableHeader', alignment: 'center', minHeight: 22 },
          { text: 'Amount', style: 'tableHeader', alignment: 'right', minHeight: 22 },
        ],
        ...(data.items || []).map(item => [
          { text: item.description || item.name || '', style: 'tableCell' },
          { text: item.hsn || '', style: 'tableCell', alignment: 'center' },
          { text: item.quantity ? `${item.quantity}` : '0', style: 'tableCell', alignment: 'center' },
          { text: formatCurrency(item.rate || 0), style: 'tableCell', alignment: 'right' },
          { text: 'nos', style: 'tableCell', alignment: 'center' },
          { text: formatCurrency(item.amount || 0), style: 'tableCell', alignment: 'right' },
        ]),
        [
          { text: 'Subtotal', style: 'bold', alignment: 'left', fontSize: 9 },
          { text: '', style: 'tableCell' },
          { text: '', style: 'tableCell' },
          { text: '', style: 'tableCell' },
          { text: '', style: 'tableCell' },
          { text: formatCurrency(calculations.subtotal || 0), style: 'bold', alignment: 'right', fontSize: 9 },
        ],
        ...(() => {
          const taxEnabled = data.taxEnabled !== false;
          if (!taxEnabled) return [];
          
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
        [
          { text: 'Total', style: 'bold', alignment: 'left', fontSize: 9 },
          { text: '', style: 'tableCell' },
          { text: `${totalQuantity} nos`, style: 'bold', alignment: 'center', fontSize: 9 },
          { text: '', style: 'tableCell' },
          { text: '', style: 'tableCell' },
          { text: formatCurrency(calculations.total || 0), style: 'bold', alignment: 'right', fontSize: 9 },
        ],
        [
          { 
            text: [
              { text: 'Amount Chargeable (in words)\n', style: 'bold', fontSize: 8 },
              { text: calculations.amountInWords || numberToWords(calculations.total || 0), style: 'bold', fontSize: 8 },
            ], 
            colSpan: 5, 
            alignment: 'left', 
            valign: 'top',
            margin: [2, 2, 2, 2],
            border: [true, false, false, true],
          },
          { text: '' },
          { text: '' },
          { text: '' },
          { text: '' },
          { 
            text: 'E. & O.E', 
            alignment: 'right', 
            valign: 'top',
            margin: [2, 2, 2, 2], 
            fontSize: 8, 
            border: [false, false, true, true]
          },
        ]
      ];

      // --- TAX SUMMARY TABLE ---
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
          { text: '' },
          { text: '' },
          ...(isIntraState ? [
            { text: 'Rate', style: 'tableHeader', alignment: 'center' },
            { text: 'Amount', style: 'tableHeader', alignment: 'center' },
            { text: 'Rate', style: 'tableHeader', alignment: 'center' },
            { text: 'Amount', style: 'tableHeader', alignment: 'center' },
            { text: '' },
          ] : [
            { text: 'Rate', style: 'tableHeader', alignment: 'center' },
            { text: 'Amount', style: 'tableHeader', alignment: 'center' },
            { text: '' },
          ]),
        ]
      ];
      
      const taxTableBody = [
        ...taxTableHeaders,
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
        (() => {
          const totalRow = [
            { text: 'Total', style: 'bold', alignment: 'center', fontSize: 9 },
            { text: formatCurrency(calculations.subtotal || 0), style: 'bold', alignment: 'right', fontSize: 9 },
          ];
          
          if (isIntraState) {
            totalRow.push(
              { text: '' },
              { text: formatCurrency(calculations.cgst?.amount || 0), style: 'bold', alignment: 'right', fontSize: 9 },
              { text: '' },
              { text: formatCurrency(calculations.sgst?.amount || 0), style: 'bold', alignment: 'right', fontSize: 9 },
              { text: formatCurrency(calculations.totalTax || 0), style: 'bold', alignment: 'right', fontSize: 9 }
            );
          } else {
            totalRow.push(
              { text: '' },
              { text: formatCurrency(calculations.igst?.amount || calculations.totalTax || 0), style: 'bold', alignment: 'right', fontSize: 9 },
              { text: formatCurrency(calculations.totalTax || 0), style: 'bold', alignment: 'right', fontSize: 9 }
            );
          }
          return totalRow;
        })(),
        [
          {
            text: [
              { text: 'Tax Amount (in words): ', style: 'bold', fontSize: 8 },
              { text: numberToWords(calculations.totalTax || 0), style: 'bold', fontSize: 8 },
            ],
            colSpan: isIntraState ? 7 : 5,
            alignment: 'left',
            margin: [2, 2, 2, 2],
          },
          ...(isIntraState 
            ? [{ text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }]
            : [{ text: '' }, { text: '' }, { text: '' }, { text: '' }]
          ),
        ]
      ];

      // --- BANK DETAILS/FOOTER ---
      const bottomTable = {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              { 
                text: [
                  { text: 'Company\'s PAN:\n', style: 'bold', fontSize: 8 },
                  { text: data.invoiceFromPAN || 'AADCT7719D', fontSize: 8 }
                ],
                border: [true, true, true, true],
                padding: [3, 3, 3, 3],
                alignment: 'left',
                valign: 'top'
              },
              {
                text: [
                  { text: 'Company\'s Bank Details\n', style: 'bold', fontSize: 8 },
                  { text: `Bank Name: ${bankDetails.bankName}\n`, fontSize: 8 },
                  { text: `A/c No.: ${bankDetails.accountNumber}\n`, fontSize: 8 },
                  { text: `Branch & IFS Code: ${bankDetails.branchAndIFSC}`, fontSize: 8 }
                ],
                border: [true, true, true, true],
                padding: [3, 3, 3, 3],
                alignment: 'left',
                valign: 'top'
              }
            ],
            [
              {
                stack: [
                  { text: 'Declaration', style: 'bold', fontSize: 8 },
                  { text: 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.', fontSize: 8 },
                  { text: '\n\n\n\n\n\n\n\n', fontSize: 8 }
                ],
                border: [true, true, true, true],
                padding: [3, 3, 3, 3],
                alignment: 'left',
                valign: 'top',
                minHeight: 120
              },
              {
                stack: [
                  { text: 'for Vista Engineering Solutions', style: 'bold', alignment: 'center', fontSize: 9, margin: [0, 0, 0, 0] },
                  { text: '\n\n\n\n\n\n\n\n', fontSize: 8 },
                  { text: 'Authorised Signatory', alignment: 'center', fontSize: 8, margin: [0, 0, 0, 0] }
                ],
                border: [true, true, true, true],
                padding: [3, 3, 3, 3],
                alignment: 'center',
                valign: 'top',
                minHeight: 120
              }
            ]
          ]
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#000',
          vLineColor: () => '#000'
        },
        margin: [0, 0, 0, 0],
        unbreakable: true
      };

      // --- Document Definition ---
      const docDefinition = {
        pageSize: 'A4',
        pageMargins: [25, 80, 25, 25],
        styles: styles,
        background: {
          image: WATERMARK_BASE64_DATA,
          width: 250,
          opacity: 0.6,
          absolutePosition: { x: 172, y: 200 }
        },
        header: (currentPage, pageCount) => {
          return {
            columns: [
              {
                image: LOGO_BASE64_DATA, 
                width: 95,
                fit: [95, 95], 
                alignment: 'left',
                margin: [25, 10, 0, 0],
              },
              {
                width: '*',
                stack: [
                  {
                    text: 'VISTA ENGG SOLUTIONS PRIVATE LIMITED', 
                    style: 'bold', 
                    alignment: 'center',
                    fontSize: 14, 
                    margin: [0, 15, 0, 0]
                  }
                ],
                margin: [0, 0, 0, 0]
              },
              {
                text: '',
                width: 110,
                margin: [0, 0, 25, 0]
              }
            ],
            columnGap: 0,
            margin: [0, 0, 0, 0]
          };
        },

        footer: (currentPage, pageCount) => ([
          { text: 'This is a Computer Generated Invoice', style: 'footerText' },
          { text: `Page ${currentPage} of ${pageCount}`, style: 'footerText', margin: [0, 0, 0, 10] }
        ]),

        content: [
          // Page-level heading placed in content so it appears once at top of first page
          { text: 'PROFORMA INVOICE', style: 'title', alignment: 'center', margin: [0, 0, 0, 8], bold: true },
          {
            columns: [
              {
                width: '40%',
                table: {
                  widths: ['100%'],
                  body: [
                    [{
                      stack: buildAddressParts(invoiceFromData, true),
                      style: 'addressBlock',
                      border: [true, true, true, true],
                      padding: [3, 3, 3, 3]
                    }],
                    [{
                      stack: [
                        { text: 'Consignee (Ship to)', style: 'italicLabel' },
                        ...buildAddressParts(shipToData)
                      ],
                      style: 'addressBlock',
                      border: [true, true, true, true],
                      padding: [3, 3, 3, 3]
                    }],
                    [{
                stack: [
                        { text: 'Buyer (Bill to)', style: 'italicLabel' },
                        ...buildAddressParts(billToData)
                      ],
                      style: 'addressBlock',
                      border: [true, true, true, true],
                      padding: [3, 3, 3, 3]
                    }]
                  ]
                },
                layout: {
                  hLineWidth: () => 0.5,
                  vLineWidth: () => 0.5,
                  hLineColor: () => '#000',
                  vLineColor: () => '#000'
                }
              ,
                  margin: [0, 0, 0, 0]
              },
              {
                width: '60%',
                table: {
                  widths: ['50%', '50%'],
                  body: [
                    [
                      { 
                        stack: [
                          { text: 'Invoice No.', style: 'bold', fontSize: 7 },
                          { text: data.invoiceNumber || '', style: 'bold', fontSize: 8 },
                          { text: '\n', fontSize: 4 }
                        ],
                        border: [true, true, true, true],
                        height: 28,
                        alignment: 'left',
                        valign: 'top',
                        padding: [2, 4, 2, 4]
                      },
                      { 
                        stack: [
                          { text: 'Invoice Date', style: 'bold', fontSize: 7 },
                          { text: formatDate(data.invoiceDate) || '', style: 'bold', fontSize: 8 },
                          { text: '\n', fontSize: 4 }
                        ],
                        border: [true, true, true, true],
                        height: 28,
                        alignment: 'left',
                        valign: 'top',
                        padding: [2, 4, 2, 4]
                      }
                    ],
                    [
                      { 
                        stack: [
                          { text: 'Delivery Note', style: 'bold', fontSize: 7 },
                          { text: data.deliveryNote || '', style: 'bold', fontSize: 8 },
                          { text: '\n\n', fontSize: 4 }
                        ],
                        border: [true, true, true, true],
                        height: 28,
                        alignment: 'left',
                        valign: 'top',
                        padding: [2, 8, 2, 8]
                      },
                      { 
                        stack: [
                          { text: 'Mode/Terms of Payment', style: 'bold', fontSize: 7 },
                          { text: data.paymentTerms || '', style: 'bold', fontSize: 8 },
                          { text: '\n\n', fontSize: 4 }
                        ],
                        border: [true, true, true, true],
                        height: 28,
                        alignment: 'left',
                        valign: 'top',
                        padding: [2, 8, 2, 8]
                      }
                    ],
                    [
                      { 
                        stack: [
                          { text: 'Reference No', style: 'bold', fontSize: 7 },
                          { text: data.referenceNo || '', style: 'bold', fontSize: 8 },
                          { text: '\n\n', fontSize: 4 }
                        ],
                        border: [true, true, true, true],
                        height: 28,
                        alignment: 'left',
                        valign: 'top',
                        padding: [2, 8, 2, 8]
                      },
                      { 
                        stack: [
                          { text: 'Other References', style: 'bold', fontSize: 7 },
                          { text: data.otherReferences || '', style: 'bold', fontSize: 8 },
                          { text: '\n\n', fontSize: 4 }
                        ],
                        border: [true, true, true, true],
                        height: 28,
                        alignment: 'left',
                        valign: 'top',
                        padding: [2, 8, 2, 8]
                      }
                    ],
                    [
                      { 
                        stack: [
                          { text: 'Buyer\'s Order No.', style: 'bold', fontSize: 7 },
                          { text: data.buyersOrderNo || '', style: 'bold', fontSize: 8 },
                          { text: '\n\n', fontSize: 4 }
                        ],
                        border: [true, true, true, true],
                        height: 28,
                        alignment: 'left',
                        valign: 'top',
                        padding: [2, 8, 2, 8]
                      },
                      { 
                        stack: [
                          { text: 'Purchase Date', style: 'bold', fontSize: 7 },
                          { text: formatDate(data.buyersOrderDate) || '', style: 'bold', fontSize: 8 },
                          { text: '\n\n', fontSize: 4 }
                        ],
                        border: [true, true, true, true],
                        height: 28,
                        alignment: 'left',
                        valign: 'top',
                        padding: [2, 8, 2, 8]
                      }
                    ],
                    [
                      { 
                        stack: [
                          { text: 'Dispatch Doc No.', style: 'bold', fontSize: 7 },
                          { text: data.dispatchDocNo || '', style: 'bold', fontSize: 8 },
                          { text: (data.dispatchDocNo && data.dispatchDocNo.trim()) ? '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n' : '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n', fontSize: 1, color: 'white' }
                        ],
                        border: [true, true, true, true],
                        height: 45,
                        alignment: 'left',
                        valign: 'top',
                        margin: [0, 0, 0, 0],
                        padding: [2, 2, 2, 20]
                      },
                      { 
                        stack: [
                          { text: 'Delivery Note Date', style: 'bold', fontSize: 7 },
                          { text: formatDate(data.deliveryNoteDate) || '', style: 'bold', fontSize: 8 },
                          { text: (data.deliveryNoteDate && data.deliveryNoteDate.trim()) ? '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n' : '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n', fontSize: 1, color: 'white' }
                        ],
                        border: [true, true, true, true],
                        height: 45,
                        alignment: 'left',
                        valign: 'top',
                        margin: [0, 0, 0, 0],
                        padding: [2, 2, 2, 20]
                      }
                    ],
                    [
                      { 
                        stack: [
                          { text: 'Dispatched through', style: 'bold', fontSize: 7 },
                          { text: data.dispatchedThrough || '', style: 'bold', fontSize: 8 },
                          { text: (data.dispatchedThrough && data.dispatchedThrough.trim()) ? '\n' : '\n\n', fontSize: 4 }
                        ],
                        border: [true, true, true, true],
                        height: 28,
                        alignment: 'left',
                        valign: 'top',
                        padding: [2, 8, 2, 8]
                      },
                      { 
                        stack: [
                          { text: 'Destination', style: 'bold', fontSize: 7 },
                          { text: data.destination || '', style: 'bold', fontSize: 8 },
                          { text: (data.destination && data.destination.trim()) ? '\n' : '\n\n', fontSize: 4 }
                        ],
                        border: [true, true, true, true],
                        height: 28,
                        alignment: 'left',
                        valign: 'top',
                        padding: [2, 8, 2, 8]
                      }
                    ],
                    [
                      { 
                        stack: [
                          { text: 'Terms of Delivery', style: 'bold', fontSize: 7 },
                          { text: data.termsOfDelivery || '', style: 'bold', fontSize: 8 },
                          { text: '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n', fontSize: 1, color: 'white' }
                        ],
                        colSpan: 2,
                        border: [true, true, true, true],
                        height: 65,
                        alignment: 'left',
                        valign: 'top',
                        margin: [0, 0, 0, 0],
                        padding: [2, 2, 2, 20]
                      },
                      { text: '' }
                    ]
                  ],
                },
                layout: {
                  hLineWidth: () => 0.5,
                  vLineWidth: (i) => {
                    if (i === 0) return 0;
                    return 0.5;
                  },
                  hLineColor: () => '#000',
                  vLineColor: () => '#000',
                  paddingLeft: () => 1,
                  paddingRight: () => 1,
                  paddingTop: () => 1,
                  paddingBottom: () => 1,
                },
              }
            ],
            columnGap: 0,
            margin: [0, 12, 0, 0]
          },
          {
            table: {
              headerRows: 1, 
              widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
              body: itemsTableBody,
              dontBreakRows: false,
            },
            layout: {
              hLineWidth: (i, node) => {
                if (i === 0) return 0.5;
                if (i === 1) return 1;
                if (i === itemsTableBody.length - 1) return 1;
                if (i === itemsTableBody.length) return 0.5;
                return 0.5;
              },
              vLineWidth: () => 0.5,
              hLineColor: () => '#000',
              vLineColor: () => '#000',
              paddingLeft: () => 2,
              paddingRight: () => 2,
              paddingTop: (i) => (i === 0 ? 6 : (i === 1 ? 4 : 1)),
              paddingBottom: (i) => (i === 0 ? 6 : (i === 1 ? 4 : 1)),
              hLineWhenBroken: true
            },
            margin: [0, 0, 0, 0],
            pageBreak: 'auto'
          },
          ...(() => {
            const taxEnabled = data.taxEnabled !== false;
            if (!taxEnabled) return [];
            return [{
              table: {
                headerRows: 2, 
                widths: isIntraState ? ['15%', '20%', '10%', '15%', '10%', '15%', '15%'] : ['20%', '25%', '15%', '25%', '15%'],
                body: taxTableBody,
                dontBreakRows: false,
              },
            layout: {
              hLineWidth: (i) => {
                if (i === 0) return 0.5;
                if (i === 1 || i === 2) return 1;
                if (i === taxTableBody.length - 1) return 1;
                if (i === taxTableBody.length) return 0.5;
                return 0.5;
              },
              vLineWidth: () => 0.5,
              hLineColor: () => '#000',
              vLineColor: () => '#000',
              paddingTop: (i) => (i < 2 ? 3 : 1),
              paddingBottom: (i) => (i < 2 ? 3 : 1),
              hLineWhenBroken: true
            },
            margin: [0, 0, 0, 0],
            pageBreak: 'auto'
          }];
          })(),
          bottomTable,
        ],
      };

      // Create PDF document
      const invoiceNumber = data.invoiceNumber || 'invoice';
      const fileName = `Invoice_${invoiceNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      console.log('Creating PDF document...');
      
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

      console.log('Attempting to download PDF:', fileName);
      try {
        pdfDoc.download(fileName);
        console.log('PDF download method called');
        
        pdfDoc.getBlob((blob) => {
          console.log('PDF blob generated, size:', blob.size);
          
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          console.log('PDF download link triggered');
          
          (async () => {
            try {
              console.log('Uploading PDF to S3...');
              const { uploadPdfToS3, updateProformaInvoiceS3Url } = await import('./api.js');
              const uploadResult = await uploadPdfToS3(blob, fileName, 'ProformaInvoice');
              console.log('✅ PDF uploaded to S3:', uploadResult.url);

              try {
                const { updateProformaInvoice, getAllProformaInvoices } = await import('./api.js');
                
                if (data._id) {
                  const dbData = {
                    invoiceNumber: data.invoiceNumber || '',
                    invoiceDate: data.invoiceDate || new Date().toISOString(),
                    referenceNo: data.referenceNo || '',
                    projectName: data.projectName || '',
                    fromAddress: {
                      companyName: data.invoiceFromCompanyName || '',
                      street: data.invoiceFromStreet || '',
                      apartment: data.invoiceFromApartment || '',
                      city: data.invoiceFromCity || '',
                      zipCode: data.invoiceFromZipCode || '',
                      country: data.invoiceFromCountryCode || '',
                      state: data.invoiceFromStateCode || '',
                      pan: data.invoiceFromPAN || '',
                      gstin: data.invoiceFromGSTIN || '',
                    },
                    billToAddress: {
                      clientName: data.billToClientName || '',
                      companyName: data.billToCompanyName || '',
                      street: data.billToStreet || '',
                      apartment: data.billToApartment || '',
                      city: data.billToCity || '',
                      zipCode: data.billToZipCode || '',
                      country: data.billToCountryCode || '',
                      state: data.billToStateCode || '',
                      pan: data.billToPAN || '',
                      gstin: data.billToGSTIN || '',
                      phoneNumber: data.billToPhoneNumber || '',
                    },
                    totalAmount: data.calculations?.total || 0,
                    s3Url: uploadResult.url || '',
                    fullInvoiceData: data,
                  };
                  
                  await updateProformaInvoice(data._id, dbData);
                  console.log('✅ Database updated with full invoice data and S3 URL');
                } else {
                  await updateProformaInvoiceS3Url(invoiceNumber, uploadResult.url);
                  console.log('✅ Database updated with S3 URL');
                }
              } catch (dbError) {
                console.warn('⚠️ Could not update database:', dbError.message);
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
      
      setTimeout(() => {
        if (onDownloadStateChange) {
          onDownloadStateChange(false);
        }
      }, 10000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
      if (onDownloadStateChange) onDownloadStateChange(false);
    }
};
=======
};


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
    
    // 1. Company/Client Name - always include client name line (empty if not present)
    if (!isInvoiceFrom) {
      if (addressData.clientName && addressData.clientName.trim()) {
        parts.push({ text: addressData.clientName.trim(), style: 'bold' });
      } else {
        parts.push({ text: ' ', fontSize: 8 }); // Empty line for client name
      }
    }
    if (addressData.companyName && addressData.companyName.trim()) {
      const style = (!addressData.clientName || isInvoiceFrom) ? 'bold' : 'normal';
      parts.push({ text: addressData.companyName.trim(), style });
    }

    // 2. Address Lines
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
    
    // 3. Country
    if (addressData.countryCode) {
      const countryName = getCountryName(addressData.countryCode);
      if (countryName) parts.push(countryName);
    }
    
    // 4. GST/PAN
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

    try {
      console.log('Starting PDF generation...');
      if (onDownloadStateChange) onDownloadStateChange(true);
      
      if (!pdfMake || !pdfMake.createPdf) {
        console.error('pdfMake is not properly initialized');
        alert('PDF library not initialized. Please refresh the page and try again.');
        if (onDownloadStateChange) onDownloadStateChange(false);
        return;
      }
      
      const calculations = data.calculations || {};
      calculations.subtotal = calculations.subtotal || 0;
      calculations.total = calculations.total || 0;
      calculations.totalTax = calculations.totalTax || 0;
      calculations.gstType = calculations.gstType || 'inter-state';
      calculations.cgst = calculations.cgst || { rate: 0, amount: 0 };
      calculations.sgst = calculations.sgst || { rate: 0, amount: 0 };
      calculations.igst = calculations.igst || { rate: 0, amount: 0 };
      calculations.amountInWords = calculations.amountInWords || '';
      
      if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        console.warn('No items found, using empty array');
        data.items = [];
      }
      
      const isIntraState = calculations.gstType === 'intra-state';
      const totalQuantity = calculations.totalQuantity || data.items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0) || 0;
      
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

      // --- ITEMS TABLE ---
      const itemsTableBody = [
        [
          { text: 'Description of Goods', style: 'tableHeader', alignment: 'left', minHeight: 22 },
          { text: 'HSN/SAC', style: 'tableHeader', alignment: 'center', minHeight: 22 },
          { text: 'Quantity', style: 'tableHeader', alignment: 'center', minHeight: 22 },
          { text: 'Rate', style: 'tableHeader', alignment: 'right', minHeight: 22 },
          { text: 'per', style: 'tableHeader', alignment: 'center', minHeight: 22 },
          { text: 'Amount', style: 'tableHeader', alignment: 'right', minHeight: 22 },
        ],
        ...(data.items || []).map(item => [
          { text: item.description || item.name || '', style: 'tableCell' },
          { text: item.hsn || '', style: 'tableCell', alignment: 'center' },
          { text: item.quantity ? `${item.quantity}` : '0', style: 'tableCell', alignment: 'center' },
          { text: formatCurrency(item.rate || 0), style: 'tableCell', alignment: 'right' },
          { text: 'nos', style: 'tableCell', alignment: 'center' },
          { text: formatCurrency(item.amount || 0), style: 'tableCell', alignment: 'right' },
        ]),
        [
          { text: 'Subtotal', style: 'bold', alignment: 'left', fontSize: 9 },
          { text: '', style: 'tableCell' },
          { text: '', style: 'tableCell' },
          { text: '', style: 'tableCell' },
          { text: '', style: 'tableCell' },
          { text: formatCurrency(calculations.subtotal || 0), style: 'bold', alignment: 'right', fontSize: 9 },
        ],
        ...(() => {
          const taxEnabled = data.taxEnabled !== false;
          if (!taxEnabled) return [];
          
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
        [
          { text: 'Total', style: 'bold', alignment: 'left', fontSize: 9 },
          { text: '', style: 'tableCell' },
          { text: `${totalQuantity} nos`, style: 'bold', alignment: 'center', fontSize: 9 },
          { text: '', style: 'tableCell' },
          { text: '', style: 'tableCell' },
          { text: formatCurrency(calculations.total || 0), style: 'bold', alignment: 'right', fontSize: 9 },
        ],
        [
          { 
            text: [
              { text: 'Amount Chargeable (in words)\n', style: 'bold', fontSize: 8 },
              { text: calculations.amountInWords || numberToWords(calculations.total || 0), style: 'bold', fontSize: 8 },
            ], 
            colSpan: 5, 
            alignment: 'left', 
            valign: 'top',
            margin: [2, 2, 2, 2],
            border: [true, false, false, true],
          },
          { text: '' },
          { text: '' },
          { text: '' },
          { text: '' },
          { 
            text: 'E. & O.E', 
            alignment: 'right', 
            valign: 'top',
            margin: [2, 2, 2, 2], 
            fontSize: 8, 
            border: [false, false, true, true]
          },
        ]
      ];

      // --- TAX SUMMARY TABLE ---
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
          { text: '' },
          { text: '' },
          ...(isIntraState ? [
            { text: 'Rate', style: 'tableHeader', alignment: 'center' },
            { text: 'Amount', style: 'tableHeader', alignment: 'center' },
            { text: 'Rate', style: 'tableHeader', alignment: 'center' },
            { text: 'Amount', style: 'tableHeader', alignment: 'center' },
            { text: '' },
          ] : [
            { text: 'Rate', style: 'tableHeader', alignment: 'center' },
            { text: 'Amount', style: 'tableHeader', alignment: 'center' },
            { text: '' },
          ]),
        ]
      ];
      
      const taxTableBody = [
        ...taxTableHeaders,
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
        (() => {
          const totalRow = [
            { text: 'Total', style: 'bold', alignment: 'center', fontSize: 9 },
            { text: formatCurrency(calculations.subtotal || 0), style: 'bold', alignment: 'right', fontSize: 9 },
          ];
          
          if (isIntraState) {
            totalRow.push(
              { text: '' },
              { text: formatCurrency(calculations.cgst?.amount || 0), style: 'bold', alignment: 'right', fontSize: 9 },
              { text: '' },
              { text: formatCurrency(calculations.sgst?.amount || 0), style: 'bold', alignment: 'right', fontSize: 9 },
              { text: formatCurrency(calculations.totalTax || 0), style: 'bold', alignment: 'right', fontSize: 9 }
            );
          } else {
            totalRow.push(
              { text: '' },
              { text: formatCurrency(calculations.igst?.amount || calculations.totalTax || 0), style: 'bold', alignment: 'right', fontSize: 9 },
              { text: formatCurrency(calculations.totalTax || 0), style: 'bold', alignment: 'right', fontSize: 9 }
            );
          }
          return totalRow;
        })(),
        [
          {
            text: [
              { text: 'Tax Amount (in words): ', style: 'bold', fontSize: 8 },
              { text: numberToWords(calculations.totalTax || 0), style: 'bold', fontSize: 8 },
            ],
            colSpan: isIntraState ? 7 : 5,
            alignment: 'left',
            margin: [2, 2, 2, 2],
          },
          ...(isIntraState 
            ? [{ text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }]
            : [{ text: '' }, { text: '' }, { text: '' }, { text: '' }]
          ),
        ]
      ];

      // --- BANK DETAILS/FOOTER ---
      const bottomTable = {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              { 
                text: [
                  { text: 'Company\'s PAN:\n', style: 'bold', fontSize: 8 },
                  { text: data.invoiceFromPAN || 'AADCT7719D', fontSize: 8 }
                ],
                border: [true, true, true, true],
                padding: [3, 3, 3, 3],
                alignment: 'left',
                valign: 'top'
              },
              {
                text: [
                  { text: 'Company\'s Bank Details\n', style: 'bold', fontSize: 8 },
                  { text: `Bank Name: ${bankDetails.bankName}\n`, fontSize: 8 },
                  { text: `A/c No.: ${bankDetails.accountNumber}\n`, fontSize: 8 },
                  { text: `Branch & IFS Code: ${bankDetails.branchAndIFSC}`, fontSize: 8 }
                ],
                border: [true, true, true, true],
                padding: [3, 3, 3, 3],
                alignment: 'left',
                valign: 'top'
              }
            ],
            [
              {
                stack: [
                  { text: 'Declaration', style: 'bold', fontSize: 8 },
                  { text: 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.', fontSize: 8 },
                  { text: '\n\n\n\n\n\n\n\n', fontSize: 8 }
                ],
                border: [true, true, true, true],
                padding: [3, 3, 3, 3],
                alignment: 'left',
                valign: 'top',
                minHeight: 120
              },
              {
                stack: [
                  { text: 'for Vista Engineering Solutions', style: 'bold', alignment: 'center', fontSize: 9, margin: [0, 0, 0, 0] },
                  { text: '\n\n\n\n\n\n\n\n', fontSize: 8 },
                  { text: 'Authorised Signatory', alignment: 'center', fontSize: 8, margin: [0, 0, 0, 0] }
                ],
                border: [true, true, true, true],
                padding: [3, 3, 3, 3],
                alignment: 'center',
                valign: 'top',
                minHeight: 120
              }
            ]
          ]
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#000',
          vLineColor: () => '#000'
        },
        margin: [0, 0, 0, 0],
        unbreakable: true
      };

      // --- Document Definition ---
      const docDefinition = {
        pageSize: 'A4',
        pageMargins: [25, 80, 25, 25],
        styles: styles,
        background: {
          image: WATERMARK_BASE64_DATA,
          width: 250,
          opacity: 0.6,
          absolutePosition: { x: 172, y: 200 }
        },
        header: (currentPage, pageCount) => {
          return {
            columns: [
              {
                image: LOGO_BASE64_DATA, 
                width: 95,
                fit: [95, 95], 
                alignment: 'left',
                margin: [25, 10, 0, 0],
              },
              {
                width: '*',
                stack: [
                  {
                    text: 'VISTA ENGG SOLUTIONS PRIVATE LIMITED', 
                    style: 'bold', 
                    alignment: 'center',
                    fontSize: 14, 
                    margin: [0, 15, 0, 0]
                  }
                ],
                margin: [0, 0, 0, 0]
              },
              {
                text: '',
                width: 110,
                margin: [0, 0, 25, 0]
              }
            ],
            columnGap: 0,
            margin: [0, 0, 0, 0]
          };
        },

        footer: (currentPage, pageCount) => ([
          { text: 'This is a Computer Generated Invoice', style: 'footerText' },
          { text: `Page ${currentPage} of ${pageCount}`, style: 'footerText', margin: [0, 0, 0, 10] }
        ]),

        content: [
          // Page-level heading placed in content so it appears once at top of first page
          { text: 'PROFORMA INVOICE', style: 'title', alignment: 'center', margin: [0, 0, 0, 8], bold: true },
          {
            columns: [
              {
                width: '40%',
                table: {
                  widths: ['100%'],
                  body: [
                    [{
                      stack: buildAddressParts(invoiceFromData, true),
                      style: 'addressBlock',
                      border: [true, true, true, true],
                      padding: [3, 3, 3, 3]
                    }],
                    [{
                      stack: [
                        { text: 'Consignee (Ship to)', style: 'italicLabel' },
                        ...buildAddressParts(shipToData)
                      ],
                      style: 'addressBlock',
                      border: [true, true, true, true],
                      padding: [3, 3, 3, 3]
                    }],
                    [{
                stack: [
                        { text: 'Buyer (Bill to)', style: 'italicLabel' },
                        ...buildAddressParts(billToData)
                      ],
                      style: 'addressBlock',
                      border: [true, true, true, true],
                      padding: [3, 3, 3, 3]
                    }]
                  ]
                },
                layout: {
                  hLineWidth: () => 0.5,
                  vLineWidth: () => 0.5,
                  hLineColor: () => '#000',
                  vLineColor: () => '#000'
                }
              ,
                  margin: [0, 0, 0, 0]
              },
              {
                width: '60%',
                table: {
                  widths: ['50%', '50%'],
                  body: [
                    [
                      { 
                        stack: [
                          { text: 'Invoice No.', style: 'bold', fontSize: 7 },
                          { text: data.invoiceNumber || '', style: 'bold', fontSize: 8 },
                          { text: '\n', fontSize: 4 }
                        ],
                        border: [true, true, true, true],
                        height: 28,
                        alignment: 'left',
                        valign: 'top',
                        padding: [2, 4, 2, 4]
                      },
                      { 
                        stack: [
                          { text: 'Invoice Date', style: 'bold', fontSize: 7 },
                          { text: formatDate(data.invoiceDate) || '', style: 'bold', fontSize: 8 },
                          { text: '\n', fontSize: 4 }
                        ],
                        border: [true, true, true, true],
                        height: 28,
                        alignment: 'left',
                        valign: 'top',
                        padding: [2, 4, 2, 4]
                      }
                    ],
                    [
                      { 
                        stack: [
                          { text: 'Delivery Note', style: 'bold', fontSize: 7 },
                          { text: data.deliveryNote || '', style: 'bold', fontSize: 8 },
                          { text: '\n\n', fontSize: 4 }
                        ],
                        border: [true, true, true, true],
                        height: 28,
                        alignment: 'left',
                        valign: 'top',
                        padding: [2, 8, 2, 8]
                      },
                      { 
                        stack: [
                          { text: 'Mode/Terms of Payment', style: 'bold', fontSize: 7 },
                          { text: data.paymentTerms || '', style: 'bold', fontSize: 8 },
                          { text: '\n\n', fontSize: 4 }
                        ],
                        border: [true, true, true, true],
                        height: 28,
                        alignment: 'left',
                        valign: 'top',
                        padding: [2, 8, 2, 8]
                      }
                    ],
                    [
                      { 
                        stack: [
                          { text: 'Reference No', style: 'bold', fontSize: 7 },
                          { text: data.referenceNo || '', style: 'bold', fontSize: 8 },
                          { text: '\n\n', fontSize: 4 }
                        ],
                        border: [true, true, true, true],
                        height: 28,
                        alignment: 'left',
                        valign: 'top',
                        padding: [2, 8, 2, 8]
                      },
                      { 
                        stack: [
                          { text: 'Other References', style: 'bold', fontSize: 7 },
                          { text: data.otherReferences || '', style: 'bold', fontSize: 8 },
                          { text: '\n\n', fontSize: 4 }
                        ],
                        border: [true, true, true, true],
                        height: 28,
                        alignment: 'left',
                        valign: 'top',
                        padding: [2, 8, 2, 8]
                      }
                    ],
                    [
                      { 
                        stack: [
                          { text: 'Buyer\'s Order No.', style: 'bold', fontSize: 7 },
                          { text: data.buyersOrderNo || '', style: 'bold', fontSize: 8 },
                          { text: '\n\n', fontSize: 4 }
                        ],
                        border: [true, true, true, true],
                        height: 28,
                        alignment: 'left',
                        valign: 'top',
                        padding: [2, 8, 2, 8]
                      },
                      { 
                        stack: [
                          { text: 'Purchase Date', style: 'bold', fontSize: 7 },
                          { text: formatDate(data.buyersOrderDate) || '', style: 'bold', fontSize: 8 },
                          { text: '\n\n', fontSize: 4 }
                        ],
                        border: [true, true, true, true],
                        height: 28,
                        alignment: 'left',
                        valign: 'top',
                        padding: [2, 8, 2, 8]
                      }
                    ],
                    [
                      { 
                        stack: [
                          { text: 'Dispatch Doc No.', style: 'bold', fontSize: 7 },
                          { text: data.dispatchDocNo || '', style: 'bold', fontSize: 8 },
                          { text: (data.dispatchDocNo && data.dispatchDocNo.trim()) ? '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n' : '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n', fontSize: 1, color: 'white' }
                        ],
                        border: [true, true, true, true],
                        height: 45,
                        alignment: 'left',
                        valign: 'top',
                        margin: [0, 0, 0, 0],
                        padding: [2, 2, 2, 20]
                      },
                      { 
                        stack: [
                          { text: 'Delivery Note Date', style: 'bold', fontSize: 7 },
                          { text: formatDate(data.deliveryNoteDate) || '', style: 'bold', fontSize: 8 },
                          { text: (data.deliveryNoteDate && data.deliveryNoteDate.trim()) ? '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n' : '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n', fontSize: 1, color: 'white' }
                        ],
                        border: [true, true, true, true],
                        height: 45,
                        alignment: 'left',
                        valign: 'top',
                        margin: [0, 0, 0, 0],
                        padding: [2, 2, 2, 20]
                      }
                    ],
                    [
                      { 
                        stack: [
                          { text: 'Dispatched through', style: 'bold', fontSize: 7 },
                          { text: data.dispatchedThrough || '', style: 'bold', fontSize: 8 },
                          { text: (data.dispatchedThrough && data.dispatchedThrough.trim()) ? '\n' : '\n\n', fontSize: 4 }
                        ],
                        border: [true, true, true, true],
                        height: 28,
                        alignment: 'left',
                        valign: 'top',
                        padding: [2, 8, 2, 8]
                      },
                      { 
                        stack: [
                          { text: 'Destination', style: 'bold', fontSize: 7 },
                          { text: data.destination || '', style: 'bold', fontSize: 8 },
                          { text: (data.destination && data.destination.trim()) ? '\n' : '\n\n', fontSize: 4 }
                        ],
                        border: [true, true, true, true],
                        height: 28,
                        alignment: 'left',
                        valign: 'top',
                        padding: [2, 8, 2, 8]
                      }
                    ],
                    [
                      { 
                        stack: [
                          { text: 'Terms of Delivery', style: 'bold', fontSize: 7 },
                          { text: data.termsOfDelivery || '', style: 'bold', fontSize: 8 },
                          { text: '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n', fontSize: 1, color: 'white' }
                        ],
                        colSpan: 2,
                        border: [true, true, true, true],
                        height: 65,
                        alignment: 'left',
                        valign: 'top',
                        margin: [0, 0, 0, 0],
                        padding: [2, 2, 2, 20]
                      },
                      { text: '' }
                    ]
                  ],
                },
                layout: {
                  hLineWidth: () => 0.5,
                  vLineWidth: (i) => {
                    if (i === 0) return 0;
                    return 0.5;
                  },
                  hLineColor: () => '#000',
                  vLineColor: () => '#000',
                  paddingLeft: () => 1,
                  paddingRight: () => 1,
                  paddingTop: () => 1,
                  paddingBottom: () => 1,
                },
              }
            ],
            columnGap: 0,
            margin: [0, 12, 0, 0]
          },
          {
            table: {
              headerRows: 1, 
              widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
              body: itemsTableBody,
              dontBreakRows: false,
            },
            layout: {
              hLineWidth: (i, node) => {
                if (i === 0) return 0.5;
                if (i === 1) return 1;
                if (i === itemsTableBody.length - 1) return 1;
                if (i === itemsTableBody.length) return 0.5;
                return 0.5;
              },
              vLineWidth: () => 0.5,
              hLineColor: () => '#000',
              vLineColor: () => '#000',
              paddingLeft: () => 2,
              paddingRight: () => 2,
              paddingTop: (i) => (i === 0 ? 6 : (i === 1 ? 4 : 1)),
              paddingBottom: (i) => (i === 0 ? 6 : (i === 1 ? 4 : 1)),
              hLineWhenBroken: true
            },
            margin: [0, 0, 0, 0],
            pageBreak: 'auto'
          },
          ...(() => {
            const taxEnabled = data.taxEnabled !== false;
            if (!taxEnabled) return [];
            return [{
              table: {
                headerRows: 2, 
                widths: isIntraState ? ['15%', '20%', '10%', '15%', '10%', '15%', '15%'] : ['20%', '25%', '15%', '25%', '15%'],
                body: taxTableBody,
                dontBreakRows: false,
              },
            layout: {
              hLineWidth: (i) => {
                if (i === 0) return 0.5;
                if (i === 1 || i === 2) return 1;
                if (i === taxTableBody.length - 1) return 1;
                if (i === taxTableBody.length) return 0.5;
                return 0.5;
              },
              vLineWidth: () => 0.5,
              hLineColor: () => '#000',
              vLineColor: () => '#000',
              paddingTop: (i) => (i < 2 ? 3 : 1),
              paddingBottom: (i) => (i < 2 ? 3 : 1),
              hLineWhenBroken: true
            },
            margin: [0, 0, 0, 0],
            pageBreak: 'auto'
          }];
          })(),
          bottomTable,
        ],
      };

      // Create PDF document
      const invoiceNumber = data.invoiceNumber || 'invoice';
      const fileName = `Invoice_${invoiceNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      console.log('Creating PDF document...');
      
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

      console.log('Attempting to download PDF:', fileName);
      try {
        pdfDoc.download(fileName);
        console.log('PDF download method called');
        
        pdfDoc.getBlob((blob) => {
          console.log('PDF blob generated, size:', blob.size);
          
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          console.log('PDF download link triggered');
          
          (async () => {
            try {
              console.log('Uploading PDF to S3...');
              const { uploadPdfToS3, updateProformaInvoiceS3Url } = await import('./api.js');
              const uploadResult = await uploadPdfToS3(blob, fileName, 'ProformaInvoice');
              console.log('✅ PDF uploaded to S3:', uploadResult.url);

              try {
                const { updateProformaInvoice, getAllProformaInvoices } = await import('./api.js');
                
                if (data._id) {
                  const dbData = {
                    invoiceNumber: data.invoiceNumber || '',
                    invoiceDate: data.invoiceDate || new Date().toISOString(),
                    referenceNo: data.referenceNo || '',
                    projectName: data.projectName || '',
                    fromAddress: {
                      companyName: data.invoiceFromCompanyName || '',
                      street: data.invoiceFromStreet || '',
                      apartment: data.invoiceFromApartment || '',
                      city: data.invoiceFromCity || '',
                      zipCode: data.invoiceFromZipCode || '',
                      country: data.invoiceFromCountryCode || '',
                      state: data.invoiceFromStateCode || '',
                      pan: data.invoiceFromPAN || '',
                      gstin: data.invoiceFromGSTIN || '',
                    },
                    billToAddress: {
                      clientName: data.billToClientName || '',
                      companyName: data.billToCompanyName || '',
                      street: data.billToStreet || '',
                      apartment: data.billToApartment || '',
                      city: data.billToCity || '',
                      zipCode: data.billToZipCode || '',
                      country: data.billToCountryCode || '',
                      state: data.billToStateCode || '',
                      pan: data.billToPAN || '',
                      gstin: data.billToGSTIN || '',
                      phoneNumber: data.billToPhoneNumber || '',
                    },
                    totalAmount: data.calculations?.total || 0,
                    s3Url: uploadResult.url || '',
                    fullInvoiceData: data,
                  };
                  
                  await updateProformaInvoice(data._id, dbData);
                  console.log('✅ Database updated with full invoice data and S3 URL');
                } else {
                  await updateProformaInvoiceS3Url(invoiceNumber, uploadResult.url);
                  console.log('✅ Database updated with S3 URL');
                }
              } catch (dbError) {
                console.warn('⚠️ Could not update database:', dbError.message);
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
      
      setTimeout(() => {
        if (onDownloadStateChange) {
          onDownloadStateChange(false);
        }
      }, 10000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
      if (onDownloadStateChange) onDownloadStateChange(false);
    }
};
>>>>>>> 444c00970330eae1f30b5a67e96754c17a431c5a
