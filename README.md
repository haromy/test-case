# Billing Engine

A Node.js-based Billing Engine for managing loan schedules, tracking outstanding balances, and determining borrower delinquency status.

## Features

- Generate weekly loan schedules
- Track outstanding balances in real-time
- Detect delinquent borrowers
- Handle exact weekly repayments
- Support catch-up payments for missed weeks

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd billing-engine
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:
```
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=billing_engine
DB_HOST=localhost
DB_PORT=5432
NODE_ENV=development
PORT=3000
```

4. Create the database:
```bash
createdb billing_engine
```

5. Run database migrations:
```bash
npm run db:migrate
```

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

- `POST /api/v1/loans/create_schedule` - Create a new loan schedule
- `POST /api/v1/loans/{loan_id}/repayment` - Record a repayment
- `GET /api/v1/loans/{loan_id}/schedule` - Get loan schedule
- `GET /api/v1/loans/{loan_id}/outstanding` - Get outstanding balance
- `GET /api/v1/loans/{loan_id}/delinquency_status` - Check delinquency status

## Loan Product Specifications

- Principal Amount: Rp 5,000,000
- Loan Term: 50 weeks
- Interest Rate: 10% flat per annum
- Repayment Frequency: Weekly
- Weekly Repayment Amount: Rp 110,000

## Development

Run tests:
```bash
npm test
```

## License

ISC 