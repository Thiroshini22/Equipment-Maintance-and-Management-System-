import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRoutes from './src/routes/auth.routes.js';
import equipmentRoutes from './src/routes/equipment.routes.js';
import maintenanceRoutes from './src/routes/maintenance.routes.js';
import requestRoutes from './src/routes/request.routes.js';
import notificationRoutes from './src/routes/notification.routes.js';
import userRoutes from './src/routes/user.routes.js';
import technicianRoutes from './src/routes/technician.routes.js';
import settingsRoutes from './src/routes/settings.routes.js';
import { errorHandler } from './src/middleware/errorHandler.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'EMMS Backend' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/settings', settingsRoutes);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ EMMS backend running on http://localhost:${PORT}`);
});