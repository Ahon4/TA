import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class SeriesPanel extends BasePage {
    // Panel elements
    private readonly seriesSelectionTitle = '[data-testid="series-selection-title"]';
    private readonly seriesSelectionButtons = '[data-testid="series-selection-buttons"]';
    private readonly series1Button = '[data-testid="series-1-button"]';
    private readonly series2Button = '[data-testid="series-2-button"]';
    private readonly currentSeriesInfo = '[data-testid="current-series-info"]';
    private readonly currentSeriesName = '[data-testid="current-series-name"]';
    private readonly currentImageIndex = '[data-testid="current-image-index"]';

    constructor(page: Page) {
        super(page);
    }

    /**
     * Verify the current series information in the panel
     * @param seriesNumber The series number (1 or 2)
     * @param currentImage Current image number
     * @param totalImages Total images in the series
     */
    async verifyCurrentSeriesInfo(seriesNumber: 1 | 2, currentImage: number, totalImages: number) {
        const seriesInfo = this.page.locator(this.currentSeriesInfo);
        await expect(seriesInfo).toBeVisible();
        await expect(seriesInfo).toHaveAttribute('role', 'status');
        await expect(seriesInfo).toHaveAttribute('aria-live', 'polite');

        await expect(this.page.locator(this.currentSeriesName))
            .toHaveText(`Series ${seriesNumber} - JPEG Images`);
        
        await expect(this.page.locator(this.currentImageIndex))
            .toHaveText(`Image ${currentImage} of ${totalImages}`);
    }

    /**
     * Verify the series button states
     * @param activeSeries The currently active series (1 or 2)
     */
    async verifySeriesButtonStates(activeSeries: 1 | 2) {
        // Verify active series button
        const activeButton = this.page.locator(activeSeries === 1 ? this.series1Button : this.series2Button);
        await expect(activeButton).toHaveClass(/bg-blue-600/);
        await expect(activeButton).toHaveAttribute('aria-pressed', 'true');

        // Verify inactive series button
        const inactiveButton = this.page.locator(activeSeries === 1 ? this.series2Button : this.series1Button);
        await expect(inactiveButton).toHaveClass(/bg-gray-700/);
        await expect(inactiveButton).toHaveAttribute('aria-pressed', 'false');
    }

    /**
     * Verify series button information
     * @param seriesNumber The series number (1 or 2)
     * @param totalImages Total images in the series
     */
    async verifySeriesButtonInfo(seriesNumber: 1 | 2, totalImages: number) {
        const button = this.page.locator(seriesNumber === 1 ? this.series1Button : this.series2Button);
        await expect(button.locator('div').nth(0)).toHaveText(`Series ${seriesNumber}`);
        await expect(button.locator('div').nth(1)).toHaveText(`${totalImages} images`);
        await expect(button.locator('div').nth(2)).toHaveText('JPEG Format');
    }

    /**
     * Verify the complete panel structure
     */
    async verifyPanelStructure() {
        await expect(this.page.locator(this.seriesSelectionTitle)).toHaveText('Series Selection');
        const buttonsGroup = this.page.locator(this.seriesSelectionButtons);
        await expect(buttonsGroup).toHaveAttribute('role', 'group');
        await expect(buttonsGroup).toHaveAttribute('aria-label', 'Available image series');
    }
} 