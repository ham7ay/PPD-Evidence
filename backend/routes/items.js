const router = require('express').Router();
const { db } = require('../config/firebase');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const COL = 'evidence_items';

router.get('/', requireAuth, async (req, res) => {
  const snap = await db.collection(COL).orderBy('createdAt', 'desc').get();
  res.json({ items: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, blackMoneyValue, category, description, imageUrl, quantityAvailable } = req.body;
    if (!name || blackMoneyValue == null) return res.status(400).json({ error: 'Missing fields' });
    const data = {
      name,
      blackMoneyValue: Number(blackMoneyValue),
      category: category || 'Misc',
      description: description || '',
      imageUrl: imageUrl || '',
      quantityAvailable: Number(quantityAvailable) || 0,
      createdAt: Date.now(),
    };
    const ref = await db.collection(COL).add(data);
    res.json({ id: ref.id, ...data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const update = { ...req.body };
    delete update.id;
    if (update.blackMoneyValue !== undefined) update.blackMoneyValue = Number(update.blackMoneyValue);
    if (update.quantityAvailable !== undefined) update.quantityAvailable = Number(update.quantityAvailable);
    await db.collection(COL).doc(req.params.id).update(update);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await db.collection(COL).doc(req.params.id).delete();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const SEED = [
  { name: 'Illegal Weapon', blackMoneyValue: 5000, category: 'Weapon', description: 'Unlicensed firearm seized at scene.', imageUrl: '', quantityAvailable: 50 },
  { name: 'Drugs',           blackMoneyValue: 8000, category: 'Narcotics', description: 'Controlled substance — varies by gram.', imageUrl: '', quantityAvailable: 100 },
  { name: 'Fake Passport',   blackMoneyValue: 3500, category: 'Document', description: 'Forged travel document.', imageUrl: '', quantityAvailable: 30 },
  { name: 'Gold Bars',       blackMoneyValue: 12000, category: 'Valuables', description: 'Smuggled gold ingots.', imageUrl: '', quantityAvailable: 20 },
  { name: 'Stolen Jewelry',  blackMoneyValue: 6500, category: 'Valuables', description: 'Recovered from robbery cases.', imageUrl: '', quantityAvailable: 40 },
];

router.post('/seed', requireAuth, requireAdmin, async (req, res) => {
  try {
    const batch = db.batch();
    SEED.forEach((item) => {
      const ref = db.collection(COL).doc();
      batch.set(ref, { ...item, createdAt: Date.now() });
    });
    await batch.commit();
    res.json({ ok: true, seeded: SEED.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
