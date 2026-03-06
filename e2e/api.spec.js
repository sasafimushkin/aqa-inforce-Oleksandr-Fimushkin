const { test, expect } = require('@playwright/test');
const { faker } = require('@faker-js/faker');

test.describe('API Automation Tests', () => {

    let tokenCookie = '';
    let createdRoomId = null;

    test.beforeAll(async ({ request }) => {
        // 1. Authenticate to get the token for admin API calls
        const loginResponse = await request.post('/auth/login', {
            data: {
                username: 'admin',
                password: 'password'
            }
        });
        expect(loginResponse.ok()).toBeTruthy();

        const headers = loginResponse.headers();
        tokenCookie = headers['set-cookie'].split(';')[0]; // Extract the token cookie
    });

    // Test 1: Create a Room using Admin API and check it on User API
    test('Create a Room via Admin page(API) and check User page(API)', async ({ request }) => {
        const roomPayload = {
            roomName: faker.number.int({ min: 500, max: 999 }).toString(),
            type: "Double",
            accessible: true,
            description: faker.lorem.sentence(),
            image: "https://www.mwtestconsultancy.co.uk/img/testim/room2.jpg",
            roomPrice: faker.number.int({ min: 50, max: 300 }).toString(),
            features: ["WiFi", "TV", "Radio"]
        };

        // Admin creates room
        const createResponse = await request.post('/room/', {
            headers: {
                'Cookie': tokenCookie,
                'Content-Type': 'application/json'
            },
            data: roomPayload
        });

        expect(createResponse.status()).toBe(201);
        const createdRoom = await createResponse.json();
        createdRoomId = createdRoom.roomid;
        expect(createdRoomId).toBeGreaterThan(0);

        // User gets rooms (no auth required)
        const getRoomsResponse = await request.get('/room/');
        expect(getRoomsResponse.ok()).toBeTruthy();
        const rooms = await getRoomsResponse.json();

        // Verify room is in the list
        const roomExists = rooms.rooms.find(r => r.roomid === createdRoomId);
        expect(roomExists).toBeDefined();
        expect(roomExists.roomName).toBe(roomPayload.roomName);
    });

    // Test 2: Book the room using User API, check on Admin API
    test('Book room via User page(API) and check Admin page(API)', async ({ request }) => {
        expect(createdRoomId, "Room must be created first").not.toBeNull();

        const checkinDate = new Date();
        checkinDate.setDate(checkinDate.getDate() + 1); // tomorrow
        const checkoutDate = new Date();
        checkoutDate.setDate(checkoutDate.getDate() + 5);

        const bookingPayload = {
            bookingdates: {
                checkin: checkinDate.toISOString().split('T')[0],
                checkout: checkoutDate.toISOString().split('T')[0]
            },
            depositpaid: true,
            firstname: faker.person.firstName(),
            lastname: faker.person.lastName(),
            roomid: createdRoomId,
            email: faker.internet.email(),
            phone: faker.phone.number('01234567890')
        };

        // User books room (no auth required)
        const bookResponse = await request.post('/booking/', {
            data: bookingPayload
        });

        expect(bookResponse.status()).toBe(201);
        const bookingResult = await bookResponse.json();
        const bookingId = bookingResult.bookingid;
        expect(bookingId).toBeGreaterThan(0);

        // Admin checks bookings
        // We can fetch all bookings, or bookings for a specific room
        const adminCheckResponse = await request.get(`/booking/?roomid=${createdRoomId}`, {
            headers: {
                'Cookie': tokenCookie
            }
        });
        expect(adminCheckResponse.ok()).toBeTruthy();
        const adminBookings = await adminCheckResponse.json();

        // Verify the booking is retrieved by admin
        const foundBooking = adminBookings.bookings.find(b => b.bookingid === bookingId);
        expect(foundBooking).toBeDefined();
    });

    // Test 3: Edit Room in Admin page(API) and check User page(API)
    test('Edit Room via Admin page(API) and check User page(API)', async ({ request }) => {
        expect(createdRoomId, "Room must be created first").not.toBeNull();

        const updatePayload = {
            roomid: createdRoomId,
            roomName: faker.number.int({ min: 500, max: 999 }).toString(), // Changed name
            type: "Family", // Changed type
            accessible: true,
            description: "Updated Description", // Changed desc
            image: "https://www.mwtestconsultancy.co.uk/img/testim/room2.jpg",
            roomPrice: "250",
            features: ["WiFi", "Refreshments"]
        };

        // Admin updates room
        const updateResponse = await request.put(`/room/${createdRoomId}`, {
            headers: {
                'Cookie': tokenCookie,
                'Content-Type': 'application/json'
            },
            data: updatePayload
        });

        expect(updateResponse.status()).toBe(202);

        // User gets rooms
        const getRoomsResponse = await request.get('/room/');
        const rooms = await getRoomsResponse.json();

        // Verify changes
        const updatedRoom = rooms.rooms.find(r => r.roomid === createdRoomId);
        expect(updatedRoom).toBeDefined();
        expect(updatedRoom.roomName).toBe(updatePayload.roomName);
        expect(updatedRoom.type).toBe(updatePayload.type);
        expect(updatedRoom.description).toBe(updatePayload.description);
    });

    // Test 4: Delete the Room using Admin API and check User API
    test('Delete Room via Admin page(API) and check User page(API)', async ({ request }) => {
        expect(createdRoomId, "Room must be created first").not.toBeNull();

        // Admin deletes room
        const deleteResponse = await request.delete(`/room/${createdRoomId}`, {
            headers: {
                'Cookie': tokenCookie
            }
        });

        expect(deleteResponse.status()).toBe(202);

        // User gets rooms
        const getRoomsResponse = await request.get('/room/');
        const rooms = await getRoomsResponse.json();

        // Verify room is no longer in the list
        const deletedRoom = rooms.rooms.find(r => r.roomid === createdRoomId);
        expect(deletedRoom).toBeUndefined();
    });
});
