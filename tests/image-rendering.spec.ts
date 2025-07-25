// tests/imageSeries.spec.ts

import { test, expect } from '@playwright/test';
import { ImageViewerPage } from '../pages/ImageViewerPage';
import { SERIES_CONFIG } from '../interfaces/SeriesConfig';

/**
 * End-to-End Test Suite: Medical Image Viewer
 * 
 * Purpose: Validates the core functionality of medical image viewer application
 * Focus Areas:
 * - Image rendering accuracy through pixel-perfect comparison
 * - Navigation mechanisms (button clicks and mouse wheel)
 * - Series switching functionality
 * - UI state management
 * 
 * Test Data:
 * - Series 1: 7 images
 * - Series 2: 6 images
 * - Fixture Location: fixture/series{1,2}/
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
     * Test Case ID: MIVT-001
     * 
     * Objective: Verify pixel-perfect rendering of medical images across series
     * 
     * Test Steps:
     * 1. Load each series
     * 2. Compare each image with reference fixtures
     * 3. Validate navigation state
     * 
     * Validation:
     * - Exact pixel matching with reference images
     * - Correct navigation button states
     * - Proper image sequence
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
     * Test Case ID: MIVT-002
     * 
     * Objective: Validate mouse wheel navigation functionality
     * 
     * Test Steps:
     * 1. Navigate through series using mouse wheel
     * 2. Verify image sequence and indices
     * 3. Validate UI state updates
     * 
     * Validation:
     * - Correct image sequence on scroll
     * - Accurate index updates
     * - Proper boundary behavior
     * - Patient information overlay consistency
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
