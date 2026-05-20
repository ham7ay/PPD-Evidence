const router = require('express').Router();
const { db } = require('../config/firebase');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const COL = 'treasury_transactions';
const VALID = ['Added', 'Withdrawn', 'Returned'];

const normName  = (s) => String(s || '').trim().toLowerCase();
const normBatch = (s) => String(s || '').trim().toLowerCase();

async function computeBalance() {
  const snap = await db.collection(COL).get();
  let balance = 0;
  snap.docs.forEach((d) => {
    const t = d.data();
    if (t.actionType === 'Added')     balance += Number(t.amount);
    if (t.actionType === 'Withdrawn') balance -= Number(t.amount);
    if (t.actionType === 'Returned')  balance += Number(t.amount);
  });
  return balance;
}

router.get('/', requireAuth, async (req, res) => {
  const snap = await db.collection(COL).orderBy('createdAt', 'desc').limit(500).get();
  const txs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  let balance = 0;
  txs.forEach((t) => {
    if (t.actionType === 'Added')     balance += Number(t.amount);
    if (t.actionType === 'Withdrawn') balance -= Number(t.amount);
    if (t.actionType === 'Returned')  balance += Number(t.amount);
  });
  res.json({ transactions: txs, balance });
});

// Manual transactions are admin-only.
// Withdrawals cannot exceed current balance.
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { officerName, batchCode, amount, actionType } = req.body;
    if (!VALID.includes(actionType)) return res.status(400).json({ error: 'Bad actionType' });
    if (!officerName || !batchCode || amount == null) return res.status(400).json({ error: 'Missing fields' });

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ error: 'Amount must be greater than zero' });

    if (actionType === 'Withdrawn') {
      const balance = await computeBalance();
      if (amt > balance) {
        return res.status(400).json({
          error: `Insufficient vault balance. Available: $ ${balance.toLocaleString()}, requested: $ ${amt.toLocaleString()}.`,
        });
      }
    }

    const displayName  = String(officerName).trim();
    const displayBatch = String(batchCode).trim();

    const data = {
      officerName: displayName,
      batchCode: displayBatch,
      officerKey: normName(displayName),
      batchKey: normBatch(displayBatch),
      officerUid: req.user.uid,
      amount: amt,
      actionType,
      source: 'manual',
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