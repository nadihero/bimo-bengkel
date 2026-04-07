-- 30 Dummy Data untuk Gibran Motor
-- Generate fresh UUIDs using MySQL UUID() function

-- ============================================
-- CUSTOMERS (10 pelanggan)
-- ============================================
INSERT INTO customers (name, phone, address) VALUES
('Budi Santoso', '081234567890', 'Jl. Mawar No. 12, Jakarta'),
('Ahmad Hidayat', '082345678901', 'Jl. Melati No. 45, Jakarta'),
('Siti Nurhaliza', '083456789012', 'Jl. Kenanga No. 8, Jakarta'),
('Dedi Kurniawan', '084567890123', 'Jl. Anggrek No. 23, Jakarta'),
('Rina Wulandari', '085678901234', 'Jl. Cempaka No. 56, Jakarta'),
('Agus Supriyadi', '086789012345', 'Jl. Dahlia No. 78, Jakarta'),
('Maya Indah', '087890123456', 'Jl. Flamboyan No. 34, Jakarta'),
('Eko Prasetyo', '088901234567', 'Jl. Bougenville No. 67, Jakarta'),
('Lina Marlina', '089012345678', 'Jl. Teratai No. 90, Jakarta'),
('Fajar Ramadhan', '080123456789', 'Jl. Kamboja No. 11, Jakarta');

-- ============================================
-- VEHICLES (12 kendaraan - menggunakan plate_number sebagai identifier untuk seeding)
-- ============================================
-- Get customer IDs first and insert vehicles
INSERT INTO vehicles (customer_id, plate_number, brand, model, year, color, notes)
SELECT c.id, 'B 1234 ABC', 'Honda', 'Beat', 2022, 'Merah', 'Rutin service'
FROM customers c WHERE c.name = 'Budi Santoso';

INSERT INTO vehicles (customer_id, plate_number, brand, model, year, color, notes)
SELECT c.id, 'B 5678 DEF', 'Yamaha', 'NMAX', 2023, 'Hitam', 'Baru beli'
FROM customers c WHERE c.name = 'Ahmad Hidayat';

INSERT INTO vehicles (customer_id, plate_number, brand, model, year, color, notes)
SELECT c.id, 'B 9012 GHI', 'Honda', 'Vario', 2021, 'Putih', 'CVT sering slip'
FROM customers c WHERE c.name = 'Siti Nurhaliza';

INSERT INTO vehicles (customer_id, plate_number, brand, model, year, color, notes)
SELECT c.id, 'B 3456 JKL', 'Suzuki', 'Address', 2020, 'Biru', 'Mesin berisik'
FROM customers c WHERE c.name = 'Dedi Kurniawan';

INSERT INTO vehicles (customer_id, plate_number, brand, model, year, color, notes)
SELECT c.id, 'B 7890 MNO', 'Yamaha', 'Aerox', 2023, 'Merah', '-'
FROM customers c WHERE c.name = 'Rina Wulandari';

INSERT INTO vehicles (customer_id, plate_number, brand, model, year, color, notes)
SELECT c.id, 'B 2345 PQR', 'Honda', 'PCX', 2022, 'Hitam', 'Velg depan bengkok'
FROM customers c WHERE c.name = 'Agus Supriyadi';

INSERT INTO vehicles (customer_id, plate_number, brand, model, year, color, notes)
SELECT c.id, 'B 6789 STU', 'Vespa', 'Primavera', 2021, 'Kuning', 'Antik'
FROM customers c WHERE c.name = 'Maya Indah';

INSERT INTO vehicles (customer_id, plate_number, brand, model, year, color, notes)
SELECT c.id, 'B 0123 VWX', 'Yamaha', 'Lexi', 2022, 'Putih', '-'
FROM customers c WHERE c.name = 'Eko Prasetyo';

INSERT INTO vehicles (customer_id, plate_number, brand, model, year, color, notes)
SELECT c.id, 'B 4567 YZA', 'Honda', 'Scoopy', 2023, 'Pink', 'Kunci hilang'
FROM customers c WHERE c.name = 'Lina Marlina';

INSERT INTO vehicles (customer_id, plate_number, brand, model, year, color, notes)
SELECT c.id, 'B 8901 BCD', 'Kawasaki', 'KLX', 2021, 'Hijau', 'Trail'
FROM customers c WHERE c.name = 'Fajar Ramadhan';

-- Second vehicle for Budi Santoso
INSERT INTO vehicles (customer_id, plate_number, brand, model, year, color, notes)
SELECT c.id, 'B 1111 EFG', 'Honda', 'Revo', 2019, 'Biru', 'Kedua'
FROM customers c WHERE c.name = 'Budi Santoso';

-- Second vehicle for Rina Wulandari
INSERT INTO vehicles (customer_id, plate_number, brand, model, year, color, notes)
SELECT c.id, 'B 2222 HIJ', 'Yamaha', 'Mio', 2020, 'Ungu', 'Kedua'
FROM customers c WHERE c.name = 'Rina Wulandari';
