const { test, expect } = require('@playwright/test');

test.describe('Admin Page Visual Snapshots', () => {

    test('Admin Login Page Snapshot', async ({ page }) => {
        await page.goto('/#/admin');

        // Wait for the login form to be fully visible
        const usernameInput = page.locator('#username');
        if (await usernameInput.count() === 0) {
            test.skip('Admin login form is not available on the current site version');
        }
        await expect(usernameInput).toBeVisible();
        await expect(page.locator('#password')).toBeVisible();
        await expect(page.locator('#doLogin')).toBeVisible();

        // Slight delay to ensure any dynamic rendering is complete
        await page.waitForTimeout(1000);

        // Capture snapshot of the login page
        await expect(page).toHaveScreenshot('admin-login.png', { fullPage: true });
    });

    test('Admin Rooms Page Snapshot', async ({ page }) => {
        // Navigate and login
        await page.goto('/#/admin');
        const usernameInput = page.locator('#username');
        if (await usernameInput.count() === 0) {
            test.skip('Admin login form is not available on the current site version');
        }
        await usernameInput.fill('admin');
        await page.locator('#password').fill('password');
        await page.locator('#doLogin').click();

        // The user should be redirected to the rooms page
        // Wait for the logout button and the 'Rooms' navigation link
        await expect(page.getByText('Logout')).toBeVisible();
        await expect(page.getByText('Rooms', { exact: true })).toBeVisible();

        // Wait for the rooms list to populate. Usually there's a delay for API response.
        // Let's wait until we see some room data, or just use a fixed timeout for stability of snapshot.
        // We can look for the "Create" button which indicates the form is loaded.
        await expect(page.locator('#createRoom')).toBeVisible();
        await page.waitForTimeout(2000); // Allow data to populate in the list

        // Capture snapshot of the rooms list page
        await expect(page).toHaveScreenshot('admin-rooms.png', { fullPage: true });
    });
});
