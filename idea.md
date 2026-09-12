🚀 FULL PROMPT — E-Tax System Somaliland Mobile Application

Professional Government Tax Mobile Application — Full-Stack, CRUD, Secure & Production-Ready

Build a complete, professional, modern, secure and production-ready E-Tax System Somaliland Mobile Application.

This is a MOBILE APPLICATION, NOT a website.

The application must allow citizens and businesses in Somaliland to:

- Register
- Create a taxpayer profile
- Receive a Taxpayer ID/TIN
- Enter personal and business information
- View tax obligations
- Select tax types
- Pay taxes digitally
- Use supported payment methods
- Receive a digital tax receipt
- Download/print a PDF receipt
- Verify receipts using QR codes
- View payment history
- Receive notifications

The application must also include a secure Admin Mobile Dashboard where authorized administrators can manage taxpayers, payments, tax types, cities, receipts, reports and database records through the application.

---

1. PRIMARY OBJECTIVE

Build a real-world-style government tax application called:

E-Tax System Somaliland

App subtitle:

Official Digital Tax Payment System

Main purpose:

«Make tax registration, tax management, digital payment and receipt generation easier, faster and more transparent.»

The application must be:

- Production-ready architecture
- Secure
- Modern
- Responsive to different mobile screen sizes
- Beginner-friendly
- Easy to debug
- Easy to maintain
- Professionally structured
- Fully documented
- API-driven
- Database-backed
- CRUD-enabled

---

2. MOBILE TECHNOLOGY STACK

Mobile Frontend

Use:

- React Native
- Expo
- React Navigation
- NativeWind
- Axios
- AsyncStorage
- React Native Paper or another professional component library
- React Native Vector Icons / Expo Icons
- React Native Safe Area Context
- React Native Screens
- Reanimated where appropriate

Use Expo-compatible versions.

Do NOT use web-only libraries.

The application must run with:

npx expo start

It must support:

- Android
- iOS
- Expo development environment

If a library requires native configuration, use the correct Expo-compatible package and configuration.

---

3. BACKEND

Use:

- Python
- Flask
- Flask Blueprints
- Flask-SQLAlchemy
- Flask-Migrate
- Flask-CORS
- Flask-Limiter
- bcrypt
- PyJWT
- python-dotenv
- ReportLab
- QR-code generation library

Use SQLAlchemy ORM ONLY.

Never use raw SQL inside application code.

---

4. DATABASE

Use:

MySQL

Database:

etax_somaliland

Use:

- SQLAlchemy ORM
- Foreign keys
- Relationships
- Indexes
- Cascade behavior
- UTF-8
- Connection pooling
- Database migrations

Include:

schema.sql
seed.sql

The application itself must communicate with MySQL through SQLAlchemy ORM.

---

5. PROJECT STRUCTURE

Create a professional mobile full-stack structure:

E-Tax-Somaliland/
│
├── mobile/
│   ├── assets/
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   │   ├── auth/
│   │   │   ├── citizen/
│   │   │   ├── payment/
│   │   │   ├── receipt/
│   │   │   └── admin/
│   │   ├── navigation/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── storage/
│   │   ├── utils/
│   │   ├── constants/
│   │   └── theme/
│   │
│   ├── App.js
│   ├── app.json
│   ├── package.json
│   └── .env.example
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── validators/
│   ├── middleware/
│   ├── security/
│   ├── database/
│   ├── responses/
│   ├── logging/
│   ├── utils/
│   ├── migrations/
│   ├── app.py
│   ├── config.py
│   ├── extensions.py
│   ├── requirements.txt
│   └── .env.example
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
├── docs/
│   ├── README.md
│   ├── API.md
│   ├── DATABASE.md
│   ├── INSTALLATION.md
│   ├── DEPLOYMENT.md
│   ├── SECURITY.md
│   ├── TROUBLESHOOTING.md
│   └── BACKUP.md
│
├── README.md
└── .gitignore

Every referenced file must actually exist.

Do not create empty placeholder files.

Do not leave TODO comments.

---

6. APPLICATION BRANDING

Application name:

E-Tax System Somaliland

Subtitle:

Official Digital Tax Payment System

Use professional government colors:

- Green
- White
- Red
- Dark Gray
- Light Gray

The design must communicate:

- Government
- Trust
- Security
- Transparency
- Digital services

---

7. SOMALILAND FLAG

Use the correct Somaliland flag.

IMPORTANT:

Do NOT use the Somalia flag.

The Somaliland flag should be used appropriately in:

- Splash screen
- Login/register branding
- Home screen
- Receipt
- About section

Do not make the flag overpower the interface.

Use a soft, professional presentation.

If the asset is included locally, store it inside:

mobile/assets/

Do not depend on an unreliable external image URL for the primary branding.

---

8. SPLASH SCREEN

Create a professional splash screen.

Display:

E-Tax System Somaliland

Subtitle:

Official Digital Tax Payment System

Use:

- Somaliland flag
- Government-style branding
- Professional animation
- Loading indicator

After loading:

If authenticated:

→ Dashboard

If not authenticated:

→ Welcome/Login

Do not create infinite loading.

---

9. WELCOME SCREEN

Display:

Welcome to E-Tax Somaliland

Description:

«Register, manage your tax obligations, make digital payments and receive your official electronic receipt.»

Buttons:

Login

Create Account

Verify Receipt

---

10. CITIZEN REGISTRATION

Registration MUST NEVER FAIL for valid input.

Fields:

- Full Name
- Email
- Phone Number
- ID Number
- City
- Address
- Occupation
- Taxpayer Type
- Business Name
- Password
- Confirm Password

---

11. FULL NAME VALIDATION

Requirements:

- Minimum 3 characters
- Accept legitimate human names
- Allow spaces
- Do not use overly restrictive rules
- Do not reject valid Somali names

Example valid:

Ahmed Mohamed
Abdi Hassan
Ayaan Ali
Mohamed Ahmed Ibrahim

---

12. PHONE VALIDATION

Support reasonable phone formats.

Especially support Somaliland numbers.

Do not reject valid numbers unnecessarily.

Display a friendly validation message only when genuinely invalid.

---

13. EMAIL VALIDATION

Email must accept standard valid formats.

If email is optional, do not require it unnecessarily.

If provided:

Validate it properly.

Do not reject normal valid email addresses.

---

14. PASSWORD

Password must:

- Never be stored in plaintext
- Be hashed using bcrypt
- Never be returned by API
- Never be logged

Require:

- Minimum secure length
- Confirmation
- Friendly validation

---

15. REGISTRATION FLOW

When user taps:

Create Account

The app must:

1. Validate fields
2. Scroll to first invalid field
3. Disable button
4. Display spinner
5. Prevent double submission
6. Send POST request
7. Backend validates
8. Create user
9. Generate taxpayer reference/TIN where appropriate
10. Return safe response
11. Save authentication state if appropriate
12. Navigate to Dashboard

Never navigate before backend success.

---

16. OTP VERIFICATION

Where configured, support OTP verification.

Flow:

Register
 ↓
OTP Sent
 ↓
Enter OTP
 ↓
Verify
 ↓
Account Activated

Development mode may use a mock OTP service.

Clearly label development/mock behavior.

Never pretend an SMS was sent if no SMS provider is connected.

---

17. LOGIN

Create a professional login screen.

Fields:

- Phone/Email
- Password

Buttons:

Login

Forgot Password

Create Account

Show:

- Loading state
- Friendly errors
- Retry option

Wrong credentials:

Invalid phone/email or password.

Never show server stack traces.

---

18. AUTHENTICATION

Use JWT authentication.

Flow:

Login
 ↓
Backend validation
 ↓
JWT generated
 ↓
Mobile app stores authentication state securely
 ↓
Dashboard

Use secure mobile storage where possible.

Do not store passwords.

Do not store PINs.

Do not expose JWT secrets.

---

19. SESSION PERSISTENCE

When the user closes and reopens the application:

If authentication is still valid:

→ Keep user logged in.

If token is expired:

→ Clear session

→ Redirect to Login

Do not show a white screen.

---

20. CITIZEN DASHBOARD

After login display:

Welcome, Ahmed

Cards:

- Taxpayer ID
- Total Tax Paid
- Outstanding Tax
- Recent Payment
- Payment Status

Quick actions:

- Pay Tax
- My Taxes
- Payment History
- Receipts
- Profile
- Notifications

---

21. TAXPAYER PROFILE

Display:

- Full Name
- Taxpayer ID/TIN
- Phone
- Email
- ID Number
- City
- Address
- Occupation
- Taxpayer Type
- Business Name
- Account Status
- Registration Date

Allow appropriate profile updates.

---

22. BUSINESS PROFILE

If taxpayer is a business owner:

Allow:

- Business Name
- Business Type
- Registration Number
- City
- Address
- Business Status

Business types:

- Retail
- Wholesale
- Service
- Manufacturing
- Other

---

23. TAX TYPES

Create tax types in the database.

Examples:

- Yearly Tax
- Daily Tax
- Business Tax
- Income Tax
- GST
- Other Government Tax

The mobile app must load tax types from backend.

Do not duplicate tax business rules across multiple screens.

---

24. PAY TAX SCREEN

Create a professional payment form.

Fields:

Citizen

- Full Name

Business

- Business Name
- Business Type

Location

City dropdown.

Include major Somaliland cities/towns such as:

- Hargeisa
- Berbera
- Burao
- Borama
- Gabiley
- Erigavo
- Las Anod
- Sheikh
- Odweyne
- Wajaale
- Balligubadle
- Other major towns

Cities should preferably come from backend database.

---

25. TAX TYPE

Allow citizen to select:

- Yearly
- Daily
- Business Tax
- Other configured tax types

The backend must determine valid tax types and amounts.

Never trust the mobile application alone.

---

26. CURRENCY

Support:

- SLSH
- USD

Display currency clearly next to amount.

---

27. TAX AMOUNT

Yearly minimum development configuration:

100000 SLSH

Daily amount must be configurable.

If amount is invalid:

Display:

Please enter the correct tax amount required.

Tax rules should be controlled from backend configuration/database.

Do not hardcode tax logic in multiple mobile screens.

---

28. PAYMENT METHODS

Support interface options:

- ZAAD
- eDahab
- EVC Plus
- Bank
- Card

For development:

Use sandbox/mock payment processing unless a real payment gateway is explicitly configured.

Never claim a real financial transaction occurred when only a mock service was used.

---

29. PAYMENT FLOW

Payment:

Select Tax
 ↓
Enter Amount
 ↓
Select Currency
 ↓
Select Payment Method
 ↓
Review
 ↓
Confirm
 ↓
Process Payment
 ↓
Payment Result
 ↓
Generate Receipt

---

30. PAYMENT PIN

PIN:

- 4–6 digits
- Numeric only
- Confirmation required
- Never display
- Never return
- Never log
- Never store plaintext

Hash using bcrypt.

IMPORTANT:

If a real payment provider requires its own secure PIN entry, do not collect or store the provider PIN in the E-Tax backend unless the provider explicitly authorizes such integration.

Prefer provider-hosted/secure payment flows.

---

31. PAYMENT REVIEW SCREEN

Before payment:

Display:

Taxpayer
Business
Tax Type
Amount
Currency
Payment Method

Button:

Confirm Payment

User must explicitly confirm.

Prevent accidental payments.

---

32. PAYMENT SUCCESS

After successful payment:

Display:

Payment Successful ✓

Message:

Citizen, you have successfully fulfilled your tax obligation.

Show:

- Reference ID
- Transaction ID
- Taxpayer ID
- Citizen Name
- Business Name
- Tax Type
- Payment Method
- Currency
- Amount
- Date
- Status

Buttons:

View Receipt

Download PDF

Share Receipt

Verify Receipt

---

33. PAYMENT FAILURE

If payment fails:

Display:

Payment could not be completed.

Show:

- Reason where safe
- Retry
- Back to Dashboard

Never expose:

- SQL errors
- API stack traces
- Secret information

---

34. PAYMENT STATUS

Use:

- Pending
- Processing
- Completed
- Failed
- Cancelled

Do not mark a payment completed until backend/payment service confirms it.

---

35. DUPLICATE PAYMENT PROTECTION

Prevent duplicate submissions.

Use:

- Disabled buttons
- Unique transaction/reference IDs
- Idempotency protection where appropriate
- Backend duplicate validation

If duplicate payment detected:

Display a friendly message.

---

36. PAYMENT HISTORY

Create:

My Payments

Display:

- Reference ID
- Tax Type
- Amount
- Currency
- Payment Method
- Status
- Date

Allow:

- Search
- Filter
- View details
- View receipt

---

37. DIGITAL RECEIPT

Create a professional digital receipt screen.

Header:

REPUBLIC OF SOMALILAND

MINISTRY OF FINANCE

E-TAX DIGITAL RECEIPT

Display:

Receipt Number
Reference ID
Transaction ID
Taxpayer ID
Citizen Name
Business Name
Tax Type
Payment Method
Currency
Amount
Payment Date
Status

---

38. QR CODE

Generate QR code for receipt verification.

QR should contain only a safe verification reference/URL.

Example:

Receipt Reference:
ETX-2026-000001

Never put:

- Password
- PIN
- JWT
- Database credentials
- Sensitive personal data

inside QR code.

---

39. RECEIPT VERIFICATION

Create mobile screen:

Verify Digital Receipt

User can:

- Scan QR
- Enter receipt reference manually

After verification:

Receipt VERIFIED ✓

Receipt Number
Taxpayer
Tax Type
Amount
Currency
Payment Date
Status

Do not expose unnecessary sensitive information.

---

40. QR SCANNER

Use an Expo-compatible camera/barcode scanner.

Permissions must be handled correctly.

If permission denied:

Display:

Camera permission is required to scan a receipt.

Provide:

Enter Reference Manually

Do not crash if permission is denied.

---

41. PDF RECEIPT

Generate a professional PDF receipt.

The app should allow:

- Generate PDF
- Preview
- Save/share PDF

Backend may generate official PDF using ReportLab.

Mobile app receives/downloads it securely.

PDF should contain:

- Government branding
- Receipt number
- Taxpayer information
- Payment details
- QR code
- Date
- Status

Never include PIN/password.

---

42. SHARE RECEIPT

Allow mobile share functionality.

Use an Expo-compatible sharing solution.

User can share:

- PDF
- Receipt reference

Do not share sensitive authentication information.

---

43. NOTIFICATIONS

Create notification screen.

Examples:

- Payment successful
- Payment pending
- Tax deadline reminder
- Receipt generated
- Government announcement

Use backend notifications.

Push notifications may be implemented through Expo Notifications if configured.

Development mode may use local/in-app notifications.

---

44. ADMIN MOBILE LOGIN

Create:

Admin Login

Development credentials:

Username: admin
Password: 1234

Credentials must come from backend environment variables.

Do NOT hardcode admin credentials in the mobile app.

After successful login:

→ Admin Dashboard

Wrong credentials:

Invalid username or password.

---

45. ADMIN DASHBOARD

Create a professional mobile admin dashboard.

Display:

- Total Citizens
- Total Businesses
- Total Payments
- Completed Payments
- Pending Payments
- Failed Payments
- Total Revenue
- Total Receipts

Cards must be responsive.

---

46. ADMIN NAVIGATION

Admin menu:

Dashboard
Citizens
Businesses
Payments
Tax Types
Cities
Receipts
Reports
Database Management
Audit Logs
Settings
Logout

Use mobile-friendly navigation.

Use stack navigation and drawer/tab navigation where appropriate.

---

47. ADMIN CITIZEN CRUD

The Admin must have complete CRUD.

CRUD means:

Create
Read
Update
Delete

---

CREATE CITIZEN

Admin can create:

- Full Name
- Email
- Phone
- ID Number
- City
- Address
- Occupation
- Taxpayer Type
- Business Name

Validate data on backend.

---

READ CITIZENS

Display:

- ID
- Name
- Phone
- Email
- City
- Taxpayer Type
- Business
- Status
- Registration Date

Include:

- Search
- Filter
- Pagination
- Sorting

---

UPDATE CITIZEN

Admin can edit:

- Name
- Email
- Phone
- City
- Address
- Occupation
- Business
- Status

Show loading state.

Show confirmation/success notification.

---

DELETE CITIZEN

Before deleting:

Are you sure you want to delete this citizen?

Buttons:

Cancel

Delete

After deletion:

- Refresh list
- Clear cache
- Show success message

Related records must follow the configured cascade/retention policy.

---

48. ADMIN PAYMENT CRUD

Admin can:

CREATE

Create an authorized manual payment record.

Fields:

- Citizen
- Tax Type
- Amount
- Currency
- Payment Method
- Transaction ID
- Status
- Date

---

READ

View:

- Reference ID
- Transaction ID
- Citizen
- Tax Type
- Amount
- Currency
- Method
- Status
- Date

---

UPDATE

Allow authorized fields such as:

- Status
- Tax Type
- Notes
- Reference information where appropriate

Every financial record modification must create an audit log.

---

DELETE

Admin can delete a payment only after confirmation and authorization.

Show:

Are you sure you want to delete this payment?

After deletion:

- Refresh table
- Show success notification
- Create audit log

---

49. BULK CRUD ACTIONS

Admin can select multiple records.

Actions:

- Select
- Select all
- Delete selected

Before deletion:

Are you sure you want to delete the selected records?

After success:

- Refresh
- Clear selection
- Show toast

Use backend bulk endpoints where appropriate.

---

50. TAX TYPE CRUD

Admin can:

CREATE

Create tax type.

READ

View all tax types.

UPDATE

Edit:

- Name
- Description
- Minimum amount
- Currency
- Frequency
- Status

DELETE

Delete/deactivate tax type.

For historical financial integrity, prefer deactivation rather than destructive deletion where required.

---

51. CITY CRUD

Admin can:

- Create city
- View city
- Update city
- Deactivate city

Store cities in database.

Do not duplicate the list in multiple mobile screens.

---

52. RECEIPT MANAGEMENT

Admin can:

- View receipts
- Search receipts
- Filter receipts
- View receipt details
- Verify receipt
- Download PDF
- Share receipt

Do not allow unauthorized alteration of completed official receipts.

---

53. DATABASE MANAGEMENT

Create:

Database Management

Sections:

- Citizens
- Payments
- Tax Types
- Cities
- Receipts
- Audit Logs

The admin should not need MySQL manually for normal CRUD operations.

---

54. SEARCH

Citizens:

Search by:

- Name
- Phone
- Email
- ID Number
- TIN
- City

Payments:

Search by:

- Reference ID
- Transaction ID
- Citizen name
- Tax type
- Payment method

Use debounced search.

---

55. FILTERING

Provide filters:

- City
- Tax Type
- Payment Method
- Payment Status
- Currency
- Date range
- Citizen

---

56. PAGINATION

Use backend pagination.

Example:

GET /api/users?page=1&limit=20

Response:

{
  "success": true,
  "data": [],
  "page": 1,
  "limit": 20,
  "total": 100,
  "pages": 5
}

Do not download thousands of records unnecessarily.

---

57. SORTING

Support:

- Name
- Amount
- Date
- City
- Status

Only allow predefined safe sort fields.

---

58. ADMIN REPORTS

Create Reports screen.

Reports:

- Daily revenue
- Weekly revenue
- Monthly revenue
- Revenue by city
- Revenue by tax type
- Revenue by payment method
- Completed vs failed payments

---

59. CHARTS

Use a React Native-compatible chart library.

Charts:

Revenue Trend

Line/bar chart.

Payment Methods

Pie/donut chart.

Tax Types

Bar chart.

City Revenue

Bar chart.

Charts must not crash when:

- No data
- Null values
- Empty arrays
- API temporarily unavailable

Show:

No data available.

---

60. EXPORT

Admin should be able to export reports.

Support where mobile platform allows:

- CSV
- Excel-compatible file
- PDF report
- Share/Save

If direct Excel generation is not practical on-device, generate the file through the backend and provide a secure download/share flow.

Do not fake exports.

---

61. OFFLINE MODE

Implement safe offline behavior.

Cache non-sensitive data such as:

- Public announcements
- Tax type names
- City list
- Non-sensitive dashboard display data where appropriate

Do NOT cache:

- Passwords
- PINs
- Payment credentials
- Secrets

When offline:

Display:

You are currently offline.

Allow:

Retry

Do not falsely mark a payment as completed while offline.

---

62. NETWORK ERROR HANDLING

If backend unavailable:

Display:

Unable to connect to E-Tax server. Please check your internet connection and try again.

Buttons:

Retry

Go Back

Never show a white screen.

---

63. LOADING STATES

Every API request must show appropriate feedback:

- Loading
- Saving
- Processing payment
- Deleting
- Generating receipt
- Downloading PDF
- Verifying receipt

Buttons must be disabled during critical operations.

---

64. EMPTY STATES

Examples:

No payments found.

No receipts found.

No citizens found.

Provide useful action buttons where appropriate.

---

65. ERROR STATES

All screens must safely handle:

- API errors
- Network errors
- Null responses
- Empty responses
- Invalid data
- Unauthorized requests
- Expired sessions

No undefined/null crashes.

---

66. BACKEND API

Use Flask Blueprints.

Authentication:

POST /api/register
POST /api/login
POST /api/admin/login
POST /api/logout
GET  /api/health

Users:

POST   /api/users
GET    /api/users
GET    /api/users/<id>
PUT    /api/users/<id>
DELETE /api/users/<id>

Payments:

POST   /api/payments
GET    /api/payments
GET    /api/payments/<id>
PUT    /api/payments/<id>
DELETE /api/payments/<id>

Tax Types:

POST   /api/tax-types
GET    /api/tax-types
GET    /api/tax-types/<id>
PUT    /api/tax-types/<id>
DELETE /api/tax-types/<id>

Cities:

POST   /api/cities
GET    /api/cities
GET    /api/cities/<id>
PUT    /api/cities/<id>
DELETE /api/cities/<id>

Dashboard:

GET /api/dashboard/stats
GET /api/dashboard/revenue
GET /api/dashboard/payments
GET /api/dashboard/cities
GET /api/dashboard/payment-methods

Receipts:

GET /api/receipts/<reference_id>
GET /api/receipts/<reference_id>/verify
GET /api/receipts/<reference_id>/pdf

---

67. API RESPONSE FORMAT

Success:

{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}

Error:

{
  "success": false,
  "message": "Something went wrong.",
  "errors": {}
}

Never return:

- Password
- PIN
- Secret keys
- JWT secret
- Database credentials
- Stack traces

---

68. HTTP STATUS CODES

Use:

200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
429 Too Many Requests
500 Internal Server Error

---

69. SECURITY

Implement:

- bcrypt
- JWT
- Input validation
- Backend validation
- SQL injection protection through ORM
- XSS-safe API responses
- Rate limiting
- Secure CORS
- Secure headers
- Environment variables
- Authorization middleware
- Audit logging
- Sensitive-data protection

---

70. ADMIN AUTHORIZATION

Every admin API endpoint must verify:

1. JWT
2. Token validity
3. Token expiration
4. Admin role

Citizen accounts must never access admin endpoints.

---

71. RATE LIMITING

Protect:

- Login
- Registration
- Payment
- OTP
- Receipt verification

using Flask-Limiter.

---

72. CORS

Configure:

FRONTEND_URL=http://localhost:8081

Use the appropriate Expo development origin/configuration.

Do not use unrestricted CORS in production.

---

73. AUDIT LOGS

Create:

audit_logs

Fields:

id
admin_id
action
entity_type
entity_id
description
ip_address
created_at

Log:

- Login
- Logout
- Create citizen
- Update citizen
- Delete citizen
- Create payment
- Update payment
- Delete payment
- Create tax type
- Update tax type
- Delete/deactivate tax type
- City changes

Never log passwords or PINs.

---

74. DATABASE MODELS

Minimum models:

User
Payment
TaxType
City
Receipt
AuditLog
AdminUser

Optional:

Business
Notification
PaymentTransaction

---

75. USER MODEL

Suggested fields:

id
full_name
email
phone
id_number
tin
city_id
address
occupation
taxpayer_type
business_name
password_hash
status
created_at
updated_at

---

76. PAYMENT MODEL

Suggested fields:

id
reference_id
transaction_id
user_id
tax_type_id
amount
currency
payment_method
status
payment_date
created_at
updated_at

Never store plaintext PIN.

---

77. RECEIPT MODEL

Suggested fields:

id
receipt_number
payment_id
verification_token
created_at

Use a safe unique verification reference.

---

78. DATABASE RELATIONSHIPS

Relationship:

User
  |
  | 1
  |
  | many
  ↓
Payment

Also:

TaxType
  |
  | 1
  |
  | many
  ↓
Payment

And:

Payment
  |
  | 1
  |
  | 1
  ↓
Receipt

Use SQLAlchemy relationships.

---

79. CASCADE DELETE

When deleting a citizen:

Related payments may be deleted according to configured cascade behavior.

However, because tax/payment records can be legally important, clearly document this behavior and allow a production retention policy.

Do not silently destroy historical financial records in a real deployment.

---

80. INDEXES

Create indexes for:

- phone
- email
- TIN
- city
- tax type
- payment method
- payment status
- created date
- reference ID
- transaction ID

Use SQLAlchemy indexes.

---

81. MYSQL CONNECTION

Use:

DATABASE_URL=mysql+pymysql://root:password@localhost/etax_somaliland

Use connection pooling.

Handle:

- Database unavailable
- Connection timeout
- Connection failure

Gracefully.

---

82. ERROR HANDLING

Create centralized Flask exception handling.

Never expose:

Traceback
SQL Error
Database Password
Python Internal Error

Return safe JSON.

---

83. LOGGING

Implement structured logging.

Log:

- API requests
- Authentication events
- Payment events
- CRUD operations
- Security events
- Exceptions

Never log:

- Password
- PIN
- JWT secret
- Database password
- Payment credentials

---

84. MOBILE COMPONENTS

Create reusable components:

AppButton
AppInput
AppSelect
AppCard
AppHeader
LoadingSpinner
ErrorMessage
SuccessMessage
ConfirmModal
SearchBar
FilterPanel
StatCard
PaymentCard
ReceiptCard
EmptyState
ErrorState
ProtectedRoute
AdminDrawer

Avoid duplicating UI code.

---

85. MOBILE NAVIGATION

Citizen navigation may use:

Home
My Taxes
Payments
Receipts
Profile

Admin navigation:

Dashboard
Citizens
Payments
Tax Types
Cities
Receipts
Reports
Database
Audit Logs
Settings

Use React Navigation.

Do not use React Router.

---

86. RESPONSIVE MOBILE UI

Test different screen sizes.

Support:

320px
360px
375px
390px
414px
430px

The app must not:

- Overflow horizontally
- Cut buttons
- Hide fields
- Break navigation
- Crash on small screens

Use SafeAreaView.

Use KeyboardAvoidingView on forms where appropriate.

---

87. KEYBOARD HANDLING

Forms must work properly when keyboard opens.

Use:

- KeyboardAvoidingView
- ScrollView
- Keyboard.dismiss

Users must be able to see the active input.

---

88. ACCESSIBILITY

Include:

- Accessible labels
- Proper contrast
- Large touch targets
- Clear error messages
- Screen-reader-friendly labels where practical
- Keyboard/focus behavior where applicable

---

89. APP SETTINGS

Create settings screen.

Options:

- Language
- Notifications
- Security
- About
- Privacy
- Terms
- Logout

---

90. LANGUAGE

Prepare architecture for:

- English
- Somali

Default language:

English

Allow Somali translation through a centralized localization system.

Do not hardcode all text inside components if localization can reasonably be used.

---

91. ABOUT SCREEN

Display:

E-Tax System Somaliland

Description:

Digital tax registration, management and payment platform.

Include:

- Version
- Support
- Privacy
- Terms
- About the system

If this is a student/demo project, clearly state that it is a demonstration and not an officially authorized government application unless such authorization exists.

---

92. ENVIRONMENT VARIABLES

Mobile:

EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000/api

Backend:

SECRET_KEY=change-this-secret
DATABASE_URL=mysql+pymysql://root:password@localhost/etax_somaliland
ADMIN_USERNAME=admin
ADMIN_PASSWORD=1234
FRONTEND_URL=http://localhost:8081
JWT_EXPIRATION_HOURS=8

Provide:

.env.example

Never commit real secrets.

---

93. LOCAL NETWORK DEVELOPMENT

IMPORTANT:

When testing the Expo mobile application on a physical Android phone, do NOT use:

localhost

for the backend API.

Use the computer's local network IP:

EXPO_PUBLIC_API_URL=http://192.168.x.x:5000/api

The phone and computer must be on the same network.

Document this clearly.

---

94. BACKEND START

Use:

cd backend
python -m venv venv

Windows:

venv\Scripts\activate

Then:

pip install -r requirements.txt
python app.py

---

95. MOBILE START

Use:

cd mobile
npm install
npx expo start

Then:

- Android emulator
- Physical Android device
- iOS simulator where supported

---

96. DATABASE SETUP

Document:

1. Install MySQL
2. Create database
3. Configure DATABASE_URL
4. Run Flask migrations
5. Seed development data
6. Start backend
7. Start Expo
8. Configure mobile API URL

---

97. DATABASE SEED

Seed development data:

- Admin
- Cities
- Tax types
- Sample citizens
- Sample payments
- Sample receipts

Clearly mark sample data as development/demo data.

Never represent demo payments as real government payments.

---

98. TESTING

Create backend tests for:

- Registration
- Login
- Admin login
- JWT
- User CRUD
- Payment CRUD
- Tax Type CRUD
- City CRUD
- Receipt generation
- Receipt verification
- Dashboard
- Authorization
- Validation

Test frontend flows where practical:

- Register
- Login
- Dashboard
- Payment
- Receipt
- Admin login
- CRUD
- Logout

---

99. ZERO ERROR REQUIREMENT

Before considering the project complete, verify:

✔ Expo starts

✔ React Native starts

✔ Android build/start works

✔ Backend starts

✔ MySQL connects

✔ All Python imports work

✔ All npm dependencies exist

✔ No missing package errors

✔ No React Native runtime errors

✔ No Expo errors

✔ No Flask errors

✔ No SQLAlchemy errors

✔ No circular imports

✔ No CORS errors

✔ Registration works

✔ Login works

✔ Admin login works

✔ Session persistence works

✔ Token expiration works

✔ Protected routes work

✔ Taxpayer profile works

✔ Tax types load

✔ Cities load

✔ Payment screen works

✔ Payment validation works

✔ Duplicate payment protection works

✔ PIN is never exposed

✔ Payment success works

✔ Payment failure works

✔ Receipt generation works

✔ PDF generation works

✔ QR generation works

✔ QR scanning works

✔ Manual receipt verification works

✔ Payment history works

✔ Notifications screen works

✔ Admin dashboard works

✔ Dashboard statistics work

✔ Charts work

✔ Citizen CREATE works

✔ Citizen READ works

✔ Citizen UPDATE works

✔ Citizen DELETE works

✔ Payment CREATE works

✔ Payment READ works

✔ Payment UPDATE works

✔ Payment DELETE works

✔ Bulk delete works

✔ Tax Type CRUD works

✔ City CRUD works

✔ Receipt management works

✔ Search works

✔ Filters work

✔ Pagination works

✔ Sorting works

✔ Reports work

✔ Export works

✔ Audit logs work

✔ Offline handling works

✔ Network errors are handled

✔ No white-screen errors

✔ No undefined errors

✔ No null crashes

✔ No broken navigation

✔ No broken buttons

✔ No fake successful payments

✔ No sensitive information exposed

✔ Correct Somaliland flag is displayed

✔ Somalia flag is never substituted for Somaliland flag

✔ App works on different mobile screen sizes

✔ API is secure

✔ Database relationships work

✔ Documentation is complete

---

100. NO FAKE FUNCTIONALITY

Do NOT create buttons that only visually work.

Every important operation must follow:

Mobile App
     ↓
Axios
     ↓
Flask API
     ↓
Authentication
     ↓
Validation
     ↓
Service Layer
     ↓
SQLAlchemy ORM
     ↓
MySQL
     ↓
Response
     ↓
Mobile UI

This applies to:

- Register
- Login
- Payment
- Receipt
- Create
- Read
- Update
- Delete
- Tax Types
- Cities
- Reports
- Verification

---

101. NO PLACEHOLDERS

Do not use:

TODO
Coming Soon
Implement later
Your code here
Fake API
Dummy function

unless something is explicitly identified as a development sandbox/mock service.

Every requested feature must have a real implementation.

---

102. PRODUCTION PAYMENT RULE

The application must clearly distinguish:

Development/Sandbox

Mock payment transaction.

Production

Real integration with an authorized payment provider.

Never claim that ZAAD, eDahab, EVC Plus, bank or card payment succeeded unless the backend receives a valid confirmation from the appropriate payment provider.

Do not collect or store mobile-money PINs unless an authorized provider integration specifically requires a secure provider-controlled flow.

---

103. DOCUMENTATION

Create complete documentation:

README.md

Include:

- Project overview
- Features
- Architecture
- Requirements
- Installation
- Database setup
- Environment variables
- Mobile setup
- Backend setup
- API setup
- Admin login
- Testing
- Troubleshooting
- Deployment

API.md

Document:

- Endpoints
- Request body
- Responses
- Authentication
- Errors

DATABASE.md

Document:

- Tables
- Relationships
- Indexes
- Cascade behavior

SECURITY.md

Document:

- Authentication
- JWT
- bcrypt
- Rate limiting
- CORS
- Data protection
- Audit logging

TROUBLESHOOTING.md

Include solutions for:

- Expo connection
- Android device connection
- API unreachable
- MySQL connection
- CORS
- JWT
- npm installation
- Python dependencies

BACKUP.md

Document MySQL backup and restore.

---

104. BACKUP

Document safe MySQL backup/restore procedures.

Do not include destructive commands in the normal startup process.

Database backup must be treated as an administrator operation.

---

105. FINAL PROJECT DELIVERY

Generate the COMPLETE mobile project.

The final folder must contain:

Mobile App
Backend API
Database
Authentication
CRUD
Tax Management
Payment System
Digital Receipt
PDF Receipt
QR Verification
QR Scanner
Admin Dashboard
Reports
Search
Filters
Pagination
Sorting
Notifications
Audit Logs
Security
Testing
Documentation
Environment Examples
Assets

---

106. ZIP DELIVERY

If the environment supports file creation:

Create:

E-Tax-Somaliland-Mobile.zip

The ZIP must contain the complete project.

After extracting:

Open in VS Code
        ↓
Configure .env
        ↓
Install MySQL
        ↓
Install backend dependencies
        ↓
Install mobile dependencies
        ↓
Start Flask
        ↓
Start Expo
        ↓
Open Android/iOS

No manual code fixes should be required.

---

107. FINAL VERIFICATION

Before delivering the project, actually verify:

1. Backend starts.
2. Database connection works.
3. API health endpoint works.
4. Registration works.
5. Login works.
6. Admin login works.
7. JWT works.
8. Citizen CRUD works.
9. Payment CRUD works.
10. Tax Type CRUD works.
11. City CRUD works.
12. Payment validation works.
13. Receipt generation works.
14. PDF works.
15. QR verification works.
16. Dashboard works.
17. Search works.
18. Filters work.
19. Pagination works.
20. Reports work.
21. Audit logs work.
22. Mobile navigation works.
23. No missing dependencies.
24. No runtime crashes.
25. No broken imports.
26. No white screen.
27. No exposed secrets.
28. No PIN logging.
29. No fake payment confirmation.
30. App works on Android development environment.

---

108. FINAL INSTRUCTION TO THE AI

Do NOT simply explain how to build the application.

Actually generate the complete source code.

If file-generation tools are available:

1. Create the entire project.
2. Create every required file.
3. Install/check dependencies where possible.
4. Run backend tests.
5. Verify frontend dependencies.
6. Verify API endpoints.
7. Verify database models.
8. Verify CRUD.
9. Verify authentication.
10. Verify receipt generation.
11. Fix discovered errors.
12. Package everything into:

E-Tax-Somaliland-Mobile.zip

Provide the downloadable ZIP.

If the environment cannot create a ZIP, output the complete file-by-file source code and exact project structure without omitting required files.

The final result must be a professional:

E-Tax System Somaliland Mobile Application

with:

Citizen Registration + Taxpayer Profile + Tax Management + Digital Payment + Digital Receipt + PDF + QR Verification + Admin Dashboard + Complete CRUD + Reports + Secure Flask API + MySQL Database + Professional Government UI.