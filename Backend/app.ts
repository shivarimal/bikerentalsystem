import express from 'express';
import path from 'path';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import bikeRoutes from './routes/bikeRoutes';
import bookingRoutes from './routes/bookingRoutes';
import paymentRoutes from './routes/paymentRoutes';
import algorithmRoutes from './routes/algorithmRoutes';
import recommendationRoutes from './routes/recommendationRoutes';

import cors from 'cors';
import connectDB from './config/db';

const app = express();

connectDB();

app.use(cors());

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use('/bikeImages', express.static(path.join(__dirname, 'uploads', 'bikeImages')));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/bikes', bikeRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/algorithm', algorithmRoutes);
app.use('/api', recommendationRoutes);

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
