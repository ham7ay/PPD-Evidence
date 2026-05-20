const router = require('express').Router();
const { db } = require('../config/firebase');
const { requireAuth } = require('../middleware/auth');

const norm = (s) => String(s || '').trim().toLowerCase();

router.get('/summary', requireAuth, async (req, res) => {
  try {
    const [lockerSnap, treasurySnap, itemsSnap] = await Promise.all([
      db.collection('evidence_locker').get(),
      db.collection('treasury_transactions').get(),
      db.collection('evidence_items').get(),
    ]);

    let totalBlack = 0, totalWhite = 0, totalItems = 0;
    const byOfficer = {};
    const byItem = {};
    const byDay = {};

    lockerSnap.docs.forEach((d) => {
      const e = d.data();
      totalBlack += e.blackMoneyValue || 0;
      totalWhite += e.whiteMoneyValue || 0;
      totalItems += e.quantity || 0;

      // Group by normalized key — handles legacy data without officerKey
      const keyName  = e.officerKey || norm(e.officerName);
      const keyBatch = e.batchKey   || norm(e.batchCode);
      const k = `${keyName}|${keyBatch}`;
      if (!byOfficer[k]) {
        // Use the first-seen display version (whatever was typed) as the canonical label
        byOfficer[k] = {
          officerName: e.officerName,
          batchCode: e.batchCode,
          items: 0, black: 0, white: 0,
        };
      }
      byOfficer[k].items += e.quantity || 0;
      byOfficer[k].black += e.blackMoneyValue || 0;
      byOfficer[k].white += e.whiteMoneyValue || 0;

      byItem[e.itemName] = byItem[e.itemName] || { itemName: e.itemName, quantity: 0, black: 0 };
      byItem[e.itemName].quantity += e.quantity || 0;
      byItem[e.itemName].black += e.blackMoneyValue || 0;

      const day = new Date(e.createdAt).toISOString().split('T')[0];
      byDay[day] = byDay[day] || { date: day, items: 0, black: 0, white: 0 };
      byDay[day].items += e.quantity || 0;
      byDay[day].black += e.blackMoneyValue || 0;
      byDay[day].white += e.whiteMoneyValue || 0;
    });

    let treasuryBalance = 0;
    treasurySnap.docs.forEach((d) => {
      const t = d.data();
      if (t.actionType === 'Added')     treasuryBalance += Number(t.amount);
      if (t.actionType === 'Withdrawn') treasuryBalance -= Number(t.amount);
      if (t.actionType === 'Returned')  treasuryBalance += Number(t.amount);
    });

    res.json({
      totalBlack,
      totalWhite,
      totalItems,
      treasuryBalance,
      itemCatalogueCount: itemsSnap.size,
      byOfficer: Object.values(byOfficer).sort((a, b) => b.black - a.black),
      byItem: Object.values(byItem).sort((a, b) => b.quantity - a.quantity),
      byDay: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;