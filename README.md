# AQA Inforce - Oleksandr Fimushkin

This repository contains the automated UI and API tests for the `automationintesting.online` platform as part of the AQA technical assessment for InForce.

## Project Structure

- `e2e/ui.spec.js`: Contains Playwright UI automation tests for room booking flows.
- `e2e/api.spec.js`: Contains Playwright API automation tests for room management and booking flows.
- `test-cases.txt`: Contains the detailed manual test cases for the UI flows.
- `playwright.config.js`: Configuration file for Playwright.

## Prerequisites

- Node.js (version 16 or higher recommended)
- npm (comes with Node.js)

## Setup Instructions

1. Clone this repository:
   ```bash
   git clone <repository_url>
   cd aqa-inforce-Oleksandr-Fimushkin
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Tests

To run all tests (UI and API) in headless mode:
```bash
npx playwright test
```

To run only UI tests:
```bash
npx playwright test e2e/ui.spec.js
```

To run only API tests:
```bash
npx playwright test e2e/api.spec.js
```

To view the HTML report after a test run:
```bash
npx playwright show-report
```

## Built With

- [Playwright](https://playwright.dev/) - End-to-end testing framework
- [@faker-js/faker](https://fakerjs.dev/) - Used for generating realistic mock data

---

## Task Description

Dear candidate, we are pleased that you are one step ahead on receiving an offer. The examples in this task were created on Cypress, but you can use any type of framework.

### Application Details

- **App URL:** https://automationintesting.online/
- **Admin Panel:** https://automationintesting.online/#/admin
- **Admin Credentials:** admin/password
- **User App:** No credentials required

### Part 1: Manual Testing and Test Documentation

Create detailed test cases in `test-cases.txt` for the UI flow described below:

**UI Test Cases:**
1. Check that the room can be booked with valid data
2. Check that the room can't be booked with invalid data
3. Check that the earlier booked dates show as Unavailable

### Part 2: Automation Process

#### 1. UI Automation Tests
Write UI automation tests using the test cases from `test-cases.txt` file

#### 2. API Automation Tests
Implement API automation tests for the following flows:

- **Create a Room:** Using the Admin page API and verify it appears on the User page API
- **Book a Room:** Using the User page API, then verify it shows as booked on the Admin page API
- **Edit Room:** In the Admin page Rooms menu using API and verify changes on the User page API
- **Delete Room:** Using the Admin page API and verify it's removed from the User page API

**Additional Notes:**
- You are free to implement custom commands or techniques
- Using intercept in your tests will be a plus :)

### Testing Approaches

**UI Testing:**
- Valid data booking scenarios
- Invalid data rejection
- Date availability verification

**API Testing:**
- Room CRUD operations
- Cross-page verification
- Booking state management

### Repository Structure

```
aqa-inforce-Oleksandr-Fimushkin
├── e2e/
│   ├── ui.spec.js
│   └── api.spec.js
├── test-cases.txt
├── playwright.config.js
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
```

### Submission Guidelines

- Repository is hosted on GitHub
- README.md includes setup and execution instructions
- Test cases documentation provided in `test-cases.txt`
- All code is automated using Playwright framework
- Tests are configured to run in headless mode

---

**Best of luck from the InForce team!**
If you have any questions, feel free to ask. We're here to support you throughout the task. 
