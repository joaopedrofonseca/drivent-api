import { AuthenticatedRequest } from "@/middlewares";
import bookingRouter from "@/routers/booking-router";
import bookingService from "@/services/booking-service";
import { Certificate } from "crypto";
import { NextFunction, Response } from "express";

export async function getBooking(req: AuthenticatedRequest, res: Response) {
    try {

    } catch (err) {
        return res.sendStatus(400)
    }
}

export async function createBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const { userId } = req;
    const { roomId } = req.body;

    try {
        const booking = await bookingService.createBooking(userId, roomId);
        return res.status(200).send({bookingId: booking.id});
    } catch (err) {
        next(err)
    }
}

export async function updateBooking(req: AuthenticatedRequest, res: Response) {
    try {

    } catch (err) {
        return res.sendStatus(400)
    }
}