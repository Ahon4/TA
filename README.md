# Playwright Automation Framework (TypeScript)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Run tests:**
   ```bash
   npx playwright test
   ```
3. **View Allure Report:**
   ```bash
   npx allure-playwright generate allure-results --clean && npx allure open
   ```

## Project Structure
- `playwright.config.ts` – Playwright configuration (baseURL, reporters, etc.)
- `tests/` – Test specs
- `pages/` – Page Object Model (POM) classes
- `allure-results/` – Allure report output

## POM Example
Create your page objects in the `pages/` directory and import them in your tests. 