import express from 'express';
import { analyticsController } from '../controllers/analytics.controller';

const router = express.Router();

/**
 * Analytics Routes
 */
router.get('/stats', (req, res, next) => analyticsController.getStats(req, res, next));
router.get('/invoice-trends', (req, res, next) => analyticsController.getInvoiceTrends(req, res, next));
router.get('/vendors/top10', (req, res, next) => analyticsController.getTopVendors(req, res, next));
router.get('/category-spend', (req, res, next) => analyticsController.getCategorySpend(req, res, next));
router.get('/cash-outflow', (req, res, next) => analyticsController.getCashOutflow(req, res, next));
router.get('/invoices', (req, res, next) => analyticsController.getInvoices(req, res, next));

export default router;
