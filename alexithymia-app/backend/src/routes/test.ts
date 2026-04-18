import { Router, Response } from 'express';
import db from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/save', requireAuth, (req: AuthRequest, res: Response) => {
  const { score, subscores } = req.body;

  if (typeof score !== 'number' || !subscores) {
    res.status(400).json({ error: 'score and subscores are required' });
    return;
  }

  const stmt = db.prepare(
    'INSERT INTO test_results (score, subscores, user_id) VALUES (?, ?, ?)'
  );
  const result = stmt.run(score, JSON.stringify(subscores), req.userId);
  res.json({ id: result.lastInsertRowid, score, subscores });
});

router.get('/history', requireAuth, (req: AuthRequest, res: Response) => {
  const rows = db
    .prepare('SELECT * FROM test_results WHERE user_id = ? ORDER BY taken_at DESC')
    .all(req.userId);
  const parsed = (rows as Array<{ id: number; score: number; subscores: string; taken_at: string }>).map((r) => ({
    ...r,
    subscores: JSON.parse(r.subscores),
  }));
  res.json(parsed);
});

export default router;
