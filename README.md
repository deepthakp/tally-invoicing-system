# Tally-Like Invoicing System

A standalone invoicing system built with React + Vite (Frontend) and Node.js + Express + MySQL (Backend).

## Features
- **Company Management**: Add and store company details.
- **Product Management**: Add products with Unit Price and VAT Rate.
- **Invoicing**: Create orders/invoices with automatic VAT calculation and total price computation.
- **Data Persistence**: Stores data in MySQL database with relational structure.
- **JSON/XML Compliance**: Stores raw transaction data in JSON format for audit/compliance.

## Tech Stack
- **Frontend**: React, Vite, Mantine UI, Axios
- **Backend**: Node.js, Express, MySQL2
- **Database**: MySQL

## Prerequisites
- Node.js (v14+)
- MySQL Server

## Setup Instructions

1.  **Clone the repository** (if applicable)

2.  **Database Setup**
    - Ensure your MySQL server is running.
    - Create a database named `tally_invoicing` or let the setup script do it.
    - Configure database credentials in `server/.env` file:
      ```env
      DB_HOST=localhost
      DB_USER=root
      DB_PASSWORD=your_password
      DB_NAME=tally_invoicing
      PORT=3000
      ```
    - Run the schema setup script (from root directory):
      ```bash
      cd server
      node setup_db.js
      ```
      *Note: If this fails due to password, verify your .env file.*

3.  **Backend Setup**
    ```bash
    cd server
    npm install
    node index.js
    ```
    Server will start on `http://localhost:3000`.

4.  **Frontend Setup**
    ```bash
    cd client
    npm install
    npm run dev
    ```
    Frontend will start on `http://localhost:5173`.

## Usage
1.  Open the frontend URL.
2.  Go to **Add Company** tab to create a company.
3.  Go to **Add Product** tab to create a product.
4.  Go to **Create Invoice** tab, select the company and product, enter quantity.
    - The system will auto-calculate VAT and Total.
5.  Click **Generate Invoice**.
6.  View all invoices in the **View Invoices** tab.

## Database Schema
The SQL schema is located in `schema.sql`.

## XML/JSON Handling
- The system accepts JSON payloads for order creation.
- It stores the raw JSON request in the `raw_data` column of the `orders` table.
- The backend is configured with `xml2js` to extensible support XML input if enabling the specific route logic.

## Deployment Details
1. Frontend Deployment
Platform: Vercel
Live URL: https://tally-invoicing-system.vercel.app
The frontend is deployed using Vercel and automatically builds from the GitHub repository on every push to the main branch.

2.Database Deployment
Platform: Railway
Database Type: MySQL
Dashboard Link: https://railway.app/dashboard
The MySQL database is provisioned and hosted on Railway.
It stores all application data including companies, products, and invoices.

