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
