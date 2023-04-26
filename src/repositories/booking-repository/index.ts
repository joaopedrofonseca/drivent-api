import { prisma } from "@/config";

async function findRoomById(roomId: number) {
    return await prisma.room.findFirst({
        where: {
            id: roomId,
        },
    })
}

async function findBookingsOnRoom(roomId: number) {
    return await prisma.booking.findMany({
        where: {
            roomId
        }
    })
}

async function createBooking(roomId: number, userId: number) {
    await prisma.booking.create({
        data: {
            userId,
            roomId,
        }
    })

    return await prisma.booking.findMany({
        orderBy: { id: 'desc' },
        where: { roomId }
    })
}

async function findBookingByUserId(userId: number) {
    return await prisma.booking.findMany({
        where: {
            userId
        },
        include: { Room: true },
    })
}

async function updateBooking(bookingId: number, roomId: number) {
    await prisma.booking.update({
        where: {
            id: bookingId,
        },
        data: {
            roomId,
        },
    })

    return await prisma.booking.findFirst({
        where: {
            id: bookingId,
        }
    })
}

const bookingRepository = {
    findRoomById,
    findBookingsOnRoom,
    createBooking,
    findBookingByUserId,
    updateBooking,
}

export default bookingRepository;