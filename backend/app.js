const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const productsRoutes = require('./routes/products-routes');
const ordersRoutes = require('./routes/orders-routes');
const analyticsRoutes = require('./routes/analytics-routes');
const inventoryRoutes = require('./routes/inventory-routes');
const metadataRoutes = require('./routes/metadata-routes');
const usersRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Static file serving for uploads
app.use('/uploads/images', express.static(path.join('uploads', 'images')));

// CORS headers
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE');
    next();
});

// Routes
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/metadata', metadataRoutes);
app.use('/api/users', usersRoutes);

// 404 error handler
app.use((req, res, next) => {
    const error = new HttpError('Could not find this route.', 404);
    throw error;
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (req.file) {
        fs.unlink(req.file.path, (err) => {
            console.log(err);
        });
    }
    
    if (res.headerSent) {
        return next(error);
    }
    
    res.status(error.code || 500);
    res.json({ message: error.message || 'An unknown error occurred!' });
});

// Database connection and server start
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 5000;

// Validate that required environment variables are set
if (!MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI is not defined in .env file');
    console.error('Please copy .env.example to .env and configure your database credentials');
    process.exit(1);
}

mongoose
    .connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
        // Removed deprecated useCreateIndex option
    })
    .then(() => {
        app.listen(PORT);
        console.log(`Server running on port ${PORT}`);
        console.log('DB connection successful!');
        console.log(`MongoDB connected to: ${MONGODB_URI.includes('cluster0') ? 'MongoDB Atlas' : 'Local MongoDB'}`);
    })
    .catch(err => {
        console.log('Database connection failed:', err);
        console.log('Please check your MongoDB connection string');
    });

