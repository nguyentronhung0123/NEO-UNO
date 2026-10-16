require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API kiểm tra hệ thống
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: "NEO UNO Backend đang hoạt động!",
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`[BE] Server đã khởi chạy tại: http://localhost:${PORT}`);
});
