import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db';
import { requireAuth, AuthRequest, JWT_SECRET } from '../middleware/auth';

const router = Router();

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
}

router.post('/register', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'Email already in use' });
    return;
  }

  const password_hash = await bcrypt.hash(password, 10);
  const result = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email, password_hash);

  const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: result.lastInsertRowid, email } });
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email } });
});

router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(req.userId) as UserRow | undefined;
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ id: user.id, email: user.email, created_at: user.created_at });
});

export default router;
