import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class SeriesNavigator extends BasePage {
    // Selectors
    private readonly nextImageButton = '[data-testid="next-image-button"]';
    private readonly switchToSeries2Button = '[data-testid="series-2-button"]';
    private readonly switchToSeries1Button = '[data-testid="series-1-button"]';
    private readonly sliceInformation = '[data-testid="slice-information"]';

    constructor(page: Page) {
        super(page);
    }

    /**
     * Navigate to the next image
     */
    async clickNext() {
        const nextButton = this.page.locator(this.nextImageButton);
        await expect(nextButton).toBeEnabled();
        const currentImageSrc = await this.getCurrentImageSrc();
        await nextButton.click();
        await expect(this.page.locator('[data-testid="medical-image"]')).not.toHaveAttribute('src', currentImageSrc || '');
        await this.waitForImageStability();
    }

    /**
     * Switch to Series 2
     */
    async switchToSeries2() {
        // First check if we're already on Series 2
        const series2Button = this.page.locator(this.switchToSeries2Button);
        const isAlreadyOnSeries2 = await series2Button.getAttribute('aria-pressed') === 'true';
        
        if (isAlreadyOnSeries2) {
            // Already on Series 2, no need to switch
            return;
        }

        // Get initial state before switching
        const medicalImage = this.page.locator('[data-testid="medical-image"]');
        const initialAlt = await medicalImage.getAttribute('alt');

        // Perform the switch
        await expect(series2Button).toBeEnabled();
        await series2Button.click();
        await this.page.waitForTimeout(2000);
        // Wait for and verify the switch
        await expect(medicalImage).not.toHaveAttribute('alt', initialAlt || '', { timeout: 10000 });
        await this.page.waitForLoadState('networkidle');
        await expect(series2Button).toHaveAttribute('aria-pressed', 'true');
    }

    /**
     * Switch to Series 1
     */
    async switchToSeries1() {
        const currentImageSrc = await this.getCurrentImageSrc();
        const series1Button = this.page.locator(this.switchToSeries1Button);
        await expect(series1Button).toBeEnabled();
        await series1Button.click();
        await this.page.waitForTimeout(5000);
        await expect(this.page.locator('[data-testid="medical-image"]')).not.toHaveAttribute('src', currentImageSrc || '');
        await this.waitForImageStability();
        await this.page.waitForTimeout(1000);
    }

    /**
     * Get current slice information (e.g., "1 / 7")
     */
    async getCurrentSliceInfo(): Promise<{ current: number; total: number }> {
        const sliceText = await this.page.locator(this.sliceInformation).textContent();
        const [current, total] = sliceText!.split(' / ').map(Number);
        return { current, total };
    }

    /**
     * Verify series highlight state
     */
    async verifySeriesHighlight(series: 'series1' | 'series2') {
        const activeButton = this.page.locator(series === 'series1' ? this.switchToSeries1Button : this.switchToSeries2Button);
        const inactiveButton = this.page.locator(series === 'series1' ? this.switchToSeries2Button : this.switchToSeries1Button);
        
        // Verify button states using aria-pressed attribute
        await expect(activeButton).toHaveAttribute('aria-pressed', 'true');
        await expect(inactiveButton).toHaveAttribute('aria-pressed', 'false');

        // Verify visual states using background color classes
        await expect(activeButton).toHaveClass(/bg-blue-600/);
        await expect(inactiveButton).toHaveClass(/bg-gray-700/);
    }

    /**
     * Check if the next button is disabled
     */
    async isNextButtonDisabled() {
        await expect(this.page.locator(this.nextImageButton)).toBeDisabled();
    }

    private async getCurrentImageSrc(): Promise<string | null> {
        return await this.page.locator('[data-testid="medical-image"]').getAttribute('src');
    }

    private async waitForImageStability() {
        const medicalImage = this.page.locator('[data-testid="medical-image"]');
        await medicalImage.waitFor({ state: 'visible', timeout: 10000 });
        await this.page.waitForLoadState('networkidle');
        const initialImageSrc = await medicalImage.getAttribute('src');
        await this.page.waitForTimeout(1000);
        const currentImageSrc = await medicalImage.getAttribute('src');
        expect(currentImageSrc).toBe(initialImageSrc);
    }
} 