const router = require('express').Router();
const { db } = require('../config/firebase');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const COL = 'treasury_transactions';
const VALID = ['Added', 'Withdrawn', 'Returned'];

router.get('/', requireAuth, async (req, res) => {
  const snap = await db.collection(COL).orderBy('createdAt', 'desc').limit(500).get();
  const txs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Balance: Added - Withdrawn + Returned
  let balance = 0;
  txs.forEach((t) => {
    if (t.actionType === 'Added')     balance += Number(t.amount);
    if (t.actionType === 'Withdrawn') balance -= Number(t.amount);
    if (t.actionType === 'Returned')  balance += Number(t.amount);
  });
  res.json({ transactions: txs, balance });
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { officerName, batchCode, amount, actionType } = req.body;
    if (!VALID.includes(actionType)) return res.status(400).json({ error: 'Bad actionType' });
    if (!officerName || !batchCode || amount == null) return res.status(400).json({ error: 'Missing fields' });

    const data = {
      officerName,
      batchCode,
      officerUid: req.user.uid,
      amount: Number(amount),
      actionType,
      createdAt: Date.now(),
    };
    const ref = await db.collection(COL).add(data);
    res.json({ id: ref.id, ...data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/reset', requireAuth, requireAdmin, async (req, res) => {
  try {
    const snap = await db.collection(COL).get();
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    res.json({ ok: true, deleted: snap.size });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
