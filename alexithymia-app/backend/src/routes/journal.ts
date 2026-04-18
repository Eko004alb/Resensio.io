import { Router, Response } from 'express';
import db from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/entry', requireAuth, (req: AuthRequest, res: Response) => {
  const { label, note, x_val, y_val } = req.body;

  if (!label || !note || x_val === undefined || y_val === undefined) {
    res.status(400).json({ error: 'label, note, x_val, and y_val are required' });
    return;
  }

  const stmt = db.prepare(
    'INSERT INTO journal_entries (label, note, x_val, y_val, user_id) VALUES (?, ?, ?, ?, ?)'
  );
  const result = stmt.run(label, note, x_val, y_val, req.userId);
  res.json({ id: result.lastInsertRowid, label, note, x_val, y_val });
});

router.get('/entries', requireAuth, (req: AuthRequest, res: Response) => {
  const rows = db
    .prepare('SELECT * FROM journal_entries WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.userId);
  res.json(rows);
});

router.delete('/entry/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  db.prepare('DELETE FROM journal_entries WHERE id = ? AND user_id = ?').run(id, req.userId);
  res.json({ success: true });
});

export default router;
