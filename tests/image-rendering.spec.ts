// tests/imageSeries.spec.ts

import { test, expect } from '@playwright/test';
import { ImageViewerPage } from '../pages/ImageViewerPage';
import { SERIES_CONFIG } from '../interfaces/SeriesConfig';

/**
 * 
 * 
 * @author Ahon4
 * @version 1.0.0
 * @package Medical.ImageViewer
 * @group E2E
 */
test.describe('Medical Image Viewer - Core Functionality', () => {
    let imageViewerPage: ImageViewerPage;

    // Extended timeout for image processing operations
    test.setTimeout(120000);

    test.beforeEach(async ({ page }) => {
        // Initialize page object and set up test environment
        imageViewerPage = new ImageViewerPage(page);
        await imageViewerPage.goto('https://diit-playwright-qa-test.vercel.app/');
        await imageViewerPage.acceptDisclaimer();
    });

    /**
     * 
     * Objective: Verify pixel-perfect rendering of medical images across series
     * 
     */
    test('should maintain pixel-perfect accuracy for all medical images', async () => {
        for (const [seriesIndex, currentSeries] of SERIES_CONFIG.entries()) {
            test.info().annotations.push({
                type: 'info',
                description: `Validating ${currentSeries.name} image rendering`
            });

            // Handle series navigation
            if (seriesIndex > 0) {
                await imageViewerPage.switchToSeries2();
            }

            // Validate each image in series
            for (let imageIndex = 1; imageIndex <= currentSeries.totalImages; imageIndex++) {
                // Perform pixel-perfect comparison
                await imageViewerPage.compareCurrentImage(
                    imageIndex,
                    currentSeries.fixturePath,
                    currentSeries.fixturePrefix
                );

                // Validate navigation state and proceed
                if (imageIndex < currentSeries.totalImages) {
                    await imageViewerPage.clickNext();
                } else {
                    await imageViewerPage.isNextButtonDisabled();
                }
            }
        }
    });

    /**
     * 
     * 
     * Objective: Validate mouse wheel navigation functionality
     * 
     *
     */
    test('should handle mouse wheel navigation accurately', async () => {
        for (const [seriesIndex, currentSeries] of SERIES_CONFIG.entries()) {
            test.info().annotations.push({
                type: 'info',
                description: `Validating mouse wheel navigation for ${currentSeries.name}`
            });

            // Series setup
            if (seriesIndex > 0) {
                await imageViewerPage.switchToSeries2();
            }

            // Initial state validation
            await imageViewerPage.verifyPatientInfoOverlay();
            let sliceInfo = await imageViewerPage.getCurrentSliceInfo();
            expect(sliceInfo.current, `Initial image index for ${currentSeries.name}`).toBe(1);
            expect(sliceInfo.total, `Total images for ${currentSeries.name}`).toBe(currentSeries.totalImages);

            // Forward navigation validation
            test.info().annotations.push({
                type: 'step',
                description: `Validating forward scroll navigation - ${currentSeries.name}`
            });

            for (let i = 1; i < currentSeries.totalImages; i++) {
                await imageViewerPage.scrollMouseWheel('down');
                sliceInfo = await imageViewerPage.getCurrentSliceInfo();
                expect(sliceInfo.current, `Forward navigation index in ${currentSeries.name}`).toBe(i + 1);
            }

            // Boundary validation - last image
            sliceInfo = await imageViewerPage.getCurrentSliceInfo();
            expect(sliceInfo.current, `Upper boundary check for ${currentSeries.name}`).toBe(currentSeries.totalImages);

            // Backward navigation validation
            test.info().annotations.push({
                type: 'step',
                description: `Validating backward scroll navigation - ${currentSeries.name}`
            });

            for (let i = currentSeries.totalImages; i > 1; i--) {
                await imageViewerPage.scrollMouseWheel('up');
                sliceInfo = await imageViewerPage.getCurrentSliceInfo();
                expect(sliceInfo.current, `Backward navigation index in ${currentSeries.name}`).toBe(i - 1);
            }

            // Boundary validation - first image
            sliceInfo = await imageViewerPage.getCurrentSliceInfo();
            expect(sliceInfo.current, `Lower boundary check for ${currentSeries.name}`).toBe(1);
        }
    });
});
