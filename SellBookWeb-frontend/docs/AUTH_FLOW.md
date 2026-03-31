# 🔄 Phân Luồng Đăng Nhập (Authentication Flow)

## 📋 Luồng Total:

```
1. User truy cập trang login.html
2. User chọn role (ADMIN/CUSTOMER)
3. User nhập email + password
4. Submit form → handleLogin()
5. Gọi API POST /api/auth/login
6. Backend xác thực → trả token + user data
7. Lưu token vào localStorage
8. Redirect theo role:
   - ADMIN → admin.html
   - CUSTOMER → customer.html
```

## 🛡️ Authentication Check:

### Khi load các trang khác:
```
1. Kiểm tra token tồn tại?
   - ❌ Không → redirect về login.html
   - ✅ Có → tiếp tục

2. Kiểm tra role phù hợp trang?
   - admin.html + role=ADMIN → ✅ OK
   - admin.html + role=CUSTOMER → ❌ redirect customer.html
   - customer.html + role=ADMIN → ❌ redirect admin.html  
   - customer.html + role=CUSTOMER → ✅ OK
```

## 🔐 API Flow:

### Login Request:
```javascript
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "123456", 
  "role": "ADMIN"
}
```

### Login Response:
```javascript
{
  "accessToken": "jwt_token_here",
  "refreshToken": "jwt_token_here", 
  "user": {
    "id": "user_id",
    "name": "Administrator",
    "email": "admin@example.com",
    "role": "ADMIN",
    "phone": "",
    "avatar": "url",
    "active": true
  }
}
```

## 🎯 Redirect Logic:

```javascript
// Trong handleLogin() function
if (user.role === 'ADMIN') {
    window.location.href = 'admin.html';
} else {
    window.location.href = 'customer.html';
}
```

## 🔑 Demo Accounts:

- **Admin**: `admin@example.com` / `123456` / `ADMIN` → `admin.html`
- **Customer**: `customer@example.com` / `123456` / `CUSTOMER` → `customer.html`

## 🚀 Security Features:

1. **JWT Token** - Xác thực stateless
2. **Role-based Access** - Phân quyền theo vai trò
3. **Auto-redirect** - Tự động chuyển trang khi không đủ quyền
4. **Local Storage** - Lưu token client-side
5. **Protected Routes** - Kiểm tra authentication mỗi trang

## 📱 Mobile Responsive:

- Form login responsive
- Error messages clear
- Loading states
- Input validation
