const directus = require('../lib/directus');
const { AppError } = require('../lib/errors');

function today() {
  return new Date().toISOString().slice(0, 10);
}

function effectiveStatus(medicine) {
  if (!medicine) return 'unknown';
  if (medicine.expiry_date && medicine.expiry_date < today()) return 'expired';
  const quantity = Number(medicine.quantity || 0);
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= Number(medicine.reorder_level || 0)) return 'low_stock';
  return 'available';
}

function decorate(medicine) {
  return { ...medicine, effective_status: effectiveStatus(medicine) };
}

async function listMedicines({ q, category, status } = {}) {
  const filter = {};
  if (category) filter.category = { _eq: category };
  const medicines = await directus.list('medicines', {
    filter: Object.keys(filter).length ? filter : undefined,
    sort: ['name'],
    fields: '*',
    limit: -1,
  });

  return medicines
    .map(decorate)
    .filter((medicine) => {
      if (status && medicine.effective_status !== status) return false;
      if (!q) return true;
      const term = q.toLowerCase();
      return [medicine.name, medicine.category, medicine.description]
        .some((value) => String(value || '').toLowerCase().includes(term));
    });
}

async function getMedicine(id) {
  const medicine = await directus.get('medicines', id);
  return decorate(medicine);
}

async function createMedicine(data) {
  const payload = {
    name: data.name?.trim(),
    category: data.category?.trim() || 'General',
    description: data.description?.trim() || null,
    quantity: Number(data.quantity || 0),
    unit: data.unit?.trim() || 'units',
    reorder_level: Number(data.reorder_level || 5),
    expiry_date: data.expiry_date || null,
  };
  if (!payload.name) throw new AppError('Medicine name is required.', 400);
  if (payload.quantity < 0) throw new AppError('Stock quantity cannot be negative.', 400);
  payload.status = effectiveStatus(payload);
  return decorate(await directus.create('medicines', payload));
}

async function updateMedicine(id, data) {
  const current = await directus.get('medicines', id);
  if (!current) throw new AppError('Medicine not found.', 404);

  const payload = {
    name: data.name?.trim() ?? current.name,
    category: data.category?.trim() ?? current.category,
    description: data.description?.trim() ?? current.description,
    quantity: data.quantity === undefined ? Number(current.quantity || 0) : Number(data.quantity),
    unit: data.unit?.trim() ?? current.unit,
    reorder_level: data.reorder_level === undefined ? Number(current.reorder_level || 0) : Number(data.reorder_level),
    expiry_date: data.expiry_date || current.expiry_date || null,
  };
  if (!payload.name) throw new AppError('Medicine name is required.', 400);
  if (payload.quantity < 0) throw new AppError('Stock quantity cannot be negative.', 400);
  payload.status = effectiveStatus(payload);
  return decorate(await directus.update('medicines', id, payload));
}

async function adjustStock(id, delta, expectedQuantity = null) {
  const medicine = await directus.get('medicines', id);
  if (!medicine) throw new AppError('Medicine not found.', 404);
  const current = Number(medicine.quantity || 0);
  if (expectedQuantity !== null && current !== Number(expectedQuantity)) {
    throw new AppError('Medicine stock changed while processing. Please try again.', 409);
  }
  const next = current + Number(delta);
  if (next < 0) throw new AppError(`Not enough stock for ${medicine.name}.`, 409);
  return updateMedicine(id, { ...medicine, quantity: next });
}

async function lowStock() {
  const medicines = await listMedicines();
  return medicines.filter((medicine) => ['low_stock', 'out_of_stock', 'expired'].includes(medicine.effective_status));
}

async function categories() {
  const medicines = await directus.list('medicines', { fields: 'category', limit: -1 });
  return [...new Set(medicines.map((item) => item.category).filter(Boolean))].sort();
}

module.exports = {
  today,
  effectiveStatus,
  decorate,
  listMedicines,
  getMedicine,
  createMedicine,
  updateMedicine,
  adjustStock,
  lowStock,
  categories,
};
