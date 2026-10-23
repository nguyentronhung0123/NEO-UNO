const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[MongoDB] ✅ Đã kết nối thành công đến MongoDB Atlas: ${conn.connection.host}`);
    console.log(`[MongoDB] 📁 Database đang sử dụng: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] ❌ Lỗi kết nối CSDL:`, error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
