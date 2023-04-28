import { AuthenticatedRequest } from "@/middlewares";
import bookingRouter from "@/routers/booking-router";
import bookingService from "@/services/booking-service";
import { Certificate } from "crypto";
import { NextFunction, Request, Response } from "express";

export async function getBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const { userId } = req;

    try {
        const booking = await bookingService.listBooking(userId);
        return res.status(200).send({
            id: booking[0].id,
            Room: {
                id: booking[0].Room.id,
                name: booking[0].Room.name,
                capacity: booking[0].Room.capacity,
                hotelId: booking[0].Room.hotelId,
                createdAt: booking[0].Room.createdAt,
                updatedAt: booking[0].Room.updatedAt
             }
        })
    } catch (err) {
        next(err);
    }
}

export async function createBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const { userId } = req;
    const { roomId } = req.body;

    try {
        const booking = await bookingService.createBooking(userId, roomId);
        return res.status(200).send({ bookingId: booking.id });
    } catch (err) {
        next(err);
    }
}

export async function updateBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const bookingId = req.params.bookingId;
    const id = Number(bookingId);

    const { roomId } = req.body;
    const { userId } = req;

    try {
        const newBooking = await bookingService.updateBooking(userId, Number(bookingId), roomId);
        return res.status(200).send({ bookingId: newBooking.id })
    } catch (err) {
        next(err);
    }
}