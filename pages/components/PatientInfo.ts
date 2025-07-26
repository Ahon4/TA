import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class PatientInfo extends BasePage {
    private readonly patientInformationOverlay = '[data-testid="patient-information-overlay"]';

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
} 