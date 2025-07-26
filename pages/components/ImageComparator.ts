import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ImageComparator extends BasePage {
    private readonly currentMedicalImage = '[data-testid="medical-image"]';

    constructor(page: Page) {
        super(page);
    }

    /**
     * Compare current image with fixture
     * @param imageIndex Image index
     * @param fixturesDirectory Directory containing fixtures
     * @param fixturePrefix Fixture file prefix
     */
    async compareCurrentImage(imageIndex: number, fixturesDirectory: string, fixturePrefix: string) {
        await this.waitForImageStability();
        
        const medicalImage = await this.waitForElement(this.currentMedicalImage);
        const imageSrc = await medicalImage.getAttribute('src');
        expect(imageSrc).toBeTruthy();
        const imageResponse = await this.page.request.get(imageSrc!);
        expect(imageResponse.status()).toBe(200);
        const renderedImageBuffer = await imageResponse.body();

        const fixtureFilePath = path.join(fixturesDirectory, `${fixturePrefix}_${imageIndex}.jpeg`);
        expect(fs.existsSync(fixtureFilePath), `Fixture not found: ${fixtureFilePath}`).toBe(true);

        const { data: renderedImageData, info: renderedImageInfo } = await sharp(renderedImageBuffer)
            .raw().ensureAlpha()
            .toBuffer({ resolveWithObject: true });
        const { data: fixtureImageData, info: fixtureImageInfo } = await sharp(fs.readFileSync(fixtureFilePath))
            .raw().ensureAlpha()
            .toBuffer({ resolveWithObject: true });

        expect(renderedImageInfo.width).toBe(fixtureImageInfo.width);
        expect(renderedImageInfo.height).toBe(fixtureImageInfo.height);
        expect(renderedImageInfo.channels).toBe(fixtureImageInfo.channels);

        const pixelmatch = (await import('pixelmatch')).default;
        const diffBuffer = Buffer.alloc(renderedImageInfo.width * renderedImageInfo.height * renderedImageInfo.channels);
        const mismatchedPixels = pixelmatch(
            fixtureImageData,
            renderedImageData,
            diffBuffer,
            renderedImageInfo.width,
            renderedImageInfo.height,
            { threshold: 0 }
        );

        const outputDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'output');
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

    private async waitForImageStability() {
        const medicalImage = this.page.locator(this.currentMedicalImage);
        await medicalImage.waitFor({ state: 'visible', timeout: 10000 });
        await this.page.waitForLoadState('networkidle');
        const initialImageSrc = await medicalImage.getAttribute('src');
        await this.page.waitForTimeout(3000);
        const currentImageSrc = await medicalImage.getAttribute('src');
        expect(currentImageSrc).toBe(initialImageSrc);
    }
} 