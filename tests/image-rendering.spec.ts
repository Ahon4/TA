// tests/imageSeries.spec.ts

import { test, expect } from '@playwright/test';
import { ImageViewerPage } from '../pages/ImageViewerPage';
import { SERIES_CONFIG } from '../interfaces/SeriesConfig';

/**
 * E2E Test Suite: Medical Image Viewer Core Functionality
 * 
 * Key Testing Concepts Demonstrated:
 * 1. Page Object Model (POM) Pattern
 * 2. Data-Driven Testing
 * 3. Test Steps and Annotations
 * 4. Component-based Testing
 * 5. Visual Regression Testing
 * 
 * @author Ahon4
 * @version 1.0.0
 * @package Medical.ImageViewer
 * @group E2E
 */
test.describe('Medical Image Viewer - Core Functionality', () => {
    let imageViewerPage: ImageViewerPage;

    /**
     * Test Setup: Before Each Test
     * - Initializes page object
     * - Navigates to application
     * - Handles initial disclaimer
     */
    test.beforeEach(async ({ page }) => {
        imageViewerPage = new ImageViewerPage(page);
        await imageViewerPage.goto('https://diit-playwright-qa-test.vercel.app/');
        await imageViewerPage.acceptDisclaimer();
    });

    // Extended timeout for image processing
    test.setTimeout(120000);

    test('TC-1: should maintain pixel-perfect accuracy for all medical images', async () => {
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

    test('TC-2: should handle mouse wheel navigation accurately', async () => {
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

    test('TC-3: should handle series switching and panel updates correctly', async () => {
        // Test data for series switching scenarios
        const seriesSwitchingTests = [
            {
                fromSeries: { number: 1, totalImages: 7 },
                toSeries: { number: 2, totalImages: 6 },
                navigationSteps: 2,
                description: 'Switch from Series 1 to Series 2'
            },
            {
                fromSeries: { number: 2, totalImages: 6 },
                toSeries: { number: 1, totalImages: 7 },
                navigationSteps: 3,
                description: 'Switch from Series 2 to Series 1'
            }
        ];

        // STEP 1: Test basic series switching functionality
        for (const testCase of seriesSwitchingTests) {
            await test.step(testCase.description, async () => {
                // Initial Setup and Validation
                await test.step('Setup and validate initial state', async () => {
                    test.info().annotations.push({
                        type: 'info',
                        description: `Starting from Series ${testCase.fromSeries.number}`
                    });

                    if (testCase.fromSeries.number === 2) {
                        await imageViewerPage.switchToSeries2();
                    }

                    let sliceInfo = await imageViewerPage.getCurrentSliceInfo();
                    expect(sliceInfo.current, `Initial image index for Series ${testCase.fromSeries.number}`).toBe(1);
                    expect(sliceInfo.total, `Total images for Series ${testCase.fromSeries.number}`)
                        .toBe(testCase.fromSeries.totalImages);
                    
                    await imageViewerPage.verifyLeftPanelInfo(
                        testCase.fromSeries.number as 1 | 2,
                        1,
                        testCase.fromSeries.totalImages
                    );
                    await imageViewerPage.verifySeriesHighlight(
                        testCase.fromSeries.number === 1 ? 'series1' : 'series2'
                    );
                    await imageViewerPage.compareCurrentImage(
                        1,
                        SERIES_CONFIG[testCase.fromSeries.number - 1].fixturePath,
                        SERIES_CONFIG[testCase.fromSeries.number - 1].fixturePrefix
                    );
                });

                // Navigate Through Source Series
                await test.step('Navigate through source series', async () => {
                    for (let i = 1; i <= testCase.navigationSteps; i++) {
                        await imageViewerPage.clickNext();
                    }
                    
                    const sliceInfo = await imageViewerPage.getCurrentSliceInfo();
                    expect(sliceInfo.current, `Navigation index in Series ${testCase.fromSeries.number}`)
                        .toBe(testCase.navigationSteps + 1);
                    
                    await imageViewerPage.verifyLeftPanelInfo(
                        testCase.fromSeries.number as 1 | 2,
                        testCase.navigationSteps + 1,
                        testCase.fromSeries.totalImages
                    );
                });

                // Switch Series and Verify
                await test.step(`Switch to Series ${testCase.toSeries.number}`, async () => {
                    if (testCase.toSeries.number === 2) {
                        await imageViewerPage.switchToSeries2();
                    } else {
                        await imageViewerPage.switchToSeries1();
                    }

                    const sliceInfo = await imageViewerPage.getCurrentSliceInfo();
                    expect(sliceInfo.current, `Image index should reset to 1 for Series ${testCase.toSeries.number}`)
                        .toBe(1);
                    expect(sliceInfo.total, `Total images for Series ${testCase.toSeries.number}`)
                        .toBe(testCase.toSeries.totalImages);
                    
                    await imageViewerPage.verifyLeftPanelInfo(
                        testCase.toSeries.number as 1 | 2,
                        1,
                        testCase.toSeries.totalImages
                    );
                    await imageViewerPage.verifySeriesHighlight(
                        testCase.toSeries.number === 1 ? 'series1' : 'series2'
                    );
                    await imageViewerPage.compareCurrentImage(
                        1,
                        SERIES_CONFIG[testCase.toSeries.number - 1].fixturePath,
                        SERIES_CONFIG[testCase.toSeries.number - 1].fixturePrefix
                    );
                });
            });
        }

        // STEP 2: Test rapid series switching stability
        await test.step('Verify stability during rapid series switching', async () => {
            // Quick switch to Series 2
            await imageViewerPage.switchToSeries2();
            await imageViewerPage.verifyLeftPanelInfo(2, 1, SERIES_CONFIG[1].totalImages);
            await imageViewerPage.verifySeriesHighlight('series2');

            // Immediately switch back to Series 1
            await imageViewerPage.switchToSeries1();
            await imageViewerPage.verifyLeftPanelInfo(1, 1, SERIES_CONFIG[0].totalImages);
            await imageViewerPage.verifySeriesHighlight('series1');

            // Verify final state
            const finalSliceInfo = await imageViewerPage.getCurrentSliceInfo();
            expect(finalSliceInfo.current, 'Image index should be 1 after rapid switching').toBe(1);
            expect(finalSliceInfo.total, 'Total images should be correct after rapid switching')
                .toBe(SERIES_CONFIG[0].totalImages);
        });
    });

    test('TC-4: should display and maintain correct patient information', async () => {
        // Test data
        const expectedPatientInfo = {
            name: 'John Doe',
            id: 'P001234567'
        };

        // STEP 1: Verify initial patient information display
        await test.step('Verify initial patient information', async () => {
            // Verify overlay structure
            await imageViewerPage.verifyPatientInfoOverlay();
            
            // Verify patient information content
            await imageViewerPage.patientInfo.verifyPatientInfo(
                expectedPatientInfo.name,
                expectedPatientInfo.id
            );
        });

        // STEP 2: Verify information persistence during Series 1 navigation
        await test.step('Verify information persistence in Series 1', async () => {
            // Navigate through Series 1
            for (let i = 1; i < SERIES_CONFIG[0].totalImages; i++) {
                await imageViewerPage.clickNext();
                await imageViewerPage.patientInfo.verifyPatientInfoPersistence();
            }
        });

        // STEP 3: Verify information persistence during series switch
        await test.step('Verify information persistence during series switch', async () => {
            // Switch to Series 2
            await imageViewerPage.switchToSeries2();
            
            // Verify patient information remains unchanged
            await imageViewerPage.patientInfo.verifyPatientInfo(
                expectedPatientInfo.name,
                expectedPatientInfo.id
            );

            // Navigate through Series 2
            for (let i = 1; i < SERIES_CONFIG[1].totalImages; i++) {
                await imageViewerPage.clickNext();
                await imageViewerPage.patientInfo.verifyPatientInfoPersistence();
            }
        });

        // STEP 4: Verify information persistence during rapid series switching
        await test.step('Verify information persistence during rapid switching', async () => {
            // Perform rapid switches between series
            for (let i = 0; i < 3; i++) {
                await imageViewerPage.switchToSeries1();
                await imageViewerPage.patientInfo.verifyPatientInfoPersistence();
                
                await imageViewerPage.switchToSeries2();
                await imageViewerPage.patientInfo.verifyPatientInfoPersistence();
            }
        });
    });
});
