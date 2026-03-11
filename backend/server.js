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
app.use('/api/products', productsRoute);
app.use('/api/otp', otpRoute);



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
