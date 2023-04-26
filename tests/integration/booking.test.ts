import faker from '@faker-js/faker';
import supertest from 'supertest';
import * as jwt from 'jsonwebtoken';
import app, { init } from '@/app';
import { cleanDb, generateValidToken } from '../helpers';
import { prisma } from '@/config';
import { createEnrollmentWithAddress, createHotel, createRoomWithHotelId, createTicket, createTicketType, createTicketTypeWithHotel, createUser } from '../factories';
import { createBooking } from '../factories/booking-factory';

beforeAll(async () => {
    await init();
});

beforeEach(async () => {
    await cleanDb();
});

const server = supertest(app);

describe('GET /booking', () => {
    it('should respond with status 401 if no token is given', async () => {
        const response = await server.get('/booking');

        expect(response.status).toBe(401);
    });

    it('should respond with status 401 if given token is not valid', async () => {
        const token = faker.lorem.word();

        const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(401);
    });
    it('should respond with status 401 if there is no session for given token', async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

        const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(401);
    });
    describe('when token is valid', () => {
        it('should respond with status 404 when user has no booking', async () => {
            const user = await createUser();
            const enrollment = await createEnrollmentWithAddress(user);
            const token = await generateValidToken(user);

            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, 'PAID');

            const hotel = await createHotel();
            const room = await createRoomWithHotelId(hotel.id);

            const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(404);

        });
        it('should respond with status 200 when user has booking', async () => {
            const user = await createUser();
            const enrollment = await createEnrollmentWithAddress(user);
            const token = await generateValidToken(user);

            const ticketType = await createTicketTypeWithHotel();
            await createTicket(enrollment.id, ticketType.id, 'PAID');

            const hotel = await createHotel();
            const room = await createRoomWithHotelId(hotel.id);
            const booking = await createBooking(user.id, room.id);

            const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
            expect(response.body).toEqual(
                [
                    {
                        id: booking.id,
                        userId: booking.userId,
                        roomId: booking.roomId,
                        createdAt: booking.createdAt.toISOString(),
                        updatedAt: booking.updatedAt.toISOString(),
                        Room: {
                            id: room.id,
                            name: room.name,
                            capacity: room.capacity,
                            hotelId: room.hotelId,
                            createdAt: room.createdAt.toISOString(),
                            updatedAt: room.updatedAt.toISOString(),
                        }
                    }
                ]
            )
        })
    })
})