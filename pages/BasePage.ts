import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
    protected readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * Navigate to a URL
     * @param url The URL to navigate to
     */
    async goto(url: string) {
        await this.page.goto(url);
    }

    /**
     * Wait for an element to be visible and return it
     * @param selector The selector to wait for
     * @param timeout Optional timeout in milliseconds
     */
    async waitForElement(selector: string, timeout = 10000): Promise<Locator> {
        const element = this.page.locator(selector);
        await element.waitFor({ state: 'visible', timeout });
        return element;
    }

    /**
     * Check if an element is visible
     * @param selector The selector to check
     */
    async isElementVisible(selector: string): Promise<boolean> {
        const element = this.page.locator(selector);
        return await element.isVisible();
    }
} 