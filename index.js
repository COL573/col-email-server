import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase, verifyFirebaseToken } from './supabase.js';

dotenv.config();

const app = express();

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Middleware to verify Firebase ID token
async function authenticateFirebase(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }

  const idToken = authHeader.split(' ')[1];

  try {
    const user = await verifyFirebaseToken(idToken);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: ' + error.message });
  }
}

// Health check route
app.get('/health', (req, res) => {
  res.send('🟢 Server is up');
});

// Secure route: fetch user role from Supabase
app.get('/user-role', authenticateFirebase, async (req, res) => {
  const { uid } = req.user;

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', uid)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Role not found.' });
  }

  res.json({ role: data.role });
});

// Secure route: create or update user profile with default role
app.post('/register-profile', authenticateFirebase, async (req, res) => {
  const { uid, email } = req.user;

  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: uid, email, role: 'viewer' }, { onConflict: ['id'] });

  if (error) {
    return res.status(500).json({ error: 'Failed to register profile.' });
  }

  res.json({ message: 'Profile registered.', data });
});

// Secure test route
app.get('/secure', authenticateFirebase, (req, res) => {
  res.json({ message: `Authenticated as ${req.user.email}` });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ COL Ministries backend running at http://localhost:${PORT}`);
});
