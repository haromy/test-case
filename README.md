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

## Quick Start with Docker

### Development Environment
```bash
# Start the application and database
docker-compose up

# Rebuild and start (after dependencies change)
docker-compose up --build

# Run database migrations
docker-compose exec app npm run db:migrate
```

### Production Environment
```bash
# Build production image
docker build -t loan-management-system .

# Run production container
docker run -p 3000:3000 loan-management-system
```

### Test Environment
```bash
# Run all tests
docker-compose run test

# Run specific test file
docker-compose run test npm test test/services/loan.service.test.js

# Run tests with coverage
docker-compose run test npm run test:coverage
```

## Manual Setup

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation Steps
1. Clone the repository
2. Install dependencies
3. Configure environment
4. Run migrations

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

## Testing

### Unit Tests
The project uses the following testing stack:
- Mocha: Test runner
- Chai: Assertion library
- Sinon: Test spies, stubs, and mocks
- NYC: Code coverage

Test files are organized by feature:
```
test/
├── services/
│   ├── loan.service.test.js
│   └── ...
├── models/
│   └── ...
└── setup.js
```

Key test cases:
1. Loan Creation
   - FLAT interest calculation
   - REDUCING balance (EMI)
   - Schedule generation

2. Repayment Processing
   - Exact payment matching
   - Transaction creation
   - Schedule updates

3. Delinquency Checking
   - Status determination
   - Consecutive payment tracking
   - Future date testing

### Running Tests
```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## API Documentation

### Postman Collection
A complete Postman collection is available in the `postman` directory. To use it:

1. Import `postman/Loan_Management_System.postman_collection.json` into Postman
2. Import `postman/environments/*.postman_environment.json` for environment variables
3. Select the desired environment (local, docker, production)

### Available Environments
- `local.postman_environment.json`: Local development
- `docker.postman_environment.json`: Docker development
- `production.postman_environment.json`: Production settings

### API Endpoints

#### Loan Management
- Create Loan
  ```http
  POST /api/loans
  Content-Type: application/json

  {
    "principal_amount": 5000000,
    "interest_rate": 10,
    "interest_type": "FLAT",
    "tenor": 50,
    "tenor_type": "WEEK",
    "start_date": "2024-03-20"
  }
  ```

- Get Loan Details
  ```http
  GET /api/loans/{loan_id}
  ```

#### Payment Processing
- Make Repayment
  ```http
  POST /api/loans/{loan_id}/repayment
  Content-Type: application/json

  {
    "amount": 110000,
    "transaction_date": "2024-03-27"
  }
  ```

#### Status Checking
- Check Delinquency
  ```http
  GET /api/loans/{loan_id}/delinquency
  ```

## Docker Configuration

### Container Structure
- `app`: Main application container
- `db`: PostgreSQL database
- `test`: Test environment
- `db_test`: Test database

### Volumes
- `postgres_data`: Persistent database storage
- Application code mounting for development

### Environment Variables
```env
NODE_ENV=development
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=loan_management
DB_HOST=db
DB_PORT=5432
```

### Security Features
- Non-root user in containers
- Production dependencies separation
- Environment isolation
- Secure defaults

## License

ISC 