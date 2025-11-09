"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Helper to serialize BigInt values from raw SQL queries
const serializeBigInt = (data) => {
    return JSON.parse(JSON.stringify(data, (_key, value) => typeof value === 'bigint' ? value.toString() : value));
};
app.get('/stats', async (_req, res) => {
    const [invoiceCount, totalSpend, avg] = await Promise.all([
        prisma.invoice.count(),
        prisma.invoice.aggregate({ _sum: { totalAmount: true } }),
        prisma.invoice.aggregate({ _avg: { totalAmount: true } })
    ]);
    res.json({
        totalSpendYTD: totalSpend._sum.totalAmount || 0,
        totalInvoices: invoiceCount,
        documentsUploaded: invoiceCount,
        averageInvoiceValue: avg._avg.totalAmount || 0
    });
});
app.get('/invoice-trends', async (_req, res) => {
    const result = await prisma.$queryRaw `SELECT date_trunc('month', "issueDate") AS month, COUNT(*) AS invoice_count, SUM("totalAmount") AS total_spend FROM "Invoice" GROUP BY 1 ORDER BY 1;`;
    res.json(serializeBigInt(result));
});
app.get('/vendors/top10', async (_req, res) => {
    const result = await prisma.$queryRaw `SELECT v.name, SUM(i."totalAmount") AS spend FROM "Invoice" i JOIN "Vendor" v ON v.id = i."vendorId" GROUP BY v.name ORDER BY spend DESC LIMIT 10;`;
    res.json(serializeBigInt(result));
});
app.get('/category-spend', async (_req, res) => {
    const result = await prisma.$queryRaw `SELECT COALESCE(v.category,'Uncategorized') AS category, SUM(i."totalAmount") AS spend FROM "Invoice" i JOIN "Vendor" v ON v.id = i."vendorId" GROUP BY category ORDER BY spend DESC;`;
    res.json(serializeBigInt(result));
});
app.get('/cash-outflow', async (_req, res) => {
    const result = await prisma.$queryRaw `
    SELECT 
      CASE 
        WHEN (i."dueDate" - CURRENT_DATE) < 0 THEN 'Overdue'
        WHEN (i."dueDate" - CURRENT_DATE) BETWEEN 0 AND 7 THEN '0-7 days'
        WHEN (i."dueDate" - CURRENT_DATE) BETWEEN 8 AND 30 THEN '8-30 days'
        WHEN (i."dueDate" - CURRENT_DATE) BETWEEN 31 AND 60 THEN '31-60 days'
        WHEN (i."dueDate" - CURRENT_DATE) > 60 THEN '60+ days'
        ELSE 'Unknown'
      END AS range,
      SUM(i."totalAmount" - COALESCE(p.paid, 0)) AS cash_outflow
    FROM "Invoice" i
    LEFT JOIN (
      SELECT "invoiceId", SUM(amount) as paid 
      FROM "Payment" 
      GROUP BY "invoiceId"
    ) p ON p."invoiceId" = i.id
    WHERE i."dueDate" IS NOT NULL
    GROUP BY range
    ORDER BY 
      CASE range
        WHEN 'Overdue' THEN 0
        WHEN '0-7 days' THEN 1
        WHEN '8-30 days' THEN 2
        WHEN '31-60 days' THEN 3
        WHEN '60+ days' THEN 4
        ELSE 5
      END;
  `;
    res.json(serializeBigInt(result));
});
app.get('/invoices', async (req, res) => {
    const { q, status } = req.query;
    const invoices = await prisma.invoice.findMany({
        where: {
            status: status ? { equals: status } : undefined,
            OR: q ? [
                { invoiceNumber: { contains: q, mode: 'insensitive' } },
                { vendor: { name: { contains: q, mode: 'insensitive' } } }
            ] : undefined
        },
        include: { vendor: true }
    });
    res.json(invoices);
});
app.post('/chat-with-data', async (req, res) => {
    // placeholder until Vanna service is implemented
    const { question } = req.body;
    res.json({ sql: 'SELECT COUNT(*) FROM "Invoice";', rows: [[42]], columns: ['count'], question });
});
const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`API running on ${port}`));
