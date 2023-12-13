// Import Mongoose
const mongoose = require('mongoose');

// Kết nối đến MongoDB
mongoose.connect('mongodb+srv://minh53016:vanduc711@cluster0.safl6ev.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true });

// Định nghĩa Schema
const purchasedProductSchema = new mongoose.Schema({
  productId: Number,
  productName: String,
  price: Number,
  buyer: String,
  seller: String,
  purchasedAt: { type: Date, default: Date.now }
});

// Tạo model từ Schema
const PurchasedProduct = mongoose.model('PurchasedProduct', purchasedProductSchema);

// Thêm dữ liệu vào MongoDB
const addPurchasedProductToMongoDB = async (productId, productName, price, buyer, seller) => {
  const purchasedProduct = new PurchasedProduct({
    productId,
    productName,
    price,
    buyer,
    seller
  });

  try {
    await purchasedProduct.save();
    console.log('Dữ liệu đã được thêm vào MongoDB.');
  } catch (error) {
    console.error('Lỗi khi thêm dữ liệu vào MongoDB:', error);
  }
};

// Sử dụng hàm để thêm dữ liệu khi giao dịch mua thành công
// Gọi hàm này khi cập nhật trạng thái mua trong smart contract
addPurchasedProductToMongoDB(productId, productName, price, buyer, seller);
