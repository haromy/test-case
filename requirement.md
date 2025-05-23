Billing Engine for Loan Engine - Technical Specifications
1. Introduction
This document outlines the technical specifications for the Billing Engine, a critical component of our Loan Engine. The Billing Engine will manage loan schedules, track outstanding balances, and determine borrower delinquency status.

2. Goals
Generate accurate weekly loan schedules.
Maintain a real-time outstanding balance for each loan.
Efficiently track and identify delinquent borrowers.
Support the specific loan product: 50-week loan, Rp 5,000,000 principal, 10% flat annual interest.
Handle exact weekly repayments or no repayment.
Accommodate missed payments and subsequent catch-up payments.
3. Scope
This document covers the design and implementation details for the core functionalities of the Billing Engine, including:

Loan Schedule Generation
Outstanding Balance Tracking
Delinquency Detection
API Endpoints for core functionalities
4. Out of Scope
User Interface (UI) for the Billing Engine.
Integration with external payment gateways (assumed to be handled by the Loan Engine).
Reporting and analytics beyond basic delinquency status.
Complex interest calculations (e.g., compound interest, floating interest rates) beyond the specified flat rate.
Partial payments.
5. Loan Product Definition
Principal Amount: Rp 5,000,000
Loan Term: 50 weeks
Interest Rate: 10% flat per annum
Repayment Frequency: Weekly
Repayment Amount per Week:
Total Interest = Principal * Annual Interest Rate = Rp 5,000,000 * 0.10 = Rp 500,000
Total Repayable Amount = Principal + Total Interest = Rp 5,000,000 + Rp 500,000 = Rp 5,500,000
Weekly Repayment Amount = Total Repayable Amount / Loan Term = Rp 5,500,000 / 50 = Rp 110,000
6. System Design
6.1. High-Level Architecture
The Billing Engine will be a microservice, communicating with the Loan Engine and potentially other services via well-defined APIs.

+---------------------+         +-------------------+
|     Loan Engine     |         |    Billing Engine |
|                     |         |                   |
| - Loan Creation     | ------->| - Generate Schedule |
| - Repayment Event   | <-------| - Update Balance  |
| - Delinquency Check | <-------| - Check Delinquency |
+---------------------+         +-------------------+
6.2. Data Model
Loan Table
Field Name	Data Type	Description
loan_id	UUID/Long	Unique identifier for the loan
principal_amount	Decimal	Original principal loan amount
interest_rate	Decimal	Annual flat interest rate (e.g., 0.10)
loan_term_weeks	Integer	Total duration of the loan in weeks (e.g., 50)
start_date	Date	Date when the loan was disbursed
total_repayable	Decimal	Principal + Total Interest
weekly_repayment	Decimal	Calculated weekly repayment amount
current_outstanding	Decimal	Current outstanding balance of the loan
status	Enum (ACTIVE, COMPLETED, CANCELLED)	Current status of the loan
last_payment_week	Integer	The week number of the last successful payment
last_updated_at	Timestamp	Timestamp of the last update

Export to Sheets
LoanSchedule Table
Field Name	Data Type	Description
schedule_id	UUID/Long	Unique identifier for the schedule entry
loan_id	UUID/Long	Foreign key to the Loan table
week_number	Integer	Week number (1 to 50)
due_date	Date	Date when the payment for this week is due
scheduled_amount	Decimal	Expected payment amount for this week (Rp 110,000)
paid_amount	Decimal	Actual amount paid for this week
status	Enum (DUE, PAID, MISSED)	Current status of the weekly payment

Export to Sheets
PaymentTransaction Table (Optional, for detailed payment history)
Field Name	Data Type	Description
transaction_id	UUID/Long	Unique identifier for the transaction
loan_id	UUID/Long	Foreign key to the Loan table
payment_date	Timestamp	Date and time of the payment
amount_paid	Decimal	Actual amount paid in this transaction
payment_type	Enum (WEEKLY_REPAYMENT, CATCH_UP)	Type of payment (e.g., regular, covering missed)
week_numbers_covered	Array/JSONB of Integers	List of week numbers this payment covers

Export to Sheets
6.3. Core Functionalities
6.3.1. Loan Schedule Generation
Trigger: Invoked when a new loan is created by the Loan Engine.
Logic:
Calculate total_repayable = principal_amount + (principal_amount * interest_rate).
Calculate weekly_repayment = total_repayable / loan_term_weeks.
Generate 50 entries in the LoanSchedule table for the given loan_id.
For each entry:
week_number from 1 to 50.
due_date calculated as start_date + week_number weeks.
scheduled_amount = weekly_repayment.
paid_amount = 0.
status = DUE.
Output: Populated LoanSchedule table entries for the new loan.
6.3.2. Outstanding Balance Tracking
Mechanism: The current_outstanding field in the Loan table will reflect the real-time outstanding balance.
Update Trigger: Invoked when a repayment is made by the borrower.
Logic:
Upon receiving a repayment for a loan_id and amount_paid:
Identify the LoanSchedule entries that are DUE and have not been fully paid, starting from the earliest week_number.
For each identified LoanSchedule entry:
If amount_paid >= (scheduled_amount - paid_amount):
amount_paid -= (scheduled_amount - paid_amount)
paid_amount = scheduled_amount
status = PAID
Update Loan.current_outstanding -= scheduled_amount
Update Loan.last_payment_week to the current week_number.
Else (amount_paid &lt; (scheduled_amount - paid_amount)): (This scenario is out of scope as per problem statement "borrower can only pay the exact amount of payable that week or not pay at all") - Self-correction: Based on the "exact amount or not pay at all" rule, partial payments should not occur. A payment will fully cover one or more scheduled weeks.
Revised Logic for Repayments:
Upon receiving a payment for loan_id and amount_paid (which will always be an exact multiple of weekly_repayment):
Determine num_weeks_covered = amount_paid / weekly_repayment.
Fetch the num_weeks_covered LoanSchedule entries with status = DUE and the lowest week_number for the given loan_id.
For each of these LoanSchedule entries:
Set paid_amount = scheduled_amount.
Set status = PAID.
Update Loan.current_outstanding -= amount_paid.
Update Loan.last_payment_week to the week_number of the last week covered by this payment.
If current_outstanding becomes 0, set Loan.status to COMPLETED.
6.3.3. Delinquency Detection
Definition: A borrower is delinquent if they miss 2 continuous repayments.
Mechanism: Regularly scheduled batch job or real-time check upon request.
Logic:
For each loan_id with status = ACTIVE:
Identify the current week (current_week = floor((today - loan.start_date) / 7)).
Count the number of LoanSchedule entries for the loan_id where:
week_number &lt;= current_week
status = DUE (i.e., not yet paid)
If this count is >= 2, the borrower is delinquent.
6.4. API Endpoints
The Billing Engine will expose the following RESTful API endpoints:

6.4.1. POST /api/v1/loans/create_schedule
Description: Creates a new loan schedule.
Request Body:
JSON

{
  "loan_id": "string",
  "principal_amount": "decimal",
  "interest_rate": "decimal",
  "loan_term_weeks": "integer",
  "start_date": "YYYY-MM-DD"
}
Response:
201 Created on success.
400 Bad Request if input is invalid.
500 Internal Server Error on system failure.
6.4.2. POST /api/v1/loans/{loan_id}/repayment
Description: Records a repayment for a given loan.
Request Body:
JSON

{
  "amount_paid": "decimal",
  "payment_date": "YYYY-MM-DD"
}
Response:
200 OK on successful repayment.
404 Not Found if loan_id does not exist.
400 Bad Request if amount_paid is not a valid multiple of weekly repayment or if loan is already completed.
500 Internal Server Error on system failure.
6.4.3. GET /api/v1/loans/{loan_id}/schedule
Description: Retrieves the detailed repayment schedule for a loan.
Response:
200 OK with an array of schedule entries.
404 Not Found if loan_id does not exist.
500 Internal Server Error on system failure. <!-- end list -->
JSON

[
  {
    "week_number": 1,
    "due_date": "YYYY-MM-DD",
    "scheduled_amount": 110000.00,
    "paid_amount": 110000.00,
    "status": "PAID"
  },
  {
    "week_number": 2,
    "due_date": "YYYY-MM-DD",
    "scheduled_amount": 110000.00,
    "paid_amount": 0.00,
    "status": "DUE"
  }
]
6.4.4. GET /api/v1/loans/{loan_id}/outstanding
Description: Retrieves the current outstanding balance for a loan.
Response:
200 OK with the outstanding amount.
404 Not Found if loan_id does not exist.
500 Internal Server Error on system failure. <!-- end list -->
JSON

{
  "loan_id": "string",
  "outstanding_amount": "decimal"
}
6.4.5. GET /api/v1/loans/{loan_id}/delinquency_status
Description: Checks if a borrower is delinquent.
Response:
200 OK with delinquency status.
404 Not Found if loan_id does not exist.
500 Internal Server Error on system failure. <!-- end list -->
JSON

{
  "loan_id": "string",
  "is_delinquent": "boolean"
}
7. Technical Considerations
7.1. Technology Stack
Language: Java (Spring Boot) or Python (Django/Flask) - Choose based on team expertise and existing ecosystem.
Database: PostgreSQL (for ACID compliance, transactional support, and JSONB for potential future flexibility).
ORM: Hibernate (Java) or SQLAlchemy (Python).
API Framework: Spring Web (Java) or Flask/Django REST Framework (Python).
Containerization: Docker.
Orchestration: Kubernetes (for production deployment).
7.2. Scalability
Database indexing on loan_id, week_number, and status in LoanSchedule for efficient lookups.
Consider read replicas for the database if read heavy.
Microservice architecture allows horizontal scaling of the Billing Engine independently.
7.3. Error Handling
Implement robust error handling for all API endpoints.
Log errors with sufficient detail for debugging.
Use appropriate HTTP status codes for responses.
7.4. Security
Implement authentication and authorization for API endpoints (e.g., using JWTs).
Protect sensitive data (e.g., financial amounts) using appropriate encryption at rest and in transit.
Input validation for all incoming API requests to prevent injection attacks and other vulnerabilities.
7.5. Testing
Unit Tests: For individual methods and components.
Integration Tests: To verify communication between the Billing Engine and the database, and other services.
API Tests: To ensure API endpoints function as expected.
Load Tests: To simulate high traffic and assess performance.
8. Future Enhancements (Out of current scope, but worth considering)
Flexible Repayment Amounts: Allow borrowers to pay more than the weekly scheduled amount to reduce principal faster.
Partial Payments: Handle scenarios where borrowers pay less than the full weekly amount.
Dynamic Interest Rates: Support for variable interest rates.
Payment Reminders: Integration with a notification service to send payment reminders.
Reporting and Analytics: Dashboards for loan performance, delinquency trends, etc.
Audit Logging: Comprehensive logging of all financial transactions and status changes for compliance and traceability.
9. Deployment
CI/CD pipeline for automated testing and deployment.
Deployment on a cloud platform (e.g., AWS, GCP, Azure) using Kubernetes or similar orchestration.
10. Open Questions / Assumptions
What is the expected volume of loans?
What is the response time requirement for API calls?
Are there any specific compliance or regulatory requirements for financial data in Indonesia? (e.g., data residency, auditing).
How will time zones be handled for due_date and payment_date? (Assume WIB for now).
How will catch-up payments be specifically designated in the system if a borrower pays for multiple missed weeks? (The current design of updating LoanSchedule entries handles this implicitly, but explicit tagging in PaymentTransaction is also an option).
This technical specification provides a detailed blueprint for the Billing Engine. Further discussions and refinements may be required during the implementation phase.