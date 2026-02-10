-- Create Database
CREATE DATABASE IF NOT EXISTS tally_invoicing;
USE tally_invoicing;

-- Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    vat_rate DECIMAL(5, 2) NOT NULL,
    quantity_in_stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
-- Storing raw JSON payload in a separate column 'order_data' for strict compliance with "store it [JSON/XML]" requirement if needed,
-- but primarily using relational columns for querying and display.
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    vat_amount DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    raw_data JSON, -- Stores the JSON representation of the order as per requirements
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
