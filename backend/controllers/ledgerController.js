const LedgerEntry = require('../models/LedgerEntry');

// GET /api/ledger
exports.getLedgerEntries = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      type,
      search,
      startDate,
      endDate,
      customer_id
    } = req.query;

    const query = {};

    if (type && type !== 'ALL') {
      query.transaction_type = type;
    }

    if (customer_id) {
      query.customer_id = customer_id;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { reference_no: new RegExp(search, 'i') },
        { account_name: new RegExp(search, 'i') },
        { customer_name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const entries = await LedgerEntry.find(query)
      .sort({ date: -1, _id: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const totalCount = await LedgerEntry.countDocuments(query);

    // Calculate platform totals
    const aggregates = await LedgerEntry.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalDebit: { $sum: '$debit' },
          totalCredit: { $sum: '$credit' }
        }
      }
    ]);

    const totalDebit = aggregates[0] ? aggregates[0].totalDebit : 0;
    const totalCredit = aggregates[0] ? aggregates[0].totalCredit : 0;
    const netBalance = totalDebit - totalCredit;

    res.json({
      success: true,
      data: {
        total: totalCount,
        page: Number(page),
        limit: Number(limit),
        summary: {
          totalDebit: Number(totalDebit.toFixed(2)),
          totalCredit: Number(totalCredit.toFixed(2)),
          netBalance: Number(netBalance.toFixed(2)),
          transactionCount: totalCount
        },
        entries
      },
      message: 'Ledger records retrieved successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/ledger/entry (Manual Accounting Adjustment)
exports.createManualEntry = async (req, res) => {
  try {
    const {
      reference_no,
      transaction_type = 'ADJUSTMENT',
      account_name,
      customer_id,
      customer_name,
      description,
      debit = 0,
      credit = 0
    } = req.body;

    if (!description || !account_name) {
      return res.status(400).json({ success: false, message: 'Account name and description are required.' });
    }

    // Get previous running balance
    const lastEntry = await LedgerEntry.findOne().sort({ date: -1, _id: -1 });
    const prevBalance = lastEntry ? lastEntry.running_balance : 0;
    const running_balance = Number((prevBalance + Number(debit || 0) - Number(credit || 0)).toFixed(2));

    const entry = new LedgerEntry({
      entry_id: `LED-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: new Date(),
      reference_no: reference_no || `ADJ-${Date.now().toString().slice(-6)}`,
      transaction_type,
      account_name,
      customer_id,
      customer_name,
      description,
      debit: Number(debit || 0),
      credit: Number(credit || 0),
      running_balance,
      created_by: req.user?.name || req.user?.username || 'Authorized Staff'
    });

    await entry.save();

    res.status(201).json({
      success: true,
      data: entry,
      message: 'Manual ledger entry successfully recorded.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/ledger/trail/:reference_id
exports.getAuditTrail = async (req, res) => {
  try {
    const trail = await LedgerEntry.find({
      $or: [
        { reference_id: req.params.reference_id },
        { reference_no: req.params.reference_id }
      ]
    }).sort({ date: 1 });

    res.json({
      success: true,
      data: trail,
      message: 'Ledger audit trail retrieved'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/ledger/summary
exports.getLedgerSummary = async (req, res) => {
  try {
    const aggregates = await LedgerEntry.aggregate([
      {
        $group: {
          _id: null,
          totalDebit: { $sum: '$debit' },
          totalCredit: { $sum: '$credit' }
        }
      }
    ]);

    const totalCount = await LedgerEntry.countDocuments();
    const lastEntry = await LedgerEntry.findOne().sort({ date: -1, _id: -1 });

    const totalDebit = aggregates[0] ? aggregates[0].totalDebit : 0;
    const totalCredit = aggregates[0] ? aggregates[0].totalCredit : 0;
    const netBalance = lastEntry ? lastEntry.running_balance : (totalDebit - totalCredit);

    res.json({
      success: true,
      data: {
        totalDebit: Number(totalDebit.toFixed(2)),
        totalCredit: Number(totalCredit.toFixed(2)),
        netBalance: Number(netBalance.toFixed(2)),
        totalEntries: totalCount
      },
      message: 'Ledger summary retrieved'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
