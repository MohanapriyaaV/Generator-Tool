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
    
    // 1. Company/Client Name
    if (!isInvoiceFrom) {
      if (addressData.clientName && addressData.clientName.trim()) {
        parts.push({ text: addressData.clientName.trim(), style: 'bold' });
      } else {
        parts.push({ text: ' ', fontSize: 8 });
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

const getUniqueHSN = (items) => {
    if (!items || items.length === 0) return [];
    const hsnMap = new Map();
    items.forEach(item => {
      const hsn = item.hsn || '';
      if (hsn) {
        const qty = parseFloat(item.quantity) || 0;
        const rate = parseFloat(item.price || item.rate) || 0;
        const amount = qty * rate;
        const existing = hsnMap.get(hsn) || { hsn: hsn, taxableValue: 0 };
        existing.taxableValue += amount;
        hsnMap.set(hsn, existing);
      }
    });
    return Array.from(hsnMap.values());
};

export const generateInvoicePDF = async (elementRef, fileName, formData, items, tax) => {
  try {
    if (!formData || !items) {
      throw new Error('Invoice data is not available');
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || parseFloat(item.price) || 0;
      return sum + (qty * rate);
    }, 0);
    
    const cgstRate = parseFloat(tax?.cgst) || 0;
    const sgstRate = parseFloat(tax?.sgst) || 0;
    const igstRate = parseFloat(tax?.igst) || 0;
    const isIntraState = cgstRate > 0 && sgstRate > 0;
    const taxTotal = (subtotal * (cgstRate + sgstRate + igstRate)) / 100;
    const grandTotal = subtotal + taxTotal;
    const totalQuantity = items.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0);

    // Build address data
    const invoiceFromData = {
      companyName: formData.invoiceFromCompanyName || '', 
      street: formData.invoiceFromStreet || '', 
      apartment: formData.invoiceFromApartment || '', 
      city: formData.invoiceFromCity || '', 
      zipCode: formData.invoiceFromZipCode || '', 
      countryCode: formData.invoiceFromCountryCode || '', 
      gstin: formData.invoiceFromGSTIN || '', 
      pan: formData.invoiceFromPAN || '',
    };
    
    const shipToData = {
      clientName: formData.shipToClientName || '', 
      companyName: formData.shipToCompanyName || '', 
      street: formData.shipToStreet || '', 
      apartment: formData.shipToApartment || '', 
      city: formData.shipToCity || '', 
      zipCode: formData.shipToZipCode || '', 
      countryCode: formData.shipToCountryCode || '', 
      gstin: formData.shipToGSTIN || '', 
      pan: formData.shipToPAN || '',
    };
    
    const billToData = {
      clientName: formData.billToClientName || '', 
      companyName: formData.billToCompanyName || '', 
      street: formData.billToStreet || '', 
      apartment: formData.billToApartment || '', 
      city: formData.billToCity || '', 
      zipCode: formData.billToZipCode || '', 
      countryCode: formData.billToCountryCode || '', 
      gstin: formData.billToGSTIN || '', 
      pan: formData.billToPAN || '',
    };

    // Get bank details
    const getBankDetails = () => {
      if (formData.bankDetails && formData.bankDetails.bankName) {
        return {
          bankName: formData.bankDetails.bankName || '',
          accountNumber: formData.bankDetails.accountNo || formData.bankDetails.accountNumber || '',
          branchAndIFSC: formData.bankDetails.branchIfsc || formData.bankDetails.branchAndIFSC || ''
        };
      }
      
      const countryCode = formData.invoiceFromCountryCode || '';
      if (countryCode === 'IN') {
        return { bankName: 'ICICI Bank Limited', accountNumber: '058705002413', branchAndIFSC: 'Avinashi Road & ICIC0000587' };
      } else {
        return { bankName: 'HDFC Bank Ltd', accountNumber: '00752560001860', branchAndIFSC: 'Old Airport Road & HDFC0000075' };
      }
    };
    const bankDetails = getBankDetails();
    
    const hsnDataList = getUniqueHSN(items);

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
      ...(items || []).map(item => [
        { text: item.name || item.description || '', style: 'tableCell' },
        { text: item.hsn || '', style: 'tableCell', alignment: 'center' },
        { text: item.quantity ? `${item.quantity}` : '0', style: 'tableCell', alignment: 'center' },
        { text: formatCurrency(item.price || item.rate || 0), style: 'tableCell', alignment: 'right' },
        { text: 'nos', style: 'tableCell', alignment: 'center' },
        { text: formatCurrency((parseFloat(item.quantity || 0) * parseFloat(item.price || item.rate || 0))), style: 'tableCell', alignment: 'right' },
      ]),
      [
        { text: '', style: 'tableCell' },
        { text: '', style: 'tableCell' },
        { text: '', style: 'tableCell' },
        { text: '', style: 'tableCell' },
        { text: '', style: 'tableCell' },
        { text: formatCurrency(subtotal), style: 'bold', alignment: 'right', fontSize: 9 },
      ],
      ...(() => {
        if (igstRate > 0) {
          return [[
            { text: `IGST - ${igstRate}%`, style: 'tableCell' },
            { text: '', style: 'tableCell' },
            { text: '', style: 'tableCell' },
            { text: `${igstRate}%`, style: 'tableCell', alignment: 'center' },
            { text: '', style: 'tableCell' },
            { text: formatCurrency((subtotal * igstRate) / 100), style: 'tableCell', alignment: 'right' },
          ]];
        } else if (cgstRate > 0 && sgstRate > 0) {
          return [
            [
              { text: `CGST - ${cgstRate}%`, style: 'tableCell' },
              { text: '', style: 'tableCell' },
              { text: '', style: 'tableCell' },
              { text: `${cgstRate}%`, style: 'tableCell', alignment: 'center' },
              { text: '', style: 'tableCell' },
              { text: formatCurrency((subtotal * cgstRate) / 100), style: 'tableCell', alignment: 'right' },
            ],
            [
              { text: `SGST - ${sgstRate}%`, style: 'tableCell' },
              { text: '', style: 'tableCell' },
              { text: '', style: 'tableCell' },
              { text: `${sgstRate}%`, style: 'tableCell', alignment: 'center' },
              { text: '', style: 'tableCell' },
              { text: formatCurrency((subtotal * sgstRate) / 100), style: 'tableCell', alignment: 'right' },
            ],
          ];
        }
        return [];
      })(),
      [
        { text: 'Total', style: 'bold', alignment: 'left', fontSize: 9 },
        { text: '', style: 'tableCell' },
        { text: `${totalQuantity} nos`, style: 'bold', alignment: 'center', fontSize: 9 },
        { text: '', style: 'tableCell' },
        { text: '', style: 'tableCell' },
        { text: formatCurrency(grandTotal), style: 'bold', alignment: 'right', fontSize: 9 },
      ],
      [
        { 
          text: [
            { text: 'Amount Chargeable (in words)\n', style: 'bold', fontSize: 8 },
            { text: numberToWords(grandTotal), style: 'bold', fontSize: 8 },
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
            { text: hsnData.hsn, style: 'tableCell', alignment: 'left' },
            { text: formatCurrency(hsnData.taxableValue), style: 'tableCell', alignment: 'right' },
          ];
          
          if (isIntraState) {
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
            { text: '-', style: 'tableCell', alignment: 'left' },
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
          { text: 'Total', style: 'bold', alignment: 'left', fontSize: 9 },
          { text: formatCurrency(subtotal), style: 'bold', alignment: 'right', fontSize: 9 },
        ];
        
        if (isIntraState) {
          totalRow.push(
            { text: '' },
            { text: formatCurrency((subtotal * cgstRate) / 100), style: 'bold', alignment: 'right', fontSize: 9 },
            { text: '' },
            { text: formatCurrency((subtotal * sgstRate) / 100), style: 'bold', alignment: 'right', fontSize: 9 },
            { text: formatCurrency(taxTotal), style: 'bold', alignment: 'right', fontSize: 9 }
          );
        } else {
          totalRow.push(
            { text: '' },
            { text: formatCurrency((subtotal * igstRate) / 100), style: 'bold', alignment: 'right', fontSize: 9 },
            { text: formatCurrency(taxTotal), style: 'bold', alignment: 'right', fontSize: 9 }
          );
        }
        return totalRow;
      })(),
      [
        {
          text: [
            { text: 'Tax Amount (in words): ', style: 'bold', fontSize: 8 },
            { text: numberToWords(taxTotal), style: 'bold', fontSize: 8 },
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
                { text: formData.invoiceFromPAN || 'AADCV6398Q', fontSize: 8 }
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
                { text: 'for VISTA ENGG SOLUTIONS PRIVATE LIMITED', style: 'bold', alignment: 'center', fontSize: 9, margin: [0, 0, 0, 0] },
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

    // Check if consignee data exists
    const hasConsignee = shipToData.clientName || shipToData.companyName || shipToData.street;

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
        { text: 'INVOICE', style: 'title', alignment: 'center', margin: [0, 0, 0, 8], bold: true },
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
                  ...(hasConsignee ? [[{
                    stack: [
                      { text: 'Consignee (Ship to)', style: 'italicLabel' },
                      ...buildAddressParts(shipToData)
                    ],
                    style: 'addressBlock',
                    border: [true, true, true, true],
                    padding: [3, 3, 3, 3]
                  }]] : []),
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
              },
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
                        { text: formData.invoiceNumber || '', style: 'bold', fontSize: 8 },
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
                        { text: formatDate(formData.invoiceDate) || '', style: 'bold', fontSize: 8 },
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
                        { text: formData.deliveryNote || '', style: 'bold', fontSize: 8 },
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
                        { text: formData.paymentTerms || '', style: 'bold', fontSize: 8 },
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
                        { text: formData.referenceNo || '', style: 'bold', fontSize: 8 },
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
                        { text: formData.otherReferences || '', style: 'bold', fontSize: 8 },
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
                        { text: formData.buyersOrderNo || '', style: 'bold', fontSize: 8 },
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
                        { text: formatDate(formData.buyersOrderDate) || '', style: 'bold', fontSize: 8 },
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
                        { text: 'Terms of Delivery', style: 'bold', fontSize: 7 },
                        { text: formData.termsOfDelivery || '', style: 'bold', fontSize: 8 }
                      ],
                      colSpan: 2,
                      border: [true, true, true, false],
                      alignment: 'left',
                      valign: 'top',
                      margin: [0, 0, 0, 75],
                      padding: [2, 8, 2, 28]
                    },
                    { text: '' }
                  ]
                ],
              },
              layout: {
                hLineWidth: () => 0.5,
                vLineWidth: (i, node) => {
                  if (i === 0) return 0;
                  if (i === node.table.widths.length) return 0.5;
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
        ...((cgstRate > 0 || sgstRate > 0 || igstRate > 0) ? [{
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
        }] : []),
        bottomTable,
      ],
    };

    // Create PDF document
    const invoiceNumber = formData.invoiceNumber || 'invoice';
    const pdfFileName = fileName || `Invoice_${invoiceNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    console.log('Creating PDF document...');
    
    let pdfDoc;
    try {
      pdfDoc = pdfMake.createPdf(docDefinition);
      console.log('PDF document created successfully');
    } catch (createError) {
      console.error('Error creating PDF document:', createError);
      throw new Error('Error creating PDF: ' + createError.message);
    }

    console.log('Attempting to download PDF:', pdfFileName);
    
    return new Promise((resolve, reject) => {
      pdfDoc.getBlob((blob) => {
        console.log('PDF blob generated, size:', blob.size);
        resolve(blob);
      });
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
