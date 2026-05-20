const router = require('express').Router();
const { db } = require('../config/firebase');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { toWhite } = require('../utils/currency');

const COL = 'evidence_locker';

router.get('/', requireAuth, async (req, res) => {
  try {
    const { officer, batchCode, itemName, dateFrom, dateTo, evidenceId } = req.query;
    let q = db.collection(COL);

    if (evidenceId) {
      const doc = await q.doc(evidenceId).get();
      return res.json({ entries: doc.exists ? [{ id: doc.id, ...doc.data() }] : [] });
    }

    let snap = await q.orderBy('createdAt', 'desc').limit(500).get();
    let entries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (officer)    entries = entries.filter((e) => e.officerName?.toLowerCase().includes(officer.toLowerCase()));
    if (batchCode)  entries = entries.filter((e) => e.batchCode?.toLowerCase().includes(batchCode.toLowerCase()));
    if (itemName)   entries = entries.filter((e) => e.itemName?.toLowerCase().includes(itemName.toLowerCase()));
    if (dateFrom)   entries = entries.filter((e) => e.createdAt >= new Date(dateFrom).getTime());
    if (dateTo)     entries = entries.filter((e) => e.createdAt <= new Date(dateTo).getTime() + 86400000);

    res.json({ entries });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { officerName, batchCode, itemId, quantity } = req.body;
    if (!officerName || !batchCode || !itemId || !quantity)
      return res.status(400).json({ error: 'Missing fields' });

    const itemDoc = await db.collection('evidence_items').doc(itemId).get();
    if (!itemDoc.exists) return res.status(404).json({ error: 'Item not found' });
    const item = itemDoc.data();

    const qty = Number(quantity);
    const blackMoneyValue = item.blackMoneyValue * qty;
    const whiteMoneyValue = toWhite(blackMoneyValue);

    const data = {
      officerName,
      batchCode,
      officerUid: req.user.uid,
      itemId,
      itemName: item.name,
      category: item.category,
      quantity: qty,
      blackMoneyValue,
      whiteMoneyValue,
      createdAt: Date.now(),
    };
    const ref = await db.collection(COL).add(data);

    const txRef = await db.collection('treasury_transactions').add({
      officerName,
      batchCode,
      officerUid: req.user.uid,
      amount: whiteMoneyValue,
      actionType: 'Added',
      source: 'evidence',
      evidenceId: ref.id,
      itemName: item.name,
      note: `Auto-deposit from evidence ${item.name} ×${qty}`,
      createdAt: Date.now(),
    });

    await ref.update({ treasuryTxId: txRef.id });

    res.json({ id: ref.id, ...data, treasuryTxId: txRef.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const doc = await db.collection(COL).doc(req.params.id).get();
    if (doc.exists) {
      const data = doc.data();
      if (data.treasuryTxId) {
        try { await db.collection('treasury_transactions').doc(data.treasuryTxId).delete(); } catch (_) {}
      }
    }
    await db.collection(COL).doc(req.params.id).delete();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Wipe ALL evidence + ALL treasury transactions in one go.
// Items catalogue and officers/users are untouched.
router.post('/reset-all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [evSnap, txSnap] = await Promise.all([
      db.collection('evidence_locker').get(),
      db.collection('treasury_transactions').get(),
    ]);
    const batch = db.batch();
    evSnap.docs.forEach((d) => batch.delete(d.ref));
    txSnap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    res.json({ ok: true, evidenceDeleted: evSnap.size, treasuryDeleted: txSnap.size });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;