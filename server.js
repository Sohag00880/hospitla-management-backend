const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./src/config/db');


dotenv.config();
connectDB();

const app = express();
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }));

app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/departments', require('./src/routes/departmentRoutes'));
app.use('/api/doctors', require('./src/routes/doctorRoutes'));
app.use('/api/patients', require('./src/routes/patientRoutes'));
app.use('/api/tests', require('./src/routes/testRoutes'));
app.use('/api/test-orders', require('./src/routes/testOrderRoutes'));
app.use('/api/results', require('./src/routes/resultRoutes'));
app.use('/api/reports', require('./src/routes/reportRoutes'));
app.use('/api/admit-patients', require('./src/routes/admitRoutes'));
app.use('/api/dashboard', require('./src/routes/dashboardRoutes'));
app.use('/api/urine', require('./src/routes/urineRoutes'));
app.use('/api/cbc', require('./src/routes/cbcRoutes'));

app.get('/', (req, res) => res.json({ message: 'Boishakhi Hospital API Running' }));
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(require('./src/middleware/errorHandler'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));