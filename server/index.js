const express = require('express');
const Product = require('./models/Product');
const connectDB = require('./db');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');
app.use(cors());
// const router = require('./routes/products');
connectDB();
app.use(express.json());

// router(app);
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to create a new product
app.post('/api/products', async (req, res) => {
  const { name, price } = req.body;

  try {
    // Validate request data
    if (!name || !price || isNaN(price)) {
      return res
        .status(400)
        .json({ error: 'Invalid data. Name and price are required.' });
    }

    // Create a new product instance
    const newProduct = new Product({
      name,
      price,
    });

    // Save the product to the database
    const savedProduct = await newProduct.save();

    // Respond with the created product
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
