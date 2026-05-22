import { Schema, model, Document } from 'mongoose';
import { BikeSchema, IBike } from './bike';

export interface IBooking extends Document {
    userId: Schema.Types.ObjectId;
    bikeId: Schema.Types.ObjectId;
    bike: IBike;
    startTime: Date;
    endTime: Date;
    status: string;
    paymentId?: string;
    paymentAmount?: number;
    paymentStatus?: string;
    pickupLocation?: {
        lat: number;
        lng: number;
    };
}
const bookingSchema = new Schema<IBooking>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bikeId: { type: Schema.Types.ObjectId, ref: 'Bike', required: true },
    bike: { type: BikeSchema, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { type: String, enum: ['booked', 'returned', 'canceled'], default: 'booked' },
    paymentId: { type: String },
    paymentAmount: { type: Number },
    paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    pickupLocation: {
        lat: { type: Number },
        lng: { type: Number }
    }
});

const Booking = model<IBooking>('Booking', bookingSchema);
export default Booking;
