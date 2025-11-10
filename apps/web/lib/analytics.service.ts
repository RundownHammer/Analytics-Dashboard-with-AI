import { prisma } from './prisma';
import { serializeBigInt } from './helpers';

/**
 * Analytics Service
 * Handles all business logic for analytics endpoints
 */
export class AnalyticsService {
  /**
   * Get overview statistics
   */
  async getStats() {
    const [invoiceCount, aggregates] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.aggregate({
        _sum: { totalAmount: true },
        _avg: { totalAmount: true },
      }),
    ]);

    return {
      totalSpendYTD: aggregates._sum.totalAmount?.toString() || '0',
      totalInvoices: invoiceCount,
      documentsUploaded: invoiceCount,
      averageInvoiceValue: aggregates._avg.totalAmount?.toString() || '0',
    };
  }

  /**
   * Get invoice trends (monthly)
   */
  async getInvoiceTrends() {
    const result = await prisma.$queryRaw`
      SELECT 
        date_trunc('month', "issueDate") AS month,
        COUNT(*)::text AS invoice_count,
        SUM("totalAmount")::text AS total_spend
      FROM "Invoice"
      WHERE "issueDate" IS NOT NULL
      GROUP BY date_trunc('month', "issueDate")
      ORDER BY month ASC
    `;

    return serializeBigInt(result);
  }

  /**
   * Get top 10 vendors by spend
   */
  async getTopVendors(limit: number = 10) {
    const result = await prisma.$queryRaw`
      SELECT 
        v.name,
        SUM(i."totalAmount")::text AS spend
      FROM "Invoice" i
      INNER JOIN "Vendor" v ON v.id = i."vendorId"
      GROUP BY v.id, v.name
      ORDER BY SUM(i."totalAmount") DESC
      LIMIT ${limit}
    `;

    return serializeBigInt(result);
  }

  /**
   * Get spend by category
   */
  async getCategorySpend() {
    // Ensure we always return a consistent set of categories even if some have zero spend.
    const result = await prisma.$queryRaw`
      WITH base AS (
        SELECT 
          COALESCE(v.category, 'Uncategorized') AS category,
          SUM(i."totalAmount") AS raw_spend
        FROM "Invoice" i
        INNER JOIN "Vendor" v ON v.id = i."vendorId"
        GROUP BY v.category
      ),
      categories AS (
        SELECT UNNEST(ARRAY['Technology','Operations','Marketing','Facilities']) AS category
      )
      SELECT 
        c.category,
        COALESCE(base.raw_spend, 0)::text AS spend
      FROM categories c
      LEFT JOIN base ON base.category = c.category
      ORDER BY c.category ASC
    `;

    return serializeBigInt(result);
  }

  /**
   * Get cash outflow forecast by aging buckets
   */
  async getCashOutflow() {
    // Breakdown unpaid portions of invoices across aging buckets; exclude fully paid invoices.
    const result = await prisma.$queryRaw`
      WITH buckets_list AS (
        SELECT UNNEST(ARRAY['Overdue', '0-7 days', '8-30 days', '31-60 days', '60+ days']) AS bucket
      ),
      payments AS (
        SELECT "invoiceId", COALESCE(SUM(amount), 0) AS paid
        FROM "Payment"
        GROUP BY "invoiceId"
      ),
      remaining AS (
        SELECT 
          i.id,
          i."totalAmount" - COALESCE(p.paid, 0) AS outstanding,
          i."dueDate"
        FROM "Invoice" i
        LEFT JOIN payments p ON p."invoiceId" = i.id
        WHERE i.status NOT IN ('PAID','CANCELLED')
          AND (i."totalAmount" - COALESCE(p.paid, 0)) > 0
      ),
      classified AS (
        SELECT 
          CASE 
            WHEN r."dueDate" IS NULL THEN '60+ days' -- Treat missing due date as far future to avoid lumping in overdue
            WHEN DATE(r."dueDate") < CURRENT_DATE THEN 'Overdue'
            WHEN DATE(r."dueDate") BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN '0-7 days'
            WHEN DATE(r."dueDate") BETWEEN CURRENT_DATE + INTERVAL '8 days' AND CURRENT_DATE + INTERVAL '30 days' THEN '8-30 days'
            WHEN DATE(r."dueDate") BETWEEN CURRENT_DATE + INTERVAL '31 days' AND CURRENT_DATE + INTERVAL '60 days' THEN '31-60 days'
            WHEN DATE(r."dueDate") > CURRENT_DATE + INTERVAL '60 days' THEN '60+ days'
            ELSE '60+ days'
          END AS bucket,
          r.outstanding
        FROM remaining r
      )
      SELECT 
        b.bucket,
        COALESCE(SUM(c.outstanding), 0)::text AS cash_outflow
      FROM buckets_list b
      LEFT JOIN classified c ON c.bucket = b.bucket
      GROUP BY b.bucket
      ORDER BY array_position(ARRAY['Overdue', '0-7 days', '8-30 days', '31-60 days', '60+ days'], b.bucket)
    `;

    return serializeBigInt(result);
  }

  /**
   * Get invoices with filters and pagination
   */
  async getInvoices(params: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }) {
    const {
      q,
      status,
      page,
      pageSize,
      sortBy = 'issueDate',
      sortDir = 'desc',
    } = params;

    // Build where clause
    const where: any = {};
    
    if (status) {
      where.status = status;
    }

    if (q) {
      where.OR = [
        { invoiceNumber: { contains: q, mode: 'insensitive' } },
        { vendor: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    // Determine orderBy
    const sortableFields = ['issueDate', 'dueDate', 'totalAmount', 'invoiceNumber', 'createdAt'];
    const orderByField = sortableFields.includes(sortBy) ? sortBy : 'issueDate';
    const orderBy = { [orderByField]: sortDir };

    // Handle pagination
    if (page && pageSize) {
      const p = Math.max(parseInt(String(page)), 1);
      const ps = Math.min(Math.max(parseInt(String(pageSize)), 1), 100);

      const [total, data] = await Promise.all([
        prisma.invoice.count({ where }),
        prisma.invoice.findMany({
          where,
          include: { vendor: true, customer: true },
          orderBy,
          skip: (p - 1) * ps,
          take: ps,
        }),
      ]);

      return { data, total, page: p, pageSize: ps };
    }

    // Return all matching invoices
    const data = await prisma.invoice.findMany({
      where,
      include: { vendor: true, customer: true },
      orderBy,
    });

    return data;
  }
}

export const analyticsService = new AnalyticsService();
