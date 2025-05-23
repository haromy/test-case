# Loan Management System

A Node.js-based Loan Management System for handling loan creation, repayments, schedules, and delinquency tracking.

## Features

### Loan Management
- Support for both FLAT and REDUCING interest calculation methods
- Multiple schedule generation strategies (FLAT-FIRST, FLAT-LAST, REDUCING/EMI)
- Flexible loan tenors (Weekly or Monthly)
- Automatic schedule generation
- Soft delete support for all entities
- UUID-based identifiers for security

### Payment Handling
- Support for exact repayments of due installments
- Transaction-based payment processing
- Detailed payment allocation tracking
- Historical payment records

### Delinquency Tracking
- Real-time delinquency status monitoring
- Detection of consecutive missed payments
- Automatic loan status updates (ACTIVE, CLOSED, DEFAULTED)
- Support for future date testing scenarios

## Technical Specifications

### Database Structure
- Loans table with comprehensive loan details
- Loan schedules for installment tracking
- Transaction records with payment details
- Transaction-schedule mapping for payment allocation

### Data Types
- High precision decimal fields (15,2) for monetary values
- Proper date handling (DATEONLY)
- Enumerated status fields
- UUID primary keys

## Business Rules

### Loan Creation
- Supports multiple interest calculation methods:
  - FLAT: Fixed interest amount throughout the loan term
  - REDUCING: Interest calculated on remaining principal
- Flexible tenor types: WEEK or MONTH
- Automatic schedule generation with proper date handling

### Payment Processing
- Exact payment matching for due installments
- Transaction-based payment recording
- Detailed payment allocation to principal and interest
- Automatic schedule status updates

### Delinquency Rules
- CURRENT: No overdue payments
- OVERDUE: Has overdue payments but less than 2 consecutive
- DELINQUENT: 2 or more consecutive overdue payments
- DEFAULTED: Loan status when delinquent

### Schedule Generation Methods

#### FLAT Interest Calculation
In flat interest calculation, the interest amount is calculated upfront on the initial principal and distributed across installments.

1. FLAT-FIRST Strategy
   ```
   Total Interest = Principal × Interest Rate × Term
   First Installment = (Principal ÷ Tenor) + Total Interest
   Remaining Installments = Principal ÷ Tenor
   ```
   - Higher initial installments (interest-heavy)
   - Decreasing installment amounts
   - Suitable for risk-mitigation scenarios

2. FLAT-LAST Strategy
   ```
   Total Interest = Principal × Interest Rate × Term
   Last Installment = (Principal ÷ Tenor) + Total Interest
   Earlier Installments = Principal ÷ Tenor
   ```
   - Lower initial installments
   - Final installment includes total interest
   - Suitable for borrowers expecting future income increase

#### REDUCING Balance (EMI)
Equated Monthly Installment (EMI) calculation where interest is computed on the reducing principal balance.

```
EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)
where:
P = Principal amount
r = Monthly interest rate (annual rate ÷ 12)
n = Total number of installments
```

For each installment:
1. Interest Component = Outstanding Principal × Monthly Interest Rate
2. Principal Component = EMI - Interest Component
3. New Outstanding = Previous Outstanding - Principal Component

Features:
- Equal installment amounts throughout the loan term
- Decreasing interest component
- Increasing principal component
- More accurate interest calculation based on outstanding balance

Example EMI Distribution:
```
Installment 1:
- EMI: $1000
- Interest: $500
- Principal: $500
- Outstanding: $9500

Installment 2:
- EMI: $1000
- Interest: $475
- Principal: $525
- Outstanding: $8975

... and so on
```

### Interest Calculation Methods

#### FLAT Interest
- Interest is calculated on the full principal amount
- Total interest remains fixed regardless of prepayments
- Simpler calculation but typically results in higher total interest
```
Total Interest = Principal × Interest Rate × Term
Monthly Interest = Total Interest ÷ Number of Installments
```

#### REDUCING Interest
- Interest calculated on remaining principal balance
- Interest portion decreases with each payment
- More favorable for borrowers, especially with prepayment
```
Monthly Interest = Outstanding Principal × (Annual Rate ÷ 12)
```

### Schedule Generation Rules

1. Date Calculation
   - Weekly: Next due date = Previous due date + 7 days
   - Monthly: Next due date = Previous due date + 1 month

2. Amount Distribution
   - Principal distribution based on selected strategy
   - Interest allocation according to calculation method
   - Rounding to 2 decimal places for all monetary values

3. Schedule Status
   - Each installment tracks:
     - Principal outstanding
     - Interest outstanding
     - Total outstanding
     - Payment status
     - Due dates

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd loan-management-system
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=loan_management
DB_HOST=localhost
DB_PORT=5432
NODE_ENV=development
PORT=3000
```

4. Create the database:
```bash
createdb loan_management
```

5. Run database migrations:
```bash
npm run db:migrate
```

## API Endpoints

### Loan Management
- `POST /api/loans` - Create a new loan
- `GET /api/loans/{loan_id}` - Get loan details
- `GET /api/loans/{loan_id}/schedule` - Get loan schedule

### Payment Processing
- `POST /api/loans/{loan_id}/repayment` - Process a repayment
  - Requires exact match with due installments
  - Updates loan and schedule statuses

### Status Checking
- `GET /api/loans/{loan_id}/outstanding` - Get outstanding balance
- `GET /api/loans/{loan_id}/delinquency` - Check delinquency status

## Development

Run in development mode:
```bash
npm run dev
```

Run tests:
```bash
npm test
```

## Data Models

### Loan
- UUID-based identifier
- Loan amount and interest details
- Status tracking (ACTIVE/CLOSED/DEFAULTED)
- Payment tracking fields
- Soft delete support

### LoanSchedule
- Installment tracking
- Due date management
- Outstanding balance tracking
- Payment allocation records

### LoanTransaction
- Payment recording
- Status tracking (PENDING/COMPLETED/FAILED)
- Transaction date tracking

### LoanTransactionDetail
- Payment allocation details
- Schedule mapping
- Principal and interest allocation

## License

ISC 