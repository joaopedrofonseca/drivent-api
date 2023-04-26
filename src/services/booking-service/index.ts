import { notFoundError } from "@/errors";
import { bookingError } from "@/errors/booking-error";
import bookingRepository from "@/repositories/booking-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import ticketsRepository from "@/repositories/tickets-repository";

async function listBooking(userId: number) {
    const booking = await bookingRepository.findBookingByUserId(userId);
    if (booking.length === 0) throw notFoundError();
    return booking;
}

async function createBooking(userId: number, roomId: number) {
    const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
    const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);
    if (!ticket.TicketType.includesHotel || ticket.TicketType.isRemote || ticket.status === 'RESERVED') throw bookingError();

    const room = await bookingRepository.findRoomById(roomId);
    if (!room) throw notFoundError();

    const bookings = await bookingRepository.findBookingsOnRoom(roomId);
    if (bookings.length === room.capacity) throw bookingError();

    const userBooking = await bookingRepository.createBooking(roomId, userId);
    return userBooking[0];
}

async function updateBooking(userId: number, bookingId: number, roomId: number) {
    const userHasBookingAlready = await bookingRepository.findBookingByUserId(userId);
    if (!userHasBookingAlready || userHasBookingAlready[0].id !== bookingId) throw bookingError();

    const room = await bookingRepository.findRoomById(roomId);
    if (!room) throw notFoundError();

    const bookings = await bookingRepository.findBookingsOnRoom(roomId);
    if (bookings.length === room.capacity) throw bookingError();

    const updateBooking = await bookingRepository.updateBooking(bookingId, roomId);

    return updateBooking;
}

const bookingService = {
    listBooking,
    createBooking,
    updateBooking,
};

export default bookingService;