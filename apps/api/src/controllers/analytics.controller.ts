import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service';

/**
 * Analytics Controller
 * Handles HTTP requests/responses for analytics endpoints
 */
export class AnalyticsController {
  /**
   * GET /api/stats
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await analyticsService.getStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/invoice-trends
   */
  async getInvoiceTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const trends = await analyticsService.getInvoiceTrends();
      res.json(trends);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/vendors/top10
   */
  async getTopVendors(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const vendors = await analyticsService.getTopVendors(limit);
      res.json(vendors);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/category-spend
   */
  async getCategorySpend(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await analyticsService.getCategorySpend();
      res.json(categories);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/cash-outflow
   */
  async getCashOutflow(req: Request, res: Response, next: NextFunction) {
    try {
      const outflow = await analyticsService.getCashOutflow();
      res.json(outflow);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/invoices
   */
  async getInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, status, page, pageSize, sortBy, sortDir } = req.query;
      
      const invoices = await analyticsService.getInvoices({
        q: q as string,
        status: status as string,
        page: page ? parseInt(page as string) : undefined,
        pageSize: pageSize ? parseInt(pageSize as string) : undefined,
        sortBy: sortBy as string,
        sortDir: (sortDir as 'asc' | 'desc') || 'desc',
      });
      
      res.json(invoices);
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
