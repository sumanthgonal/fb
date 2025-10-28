import express from 'express';
import {
  getAllFeedbacks,
  getFeedback,
  createFeedback,
  updateFeedbackStatus,
  voteFeedback,
  getUserVotes
} from '../controllers/feedbackController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllFeedbacks);
router.get('/:id', getFeedback);

// Protected routes
router.post('/', authMiddleware, createFeedback);
router.put('/:id', authMiddleware, updateFeedbackStatus);
router.post('/:id/vote', authMiddleware, voteFeedback);
router.get('/votes/me', authMiddleware, getUserVotes);

export default router;
