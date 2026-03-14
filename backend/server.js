const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Routes
const productsRoute = require('./routes/products');
const otpRoute = require('./routes/otp');
const paymentRoute = require('./routes/payment');
const smsRoute = require('./routes/sms');
const authRoute = require('./routes/auth');
const ordersRoute = require('./routes/orders');
const uploadRoute = require('./routes/upload');

app.use('/api/products', productsRoute);
app.use('/api/otp', otpRoute);
app.use('/api/payment', paymentRoute);
app.use('/api/sms', smsRoute);
app.use('/api/auth', authRoute);
app.use('/api/orders', ordersRoute);
app.use('/api/upload', uploadRoute);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
