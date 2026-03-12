require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

// Route files
const authRoutes = require('./routes/auth');
const crudRoutes = require('./routes/crud');
const filesRoutes = require('./routes/files');

const app = express();

// Connect to database
connectDB();

// Built-in body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Specific Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', crudRoutes);
app.use('/api/files', filesRoutes);

// Root route
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something broke on the server!' });
});

const PORT = process.env.PORT;
if (!PORT) throw new Error('PORT must be provided in ENV.');

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
