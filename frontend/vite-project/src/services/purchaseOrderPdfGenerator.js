import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { Country } from 'country-state-city';
import { LOGO_BASE64_DATA } from './logoBase64';

// Initialize pdfMake with fonts
pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.vfs;

// Helper functions
const formatCurrency = (amount) => {
  return `₹${Number(amount || 0).toFixed(2)}`;
};

const buildHeaderAddress = (address) => {
  if (!address) return [];
  const lines = [];
  if (address.companyName) lines.push({ text: address.companyName, fontSize: 9, bold: true });
  if (address.street) lines.push({ text: address.street, fontSize: 9 });
  if (address.apartment) lines.push({ text: address.apartment, fontSize: 9 });
  const cityStateZip = [address.city, address.stateCode, address.zipCode].filter(Boolean).join(', ');
  if (cityStateZip) lines.push({ text: cityStateZip, fontSize: 9 });
  if (address.countryCode) {
    const country = Country.getCountryByCode(address.countryCode);
    if (country) lines.push({ text: country.name, fontSize: 9 });
  }
  return lines;
};

const buildAddressLines = (label, address, showPanGst = false) => {
  if (!address) return [];
  const lines = [{ text: label, fontSize: 9, bold: true, margin: [0, 0, 0, 4] }];
  if (address.clientName) lines.push({ text: address.clientName, fontSize: 9 });
  if (address.companyName) lines.push({ text: address.companyName, fontSize: 9, bold: true });
  if (address.street) lines.push({ text: address.street, fontSize: 9 });
  if (address.apartment) lines.push({ text: address.apartment, fontSize: 9 });
  const cityStateZip = [address.city, address.stateCode, address.zipCode].filter(Boolean).join(', ');
  if (cityStateZip) lines.push({ text: cityStateZip, fontSize: 9 });
  if (address.countryCode) {
    const country = Country.getCountryByCode(address.countryCode);
    if (country) lines.push({ text: country.name, fontSize: 9 });
  }
  if (showPanGst) {
    if (address.pan) lines.push({ text: `PAN: ${address.pan}`, fontSize: 9 });
    if (address.gstin) lines.push({ text: `GSTIN: ${address.gstin}`, fontSize: 9 });
  }
  if (address.phoneNumber) lines.push({ text: `Phone: ${address.phoneNumber}`, fontSize: 9 });
  return lines;
};

const buildItemsTable = (items, formatCurrency) => {
  const headerRow = [
    { text: 'S.No', style: 'tableHeader', alignment: 'center' },
    { text: 'Item Description', style: 'tableHeader' },
    { text: 'Qty', style: 'tableHeader', alignment: 'center' },
    { text: 'Unit Price', style: 'tableHeader', alignment: 'right' },
    { text: 'Amount', style: 'tableHeader', alignment: 'right' },
    { text: 'Total', style: 'tableHeader', alignment: 'right' }
  ];
  const bodyRows = [headerRow];
  items.forEach((item, index) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const amount = qty * price;
    bodyRows.push([
      { text: (index + 1).toString(), alignment: 'center', fontSize: 9 },
      { text: item.itemName || item.description || '-', fontSize: 9 },
      { text: qty.toString(), alignment: 'center', fontSize: 9 },
      { text: formatCurrency(price), alignment: 'right', fontSize: 9 },
      { text: formatCurrency(amount), alignment: 'right', fontSize: 9 },
      { text: formatCurrency(amount), alignment: 'right', fontSize: 9 }
    ]);
  });
  return bodyRows;
};

const buildTotalsTable = (subtotal, tax, formatCurrency) => {
  const rows = [
    [
      { text: 'Subtotal', fontSize: 9, alignment: 'left' },
      { text: formatCurrency(subtotal), fontSize: 9, alignment: 'right' }
    ]
  ];
  if (tax && tax.taxEnabled) {
    if (tax.cgstRate) {
      rows.push([
        { text: `CGST (${tax.cgstRate}%)`, fontSize: 9, alignment: 'left' },
        { text: formatCurrency((subtotal * parseFloat(tax.cgstRate)) / 100), fontSize: 9, alignment: 'right' }
      ]);
    }
    if (tax.sgstRate) {
      rows.push([
        { text: `SGST (${tax.sgstRate}%)`, fontSize: 9, alignment: 'left' },
        { text: formatCurrency((subtotal * parseFloat(tax.sgstRate)) / 100), fontSize: 9, alignment: 'right' }
      ]);
    }
    if (tax.igstRate) {
      rows.push([
        { text: `IGST (${tax.igstRate}%)`, fontSize: 9, alignment: 'left' },
        { text: formatCurrency((subtotal * parseFloat(tax.igstRate)) / 100), fontSize: 9, alignment: 'right' }
      ]);
    }
  }
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
      styles: {
        headerTitle: { fontSize: 24, bold: true, alignment: 'right' },
        headerSubText: { fontSize: 10, alignment: 'left' },
        infoText: { fontSize: 9, alignment: 'left' },
        sectionLabel: { fontSize: 10, bold: true },
        authorizationTitle: { fontSize: 10, bold: true },
        tableHeader: { bold: true, fontSize: 9, alignment: 'center' }
      },
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
        const { uploadPdfToS3, createPurchaseOrder, updatePurchaseOrder, getAllPurchaseOrders } = await import('./api.js');
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
          // Check if this is an edit (has _id in formData)
          const isEdit = formData._id;
          
          if (isEdit) {
            // Update existing purchase order
            console.log('🔄 Updating existing purchase order with ID:', formData._id);
            await updatePurchaseOrder(formData._id, payload);
            console.log('✅ Purchase order updated in database');
          } else {
            // Check if PO already exists by PO number (to avoid duplicates)
            const allPOs = await getAllPurchaseOrders();
            const existingPO = allPOs.find(po => po.poNumber === formData.poNumber);
            
            if (existingPO) {
              // Update existing PO by number
              console.log('🔄 Updating existing purchase order by PO number:', formData.poNumber);
              await updatePurchaseOrder(existingPO._id, payload);
              console.log('✅ Purchase order updated in database');
            } else {
              // Create new purchase order
              console.log('🆕 Creating new purchase order');
              await createPurchaseOrder(payload);
              console.log('✅ Purchase order saved to database');
            }
          }
        } catch (dbError) {
          console.warn('⚠️ Could not save/update purchase order to DB:', dbError.message || dbError);
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
