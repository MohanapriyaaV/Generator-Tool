import pdfMake from 'pdfmake/build/pdfmake.js';
import * as pdfFonts from 'pdfmake/build/vfs_fonts.js';
import { LOGO_BASE64_DATA } from './logoBase64';

pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.vfs;

const styles = {
  headerTitle: { fontSize: 18, bold: true, alignment: 'right', letterSpacing: 1.5 },
  headerSubText: { fontSize: 8.5, margin: [0, 1, 0, 0] },
  headerNote: { fontSize: 8, margin: [0, 4, 0, 0], alignment: 'left' },
  headerAddress: { fontSize: 9, bold: true, margin: [0, 1, 0, 1] },
  headerAddressLine: { fontSize: 8, margin: [0, 0.5, 0, 0.5] },
  sectionLabel: { fontSize: 9, bold: true, margin: [0, 2, 0, 2] },
  infoText: { fontSize: 8.5, margin: [0, 0.5, 0, 0.5] },
  addressBlock: { fontSize: 8.5, lineHeight: 1.2 },
  tableHeader: { bold: true, fontSize: 9, alignment: 'center', fillColor: '#f5f5f5' },
  tableCell: { fontSize: 8.5, margin: [0, 2, 0, 2] },
  footerText: { fontSize: 8, alignment: 'center', margin: [0, 6, 0, 0] },
  authorizationTitle: { bold: true, margin: [0, 0, 0, 5], fontSize: 9 }
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Number(value || 0)
  );

const buildAddressLines = (label, data, includeTax = false) => {
  const lines = [{ text: label, style: 'sectionLabel' }];
  lines.push({ text: `Name: ${data.clientName || '-'}`, style: 'addressBlock' });
  lines.push({ text: `Company: ${data.companyName || '-'}`, style: 'addressBlock' });
  const addressParts = [
    data.street,
    data.apartment,
    data.city,
    data.stateCode,
    data.zipCode
  ].filter(Boolean);
  lines.push({ text: `Address: ${addressParts.length ? addressParts.join(', ') : '-'}`, style: 'addressBlock' });
  lines.push({ text: `Country: ${data.countryCode || '-'}`, style: 'addressBlock' });
  if (includeTax) {
    lines.push({ text: `PAN: ${data.pan || '-'}`, style: 'addressBlock' });
    lines.push({ text: `GSTIN: ${data.gstin || '-'}`, style: 'addressBlock' });
  }
  lines.push({ text: `Phone: ${data.phoneNumber || '-'}`, style: 'addressBlock' });
  return lines;
};

const buildHeaderAddress = (data) => {
  const lines = [];
  if (data.companyName) {
    lines.push({ text: data.companyName, style: 'headerAddress' });
  }

  const addressParts = [
    data.street,
    data.apartment,
    data.city,
    data.stateCode
  ].filter(Boolean);

  if (addressParts.length) {
    lines.push({ text: addressParts.join(', '), style: 'headerAddressLine' });
  }

  const countryZip = [data.countryCode, data.zipCode].filter(Boolean).join(' ');
  if (countryZip) {
    lines.push({ text: countryZip, style: 'headerAddressLine' });
  }

  return lines;
};

const buildItemsTable = (items = [], formatAmount) => {
  const header = [
    { text: 'Sl. No', style: 'tableHeader' },
    { text: 'Item', style: 'tableHeader' },
    { text: 'Qty', style: 'tableHeader' },
    { text: 'Unit Price', style: 'tableHeader' },
    { text: 'HSN/SAC', style: 'tableHeader' },
    { text: 'Total', style: 'tableHeader' }
  ];

  const rows = items.map((item, idx) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const total = qty * price;
    return [
      { text: idx + 1, style: 'tableCell', alignment: 'center' },
      {
        stack: [
          { text: item.itemName || '-', style: { bold: true } },
          item.description ? { text: item.description, fontSize: 9, color: '#555' } : ''
        ],
        style: 'tableCell'
      },
      { text: qty.toString(), style: 'tableCell', alignment: 'center' },
      { text: formatAmount(price), style: 'tableCell', alignment: 'right' },
      { text: item.hsn || '-', style: 'tableCell', alignment: 'center' },
      { text: formatAmount(total), style: 'tableCell', alignment: 'right' }
    ];
  });

  return [header, ...rows];
};

const buildTotalsTable = (subtotal, tax, formatAmount) => {
  const cgstRate = parseFloat(tax?.cgstRate) || 0;
  const sgstRate = parseFloat(tax?.sgstRate) || 0;
  const igstRate = parseFloat(tax?.igstRate) || 0;
  const taxTotal = parseFloat(tax?.taxAmount) || 0;
  const cgstAmount = (subtotal * cgstRate) / 100;
  const sgstAmount = (subtotal * sgstRate) / 100;
  const igstAmount = (subtotal * igstRate) / 100;

  const rows = [
    ['Subtotal', formatAmount(subtotal)],
    ...(cgstRate > 0 ? [[`CGST (${cgstRate}%)`, formatAmount(cgstAmount)]] : []),
    ...(sgstRate > 0 ? [[`SGST (${sgstRate}%)`, formatAmount(sgstAmount)]] : []),
    ...(igstRate > 0 ? [[`IGST (${igstRate}%)`, formatAmount(igstAmount)]] : []),
    ['Total Tax', formatAmount(taxTotal)]
  ];

  return rows;
};

const buildAuthorizationBlock = (formData) => ({
  table: {
    widths: ['50%', '50%'],
    body: [
      [
        {
          stack: [
            { text: 'Authorization', style: 'authorizationTitle' },
            { text: formData.poDate || '-', fontSize: 10 }
          ],
          border: [true, true, true, false],
          padding: [8, 6, 8, 6]
        },
        {
          stack: [
            { text: 'Authorization', style: 'authorizationTitle', color: '#fff' }
          ],
          border: [true, true, true, false],
          padding: [8, 6, 8, 6]
        }
      ],
      [
        {
          text: 'Authorized by',
          border: [true, true, true, true],
          alignment: 'center',
          padding: [8, 6, 8, 6],
          fontSize: 8.5
        },
        {
          text: 'Date',
          border: [true, true, true, true],
          alignment: 'center',
          padding: [8, 6, 8, 6],
          fontSize: 8.5
        }
      ]
    ]
  },
  layout: 'noHorizontals',
  margin: [0, 20, 0, 0]
});

const buildFooter = () => ({
  stack: [
    {
      columns: [
        {
          text: 'Indialand Tech Park, CHILSEZ Campus, Coimbatore, Tamil Nadu, India 641035',
          alignment: 'left'
        },
        { text: 'www.vistaes.com', alignment: 'center', color: '#22c55e' },
        { text: 'CIN: U72200TZ2011PTC017012', alignment: 'right' }
      ],
      fontSize: 9
    }
  ],
  margin: [0, 20, 0, 0]
});

export const generatePurchaseOrderPDF = async (
  previewRef,
  formData,
  items,
  tax,
  grandTotal,
  setIsGeneratingPDF
) => {
  try {
    if (setIsGeneratingPDF) setIsGeneratingPDF(true);

    const subtotal = items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return sum + qty * price;
    }, 0);

    const headerShipAddress = {
      companyName: formData.shipToCompanyName,
      street: formData.shipToStreet,
      apartment: formData.shipToApartment,
      city: formData.shipToCity,
      stateCode: formData.shipToStateCode,
      zipCode: formData.shipToZipCode,
      countryCode: formData.shipToCountryCode
    };

    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [25, 35, 25, 30],
      content: [
        {
          columns: [
            {
              width: '55%',
              stack: [
                {
                  image: LOGO_BASE64_DATA,
                  width: 160,
                  margin: [0, 0, 0, 4]
                },
                ...buildHeaderAddress(headerShipAddress)
              ]
            },
            {
              width: '45%',
              stack: [
                {
                  text: 'PURCHASE\nORDER',
                  style: 'headerTitle',
                  lineHeight: 1.1,
                  alignment: 'right'
                },
                {
                  stack: [
                    {
                      text: `PO Number: ${formData.poNumber || '-'}`,
                      style: 'headerSubText'
                    },
                    {
                      text: `Reference: ${formData.referenceNumber || '-'}`,
                      style: 'headerSubText'
                    },
                    {
                      text: 'The above PO number & reference must appear on all related correspondence shipping papers and invoices',
                      fontSize: 9,
                      lineHeight: 1.2,
                      margin: [0, 4, 0, 0]
                    }
                  ],
                  margin: [0, 10, 0, 0],
                  alignment: 'left'
                }
              ],
              alignment: 'right'
            }
          ],
          columnGap: 15,
          margin: [0, 0, 0, 12]
        },
        {
          columns: [
            {
              stack: buildAddressLines('To:', {
                clientName: formData.billToClientName,
                companyName: formData.billToCompanyName,
                street: formData.billToStreet,
                apartment: formData.billToApartment,
                city: formData.billToCity,
                stateCode: formData.billToStateCode,
                zipCode: formData.billToZipCode,
                countryCode: formData.billToCountryCode,
                pan: formData.billToPAN,
                gstin: formData.billToGSTIN,
                phoneNumber: formData.billToPhoneNumber
              }, true),
              width: '50%'
            },
            {
              stack: buildAddressLines('Ship To:', {
                clientName: formData.shipToClientName,
                companyName: formData.shipToCompanyName,
                street: formData.shipToStreet,
                apartment: formData.shipToApartment,
                city: formData.shipToCity,
                stateCode: formData.shipToStateCode,
                zipCode: formData.shipToZipCode,
                countryCode: formData.shipToCountryCode,
                phoneNumber: formData.shipToPhoneNumber
              }),
              width: '50%'
            }
          ],
          columnGap: 16,
          margin: [0, 12, 0, 12]
        },
        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                { text: `P.O Date: ${formData.poDate || '-'}`, style: 'infoText' },
                { text: `Requisitioner: ${formData.requisitionerName || '-'}`, style: 'infoText' }
              ],
              [
                { text: `Shipped Via: ${formData.shippedVia || '-'}`, style: 'infoText' },
                { text: `F.O.B Destination: ${formData.fobDestination || '-'}`, style: 'infoText' }
              ],
              [
                { text: `Terms: ${formData.terms || '-'}`, style: 'infoText' },
                { text: `Project: ${formData.projectName || '-'}`, style: 'infoText' }
              ]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 12]
        },
        {
          table: {
            widths: ['10%', '35%', '10%', '15%', '15%', '15%'],
            body: buildItemsTable(items, formatCurrency)
          },
          layout: {
            hLineWidth: () => 0.3,
            vLineWidth: () => 0.3,
            paddingTop: () => 1.5,
            paddingBottom: () => 1.5
          }
        },
        {
          columns: [
            {
              width: '55%',
              stack: [
                { text: 'Terms and Conditions', style: 'sectionLabel', margin: [0, 10, 0, 5] },
                { text: formData.termsAndConditions || '-', fontSize: 8.5 }
              ]
            },
            {
              width: '45%',
              table: {
                widths: ['70%', '30%'],
                body: [
                  ...buildTotalsTable(subtotal, tax, formatCurrency),
                  [
                    { text: 'Total', style: 'sectionLabel', alignment: 'left' },
                    { text: formatCurrency(grandTotal), style: 'sectionLabel', alignment: 'right' }
                  ]
                ]
              },
              layout: {
                hLineWidth: () => 0.3,
                vLineWidth: () => 0.3,
                paddingTop: () => 1.5,
                paddingBottom: () => 1.5
              },
              margin: [0, 8, 0, 0]
            }
          ],
          columnGap: 12,
          margin: [0, 8, 0, 0]
        },
        buildAuthorizationBlock(formData),
        buildFooter()
      ]
    };

    const fileName = `purchase_order_${formData.poNumber || 'document'}_${new Date()
      .toISOString()
      .split('T')[0]}.pdf`;

    const pdfDoc = pdfMake.createPdf(docDefinition);

    pdfDoc.download(fileName);

    pdfDoc.getBlob(async (blob) => {
      try {
        const { uploadPdfToS3, createPurchaseOrder } = await import('./api.js');
        const uploadResult = await uploadPdfToS3(blob, fileName, 'PurchaseOrder');

        const payload = {
          poNumber: formData.poNumber || '',
          poDate: formData.poDate || new Date().toISOString(),
          totalAmount: Number(grandTotal || 0),
          referenceNumber: formData.referenceNumber || '',
          projectName: formData.projectName || '',
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
            phoneNumber: formData.billToPhoneNumber || ''
          },
          shipToAddress: {
            clientName: formData.shipToClientName || '',
            companyName: formData.shipToCompanyName || '',
            street: formData.shipToStreet || '',
            apartment: formData.shipToApartment || '',
            city: formData.shipToCity || '',
            zipCode: formData.shipToZipCode || '',
            country: formData.shipToCountryCode || '',
            state: formData.shipToStateCode || '',
            phoneNumber: formData.shipToPhoneNumber || ''
          },
          s3Url: uploadResult.url || '',
          fullPurchaseOrderData: { formData, items, tax }
        };

        try {
          await createPurchaseOrder(payload);
        } catch (dbError) {
          console.warn('⚠️ Could not save purchase order to DB:', dbError.message || dbError);
        }
      } catch (uploadError) {
        console.error('❌ Error uploading PO PDF to S3:', uploadError);
      } finally {
        if (setIsGeneratingPDF) setIsGeneratingPDF(false);
      }
    });
  } catch (error) {
    console.error('Error generating Purchase Order PDF:', error);
    if (setIsGeneratingPDF) setIsGeneratingPDF(false);
  }
};

