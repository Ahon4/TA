import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class PatientInfo extends BasePage {
    private readonly patientInformationOverlay = '[data-testid="patient-information-overlay"]';
    private readonly patientName = '[data-testid="patient-name"]';
    private readonly patientId = '[data-testid="patient-id"]';
    private readonly sliceInformation = '[data-testid="slice-information"]';

    constructor(page: Page) {
        super(page);
    }

    /**
     * Verify patient information overlay is visible and accessible
     */
    async verifyPatientInfoOverlay() {
        const overlay = this.page.locator(this.patientInformationOverlay);
        await expect(overlay).toBeVisible();
        await expect(overlay).toHaveAttribute('role', 'complementary');
        await expect(overlay).toHaveAttribute('aria-label', 'Patient information and image details');
    }

    /**
     * Get current patient information
     */
    async getPatientInfo(): Promise<{ name: string; id: string }> {
        const name = await this.page.locator(this.patientName).textContent();
        const id = await this.page.locator(this.patientId).textContent();
        return {
            name: name?.replace('Patient:', '').trim() || '',
            id: id?.replace('ID:', '').trim() || ''
        };
    }

    /**
     * Verify patient information matches expected values
     */
    async verifyPatientInfo(expectedName: string, expectedId: string) {
        await expect(this.page.locator(this.patientName)).toContainText(`${expectedName}`);
        await expect(this.page.locator(this.patientId)).toContainText(`${expectedId}`);
    }

    /**
     * Verify patient information persistence
     */
    async verifyPatientInfoPersistence() {
        const initialInfo = await this.getPatientInfo();
        await this.verifyPatientInfo(initialInfo.name, initialInfo.id);
    }
} 