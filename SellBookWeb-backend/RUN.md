# Chạy SellBookWeb (dev)

## Yêu cầu

- **Node.js** (LTS khuyến nghị)
- **MongoDB** chạy local (mặc định `mongodb://localhost:27017`)

## Cấu hình

File `.env` (tham chiếu):

- `PORT=8080` — API + static frontend
- `MONGODB_URI=mongodb://localhost:27017/sellbookweb`
- `JWT_SECRET=...`
- `FRONTEND_URL=http://localhost:3000` (tuỳ môi trường)

## Lệnh

```bash
cd SellBookWeb-backend
npm install
npm run dev
# hoặc: npm start
```

Mở trình duyệt: **http://localhost:8080**

## Seed dữ liệu mẫu (tuỳ chọn)

```bash
node seed.js
```

**Cảnh báo:** script seed xóa toàn bộ user, category, book và coupon hiện có, rồi tạo lại dữ liệu mẫu + tài khoản admin (`admin@bookstore.com` / `admin123` — xem `seed.js`). Sau seed có thêm mã demo **SALE10** (10%, áp dụng tất cả sách).

## Kiểm tra API

- `GET http://localhost:8080/api/health`
