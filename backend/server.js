require('dotenv').config();
const express = require('express');
const cors = require('cors');

require('./config/firebase'); // init admin

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'ppd-evidence-api' }));

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/items',    require('./routes/items'));
app.use('/api/evidence', require('./routes/evidence'));
app.use('/api/treasury', require('./routes/treasury'));
app.use('/api/reports',  require('./routes/reports'));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚔 PPD Evidence API on http://localhost:${PORT}`));
