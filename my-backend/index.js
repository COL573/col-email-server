import express from 'express';
import { supabase } from './supabase.js';

const app = express();
app.use(express.json());

// Example: Role-protected endpoint
app.get('/user-role/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', id)
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch role.' });
  }

  res.json({ role: data.role });
});

// Example: Create new profile (if needed)
app.post('/register-profile', async (req, res) => {
  const { id, email } = req.body;
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id, email, role: 'viewer' });

  if (error) {
    return res.status(500).json({ error: 'Failed to insert profile.' });
  }

  res.json({ message: 'Profile registered.', data });
});

app.listen(3000, () => {
  console.log('Backend running on http://localhost:3000');
});
