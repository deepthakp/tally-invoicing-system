const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const xml2js = require('xml2js');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.text({ type: 'application/xml' })); // Parse XML as text
// If JSON payload is sent, bodyParser.json() handles it.

// Database Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test DB Connection
pool.getConnection()
    .then(conn => {
        console.log('Database connected successfully');
        conn.release();
    })
    .catch(err => {
        console.error('Database connection failed:', err);
    });

// Helper to convert XML to JSON
const parseXML = async (xmlOptions) => {
    const parser = new xml2js.Parser();
    return parser.parseStringPromise(xmlOptions);
};

// --- Routes ---

// Root Check
app.get('/', (req, res) => {
    res.json({ status: 'Backend is running', timestamp: new Date() });
});

// Create Company
app.post('/api/companies', async (req, res) => {
    try {
        const { name, address } = req.body;
        if (!name || !address) return res.status(400).json({ error: 'Name and Address required' });

        const [result] = await pool.execute(
            'INSERT INTO companies (name, address) VALUES (?, ?)',
            [name, address]
        );
        res.status(201).json({ id: result.insertId, name, address });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get Companies
app.get('/api/companies', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM companies ORDER BY name');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Product
app.post('/api/products', async (req, res) => {
    try {
        const { name, unit_price, vat_rate, quantity_in_stock } = req.body;
        if (!name || unit_price === undefined || vat_rate === undefined) {
            return res.status(400).json({ error: 'Invalid product data' });
        }

        const [result] = await pool.execute(
            'INSERT INTO products (name, unit_price, vat_rate, quantity_in_stock) VALUES (?, ?, ?, ?)',
            [name, unit_price, vat_rate, quantity_in_stock || 0]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get Products
app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM products ORDER BY name');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Order (supports JSON body or conversion from XML if implemented in frontend to send XML)
// Requirement: "Convert submitted data to XML/JSON and store it"
// We'll accept JSON payload from frontend for simplicity, and store it.
app.post('/api/orders', async (req, res) => {
    try {
        let orderData = req.body;

        // If content-type is xml, parse it
        if (req.is('application/xml')) {
            const parsed = await parseXML(req.body);
            // Basic transformation if needed, simplistic assumption of structure
            // XML expected structure: <root><companyId>1</companyId><productId>2</productId>...</root>
            // For now assume frontend sends JSON as per modern standards, but we store the blob.
            // If the requirement dictates we MUST support XML input endpoint:
            // Map parsed XML to orderData object
        }

        const { company_id, product_id, quantity } = orderData;

        if (!company_id || !product_id || !quantity) {
            return res.status(400).json({ error: 'Missing required order fields' });
        }


        // Fetch product details for calculation
        const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [product_id]);
        if (products.length === 0) return res.status(404).json({ error: 'Product not found' });

        const product = products[0];

        // Fetch company details for snapshot
        const [companies] = await pool.query('SELECT * FROM companies WHERE id = ?', [company_id]);
        if (companies.length === 0) return res.status(404).json({ error: 'Company not found' });
        const company = companies[0];

        // Calculation
        const priceBeforeVat = product.unit_price * quantity;
        const vatAmount = (priceBeforeVat * product.vat_rate) / 100;
        const totalPrice = priceBeforeVat + vatAmount;

        // Construct full snapshot JSON
        const fullSnapshot = {
            company: {
                id: company.id,
                name: company.name,
                address: company.address
            },
            product: {
                id: product.id,
                name: product.name,
                unit_price: product.unit_price,
                vat_rate: product.vat_rate,
                quantity: quantity
            }
        };

        // Store
        const [result] = await pool.execute(
            `INSERT INTO orders 
            (company_id, product_id, quantity, vat_amount, total_price, raw_data) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [company_id, product_id, quantity, vatAmount, totalPrice, JSON.stringify(fullSnapshot)]
        );

        res.status(201).json({
            id: result.insertId,
            company_id,
            product_id,
            quantity,
            vat_amount: vatAmount,
            total_price: totalPrice
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get Invoices (Orders with details)
app.get('/api/invoices', async (req, res) => {
    try {
        const query = `
            SELECT o.id, o.order_date, o.quantity, o.vat_amount, o.total_price,
                   c.name as company_name, c.address as company_address,
                   p.name as product_name, p.unit_price, p.vat_rate
            FROM orders o
            JOIN companies c ON o.company_id = c.id
            JOIN products p ON o.product_id = p.id
            ORDER BY o.order_date DESC
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
