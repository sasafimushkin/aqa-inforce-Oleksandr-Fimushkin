const { test, expect } = require('@playwright/test');
const { faker } = require('@faker-js/faker');

test.describe('UI Room Booking Tests', () => {

    function toISODate(d) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function addDays(date, days) {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d;
    }

    async function getAdminTokenCookie(request) {
        const loginResponse = await request.post('/api/auth/login', {
            data: { username: 'admin', password: 'password' }
        });
        expect(loginResponse.ok()).toBeTruthy();
        const { token } = await loginResponse.json();
        return `token=${token}`;
    }

    async function createRoom(request) {
        const cookie = await getAdminTokenCookie(request);
        const roomName = faker.number.int({ min: 5000, max: 9999 }).toString();

        const createResponse = await request.post('/api/room/', {
            headers: {
                Cookie: cookie,
                'Content-Type': 'application/json',
            },
            data: {
                roomName,
                type: 'Double',
                accessible: true,
                description: faker.lorem.sentence(),
                image: 'https://www.mwtestconsultancy.co.uk/img/testim/room2.jpg',
                roomPrice: 123,
                features: ['WiFi']
            }
        });
        expect(createResponse.ok()).toBeTruthy();

        const roomsRes = await request.get('/api/room/');
        expect(roomsRes.ok()).toBeTruthy();
        const { rooms } = await roomsRes.json();
        const created = rooms.find(r => r.roomName === roomName);
        expect(created).toBeDefined();

        return { roomid: created.roomid, cookie };
    }

    async function deleteRoom(request, cookie, roomid) {
        await request.delete(`/api/room/${roomid}`, {
            headers: { Cookie: cookie }
        });
    }

    test('Check that the room can be booked with valid data', async ({ page, request }) => {
        await page.goto('/');

        const { roomid, cookie } = await createRoom(request);
        const checkin = toISODate(addDays(new Date(), 2));
        const checkout = toISODate(addDays(new Date(), 4));

        await page.goto(`/reservation/${roomid}?checkin=${checkin}&checkout=${checkout}`);

        const openForm = page.getByRole('button', { name: /reserve now/i }).first();
        await openForm.scrollIntoViewIfNeeded();
        await openForm.click();

        await page.getByPlaceholder('Firstname').fill(faker.person.firstName());
        await page.getByPlaceholder('Lastname').fill(faker.person.lastName());
        await page.getByPlaceholder('Email').fill(faker.internet.email());
        await page.getByPlaceholder('Phone').fill(faker.phone.number('01234567890'));

        const submit = page.locator('form').getByRole('button', { name: /reserve now/i });

        const [bookingResponse] = await Promise.all([
            page.waitForResponse(r => r.url().includes('/api/booking') && r.request().method() === 'POST'),
            submit.click()
        ]);

        expect(bookingResponse.status()).toBe(201);
        await expect(page.locator('form').getByRole('button', { name: /reserve now/i })).toHaveCount(0);

        await deleteRoom(request, cookie, roomid);
    });

    test('Check that the room can’t be booked with invalid data', async ({ page, request }) => {
        await page.goto('/');

        const { roomid, cookie } = await createRoom(request);
        const checkin = toISODate(addDays(new Date(), 2));
        const checkout = toISODate(addDays(new Date(), 4));
        await page.goto(`/reservation/${roomid}?checkin=${checkin}&checkout=${checkout}`);

        const openForm = page.getByRole('button', { name: /reserve now/i }).first();
        await openForm.scrollIntoViewIfNeeded();
        await openForm.click();

        await page.getByPlaceholder('Firstname').fill('A');
        await page.getByPlaceholder('Lastname').fill('B');
        await page.getByPlaceholder('Email').fill('invalid-email');
        await page.getByPlaceholder('Phone').fill('123');

        const submit = page.locator('form').getByRole('button', { name: /reserve now/i });
        const [bookingResponse] = await Promise.all([
            page.waitForResponse(r => r.url().includes('/api/booking') && r.request().method() === 'POST'),
            submit.click()
        ]);

        expect(bookingResponse.status()).not.toBe(201);
        await expect(page.getByRole('button', { name: /reserve now/i }).first()).toBeVisible();

        await deleteRoom(request, cookie, roomid);
    });

    test('Check that the earlier booked dates show as Unavailable', async ({ page, request }) => {
        const { roomid, cookie } = await createRoom(request);
        const checkin = toISODate(addDays(new Date(), 2));
        const checkout = toISODate(addDays(new Date(), 4));

        // Create an initial booking via API for that range
        const seedBooking = await request.post('/api/booking/', {
            data: {
                roomid,
                firstname: 'Seed',
                lastname: 'Booking',
                depositpaid: false,
                bookingdates: { checkin, checkout },
                email: 'seed@example.com',
                phone: '01234567890'
            }
        });
        expect(seedBooking.status()).toBe(201);

        // Attempt the same booking via UI and expect conflict
        await page.goto(`/reservation/${roomid}?checkin=${checkin}&checkout=${checkout}`);
        const openForm = page.getByRole('button', { name: /reserve now/i }).first();
        await openForm.scrollIntoViewIfNeeded();
        await openForm.click();

        await page.getByPlaceholder('Firstname').fill(faker.person.firstName());
        await page.getByPlaceholder('Lastname').fill(faker.person.lastName());
        await page.getByPlaceholder('Email').fill(faker.internet.email());
        await page.getByPlaceholder('Phone').fill(faker.phone.number('01234567890'));

        const submit = page.locator('form').getByRole('button', { name: /reserve now/i });
        const [bookingResponse] = await Promise.all([
            page.waitForResponse(r => r.url().includes('/api/booking') && r.request().method() === 'POST'),
            submit.click()
        ]);

        expect(bookingResponse.status()).toBe(409);

        await deleteRoom(request, cookie, roomid);
    });
});
