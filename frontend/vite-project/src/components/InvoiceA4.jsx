import React, { useContext } from 'react';
import logo from '../assets/logo.jpg';
import { InvoiceContext } from '../context/InvoiceContext';

const InvoiceA4 = React.forwardRef((props, ref) => {
  // Use props if provided, otherwise fallback to context
  const { customerDetails } = useContext(InvoiceContext);
  const customer = props.customer || customerDetails;
  const items = props.items || [];
  const issueDate = props.issueDate || new Date().toLocaleDateString();
  const invoiceNumber = props.invoiceNumber || 'INV-' + new Date().getTime();
  // Helper functions for tax and totals
  const getIGST = (item) => Number(item.cgst) + Number(item.sgst);
  const getTotalTaxAmount = (item) => {
    const base = Number(item.quantity) * Number(item.price);
    const igst = getIGST(item);
    return ((base * igst) / 100).toFixed(2);
  };
  const getTotalAmount = (item) => {
    const base = Number(item.quantity) * Number(item.price);
    const tax = Number(getTotalTaxAmount(item));
    return (base + tax).toFixed(2);
  };
  const grandTotalTax = items?.reduce((sum, item) => sum + Number(getTotalTaxAmount(item)), 0) || 0;
  const grandTotalAmount = items?.reduce((sum, item) => sum + Number(getTotalAmount(item)), 0) || 0;
  // Add a prop to control PDF mode
  const { isPdfMode = false } = props;

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        maxWidth: '820px',
        minHeight: '1000px',
        background: '#fff',
        fontFamily: 'Arial, sans-serif',
        border: '2px solid #222',
        boxSizing: 'border-box',
        margin: '32px auto',
        padding: 0,
        position: 'relative',
        boxShadow: '0 2px 12px #0001',
      }}
    >
      {/* Header Row: Logo and Invoice Info */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', padding: '32px 32px 0 32px', gap: 16 }}>
        {/* Logo and Company Details */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 280, maxWidth: 320, flex: '0 0 320px' }}>
          <img
            src={logo}
            alt="Company Logo"
            style={{ width: 180, height: 90, objectFit: 'contain', padding: 8, background: '#fff', borderRadius: 8, marginBottom: 12 }}
          />
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>VISTA ENGG SOLUTIONS PRIVATE LIMITED</div>
          <div style={{ fontSize: 14, marginBottom: 2 }}>677, 1st Floor, Spacelance,</div>
          <div style={{ fontSize: 14, marginBottom: 2 }}>27th Main Road, 13th Cross HSR Layout, Sector 1,</div>
          <div style={{ fontSize: 14, marginBottom: 2 }}>Bangalore, Karnataka</div>
          <div style={{ fontSize: 14, marginBottom: 2 }}>GSTIN/UIN: 29AADCV6398Q1Z4</div>
          <div style={{ fontSize: 14, marginBottom: 2 }}>State Name: Karnataka, Code: 29</div>
          <div style={{ fontSize: 14, marginBottom: 2 }}>CIN: U72200TZ2011PTC017012</div>
          <div style={{ fontSize: 14, marginBottom: 2 }}>E-Mail: info@vistaes.com</div>
        </div>
        {/* Spacer for center alignment */}
        <div style={{ flex: 1 }}></div>
        {/* Invoice Info */}
        <div style={{ textAlign: 'right', minWidth: 240, maxWidth: 260, flex: '0 0 260px', wordBreak: 'break-word', marginTop: 16, paddingLeft: 12, alignSelf: 'flex-start' }}>
          <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 18, whiteSpace: 'nowrap' }}>INVOICE</div>
          <div style={{ fontSize: 15, marginBottom: 8, whiteSpace: 'nowrap' }}>Issue Date: <b>{issueDate}</b></div>
          <div style={{ fontSize: 15, whiteSpace: 'nowrap' }}>Invoice number: <b>{invoiceNumber}</b></div>
        </div>
      </div>

      {/* Buyer (Bill To) Section */}
      <div style={{ marginTop: 36, padding: '0 32px' }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Buyer (Bill To)</div>
        <div style={{ fontSize: 15, whiteSpace: 'pre-line' }}>
          {customer?.name || 'Company Name'},
          <br />
          {customer?.address || 'Company Address'}
        </div>
      </div>

      {/* Items Table - now matches Purchase Items details page */}
      <div style={{ marginTop: 36, padding: '0 32px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15, background: '#fff' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={{ border: '1px solid #bbb', padding: 8 }}>SNo</th>
              <th style={{ border: '1px solid #bbb', padding: 8 }}>Item Name</th>
              <th style={{ border: '1px solid #bbb', padding: 8 }}>Quantity</th>
              <th style={{ border: '1px solid #bbb', padding: 8 }}>Price/Qty</th>
              <th style={{ border: '1px solid #bbb', padding: 8 }}>Total tax (IGST) %</th>
              <th style={{ border: '1px solid #bbb', padding: 8 }}>Total Tax Amount</th>
              <th style={{ border: '1px solid #bbb', padding: 8 }}>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {items && items.length > 0 ? (
              items.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ border: '1px solid #bbb', padding: 8, textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #bbb', padding: 8 }}>{item.name || item.description}</td>
                  <td style={{ border: '1px solid #bbb', padding: 8, textAlign: 'center' }}>{item.quantity || item.qty}</td>
                  <td style={{ border: '1px solid #bbb', padding: 8, textAlign: 'right' }}>{Number(item.price).toFixed(2)}</td>
                  <td style={{ border: '1px solid #bbb', padding: 8, textAlign: 'center', fontWeight: 600 }}>{getIGST(item)}</td>
                  <td style={{ border: '1px solid #bbb', padding: 8, textAlign: 'right', fontWeight: 600 }}>{getTotalTaxAmount(item)}</td>
                  <td style={{ border: '1px solid #bbb', padding: 8, textAlign: 'right', fontWeight: 600 }}>{getTotalAmount(item)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ border: '1px solid #bbb', padding: 8, textAlign: 'center', color: '#aaa' }}>No items added</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            {/* CGST/SGST summary row (common for all items) */}
            {items.length > 0 && (
              <tr style={{ background: '#f9f9f9', fontWeight: 600 }}>
                <td colSpan={4} style={{ border: '1px solid #bbb', padding: 8, textAlign: 'right' }}>CGST %</td>
                <td style={{ border: '1px solid #bbb', padding: 8, textAlign: 'right' }}>{items[0].cgst}</td>
                <td style={{ border: '1px solid #bbb', padding: 8, textAlign: 'right' }}>SGST %</td>
                <td style={{ border: '1px solid #bbb', padding: 8, textAlign: 'right' }}>{items[0].sgst}</td>
              </tr>
            )}
            {/* Grand Total row */}
            <tr style={{ background: '#f0f0f0', fontWeight: 700 }}>
              <td colSpan={4} style={{ border: '1px solid #bbb', padding: 8, textAlign: 'right' }}>Grand Total</td>
              <td style={{ border: '1px solid #bbb', padding: 8, textAlign: 'right' }}>{grandTotalTax.toFixed(2)}</td>
              <td style={{ border: '1px solid #bbb', padding: 8, textAlign: 'right' }}>{grandTotalAmount.toFixed(2)}</td>
              <td style={{ border: '1px solid #bbb', padding: 8 }}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Bank Details Section */}
      {props.bankDetails && (
        <div style={{ marginTop: 36, padding: '0 32px', fontSize: 15, color: '#222' }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Bank Details</div>
          <div>Bank Name: <b>{props.bankDetails.bankName}</b></div>
          <div>A/C No.: <b>{props.bankDetails.accountNo}</b></div>
          <div>Branch & IFS Code: <b>{props.bankDetails.branchIfsc}</b></div>
          <div>Company's PAN: <b>{props.bankDetails.pan}</b></div>
        </div>
      )}

      {/* Download as PDF Button (only show if not in PDF mode) */}
      {!isPdfMode && (
        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <button
            onClick={props.onDownloadPDF}
            style={{
              background: '#7c3aed', color: '#fff', fontWeight: 600, fontSize: 16, padding: '12px 32px', borderRadius: 8, border: 'none', boxShadow: '0 2px 8px #0002', cursor: 'pointer', margin: '0 auto', display: 'inline-block', marginTop: 16
            }}
          >
            Download as PDF
          </button>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 40, width: '100%', textAlign: 'center', fontSize: 13, color: '#888', paddingBottom: 24 }}>
        Thank you for your business!
      </div>
    </div>
  );
});

export default InvoiceA4;
