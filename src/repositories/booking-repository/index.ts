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
        orderBy: {id: 'desc'},
        where: { roomId }
    })
}

const bookingRepository = {
    findRoomById,
    findBookingsOnRoom,
    createBooking,
}

export default bookingRepository;