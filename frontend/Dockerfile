# ============================================================================
# NEO-UNO FRONTEND DOCKERFILE: MULTI-STAGE BUILD (VITE + NGINX ALPINE)
# ============================================================================

# STAGE 1: Xây dựng bản phân phối Vite Production
FROM node:20-alpine AS builder

WORKDIR /app

# Sao chép file khai báo dependencies
COPY package*.json ./

# Cài đặt toàn bộ dependencies phục vụ quá trình build
RUN npm ci

# Sao chép mã nguồn giao diện
COPY . .

# Biên dịch mã nguồn Vite (đã kích hoạt Code-Splitting và nén chunk)
RUN npm run build

# STAGE 2: Khởi chạy máy chủ Web tĩnh siêu nhẹ Nginx Alpine (< 25MB)
FROM nginx:alpine

# Xóa cấu hình mặc định của Nginx
RUN rm -rf /etc/nginx/conf.d/default.conf

# Sao chép cấu hình Nginx tối ưu cho NEO-UNO (Gzip, SPA, Proxy API/WS)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Sao chép bản build từ Stage 1 sang thư mục phục vụ của Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Mở cổng 80 chuẩn HTTP
EXPOSE 80

# Kiểm tra sức khỏe Nginx Container
HEALTHCHECK --interval=30s --timeout=5s --start-period=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Khởi chạy Nginx ở chế độ tiền cảnh (foreground)
CMD ["nginx", "-g", "daemon off;"]
