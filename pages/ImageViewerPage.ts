import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import pixelmatch from 'pixelmatch';

export class ImageViewerPage extends BasePage {
    // Selectors
    private readonly nextImageButton = '[data-testid="next-image-button"]';
    private readonly currentMedicalImage = '[data-testid="medical-image"]';
    private readonly disclaimerAcceptButton = '[data-testid="welcome-popup-accept-button"]';
    private readonly switchToSeries2Button = '[data-testid="series-2-button"]';

    constructor(page: Page) {
        super(page);
    }

    /**
     * Accept the welcome disclaimer if it's visible
     */
    async acceptDisclaimer() {
        if (await this.isElementVisible(this.disclaimerAcceptButton)) {
            await this.page.locator(this.disclaimerAcceptButton).click();
        }
    }

    /**
     * Wait for image to be stable
     * @returns Promise<void>
     */
    private async waitForImageStability() {
        const medicalImage = this.page.locator(this.currentMedicalImage);
        
        // Wait for image to be visible
        await medicalImage.waitFor({ state: 'visible', timeout: 10000 });
        
        // Wait for network idle
        await this.page.waitForLoadState('networkidle');
        
        // Get initial src
        const initialImageSrc = await medicalImage.getAttribute('src');
        
        // Wait a bit and check if src remains the same
        await this.page.waitForTimeout(1000);
        const currentImageSrc = await medicalImage.getAttribute('src');
        
        expect(currentImageSrc).toBe(initialImageSrc);
    }

    /**
     * Navigate to the next image
     * @returns Promise<void>
     */
    async clickNext() {
        const nextButton = this.page.locator(this.nextImageButton);
        await expect(nextButton).toBeEnabled();
        const currentImageSrc = await this.getCurrentImageSrc();
        await nextButton.click();
        await expect(this.page.locator(this.currentMedicalImage)).not.toHaveAttribute('src', currentImageSrc || '');
        await this.waitForImageStability();
    }

    /**
     * Switch to Series 2
     */
    async switchToSeries2() {
        // Get current image src to verify it changes
        const currentImageSrc = await this.getCurrentImageSrc();
        
        // Click series 2 button
        const series2Button = this.page.locator(this.switchToSeries2Button);
        await expect(series2Button).toBeEnabled();
        await series2Button.click();

        // Wait for 5 seconds to ensure series switch is complete
        await this.page.waitForTimeout(5000);

        // Wait for image to change
        await expect(this.page.locator(this.currentMedicalImage)).not.toHaveAttribute('src', currentImageSrc || '');
        
        // Wait for new image to be stable
        await this.waitForImageStability();
        
        // Additional wait for any transitions
        await this.page.waitForTimeout(1000);
    }

    /**
     * Get the current image source
     */
    async getCurrentImageSrc(): Promise<string | null> {
        return await this.page.locator(this.currentMedicalImage).getAttribute('src');
    }

    /**
     * Check if the next button is disabled
     */
    async isNextButtonDisabled() {
        await expect(this.page.locator(this.nextImageButton)).toBeDisabled();
    }

    /**
     * Compare current image with fixture
     * @param imageIndex Image index
     * @param fixturesDirectory Directory containing fixtures
     * @param fixturePrefix Fixture file prefix
     */
    async compareCurrentImage(imageIndex: number, fixturesDirectory: string, fixturePrefix: string) {
        // Ensure image is stable before comparison
        await this.waitForImageStability();
        
        // Get current image data
        const medicalImage = await this.waitForElement(this.currentMedicalImage);
        const imageSrc = await medicalImage.getAttribute('src');
        expect(imageSrc).toBeTruthy();
        const imageResponse = await this.page.request.get(imageSrc!);
        expect(imageResponse.status()).toBe(200);
        const renderedImageBuffer = await imageResponse.body();

        // Verify and compare with fixture
        const fixtureFilePath = path.join(fixturesDirectory, `${fixturePrefix}_${imageIndex}.jpeg`);
        expect(fs.existsSync(fixtureFilePath), `Fixture not found: ${fixtureFilePath}`).toBe(true);

        // Convert both images to raw RGBA
        const { data: renderedImageData, info: renderedImageInfo } = await sharp(renderedImageBuffer)
            .raw().ensureAlpha()
            .toBuffer({ resolveWithObject: true });
        const { data: fixtureImageData, info: fixtureImageInfo } = await sharp(fs.readFileSync(fixtureFilePath))
            .raw().ensureAlpha()
            .toBuffer({ resolveWithObject: true });

        // Verify dimensions
        expect(renderedImageInfo.width).toBe(fixtureImageInfo.width);
        expect(renderedImageInfo.height).toBe(fixtureImageInfo.height);
        expect(renderedImageInfo.channels).toBe(fixtureImageInfo.channels);

        // Compare pixels
        const diffBuffer = Buffer.alloc(renderedImageInfo.width * renderedImageInfo.height * renderedImageInfo.channels);
        const mismatchedPixels = pixelmatch(
            fixtureImageData,
            renderedImageData,
            diffBuffer,
            renderedImageInfo.width,
            renderedImageInfo.height,
            { threshold: 0 }
        );

        // Save comparison artifacts
        const outputDirectory = path.resolve(__dirname, '..', 'output');
        if (!fs.existsSync(outputDirectory)) fs.mkdirSync(outputDirectory);
        
        await sharp(diffBuffer, {
            raw: { 
                width: renderedImageInfo.width, 
                height: renderedImageInfo.height, 
                channels: renderedImageInfo.channels 
            },
        })
            .jpeg({ quality: 90 })
            .toFile(path.join(outputDirectory, `diff_${fixturePrefix}_${imageIndex}.jpeg`));
        
        fs.writeFileSync(
            path.join(outputDirectory, `rendered_${fixturePrefix}_${imageIndex}.jpeg`), 
            renderedImageBuffer
        );

        expect(mismatchedPixels, `Image ${fixturePrefix}_${imageIndex} has ${mismatchedPixels} mismatched pixels`).toBe(0);
    }
} 