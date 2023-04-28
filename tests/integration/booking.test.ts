import faker from '@faker-js/faker';
import supertest from 'supertest';
import * as jwt from 'jsonwebtoken';
import app, { init } from '@/app';
import { cleanDb, generateValidToken } from '../helpers';
import { prisma } from '@/config';
import { createEnrollmentWithAddress, createHotel, createRoomWithHotelId, createRoomWithHotelIdNoCapacity, createTicket, createTicketType, createTicketTypeNotIncludesHotel, createTicketTypeRemote, createTicketTypeWithHotel, createUser } from '../factories';
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
                    {
                        id: booking.id,
                        Room: {
                            id: room.id,
                            name: room.name,
                            capacity: room.capacity,
                            hotelId: room.hotelId,
                            createdAt: room.createdAt.toISOString(),
                            updatedAt: room.updatedAt.toISOString(),
                        }
                    }
            )
        })
    })
});

describe('POST /booking', () => {
    it('should respond with status 401 if no token is given', async () => {
        const response = await server.post('/booking');

        expect(response.status).toBe(401);
    });

    it('should respond with status 401 if given token is not valid', async () => {
        const token = faker.lorem.word();

        const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(401);
    });
    it('should respond with status 401 if there is no session for given token', async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

        const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(401);
    });
    describe('when token is valid', () => {
        it('should respond with status 403 when ticket type is remote', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);

            const ticketType = await createTicketTypeRemote();
            await createTicket(enrollment.id, ticketType.id, 'PAID');

            const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(403);

        });

        it('should respond with status 403 when ticket does not include hotel', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);

            const ticketType = await createTicketTypeNotIncludesHotel();
            await createTicket(enrollment.id, ticketType.id, 'PAID');

            const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(403);

        });

        it('should respond with status 403 when ticket status is not paid', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);

            const ticketType = await createTicketTypeWithHotel();
            await createTicket(enrollment.id, ticketType.id, 'RESERVED');

            const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(403);

        });

        it('should respond with status 404 when room not exists', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);

            const ticketType = await createTicketTypeWithHotel();
            await createTicket(enrollment.id, ticketType.id, 'PAID');

            await prisma.booking.deleteMany({});
            await prisma.room.deleteMany({});

            const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: 1 });
            expect(response.status).toBe(404);

        });

        it('should respond with status 403 when room is full of capacity', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);

            const ticketType = await createTicketTypeWithHotel();
            await createTicket(enrollment.id, ticketType.id, 'PAID');

            const hotel = await createHotel();
            const room = await createRoomWithHotelId(hotel.id);
            const booking = await createBooking(user.id, room.id);

            const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: room.id });
            expect(response.status).toBe(403);

        });

        it('should respond with status 200 when user creates a booking', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);

            const ticketType = await createTicketTypeWithHotel();
            await createTicket(enrollment.id, ticketType.id, 'PAID');

            const hotel = await createHotel();
            const room = await createRoomWithHotelId(hotel.id);

            const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: room.id });
            const userBooking = await prisma.booking.findMany({
                orderBy: { id: 'desc' },
                where: { roomId: room.id }
            })

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                bookingId: userBooking[0].id
            })
        });
    })
})

describe('PUT /booking/:bookingId', () => {
    it('should respond with status 401 if no token is given', async () => {
        const response = await server.put('/booking/1');

        expect(response.status).toBe(401);
    });

    it('should respond with status 401 if given token is not valid', async () => {
        const token = faker.lorem.word();

        const response = await server.put('/booking/1').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(401);
    });

    it('should respond with status 401 if there is no session for given token', async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

        const response = await server.put('/booking/1').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(401);
    });

    describe('when token is valid', () => {
        it('should respond with 403 when user does not have a booking', async () => {
            //verficar posteriormente
            const user = await createUser();
            const anotherUser = await createUser();
            const token = await generateValidToken(anotherUser);
            const enrollment = await createEnrollmentWithAddress(anotherUser);

            const ticketType = await createTicketTypeWithHotel();
            await createTicket(enrollment.id, ticketType.id, 'PAID');

            const hotel = await createHotel();
            const room = await createRoomWithHotelId(hotel.id);
            const booking = await createBooking(anotherUser.id, room.id);

            const response = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${token}`).send({ roomId: room.id });
            expect(response.status).toBe(403);
        });

        it('should respond with status 500 if booking id not exists', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);

            const ticketType = await createTicketTypeWithHotel();
            await createTicket(enrollment.id, ticketType.id, 'PAID');

            const hotel = await createHotel();
            const room = await createRoomWithHotelId(hotel.id);

            await prisma.booking.deleteMany({});

            const response = await server.put(`/booking/1`).set('Authorization', `Bearer ${token}`).send({ roomId: room.id });
            expect(response.status).toBe(500);
        });

        it('should respond with status 404 when room not exists', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);

            const ticketType = await createTicketTypeWithHotel();
            await createTicket(enrollment.id, ticketType.id, 'PAID');

            const hotel = await createHotel();
            const room = await createRoomWithHotelId(hotel.id);
            const booking = await createBooking(user.id, room.id);


            const response = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${token}`).send({ roomId: 1 });
            expect(response.status).toBe(404);


        });

        it('should respond with status 403 when room is full of capacity', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);

            const ticketType = await createTicketTypeWithHotel();
            await createTicket(enrollment.id, ticketType.id, 'PAID');

            const hotel = await createHotel();
            const room = await createRoomWithHotelId(hotel.id);
            const roomNoCapacity = await createRoomWithHotelIdNoCapacity(hotel.id);
            const booking = await createBooking(user.id, room.id);


            const response = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${token}`).send({ roomId: roomNoCapacity.id });
            expect(response.status).toBe(403);
        });

        it('should respond with status 200 when user creates a booking', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);

            const ticketType = await createTicketTypeWithHotel();
            await createTicket(enrollment.id, ticketType.id, 'PAID');

            const hotel = await createHotel();
            const room = await createRoomWithHotelId(hotel.id);
            const anotherRoom = await createRoomWithHotelId(hotel.id);
            const booking = await createBooking(user.id, room.id);

            const response = await server.put(`/booking/${booking.id}`).set(`Authorization`, `Bearer ${token}`).send({ roomId: anotherRoom.id });
            expect(response.status).toBe(200);
        });
    })
})