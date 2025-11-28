# Vista Purchase App - Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Objective](#objective)
3. [Scope](#scope)
4. [Tools & Technologies](#tools--technologies)
5. [User Roles and Functionalities](#user-roles-and-functionalities)
6. [System Architecture](#system-architecture)
7. [Key Modules](#key-modules)
8. [Expected Outcomes](#expected-outcomes)
9. [Conclusion](#conclusion)

---

## Project Overview

### What the Project is About

The **Vista Purchase App** is a comprehensive web-based document management and generation system designed specifically for VISTA Engineering Solutions Private Limited. The application streamlines the creation, management, and archival of critical business documents including Quotations, Proforma Invoices, Invoices, and Purchase Orders.

The system serves as a centralized platform that automates document generation processes, ensures consistent formatting, maintains a searchable history of all documents, and provides seamless integration with cloud storage for document archival. It eliminates manual document creation processes, reduces human errors, and significantly improves operational efficiency.

### Problem It Solves

**Before the Implementation:**
- **Manual Document Creation**: Staff had to manually create quotations, invoices, and purchase orders using word processors or spreadsheets, leading to inconsistent formatting and time-consuming processes.
- **Document Management Challenges**: No centralized system to store and retrieve historical documents, making it difficult to track past transactions and reference previous quotes or invoices.
- **Data Inconsistency**: Manual entry led to errors in calculations, formatting, and data entry, affecting professional appearance and accuracy.
- **Time-Consuming Processes**: Creating each document from scratch required significant time, especially for complex documents with multiple line items and detailed terms.
- **Limited Accessibility**: Documents were stored locally or in scattered locations, making it difficult to access them remotely or share with team members.
- **No Automated Numbering**: Sequential numbering for invoices, quotations, and purchase orders was managed manually, leading to potential duplicates or gaps.
- **Lack of Search Capability**: Finding specific documents by reference number, project name, or date required manual searching through files.

**After Implementation:**
- **Automated Document Generation**: All documents are generated automatically with consistent formatting and professional appearance.
- **Centralized Database**: All documents are stored in MongoDB with full search and retrieval capabilities.
- **Cloud Storage Integration**: PDFs are automatically uploaded to AWS S3 for secure, long-term archival and easy access.
- **Sequential Numbering**: Automatic generation of unique sequential numbers (e.g., INV0001, PI0001, VIS_PO_0001) prevents duplicates.
- **Quick Reference Lookup**: Users can search documents by reference number, invoice number, or other identifiers.
- **Real-time Calculations**: Automatic calculation of taxes (CGST, SGST, IGST), subtotals, and grand totals eliminates calculation errors.
- **Multi-location Support**: Pre-configured office locations (USA, Germany, India) with automatic address and bank detail population.

---

## Objective

The primary objectives of this project are:

### 1. **Digital Transformation**
   - Convert manual document creation processes into a fully automated digital workflow
   - Eliminate paper-based documentation and manual file management
   - Create a paperless environment for document generation and storage

### 2. **Operational Efficiency**
   - Reduce document creation time from hours to minutes
   - Minimize human errors in calculations, data entry, and formatting
   - Standardize document formats across all business units and locations

### 3. **Data Integrity and Consistency**
   - Ensure all documents follow the same professional format and structure
   - Maintain accurate sequential numbering for all document types
   - Implement validation rules to prevent data entry errors

### 4. **Accessibility and Searchability**
   - Provide instant access to historical documents through a centralized database
   - Enable quick search by reference number, invoice number, or project name
   - Allow remote access to documents through cloud storage

### 5. **Compliance and Audit Trail**
   - Maintain complete records of all generated documents
   - Store PDF copies in secure cloud storage for compliance and audit purposes
   - Track document creation dates, modifications, and related metadata

### 6. **Scalability**
   - Design a system that can handle growing document volumes
   - Support multiple office locations with location-specific configurations
   - Accommodate future enhancements and additional document types

### 7. **User Experience**
   - Provide an intuitive, user-friendly interface requiring minimal training
   - Enable quick document creation with auto-population features
   - Offer preview capabilities before final document generation

---

## Scope

### What is Included in This Phase

#### 1. **Document Types**
   - **Quotations**: Complete quotation generation with customer details, items, pricing, and terms
   - **Proforma Invoices**: Pre-invoice documents with full invoice details and bank information
   - **Invoices**: Final invoice generation with tax calculations and payment terms
   - **Purchase Orders**: Purchase order creation with requisitioner details, shipping information, and terms

#### 2. **Core Functionalities**
   - **Document Creation Forms**: Comprehensive forms for each document type with validation
   - **Document Preview**: Real-time preview of documents before PDF generation
   - **PDF Generation**: Automatic PDF creation using html2canvas and jsPDF libraries
   - **Cloud Storage**: Automatic upload of PDFs to AWS S3 with organized folder structure
   - **Database Storage**: MongoDB storage for all document metadata and full document data
   - **History Management**: Complete history views for all document types
   - **Search Functionality**: Search documents by reference number across all types

#### 3. **Address Management**
   - **Multi-location Support**: Pre-configured office locations (USA Head Office, Regional Office, Germany Head Office, Germany Sales Office, India Registered Office, India ODC Office, India Sales Office)
   - **Dynamic Address Fields**: Country, state, and city dropdowns with auto-population
   - **Bank Details**: Automatic bank detail population based on location selection
   - **PAN and GSTIN**: Automatic population of tax identification numbers based on location

#### 4. **Numbering System**
   - **Sequential Numbering**: Automatic generation of unique sequential numbers
     - Invoices: INV0001, INV0002, etc.
     - Proforma Invoices: PI0001, PI0002, etc.
     - Purchase Orders: VIS_PO_0001, VIS_PO_0002, etc.
   - **Editable Numbers**: Users can edit numbers with validation to ensure uniqueness and ascending order
   - **Database-backed Counter**: MongoDB counter collection ensures no duplicates

#### 5. **Tax Calculations**
   - **CGST (Central GST)**: For intra-state transactions in India
   - **SGST (State GST)**: For intra-state transactions in India
   - **IGST (Integrated GST)**: For inter-state transactions in India
   - **Automatic Calculation**: Real-time tax calculation based on subtotal and tax rates

#### 6. **User Interface**
   - **Dashboard**: Central navigation hub with access to all document types and history
   - **Responsive Design**: Works on desktop and tablet devices
   - **Modern UI**: Gradient buttons, smooth animations, and intuitive navigation

### What is NOT Included in This Phase

#### 1. **User Authentication and Authorization**
   - No user login/logout functionality
   - No role-based access control (all users have same permissions)
   - No password management or user accounts

#### 2. **Payment Processing**
   - No integration with payment gateways
   - No payment tracking or status management
   - No invoice payment reminders

#### 3. **Email Integration**
   - No automatic email sending of documents
   - No email templates or notifications
   - No email history tracking

#### 4. **Advanced Reporting**
   - No financial reports or analytics dashboards
   - No revenue tracking or profit/loss statements
   - No custom report generation

#### 5. **Multi-currency Support**
   - Limited currency support (INR, USD, EUR, GBP)
   - No automatic currency conversion
   - No exchange rate management

#### 6. **Document Editing After Generation**
   - Limited editing capabilities (can edit before PDF generation)
   - No version control for documents
   - No document approval workflow

#### 7. **Customer Management**
   - No dedicated customer database
   - No customer profile management
   - No customer history tracking

#### 8. **Inventory Management**
   - No product catalog or inventory tracking
   - No stock management
   - No item master data

#### 9. **Mobile Application**
   - No native mobile app (web-based only)
   - Limited mobile optimization

#### 10. **Integration with Accounting Software**
   - No integration with QuickBooks, Tally, or other accounting systems
   - No data export to accounting formats

---

## Tools & Technologies

### Frontend Technologies

#### 1. **React 19.1.0**
   - **Purpose**: Core JavaScript library for building user interfaces
   - **Usage**: Component-based architecture for all UI elements
   - **Key Features Used**:
     - Functional components with hooks (useState, useEffect, useCallback, useMemo, useRef)
     - Context API for state management (InvoiceContext, QuotationContext)
     - React Router DOM for navigation

#### 2. **Vite 7.0.0**
   - **Purpose**: Build tool and development server
   - **Usage**: Fast development server with hot module replacement
   - **Benefits**: Quick build times and optimized production builds

#### 3. **React Router DOM 7.6.3**
   - **Purpose**: Client-side routing
   - **Usage**: Navigation between different pages/components
   - **Routes**: Dashboard, forms, previews, and history pages

#### 4. **Tailwind CSS 4.1.16**
   - **Purpose**: Utility-first CSS framework
   - **Usage**: Rapid UI development with pre-built utility classes
   - **Features**: Responsive design, gradients, animations

#### 5. **html2canvas 1.4.1**
   - **Purpose**: Convert HTML elements to canvas
   - **Usage**: Capture document preview as image before PDF generation
   - **Benefits**: Accurate visual representation of documents

#### 6. **jsPDF 3.0.3**
   - **Purpose**: PDF generation library
   - **Usage**: Convert canvas/images to PDF format
   - **Features**: Multi-page support, custom page sizes, image embedding

#### 7. **country-state-city 3.2.1**
   - **Purpose**: Geographic data library
   - **Usage**: Populate country, state, and city dropdowns
   - **Features**: ISO codes, state codes, comprehensive location data

#### 8. **Lucide React 0.546.0**
   - **Purpose**: Icon library
   - **Usage**: SVG icons for buttons and UI elements

### Backend Technologies

#### 1. **Node.js with Express 5.1.0**
   - **Purpose**: Server-side JavaScript runtime and web framework
   - **Usage**: RESTful API server for handling requests
   - **Features**: 
     - CORS support for cross-origin requests
     - JSON body parsing
     - Route management

#### 2. **MongoDB with Mongoose 8.19.3**
   - **Purpose**: NoSQL database and ODM (Object Document Mapper)
   - **Usage**: 
     - Store document metadata and full document data
     - Counter collection for sequential numbering
   - **Models**: Invoice, ProformaInvoice, Quotation, PurchaseOrder, Counter

#### 3. **AWS SDK 2.1692.0**
   - **Purpose**: Amazon Web Services SDK
   - **Usage**: Upload PDF files to Amazon S3 cloud storage
   - **Features**: 
     - Secure file uploads
     - Organized folder structure
     - URL generation for uploaded files

#### 4. **Multer 2.0.2**
   - **Purpose**: File upload middleware
   - **Usage**: Handle multipart/form-data for PDF uploads
   - **Features**: Memory storage for file buffers

#### 5. **dotenv 17.2.3**
   - **Purpose**: Environment variable management
   - **Usage**: Store sensitive configuration (database URLs, AWS credentials)
   - **Security**: Keeps credentials out of source code

#### 6. **CORS 2.8.5**
   - **Purpose**: Cross-Origin Resource Sharing
   - **Usage**: Enable frontend-backend communication
   - **Configuration**: Allows requests from frontend origin

### Development Tools

#### 1. **ESLint 9.29.0**
   - **Purpose**: Code linting and quality assurance
   - **Usage**: Enforce coding standards and catch errors

#### 2. **Nodemon 3.1.11**
   - **Purpose**: Development server auto-restart
   - **Usage**: Automatically restart Node.js server on code changes

#### 3. **Autoprefixer 10.4.21**
   - **Purpose**: CSS vendor prefix automation
   - **Usage**: Ensure cross-browser compatibility

### Cloud Services

#### 1. **Amazon S3 (AWS)**
   - **Purpose**: Object storage service
   - **Usage**: Store generated PDF documents
   - **Structure**: 
     - `Generator tool/Quotation/`
     - `Generator tool/Invoice/`
     - `Generator tool/ProformaInvoice/`
     - `Generator tool/PurchaseOrder/`
   - **Benefits**: Scalable, secure, cost-effective storage

#### 2. **MongoDB Atlas (or Local)**
   - **Purpose**: Cloud or local MongoDB database
   - **Usage**: Store all application data
   - **Collections**: invoices, proformainvoices, quotations, purchaseorders, counters

### Development Environment

- **Operating System**: Cross-platform (Windows, macOS, Linux)
- **Package Manager**: npm (Node Package Manager)
- **Version Control**: Git (assumed)
- **Code Editor**: Any (VS Code recommended)

---

## User Roles and Functionalities

### User Roles

Currently, the system operates with a **single user role** - all users have the same level of access and permissions. There is no authentication system implemented, meaning anyone with access to the application can perform all available functions.

### User Functionalities

#### 1. **Dashboard Navigation**
   - **Access**: Main landing page (`/`)
   - **Functionalities**:
     - View company logo and branding
     - Navigate to document creation forms (Quotation, Proforma Invoice, Invoice, Purchase Order)
     - Access history sections for all document types
     - Search documents by reference number
   - **UI Elements**:
     - Four main action buttons (Quotation, Proforma Invoice, Invoice, Purchase Order)
     - "View History" toggle button
     - History buttons that appear when history section is expanded

#### 2. **Quotation Management**

   **a. Create Quotation**
   - **Access**: Click "Quotation" button on dashboard → `/quotation-form`
   - **Functionalities**:
     - Enter quotation details (quotation number, date, validity)
     - Fill "Quotation For" section (customer details, address)
     - Fill "Quotation From" section (company details, address)
     - Enter bank details (bank name, account number, IFSC, MICR)
     - Add line items (item name, description, quantity, rate, amount)
     - Add terms and conditions
     - Preview quotation before generation
   - **Auto-features**:
     - Automatic sequential quotation number generation
     - Auto-population of company details based on location selection
     - Real-time calculation of item totals and grand total

   **b. View Quotation History**
   - **Access**: Dashboard → "View History" → "History of Quotation"
   - **Functionalities**:
     - View list of all generated quotations
     - See quotation number, date, customer name, total amount
     - Download/view PDFs from S3
     - Filter and search quotations

#### 3. **Proforma Invoice Management**

   **a. Create Proforma Invoice**
   - **Access**: Click "Proforma Invoice" button on dashboard → `/proforma-invoice`
   - **Functionalities**:
     - Enter invoice details (invoice number, date, reference number)
     - Fill "Invoice From" section with location selection
     - Fill "Bill To" section (customer billing address)
     - Fill "Ship To" section (shipping address)
     - Auto-populate bank details for India locations
     - Add line items with HSN codes
     - Configure tax rates (CGST, SGST, IGST)
     - Enter terms and conditions
     - Preview invoice before PDF generation
   - **Auto-features**:
     - Automatic sequential invoice number (PI0001, PI0002, etc.)
     - Auto-population of bank details for India addresses
     - Auto-fetch project name from reference number lookup
     - Real-time tax calculations
     - Currency auto-selection based on ship-to country

   **b. View Proforma Invoice History**
   - **Access**: Dashboard → "View History" → "History of Proforma Invoice"
   - **Functionalities**:
     - View all proforma invoices
     - Search by invoice number or reference number
     - Download PDFs
     - View full invoice details

#### 4. **Invoice Management**

   **a. Create Invoice**
   - **Access**: Click "Invoice" button on dashboard → `/invoice`
   - **Functionalities**:
     - Single-page invoice form
     - Enter invoice details (invoice number, date)
     - Fill customer and company details
     - Add line items
     - Configure taxes
     - Preview and generate PDF
   - **Auto-features**:
     - Automatic invoice number generation (INV0001, INV0002, etc.)
     - Auto-populate from proforma invoice using reference number
     - Real-time calculations

   **b. View Invoice History**
   - **Access**: Dashboard → "View History" → "History of Invoice"
   - **Functionalities**:
     - View all invoices
     - Search and filter invoices
     - Download PDFs

#### 5. **Purchase Order Management**

   **a. Create Purchase Order**
   - **Access**: Click "Purchase Order" button on dashboard → `/purchase-order`
   - **Functionalities**:
     - Enter PO details (PO number, date, reference number)
     - Fill "Bill To" section (vendor billing address)
     - Fill "Ship To" section (shipping address with location selection)
     - Enter requisitioner details (name, F.O.B destination, shipped via, terms)
     - Add additional details (date/time, currency, project name)
     - Add line items (item name, description, quantity, unit price, HSN)
     - Configure tax rates
     - Enter terms and conditions (pre-filled with default text)
     - Preview purchase order
   - **Auto-features**:
     - Automatic PO number generation (VIS_PO_0001, VIS_PO_0002, etc.)
     - Editable PO number with validation (must be unique and in ascending order)
     - Currency auto-selection based on ship-to country
     - Pre-filled terms and conditions (editable)

   **b. View Purchase Order History**
   - **Access**: Dashboard → "View History" → "History of Purchase Order"
   - **Functionalities**:
     - View all purchase orders
     - Search by PO number or reference number
     - Download PDFs

#### 6. **Reference Number Search**
   - **Access**: Dashboard → "View History" → "Search by Reference Number"
   - **Functionalities**:
     - Search across all document types (Quotations, Invoices, Proforma Invoices, Purchase Orders)
     - Enter reference number to find matching documents
     - View document details and download PDFs
     - Cross-reference documents by project or customer

#### 7. **Document Preview and PDF Generation**
   - **Access**: Available on all document creation forms
   - **Functionalities**:
     - Real-time preview of document before generation
     - Professional formatting matching company standards
     - Company logo inclusion
     - Download PDF to local computer
     - Automatic upload to AWS S3
     - Database record creation with S3 URL

#### 8. **Location Management**
   - **Functionalities**:
     - Select from pre-configured office locations
     - Auto-populate address fields (company name, street, city, state, zip, country)
     - Auto-populate bank details for India locations
     - Auto-populate PAN and GSTIN based on location
     - Support for multiple countries (USA, Germany, India)

#### 9. **Data Validation**
   - **Functionalities**:
     - Real-time form validation
     - Required field checking
     - Format validation (PAN, GSTIN, zip codes)
     - Number uniqueness validation
     - Ascending order validation for editable numbers
     - Error messages displayed to users

---

## System Architecture

### High-Level Architecture

The Vista Purchase App follows a **three-tier architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION TIER                         │
│                  (React Frontend)                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │Dashboard │  │  Forms   │  │ Previews │  │  History │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │             │             │             │         │
│       └─────────────┴─────────────┴─────────────┘         │
│                          │                                  │
│                    React Router                            │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
                    HTTP/REST API
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                    APPLICATION TIER                          │
│              (Node.js + Express Backend)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Routes     │  │ Controllers  │  │   Services    │    │
│  │              │  │              │  │              │    │
│  │ - Quotation  │  │ - Create     │  │ - PDF Gen    │    │
│  │ - Invoice    │  │ - Read       │  │ - S3 Upload  │    │
│  │ - Proforma   │  │ - Update     │  │ - Validation │    │
│  │ - PO         │  │ - Delete     │  │              │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                  │             │
└─────────┼─────────────────┼──────────────────┼─────────────┘
          │                 │                  │
          │                 │                  │
┌─────────┼─────────────────┼──────────────────┼─────────────┐
│         │                 │                  │               │
│    ┌────▼─────┐      ┌────▼─────┐      ┌────▼─────┐       │
│    │ MongoDB  │      │   AWS    │      │  Counter │       │
│    │ Database │      │    S3    │      │  Model   │       │
│    │          │      │          │      │          │       │
│    │ Documents│      │   PDFs   │      │ Sequences│       │
│    │ Metadata │      │          │      │          │       │
│    └──────────┘      └──────────┘      └──────────┘       │
│                                                             │
│                    DATA TIER                                │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

#### 1. **Document Creation Flow**

```
User → Dashboard → Select Document Type
  ↓
Form Component (React)
  ↓
User Fills Form Data
  ↓
Form Validation (Client-side)
  ↓
Submit → Navigate to Preview
  ↓
Preview Component
  ↓
User Clicks "Generate PDF"
  ↓
PDF Generation (html2canvas + jsPDF)
  ↓
PDF Download (Local)
  ↓
PDF Upload to S3 (AWS SDK)
  ↓
Database Record Creation (MongoDB)
  ↓
S3 URL Stored in Database
```

#### 2. **Data Flow for Sequential Numbering**

```
User Opens Form
  ↓
Frontend Calls API: GET /api/purchase-orders/next-po-number
  ↓
Backend Controller: getNextPoNumber()
  ↓
Counter Model: Find or Create Counter with _id: "PO"
  ↓
Increment sequence_value
  ↓
Format: VIS_PO_${sequence_value.padStart(4, '0')}
  ↓
Return to Frontend
  ↓
Display in Form
```

#### 3. **History and Search Flow**

```
User Clicks "View History"
  ↓
Frontend Calls API: GET /api/[document-type]
  ↓
Backend Controller: get[DocumentType]s()
  ↓
MongoDB Query: Find all documents
  ↓
Return Array of Documents
  ↓
Frontend Displays List
  ↓
User Clicks Document
  ↓
Fetch Full Document Data
  ↓
Display Details or Download PDF from S3
```

#### 4. **Reference Number Search Flow**

```
User Enters Reference Number
  ↓
Frontend Searches All Document Types
  ↓
Parallel API Calls:
  - GET /api/quotations
  - GET /api/invoices
  - GET /api/proforma-invoices
  - GET /api/purchase-orders
  ↓
Filter Results by Reference Number (Client-side)
  ↓
Display Matching Documents
```

### Database Schema

#### 1. **Invoice Collection**
```javascript
{
  invoiceNumber: String (required, unique),
  invoiceDate: Date (required),
  referenceNo: String,
  projectName: String,
  fromAddress: {
    companyName: String,
    address: String,
    gst: String
  },
  toAddress: {
    name: String,
    address: String
  },
  totalAmount: Number (required),
  s3Url: String,
  fullInvoiceData: Object (Mixed type),
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. **Proforma Invoice Collection**
```javascript
{
  invoiceNumber: String (required),
  invoiceDate: Date (required),
  referenceNo: String,
  projectName: String,
  fromAddress: Object,
  billToAddress: Object,
  shipToAddress: Object,
  totalAmount: Number (required),
  s3Url: String,
  fullInvoiceData: Object (Mixed type),
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. **Quotation Collection**
```javascript
{
  quotationNo: String (required),
  quotationDate: Date (required),
  referenceNo: String,
  projectName: String,
  quotationFor: Object,
  quotationFrom: Object,
  bankDetails: Object,
  items: Array,
  totalAmount: Number (required),
  s3Url: String,
  fullQuotationData: Object (Mixed type),
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. **Purchase Order Collection**
```javascript
{
  poNumber: String (required, unique),
  poDate: Date (required),
  referenceNumber: String,
  projectName: String,
  billToAddress: Object,
  shipToAddress: Object,
  totalAmount: Number (required),
  s3Url: String,
  fullPurchaseOrderData: Object (Mixed type),
  createdAt: Date,
  updatedAt: Date
}
```

#### 5. **Counter Collection**
```javascript
{
  _id: String (required, e.g., "PO", "INV", "PI"),
  sequence_value: Number (default: 0),
  // No timestamps needed
}
```

### API Endpoints

#### Quotation Endpoints
- `GET /api/quotations` - Get all quotations
- `GET /api/quotations/:id` - Get single quotation
- `POST /api/quotations` - Create quotation
- `PUT /api/quotations/:id` - Update quotation
- `DELETE /api/quotations/:id` - Delete quotation

#### Invoice Endpoints
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get single invoice
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice

#### Proforma Invoice Endpoints
- `GET /api/proforma-invoices` - Get all proforma invoices
- `GET /api/proforma-invoices/:id` - Get single proforma invoice
- `GET /api/proforma-invoices/by-reference/:referenceNo` - Get by reference number
- `POST /api/proforma-invoices` - Create proforma invoice
- `PUT /api/proforma-invoices/:id` - Update proforma invoice
- `DELETE /api/proforma-invoices/:id` - Delete proforma invoice

#### Purchase Order Endpoints
- `GET /api/purchase-orders` - Get all purchase orders
- `GET /api/purchase-orders/:id` - Get single purchase order
- `GET /api/purchase-orders/next-po-number` - Get next PO number
- `POST /api/purchase-orders` - Create purchase order
- `PUT /api/purchase-orders/:id` - Update purchase order

#### Upload Endpoints
- `POST /api/upload/upload-pdf` - Upload PDF to S3
  - Body: FormData with `file` and `folder` parameters
  - Returns: S3 URL and key

### Security Considerations

1. **CORS Configuration**: Backend configured to accept requests from frontend origin
2. **Environment Variables**: Sensitive data (DB URLs, AWS credentials) stored in `.env` files
3. **Input Validation**: Client-side and server-side validation for all inputs
4. **Error Handling**: Comprehensive error handling with user-friendly messages
5. **No Authentication**: Currently no user authentication (to be added in future phases)

---

## Key Modules

### 1. Dashboard Module

**Location**: `frontend/vite-project/src/components/dashboard/Dashboard.jsx`

**Purpose**: Central navigation hub and entry point for the application

**Key Features**:
- Company branding display (logo, company name)
- Four main action buttons for document creation
- Collapsible history section
- Search by reference number functionality
- Responsive design with gradient styling

**Components**:
- Header with logo and company information
- Navigation buttons container
- History toggle button
- History buttons container (appears on toggle)

**State Management**:
- `showHistory`: Boolean to control history section visibility

**Navigation Routes**:
- `/invoice` - Invoice form
- `/quotation-form` - Quotation form
- `/proforma-invoice` - Proforma invoice form
- `/purchase-order` - Purchase order form
- `/history/[type]` - History pages

### 2. Quotation Module

**Location**: `frontend/vite-project/src/components/quotation/`

**Purpose**: Create and manage quotation documents

**Components**:
- `QuotationForm.jsx` - Main quotation creation form
- `QuotationA4.jsx` - Quotation preview and PDF generation
- `QuotationHome.jsx` - Quotation landing page
- `QuotationFor.jsx` - Customer details section
- `QuotationFrom.jsx` - Company details section
- `QuotationBank.jsx` - Bank details section
- `QuotationDetails.jsx` - Quotation metadata section
- `QuotationTable.jsx` - Line items table

**Key Features**:
- Multi-step form with separate sections
- Sequential quotation number generation
- Line item management (add, edit, delete)
- Real-time total calculations
- PDF generation with company branding
- S3 upload and database storage

**Data Flow**:
1. User fills form sections
2. Data stored in QuotationContext
3. Preview generated from context data
4. PDF generated using html2canvas and jsPDF
5. PDF uploaded to S3
6. Database record created

### 3. Proforma Invoice Module

**Location**: `frontend/vite-project/src/components/ProformaInvoice/`

**Purpose**: Create and manage proforma invoice documents

**Components**:
- `InvoiceForm.jsx` - Main proforma invoice form (comprehensive)
- `InvoicePreview.jsx` - Preview component with PDF generation

**Key Features**:
- Single comprehensive form with all sections
- Location-based auto-population (address, bank details, PAN, GSTIN)
- Reference number lookup to auto-fill project name
- Sequential invoice number (PI0001, PI0002, etc.)
- Tax configuration (CGST, SGST, IGST)
- Multi-item support with HSN codes
- Project name display in header
- Bank details section (auto-filled for India locations)
- Terms and conditions section

**Special Features**:
- **Location Selection**: Dropdown with pre-configured office locations
- **Auto-population**: Selecting location auto-fills all address fields
- **Bank Details**: Automatically populated for India addresses, cleared for others
- **Reference Lookup**: Enter reference number to fetch and populate project details

### 4. Invoice Module

**Location**: `frontend/vite-project/src/components/invoice/`

**Purpose**: Create and manage final invoice documents

**Components**:
- `InvoiceFormSinglePage.jsx` - Single-page invoice form
- `InvoiceA4.jsx` - Invoice preview component
- `Items.jsx` - Line items management component
- `CustomerForm.jsx` - Customer details form
- `BankDetailsForm.jsx` - Bank details form
- `Home.jsx` - Invoice home page

**Key Features**:
- Simplified single-page form
- Sequential invoice number (INV0001, INV0002, etc.)
- Reference number lookup from proforma invoices
- Auto-population of project name from proforma invoice
- Tax calculations
- PDF generation and S3 upload

**Integration**:
- Can reference proforma invoices by reference number
- Auto-fills data from proforma invoice if found

### 5. Purchase Order Module

**Location**: `frontend/vite-project/src/components/purchaseOrder/`

**Purpose**: Create and manage purchase order documents

**Components**:
- `PurchaseOrderForm.jsx` - Comprehensive purchase order form
- `PurchaseOrderPreview.jsx` - Preview and PDF generation

**Key Features**:
- **Bill To Section**: Vendor billing address with location selection
- **Ship To Section**: Shipping address with location selection
- **Requisitioner Details**: Name, F.O.B destination, shipped via, terms
- **Additional Details**: PO number (editable), reference number, PO date, date/time, currency, project name
- **Items Section**: Line items with HSN codes
- **Tax Configuration**: CGST, SGST, IGST rates
- **Terms and Conditions**: Pre-filled with default text (editable)
- **PO Number Management**:
  - Automatic generation (VIS_PO_0001, VIS_PO_0002, etc.)
  - Editable with validation
  - Must be unique
  - Must be in ascending order from generated number
  - Displayed in header (read-only) and Additional Details (editable)
- **Currency Auto-selection**: Based on ship-to country
- **Sequential Numbering**: Database-backed counter ensures uniqueness

**Validation**:
- PO number format validation (VIS_PO_####)
- Uniqueness check against database
- Ascending order validation
- Required field validation

### 6. History Module

**Location**: `frontend/vite-project/src/components/history/`

**Purpose**: View and manage historical documents

**Components**:
- `InvoiceHistory.jsx` - Invoice history list
- `QuotationHistory.jsx` - Quotation history list
- `ProformaInvoiceHistory.jsx` - Proforma invoice history list
- `PurchaseOrderHistory.jsx` - Purchase order history list
- `ReferenceHistory.jsx` - Cross-document reference search

**Key Features**:
- **List View**: Display all documents of a type
- **Search Functionality**: Filter by various criteria
- **PDF Access**: Download PDFs from S3
- **Document Details**: View full document information
- **Reference Search**: Search across all document types by reference number

**Data Display**:
- Document number
- Date
- Customer/Vendor name
- Total amount
- Reference number
- S3 URL (for PDF download)

### 7. Context Management Module

**Location**: `frontend/vite-project/src/context/`

**Purpose**: Global state management for forms

**Components**:
- `InvoiceContext.jsx` - Invoice form state management
- `QuotationContext.jsx` - Quotation form state management

**Features**:
- Centralized state for form data
- Shared state across multiple components
- Prevents prop drilling
- State persistence during navigation

### 8. API Service Module

**Location**: `frontend/vite-project/src/services/api.js`

**Purpose**: Centralized API communication layer

**Functions**:
- **Quotation APIs**:
  - `createQuotation()`
  - `getAllQuotations()`
  - `getQuotationById()`
  - `getQuotationByReferenceNo()`
  - `updateQuotation()`
  - `updateQuotationS3Url()`
  - `deleteQuotation()`

- **Invoice APIs**:
  - `createInvoice()`
  - `getAllInvoices()`
  - `getInvoiceById()`
  - `updateInvoice()`
  - `updateInvoiceS3Url()`
  - `deleteInvoice()`

- **Proforma Invoice APIs**:
  - `createProformaInvoice()`
  - `getAllProformaInvoices()`
  - `getProformaInvoiceById()`
  - `getProformaInvoiceByReferenceNo()`
  - `updateProformaInvoice()`
  - `updateProformaInvoiceS3Url()`
  - `deleteProformaInvoice()`

- **Purchase Order APIs**:
  - `createPurchaseOrder()`
  - `getAllPurchaseOrders()`
  - `getNextPoNumber()`

- **Upload APIs**:
  - `uploadPdfToS3()`

**Error Handling**:
- Comprehensive error catching
- User-friendly error messages
- Connection error detection
- Fallback mechanisms

### 9. PDF Generation Module

**Location**: `frontend/vite-project/src/services/pdfGenerator.js`

**Purpose**: Generate PDF documents from form data

**Technologies**:
- `html2canvas`: Convert HTML to canvas
- `jsPDF`: Convert canvas to PDF
- `pdfmake`: Alternative PDF generation (for some components)

**Process**:
1. Capture HTML element as canvas using html2canvas
2. Convert canvas to image data URL
3. Create jsPDF instance
4. Add image to PDF (handle multi-page if needed)
5. Generate PDF blob
6. Download PDF to user's computer
7. Upload PDF blob to S3
8. Update database with S3 URL

**Features**:
- Multi-page support for long documents
- High-quality image rendering (scale: 2)
- Custom page sizes (A4)
- Automatic page breaks
- Company logo embedding

### 10. Backend Controller Module

**Location**: `backend/controllers/`

**Purpose**: Business logic and database operations

**Components**:
- `quotation_controller.js` - Quotation CRUD operations
- `invoice_controller.js` - Invoice CRUD operations
- `proforma_invoice_controller.js` - Proforma invoice CRUD operations
- `purchase_order_controller.js` - Purchase order CRUD operations and sequential numbering

**Key Functions**:
- **Create**: Save new documents to database
- **Read**: Fetch documents (all, by ID, by reference number)
- **Update**: Modify existing documents
- **Delete**: Remove documents
- **Sequential Numbering**: Generate next sequential numbers using Counter model

**Error Handling**:
- Try-catch blocks for all operations
- Meaningful error messages
- HTTP status code management
- Database error handling

### 11. Database Model Module

**Location**: `backend/models/`

**Purpose**: Define database schemas and models

**Components**:
- `quotation_model.js` - Quotation schema
- `invoice_model.js` - Invoice schema
- `proforma_invoice_model.js` - Proforma invoice schema
- `purchase_order_model.js` - Purchase order schema
- `counter_model.js` - Counter schema for sequential numbering

**Features**:
- Mongoose schema definitions
- Data validation rules
- Timestamps (createdAt, updatedAt)
- Mixed type fields for flexible data storage
- Indexes for performance

### 12. S3 Upload Module

**Location**: `backend/routes/uploadS3.js` and `backend/s3config.js`

**Purpose**: Handle PDF uploads to Amazon S3

**Features**:
- AWS S3 configuration
- File upload handling (Multer)
- Organized folder structure:
  - `Generator tool/Quotation/`
  - `Generator tool/Invoice/`
  - `Generator tool/ProformaInvoice/`
  - `Generator tool/PurchaseOrder/`
- Unique file naming (timestamp + original name)
- URL generation for uploaded files
- Error handling and validation

**Configuration**:
- AWS credentials from environment variables
- Bucket name configuration
- Region configuration
- Content type management

---

## Expected Outcomes

### 1. **Operational Efficiency Improvements**

#### Time Savings
- **Before**: Creating a quotation or invoice manually took 30-60 minutes
- **After**: Document creation takes 5-10 minutes
- **Improvement**: 80-85% reduction in document creation time

#### Error Reduction
- **Before**: Manual calculations and data entry led to frequent errors
- **After**: Automated calculations and validation minimize errors
- **Improvement**: Estimated 90% reduction in calculation and formatting errors

### 2. **Document Management Benefits**

#### Centralized Storage
- All documents stored in MongoDB database
- PDFs archived in AWS S3 cloud storage
- Easy retrieval and search capabilities
- No more lost or misplaced documents

#### Search and Retrieval
- Instant search by reference number across all document types
- Filter by date, customer, or document type
- Quick access to historical documents
- Reduced time to find specific documents from hours to seconds

### 3. **Professional Image Enhancement**

#### Consistent Formatting
- All documents follow the same professional format
- Company branding (logo) on all documents
- Consistent styling and layout
- Professional appearance for all client communications

#### Brand Consistency
- Standardized document templates
- Consistent company information
- Professional presentation to clients and vendors

### 4. **Data Integrity and Compliance**

#### Audit Trail
- Complete record of all generated documents
- Timestamps for creation and modification
- S3 URLs for PDF archival
- Full document data stored in database

#### Compliance
- Secure cloud storage for document retention
- Organized folder structure for easy audit
- Complete document history
- Backup and disaster recovery through S3

### 5. **Scalability and Growth**

#### Handling Volume
- System can handle hundreds of documents per day
- No performance degradation with document volume
- Scalable database and cloud storage
- Ready for business growth

#### Multi-location Support
- Support for multiple office locations
- Location-specific configurations
- Easy addition of new locations
- Centralized management

### 6. **Cost Savings**

#### Reduced Operational Costs
- Less time spent on document creation = lower labor costs
- Reduced printing and paper costs (digital-first approach)
- Lower storage costs (cloud vs. physical storage)
- Reduced error-related costs (rework, corrections)

#### ROI Estimation
- **Initial Investment**: Development time and infrastructure setup
- **Ongoing Costs**: AWS S3 storage, MongoDB hosting (minimal)
- **Savings**: Time savings, error reduction, improved efficiency
- **Payback Period**: Estimated 3-6 months based on document volume

### 7. **User Experience Improvements**

#### Ease of Use
- Intuitive interface requiring minimal training
- Quick document creation workflow
- Real-time preview before generation
- Clear error messages and validation

#### Accessibility
- Web-based access from any device
- No software installation required
- Remote access capabilities
- Mobile-friendly interface (responsive design)

### 8. **Business Process Improvements**

#### Standardization
- Standardized document creation process
- Consistent data entry procedures
- Uniform document formats
- Standardized numbering system

#### Workflow Optimization
- Streamlined document creation workflow
- Reduced approval bottlenecks
- Faster document delivery to clients
- Improved customer satisfaction

### 9. **Data Analytics Potential**

#### Future Capabilities
- Document generation metrics
- Revenue tracking by document type
- Customer analysis
- Project tracking
- Financial reporting

#### Business Intelligence
- Data available for analysis
- Historical trends
- Performance metrics
- Decision support

### 10. **Technical Benefits**

#### Maintainability
- Clean, modular code structure
- Easy to update and enhance
- Well-documented codebase
- Scalable architecture

#### Integration Readiness
- API-based architecture ready for integrations
- Can integrate with accounting software
- Email integration capability
- Payment gateway integration potential

---

## Conclusion

### Summary

The Vista Purchase App represents a significant step forward in digital transformation for VISTA Engineering Solutions Private Limited. The system successfully addresses the core challenges of manual document creation, inconsistent formatting, and document management difficulties. By automating document generation processes, implementing centralized storage, and providing comprehensive search capabilities, the application delivers substantial operational efficiency improvements.

The implementation leverages modern web technologies (React, Node.js, MongoDB, AWS S3) to create a robust, scalable, and user-friendly solution. The modular architecture ensures maintainability and provides a solid foundation for future enhancements.

### Key Achievements

1. **Complete Document Management System**: Four document types (Quotations, Proforma Invoices, Invoices, Purchase Orders) fully implemented
2. **Automated Workflows**: Sequential numbering, auto-population, and real-time calculations
3. **Cloud Integration**: Seamless AWS S3 integration for document archival
4. **User-Friendly Interface**: Intuitive dashboard and forms with minimal learning curve
5. **Comprehensive History**: Complete document history with search capabilities
6. **Multi-location Support**: Support for multiple office locations with location-specific configurations

### Next Steps for Further Development

#### Phase 2: User Authentication and Authorization
- Implement user login/logout functionality
- Role-based access control (Admin, Manager, User)
- User management system
- Session management
- Password reset functionality

#### Phase 3: Enhanced Features
- **Email Integration**: 
  - Send documents via email directly from the application
  - Email templates for different document types
  - Email history tracking
  - Automated email notifications

- **Customer Management**:
  - Dedicated customer database
  - Customer profile management
  - Customer history and analytics
  - Customer communication tracking

- **Advanced Reporting**:
  - Financial dashboards
  - Revenue reports
  - Document generation analytics
  - Custom report builder

#### Phase 4: Integration and Automation
- **Accounting Software Integration**:
  - Integration with QuickBooks, Tally, or other accounting systems
  - Automatic data synchronization
  - Export to accounting formats

- **Payment Processing**:
  - Payment gateway integration
  - Payment tracking
  - Invoice payment status
  - Payment reminders

- **Workflow Automation**:
  - Document approval workflows
  - Automated notifications
  - Task management
  - Deadline tracking

#### Phase 5: Mobile Application
- Native mobile app development (iOS and Android)
- Mobile-optimized interface
- Offline capabilities
- Push notifications

#### Phase 6: Advanced Analytics
- Business intelligence dashboards
- Predictive analytics
- Customer behavior analysis
- Financial forecasting
- Performance metrics and KPIs

#### Phase 7: Additional Document Types
- Delivery notes
- Credit notes
- Debit notes
- Receipts
- Contracts and agreements

#### Phase 8: Inventory Management
- Product catalog
- Inventory tracking
- Stock management
- Item master data
- Integration with purchase orders

#### Phase 9: Multi-currency and International Support
- Advanced currency management
- Exchange rate integration
- Automatic currency conversion
- Multi-currency reporting

#### Phase 10: API and Third-party Integrations
- Public API for third-party integrations
- Webhook support
- RESTful API documentation
- Integration marketplace

### Long-term Vision

The Vista Purchase App is designed to evolve into a comprehensive business management platform. The current implementation provides a solid foundation that can be extended to include:

- Complete ERP functionality
- Customer relationship management (CRM)
- Project management
- Financial management
- Human resources management
- Supply chain management

### Maintenance and Support

#### Ongoing Maintenance
- Regular security updates
- Performance optimization
- Bug fixes and patches
- Feature enhancements based on user feedback
- Database optimization
- Cloud storage management

#### Support Structure
- User training and documentation
- Technical support
- Regular system health checks
- Backup and disaster recovery procedures
- Monitoring and alerting systems

### Final Thoughts

The Vista Purchase App successfully modernizes document management processes for VISTA Engineering Solutions. The system provides immediate value through time savings, error reduction, and improved document management. The modular architecture and modern technology stack ensure the application can grow and evolve with the business needs.

The project demonstrates the power of digital transformation in streamlining business processes, improving efficiency, and enhancing professional image. With continued development and enhancement, the system will become an even more valuable asset for the organization.

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Prepared By**: Development Team  
**Status**: Production Ready

---

## Appendix

### A. Environment Variables Required

#### Backend (.env)
```
MONGO_URI=mongodb://localhost:27017/vista_purchase_app
PORT=5000
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BUCKET_NAME=your_bucket_name
AWS_REGION=your_region
```

#### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

### B. Installation Steps

1. **Backend Setup**:
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend/vite-project
   npm install
   npm run dev
   ```

3. **Database Setup**:
   - Install MongoDB locally or use MongoDB Atlas
   - Update MONGO_URI in backend .env file

4. **AWS S3 Setup**:
   - Create AWS account
   - Create S3 bucket
   - Configure IAM user with S3 permissions
   - Add credentials to backend .env file

### C. Project Structure

```
vista_purchase_app/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── db.js
│   ├── server.js
│   └── s3config.js
├── frontend/
│   └── vite-project/
│       └── src/
│           ├── components/
│           ├── context/
│           ├── services/
│           └── App.jsx
└── package.json
```

---

*End of Documentation*

