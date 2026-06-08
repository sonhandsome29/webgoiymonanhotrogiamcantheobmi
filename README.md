# SonE Fullstack App

SonE la ung dung goi y mon an va lap ke hoach dinh duong theo mo hinh fullstack:

- `frontend/`: React + Vite client
- `food-calorie-tool/`: Express API + MongoDB

Frontend goi API backend de xu ly dang nhap, ho so nguoi dung, goi y thuc don, lich su mon an, bang gia nguyen lieu va menu gia dinh.

## Kien truc

```text
React/Vite frontend
    -> HTTP API
Express backend
    -> MongoDB
```

## Tinh nang chinh

- Dang ky / dang nhap tai khoan
- Xac thuc bearer token o backend
- Phan quyen `admin` / `user`
- Goi y thuc don theo BMI va muc van dong
- Luu lich su mon an theo ngay
- Quan ly meal / ingredient tu trang admin
- Lap menu gia dinh 7 ngay theo ngan sach

## Chay backend

```bash
cd food-calorie-tool
npm install
npm start
```

Mac dinh backend chay o `http://localhost:3000`.

### Backend env

Tao file `.env` trong `food-calorie-tool/`:

```env
MONGODB_URI=mongodb://localhost:27017/foodDB
PORT=3000
AUTH_SECRET=replace-this-in-production
AUTH_TOKEN_TTL_MS=604800000
```

## Chay frontend

```bash
cd frontend
npm install
npm run dev
```

### Frontend env

Tao file `.env` trong `frontend/` neu backend khong chay o port mac dinh:

```env
VITE_API_URL=http://localhost:3000
```

## Production build

Frontend:

```bash
cd frontend
npm run build
```

Backend:

- Deploy `food-calorie-tool/` nhu mot Node.js service
- Cau hinh `MONGODB_URI` va `AUTH_SECRET` tren moi truong deploy

## Ghi chu

- App nay khong phai frontend-only.
- Logic nghiep vu va du lieu duoc xu ly o backend.
- `localStorage` tren frontend chi dung de luu session token/user cho client, khong phai nguon su that cua du lieu.
