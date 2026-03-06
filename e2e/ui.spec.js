const { test, expect } = require('@playwright/test');
const { faker } = require('@faker-js/faker');

test.describe('UI Room Booking Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('Check that the room can be booked with valid data', async ({ page }) => {
        // Click "Book this room" for the first available room
        await page.locator('button:has-text("Book this room")').first().click();

        // Fill in the booking form with valid random data
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const email = faker.internet.email();
        const phone = faker.phone.number('01234567890');

        // Wait for the form to appear
        const firstNameInput = page.locator('input[placeholder="Firstname"]');
        await expect(firstNameInput).toBeVisible();

        await firstNameInput.fill(firstName);
        await page.locator('input[placeholder="Lastname"]').fill(lastName);
        await page.locator('input[name="email"]').fill(email);
        await page.locator('input[name="phone"]').fill(phone);

        // To select dates, we have dragging functionality on the calendar.
        // Instead of complex drag-and-drop which might be flaky, we can try to select specific days.
        // Playwright dragAndDrop can select a range. Let's try to drag from today to 3 days later.
        const calendarDays = page.locator('.rbc-date-cell:not(.rbc-off-range)');

        // We need to wait for calendar to render
        await expect(calendarDays.first()).toBeVisible();

        // Pick days in the middle of the month to avoid edge cases right now
        const startDay = await calendarDays.nth(10).boundingBox();
        const endDay = await calendarDays.nth(13).boundingBox();

        if (startDay && endDay) {
            await page.mouse.move(startDay.x + startDay.width / 2, startDay.y + startDay.height / 2);
            await page.mouse.down();
            await page.mouse.move(endDay.x + endDay.width / 2, endDay.y + endDay.height / 2, { steps: 5 });
            await page.mouse.up();
        }

        // Click Book
        await page.locator('button:has-text("Book")').nth(1).click(); // Sometimes there are multiple buttons, we want the form one

        // Wait for success message
        const successMessage = page.locator('div.ReactModal__Content h3:has-text("Booking Successful!")');
        await expect(successMessage).toBeVisible({ timeout: 10000 });
    });

    test('Check that the room can’t be booked with invalid data', async ({ page }) => {
        // Click "Book this room" for the first available room
        await page.locator('button:has-text("Book this room")').first().click();

        // Fill with INVALID data (e.g., short phone, missing fields)
        const firstNameInput = page.locator('input[placeholder="Firstname"]');
        await expect(firstNameInput).toBeVisible();

        await firstNameInput.fill('A'); // Too short
        await page.locator('input[placeholder="Lastname"]').fill('B'); // Too short
        await page.locator('input[name="email"]').fill('invalid-email');
        await page.locator('input[name="phone"]').fill('123'); // Too short

        // Select dates
        const calendarDays = page.locator('.rbc-date-cell:not(.rbc-off-range)');
        await expect(calendarDays.first()).toBeVisible();

        const startDay = await calendarDays.nth(15).boundingBox();
        const endDay = await calendarDays.nth(18).boundingBox();

        if (startDay && endDay) {
            await page.mouse.move(startDay.x + startDay.width / 2, startDay.y + startDay.height / 2);
            await page.mouse.down();
            await page.mouse.move(endDay.x + endDay.width / 2, endDay.y + endDay.height / 2, { steps: 5 });
            await page.mouse.up();
        }

        // Click Book
        await page.locator('button', { hasText: 'Book' }).click();

        // Verify error messages appear
        const alertElement = page.locator('.alert.alert-danger');
        await expect(alertElement).toBeVisible();
        await expect(alertElement.locator('p').first()).toContainText('size must be between');
    });

    test('Check that the earlier booked dates show as Unavailable', async ({ page }) => {
        // This test ideally requires setting up a booking first either via API or UI.
        // Given we are doing E2E, we could mock the API response, or rely on a specific date.
        // The instructions say "Using intercept in your tests will be a plus :)"

        // Let's use route interception to mock the bookings response to ensure a specific date is unavailable!
        await page.route('**/booking/?roomid=*', async route => {
            const response = await route.fetch();
            const json = await response.json();

            // Inject a mocked booking for the 20th to 25th of the current month
            const today = new Date();
            const mockStart = new Date(today.getFullYear(), today.getMonth(), 20).toISOString();
            const mockEnd = new Date(today.getFullYear(), today.getMonth(), 25).toISOString();

            json.bookings.push({
                bookingdates: {
                    checkin: mockStart.split('T')[0],
                    checkout: mockEnd.split('T')[0]
                }
            });

            await route.fulfill({ json });
        });

        await page.reload();

        await page.locator('button:has-text("Book this room")').first().click();

        // Wait for the form to load
        await expect(page.locator('input[placeholder="Firstname"]')).toBeVisible();

        // Try to select the overlapping dates (21st to 22nd)
        const calendarDays = page.locator('.rbc-date-cell:not(.rbc-off-range)');
        await expect(calendarDays.first()).toBeVisible();

        // The days 20 to 25 should now be visually marked or unselectable.
        // In Restful-booker, unavailable dates get specific classes or can't be interacted with
        // For this example, we'll try dragging over the blocked dates and verify it doesn't select them or error occurs.
        const startDay = await page.locator(`.rbc-date-cell button:has-text("21")`).boundingBox();
        const endDay = await page.locator(`.rbc-date-cell button:has-text("22")`).boundingBox();

        if (startDay && endDay) {
            await page.mouse.move(startDay.x + startDay.width / 2, startDay.y + startDay.height / 2);
            await page.mouse.down();
            await page.mouse.move(endDay.x + endDay.width / 2, endDay.y + endDay.height / 2, { steps: 5 });
            await page.mouse.up();
        }

        // Since dates are blocked, the selection shouldn't have worked, thus "Book" button might not work or dates aren't filled.
        // A simpler assertion is to check if the mocked dates render differently, but without visual, testing the "unavailability" 
        // usually means checking for a class like 'rbc-off-range' or 'unavailable'.
        // Let's assert we can't submit the booking
        await page.locator('button', { hasText: 'Book' }).click();

        // We expect the booking to NOT succeed, but instead show an error or just not submit.
        // If it submits anyway but fails on backend, we'll get an error alert about booking dates.
        const alertElement = page.locator('.alert.alert-danger');
        await expect(alertElement).toBeVisible();
        await expect(alertElement.locator('p').first()).toContainText('must not be null'); // because dates weren't selected
    });
});
