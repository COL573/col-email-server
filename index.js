// index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase, verifyFirebaseToken } from './supabase.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());

// ✅ In-memory DB (for now)
let testimonies = [];
let prayerRequests = [];
let meetingLinks = [];
let audioFiles = [
  'https://your-audio-link.com/file1.mp3',
  'https://your-audio-link.com/file2.mp3'
];

// ✅ Firebase Token middleware
async function authenticateFirebase(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });

  const idToken = authHeader.split(' ')[1];
  try {
    const user = await verifyFirebaseToken(idToken);
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: ' + err.message });
  }
}

// ✅ Health
app.get('/health', (req, res) => res.send('🟢 Server is up'));

// ✅ Get role (from Supabase)
app.get('/user-role', authenticateFirebase, async (req, res) => {
  const { uid } = req.user;
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', uid)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Role not found.' });
  res.json({ role: data.role });
});

// ✅ Register default profile
app.post('/register-profile', authenticateFirebase, async (req, res) => {
  const { uid, email } = req.user;
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: uid, email, role: 'viewer' }, { onConflict: ['id'] });

  if (error) return res.status(500).json({ error: 'Failed to register profile.' });
  res.json({ message: 'Profile registered.', data });
});

// ✅ Secure test
app.get('/secure', authenticateFirebase, (req, res) => {
  res.json({ message: `Authenticated as ${req.user.email}` });
});


// ---------- ✅ Testimonies ----------
app.get('/api/testimonies', authenticateFirebase, (_, res) => res.json(testimonies));

app.post('/submit/testimony', (req, res) => {
  const { testimony, user_id } = req.body;
  const entry = {
    id: Date.now().toString(),
    testimony,
    user_id,
    status: 'pending',
    created_at: new Date()
  };
  testimonies.unshift(entry);
  res.json(entry);
});

app.patch('/api/testimonies/:id', authenticateFirebase, (req, res) => {
  const item = testimonies.find(t => t.id === req.params.id);
  if (item) item.status = req.body.status || 'approved';
  res.json(item || {});
});

app.delete('/api/testimonies/:id', authenticateFirebase, (req, res) => {
  testimonies = testimonies.filter(t => t.id !== req.params.id);
  res.json({ success: true });
});


// ---------- ✅ Prayer Requests ----------
app.get('/api/prayer-requests', authenticateFirebase, (_, res) => res.json(prayerRequests));

app.post('/submit/prayer-request', (req, res) => {
  const { message, user_id, tags, is_public } = req.body;
  const entry = {
    id: Date.now().toString(),
    message,
    user_id,
    tags,
    is_public,
    status: 'pending',
    created_at: new Date()
  };
  prayerRequests.unshift(entry);
  res.json(entry);
});

app.patch('/api/prayer-requests/:id', authenticateFirebase, (req, res) => {
  const item = prayerRequests.find(p => p.id === req.params.id);
  if (item) item.status = req.body.status || 'approved';
  res.json(item || {});
});

app.delete('/api/prayer-requests/:id', authenticateFirebase, (req, res) => {
  prayerRequests = prayerRequests.filter(p => p.id !== req.params.id);
  res.json({ success: true });
});


// ---------- ✅ Meeting Links ----------
app.get('/api/meeting-links', authenticateFirebase, (_, res) => res.json(meetingLinks));

app.post('/api/meeting-links', authenticateFirebase, (req, res) => {
  const url = req.body.url;
  if (url) meetingLinks.push({ url, created_at: new Date() });
  res.json({ success: true });
});


// ---------- ✅ Audio Requests ----------
app.get('/api/audio-requests', authenticateFirebase, (_, res) => {
  res.json(audioFiles);
});


// ---------- ✅ Start server ----------
app.listen(PORT, () => {
  console.log(`🚀 COL Ministries backend running at http://localhost:${PORT}`);
});
