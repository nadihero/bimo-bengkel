-- Bengkel Dream Database Schema for Supabase (MySQL compatible)
-- Motorcycle Workshop Bookkeeping System

-- Enable UUID extension (for Supabase/PostgreSQL)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers table
CREATE TABLE customers (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Vehicles table
CREATE TABLE vehicles (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    customer_id CHAR(36) NOT NULL,
    plate_number VARCHAR(20) NOT NULL UNIQUE,
    brand VARCHAR(100),
    model VARCHAR(100),
    year INT,
    color VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Index on plate_number for fast lookup
CREATE INDEX idx_vehicles_plate_number ON vehicles(plate_number);

-- Transactions table
CREATE TABLE transactions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    vehicle_id CHAR(36) NOT NULL,
    transaction_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    status ENUM('unpaid', 'dp', 'paid') NOT NULL DEFAULT 'unpaid',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Index on transaction status for filtering
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);

-- Transaction items table
CREATE TABLE transaction_items (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    transaction_id CHAR(36) NOT NULL,
    description VARCHAR(500) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

CREATE INDEX idx_transaction_items_transaction ON transaction_items(transaction_id);

-- Payments table
CREATE TABLE payments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    transaction_id CHAR(36) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method ENUM('cash', 'transfer', 'qris') NOT NULL DEFAULT 'cash',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

CREATE INDEX idx_payments_transaction ON payments(transaction_id);

-- Out of stock items (Restock list)
CREATE TABLE out_of_stock_items (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    is_bought BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
