const { AppError } = require('../lib/errors');

function validateMedicine(body) {
  if (!body.name || !String(body.name).trim()) throw new AppError('Medicine name is required.', 400);
  const quantity = Number(body.quantity || 0);
  if (!Number.isFinite(quantity) || quantity < 0) throw new AppError('Stock quantity must be zero or more.', 400);
  const reorder = Number(body.reorder_level || 0);
  if (!Number.isFinite(reorder) || reorder < 0) throw new AppError('Reorder level must be zero or more.', 400);
}

module.exports = { validateMedicine };
