# SonE Frontend

Frontend React + Vite cho du an SonE.

Giao dien nay ket noi voi backend trong `food-calorie-tool/` va phuc vu cac luong:

- Dang nhap / dang ky
- Tim kiem mon an
- Goi y bua an theo calories
- Xem thu vien mon an
- Luu meal history
- Xem shopping list
- Xem bang gia nguyen lieu
- Sinh menu gia dinh theo ngan sach

Frontend hien da duoc cai dat `TailwindCSS` va co the dung song song voi CSS hien co de migrate dan giao dien ma khong pha vo bo cuc dang chay.

## Chay frontend

```bash
cd frontend
npm install
npm run dev -- --port 5173
```

Frontend mac dinh:

- `http://localhost:5173`

## Stack giao dien

- React 19
- Vite 8
- React Router
- Ant Design Icons
- TailwindCSS
- CSS custom cho cac layout lon / phong cach rieng

## Bien moi truong

File `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Neu backend chay cong khac, sua lai bien nay roi khoi dong lai frontend.

## Tai khoan admin local

Hien tai trong local dev, email admin da duoc khai bao trong backend:

- `admin@example.com`
- `tester20260313133318@example.com`

Tai khoan admin da test local:

- email: `admin@example.com`
- password: `123456`

Neu MongoDB cua ban la ban moi hoan toan va chua co user nay, vao `/auth` dang ky email `admin@example.com` voi mat khau moi. Vi email nay nam trong `ADMIN_EMAILS`, tai khoan se tu co quyen admin.

## Cac trang trong frontend

- `/` - trang home, co banner gioi thieu SonE
- `/auth` - dang nhap / dang ky / xem tai khoan
- `/planner` - meal planner theo thong so co the
- `/history` - meal history va shopping list
- `/library` - thu vien mon an va tim kiem mon
- `/pricing` - bang gia nguyen lieu
- `/family` - menu gia dinh theo budget

## Cach su dung nhanh

### 1. Home

- Mo `http://localhost:5173`
- Xem banner gioi thieu va cac meal noi bat
- Bam vao cac nhom mon hoac card mon an de nhay sang thu vien mon

### 2. Dang nhap / dang ky

- Bam icon `Tai khoan` hoac vao `/auth`
- Neu chua co tai khoan: chon `Tao tai khoan`
- Neu da co tai khoan: chon `Dang nhap`
- Sau khi dang nhap, menu user o goc tren phai se cho phep vao tai khoan, lich su, hoac dang xuat

### 3. Tim kiem mon an

- Dung thanh search tren cung
- Nhap ten mon, nhom mon, hoac tu khoa
- Bam `Tim`
- He thong se dua den `/library` va loc danh sach mon phu hop

### 4. Thu vien mon an

- Vao `/library`
- Loc theo ten mon
- Loc theo nhom mon
- Bam tung card de xem mon ban vua tim qua route loc

### 5. Goi y bua an

- Vao `/planner`
- Nhap can nang, chieu cao, tuoi, gioi tinh, muc do van dong
- Neu can, co the them nhom mon / nguyen lieu / mon an muon tranh
- Bam `Lay goi y bua an`
- Neu da dang nhap, co the luu thuc don vao mot ngay trong tuan

### 6. Meal history

- Vao `/history`
- Chon ngay trong tuan
- Xem cac bua da luu
- Xem shopping list tu dong sinh ra theo ngay

### 7. Bang gia nguyen lieu

- Vao `/pricing`
- Moi user deu xem duoc bang gia
- Chi admin moi thay form chinh sua gia
- User thuong se chi thay che do read-only

### 8. Menu gia dinh

- Vao `/family`
- Nhap so thanh vien va ngan sach tuan
- Bam `Sinh menu gia dinh`
- Xem chi phi tung ngay va tong chi phi ca tuan

## Quyen admin va user

### User thuong

- Dang nhap / dang ky
- Tim mon
- Dung planner
- Luu history
- Xem shopping list
- Xem bang gia
- Sinh menu gia dinh

### Admin

Co toan bo quyen cua user, va them:

- Chinh sua bang gia nguyen lieu trong `/pricing`

## Neu co loi

### Frontend khong len

Chay lai:

```bash
cd frontend
npm run dev -- --port 5173
```

### Frontend khong goi duoc backend

Kiem tra backend dang chay tai `http://localhost:3000`.

Neu khac cong, sua `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

### Dang nhap admin nhung khong sua duoc bang gia

Kiem tra file `food-calorie-tool/.env` co email trong `ADMIN_EMAILS`.

Vi du:

```env
ADMIN_EMAILS=admin@example.com,tester20260313133318@example.com
```

Sau do dang xuat va dang nhap lai.

## Lenh kiem tra frontend

```bash
cd frontend
npm run lint
npm run build
```
