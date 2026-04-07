# GIBRAN MOTOR - Sistem POS Bengkel Motor

Aplikasi Point of Sale (POS) untuk bengkel motor dengan fitur lengkap pencatatan transaksi, pembayaran, dan laporan.

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38bdf8)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479a1)

## ✨ Fitur Utama

- **📝 Transaksi Baru** - Catat transaksi dengan input manual atau suara (Indonesia)
- **💰 Pembayaran** - Catat pembayaran tunai/transfer/QRIS dengan status otomatis
- **📊 Laporan** - Laporan harian, mingguan, bulanan dengan ringkasan pendapatan
- **🚗 Riwayat** - Lihat semua kendaraan dan riwayat transaksi per plat
- **💳 Tagihan** - List transaksi belum lunas untuk pembayaran cepat
- **🌙 Dark/Light Mode** - Tema gelap dan terang

## 🛠 Tech Stack

| Technology | Version |
|------------|---------|
| Next.js | 16.1.6 |
| React | 19.2.3 |
| TypeScript | 5.x |
| TailwindCSS | 4.x |
| MySQL | 8.x |

## 🚀 Instalasi

### 1. Clone Repository
```bash
git clone https://github.com/nadihero/gibran-motor.git
cd gibran-motor
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Database MySQL
```sql
-- Buat database di phpMyAdmin atau MySQL CLI
CREATE DATABASE gibran_motor;
```

Import schema:
```bash
mysql -u root -p gibran_motor < database/schema.sql
```

Atau import manual via phpMyAdmin dengan file `database/schema.sql`

### 4. Konfigurasi Environment
Buat file `.env.local`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=gibran_motor
```

### 5. Jalankan Development Server
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## 📱 Halaman

| Route | Deskripsi |
|-------|-----------|
| `/` | Dashboard utama dengan ringkasan hari ini |
| `/transaction/new` | Catat transaksi baru |
| `/transaction/[id]` | Detail transaksi & pembayaran |
| `/history` | Riwayat kendaraan & transaksi |
| `/laporan` | Laporan pendapatan |
| `/bayar` | List tagihan belum lunas |
| `/vehicle/[plate]` | Detail kendaraan |

## 📁 Struktur Folder

```
gibran-motor/
├── app/                      # Next.js App Router
│   ├── page.tsx              # Homepage/Dashboard
│   ├── bayar/                # Halaman pembayaran
│   ├── history/              # Riwayat kendaraan
│   ├── laporan/              # Laporan POS
│   ├── transaction/
│   │   ├── new/              # Transaksi baru
│   │   └── [id]/             # Detail transaksi
│   └── vehicle/[plate]/      # Detail kendaraan
├── components/               # React components
│   ├── ui/                   # UI primitives
│   └── ...                   # Feature components
├── lib/
│   ├── actions/              # Server actions (MySQL queries)
│   ├── db.ts                 # Database connection pool
│   ├── types.ts              # TypeScript types
│   └── utils.ts              # Utility functions
└── database/
    ├── schema.sql            # Database schema
    └── seed.sql              # Sample data (opsional)
```

## 🗄 Database Schema

| Table | Deskripsi |
|-------|-----------|
| `customers` | Data pelanggan |
| `vehicles` | Data kendaraan (plate_number unique) |
| `transactions` | Transaksi service |
| `transaction_items` | Item dalam transaksi |
| `payments` | Pembayaran |

## 🎨 Design System

- **Industrial Flat Design** - No gradients, no shadows
- **Mobile-first** - Optimized untuk smartphone
- **Dark/Light Theme** - CSS variables untuk theming
- **Accent Color**: `#E10600` (merah)

## 🔧 Scripts

```bash
# Development
npm run dev

# Build production
npm run build

# Start production
npm run start

# Type check
npx tsc --noEmit
```

## 📄 License

MIT

---

Made with ❤️ for Gibran Motor
