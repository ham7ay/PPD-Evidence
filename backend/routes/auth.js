const router = require('express').Router();
const { db, auth } = require('../config/firebase');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.post('/register', requireAuth, async (req, res) => {
  try {
    const { name, batchCode } = req.body;
    const { uid, email } = req.user;

    const userRef = db.collection('users').doc(uid);
    const snap = await userRef.get();
    if (snap.exists) return res.json({ ok: true, user: snap.data() });

    // Bootstrap: first user ever becomes auto-approved admin.
    // Everyone else is pending, awaiting admin approval.
    const usersSnap = await db.collection('users').limit(1).get();
    const isFirstUser = usersSnap.empty;
    const role   = isFirstUser ? 'admin'    : 'officer';
    const status = isFirstUser ? 'approved' : 'pending';

    const data = {
      uid,
      email,
      name: name || email.split('@')[0],
      batchCode: batchCode || '',
      role,
      status,
      createdAt: Date.now(),
    };
    await userRef.set(data);
    res.json({ ok: true, user: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.userData });
});

router.put('/me', requireAuth, async (req, res) => {
  try {
    if (!req.isApproved) return res.status(403).json({ error: 'Account pending approval' });
    const { name, batchCode } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (batchCode !== undefined) update.batchCode = batchCode;
    await db.collection('users').doc(req.user.uid).update(update);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/officers', requireAuth, requireAdmin, async (req, res) => {
  const snap = await db.collection('users').orderBy('createdAt', 'desc').get();
  res.json({ officers: snap.docs.map((d) => d.data()) });
});

router.put('/officers/:uid/role', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'officer'].includes(role)) return res.status(400).json({ error: 'Bad role' });
    await db.collection('users').doc(req.params.uid).update({ role });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Approve a pending registration
router.put('/officers/:uid/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    await db.collection('users').doc(req.params.uid).update({
      status: 'approved',
      approvedAt: Date.now(),
      approvedBy: req.user.uid,
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Reject pending registration — deletes Firestore doc AND Firebase Auth user
router.delete('/officers/:uid', requireAuth, requireAdmin, async (req, res) => {
  try {
    await db.collection('users').doc(req.params.uid).delete();
    try { await auth.deleteUser(req.params.uid); } catch (_) {}
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;