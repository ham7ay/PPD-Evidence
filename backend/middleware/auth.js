const { auth, db } = require('../config/firebase');

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No token' });

    const decoded = await auth.verifyIdToken(token);
    req.user = decoded;

    const userDoc = await db.collection('users').doc(decoded.uid).get();
    req.userData = userDoc.exists ? userDoc.data() : null;
    req.isAdmin = req.userData?.role === 'admin';
    next();
  } catch (e) {
    console.error('Auth error:', e.message);
    res.status(401).json({ error: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.isAdmin) return res.status(403).json({ error: 'Admin only' });
  next();
}

module.exports = { requireAuth, requireAdmin };
