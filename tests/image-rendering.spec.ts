// tests/imageSeries.spec.ts

import { test } from '@playwright/test';
import { ImageViewerPage } from '../pages/ImageViewerPage';
import { SERIES_CONFIG } from '../interfaces/SeriesConfig';

// Set timeout for all tests in this file
test.setTimeout(120000); // 2 minutes

test.describe('Image Viewer Tests', () => {
    let imageViewerPage: ImageViewerPage;

    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        imageViewerPage = new ImageViewerPage(page);
        await imageViewerPage.goto('https://diit-playwright-qa-test.vercel.app/');
        await imageViewerPage.acceptDisclaimer();
    });


    test.afterAll(async ({ browser }) => {
        await browser.close();
    });

    test('Verify all series images with pixel-perfect comparison', async () => {
        // Process each series
        for (let seriesIndex = 0; seriesIndex < SERIES_CONFIG.length; seriesIndex++) {
            const currentSeries = SERIES_CONFIG[seriesIndex];
            
            // Switch to Series 2 if not on first series
            if (seriesIndex > 0) {
                await imageViewerPage.switchToSeries2();
            }

            // Process all images in current series
            for (let imageIndex = 1; imageIndex <= currentSeries.totalImages; imageIndex++) {
                await imageViewerPage.compareCurrentImage(
                    imageIndex,
                    currentSeries.fixturePath,
                    currentSeries.fixturePrefix
                );

                // Handle navigation
                if (imageIndex < currentSeries.totalImages) {
                    await imageViewerPage.clickNext();
                } else {
                    await imageViewerPage.isNextButtonDisabled();
                }
            }
        }
    });
});
