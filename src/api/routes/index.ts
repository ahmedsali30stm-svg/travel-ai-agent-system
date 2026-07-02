import { Router } from 'express';
import { healthRoutes } from './health.js';
import { authRoutes } from './auth.js';
import { searchRoutes } from './search.js';
import { agentRoutes } from './agents.js';
import { tripRoutes } from './trips.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/search', searchRoutes);
router.use('/agents', agentRoutes);
router.use('/trips', tripRoutes);

export default router;
