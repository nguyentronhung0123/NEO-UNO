# ============================================================================
# NEO-UNO BACKEND DOCKERFILE: PRODUCTION MULTI-LAYER IMAGE
# ============================================================================
FROM node:20-alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Thiết lập biến môi trường production
ENV NODE_ENV=production
ENV PORT=5001

# Sao chép package manifests để tận dụng Docker layer caching
COPY package*.json ./

# Cài đặt các gói phụ thuộc production siêu nhẹ
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# Sao chép toàn bộ mã nguồn backend vào container
COPY . .

# Chuyển quyền sở hữu cho người dùng phi-root 'node' để tăng cường bảo mật
RUN chown -R node:node /app
USER node

# Mở cổng 5001 phục vụ REST API & Socket.io WebSocket
EXPOSE 5001

# Kiểm tra sức khỏe container (Healthcheck)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/api/health || exit 1

# Khởi chạy máy chủ Node.js an toàn
CMD ["node", "server.js"]
