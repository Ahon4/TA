import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { SeriesNavigator } from './components/SeriesNavigator';
import { ImageComparator } from './components/ImageComparator';
import { PatientInfo } from './components/PatientInfo';
import { SeriesPanel } from './components/SeriesPanel';

export class ImageViewerPage extends BasePage {
    private readonly disclaimerAcceptButton = '[data-testid="welcome-popup-accept-button"]';
    
    // Component instances
    readonly seriesNavigator: SeriesNavigator;
    readonly imageComparator: ImageComparator;
    readonly patientInfo: PatientInfo;
    readonly seriesPanel: SeriesPanel;

    constructor(page: Page) {
        super(page);
        this.seriesNavigator = new SeriesNavigator(page);
        this.imageComparator = new ImageComparator(page);
        this.patientInfo = new PatientInfo(page);
        this.seriesPanel = new SeriesPanel(page);
    }

    /**
     * Accept the welcome disclaimer if it's visible
     */
    async acceptDisclaimer() {
        if (await this.isElementVisible(this.disclaimerAcceptButton)) {
            await this.page.locator(this.disclaimerAcceptButton).click();
        }
    }

    // Delegate methods to components for cleaner test code
    async clickNext() {
        await this.seriesNavigator.clickNext();
    }

    async switchToSeries1() {
        await this.seriesNavigator.switchToSeries1();
    }

    async switchToSeries2() {
        await this.seriesNavigator.switchToSeries2();
    }

    async getCurrentSliceInfo() {
        return await this.seriesNavigator.getCurrentSliceInfo();
    }

    async verifySeriesHighlight(series: 'series1' | 'series2') {
        await this.seriesNavigator.verifySeriesHighlight(series);
    }

    async isNextButtonDisabled() {
        await this.seriesNavigator.isNextButtonDisabled();
    }

    async compareCurrentImage(imageIndex: number, fixturesDirectory: string, fixturePrefix: string) {
        await this.imageComparator.compareCurrentImage(imageIndex, fixturesDirectory, fixturePrefix);
    }

    async verifyPatientInfoOverlay() {
        await this.patientInfo.verifyPatientInfoOverlay();
    }

    /**
     * Scroll the mouse wheel to navigate images
     * @param direction 'up' or 'down'
     */
    async scrollMouseWheel(direction: 'up' | 'down') {
        const image = this.page.locator('[data-testid="medical-image"]');
        await image.scrollIntoViewIfNeeded();
        const currentSrc = await image.getAttribute('src');
        await image.hover();
        await this.page.mouse.wheel(0, direction === 'up' ? -100 : 100);
        await image.waitFor();
        await this.page.waitForLoadState('networkidle');
        await image.waitFor({ state: 'visible' });
    }

    /**
     * Verify the left panel information
     * @param seriesNumber Current series number (1 or 2)
     * @param currentImage Current image number
     * @param totalImages Total images in series
     */
    async verifyLeftPanelInfo(seriesNumber: 1 | 2, currentImage: number, totalImages: number) {
        await this.seriesPanel.verifyPanelStructure();
        await this.seriesPanel.verifyCurrentSeriesInfo(seriesNumber, currentImage, totalImages);
        await this.seriesPanel.verifySeriesButtonStates(seriesNumber);
        await this.seriesPanel.verifySeriesButtonInfo(seriesNumber, totalImages);
    }
} 