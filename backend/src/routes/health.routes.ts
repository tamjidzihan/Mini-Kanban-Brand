import { Router } from 'express';
import { getHealthSummary } from '../controllers/health.controller.js';

const router = Router();

// Full diagnostic health check (no auth required so external monitors or developers can easily inspect)
router.get('/', getHealthSummary);
router.get('/full', getHealthSummary);

export default router;
