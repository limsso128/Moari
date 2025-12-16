const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const clubRoutes = require('./routes/clubs');
const messageRoutes = require('./routes/messages'); // Add this line

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/messages', messageRoutes); // Add this line

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
