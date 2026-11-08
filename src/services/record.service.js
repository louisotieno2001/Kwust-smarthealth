const directus = require('../lib/directus');
const { AppError } = require('../lib/errors');
const medicineService = require('./medicine.service');

const RECORD_FIELDS = [
  '*',
  'student_id.id',
  'student_id.full_name',
  'student_id.admission_number',
  'student_id.email',
  'clinician_id.id',
  'clinician_id.full_name',
  'clinician_id.staff_title',
  'appointment_id.id',
  'appointment_id.status',
].join(',');

const PRESCRIPTION_FIELDS = '*,medicine_id.id,medicine_id.name,medicine_id.category,medicine_id.unit,medicine_id.quantity';

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function attachPrescriptions(records) {
  if (!records.length) return records;
  const ids = records.map((record) => record.id);
  const prescriptions = await directus.list('prescriptions', {
    filter: { record_id: { _in: ids } },
    fields: PRESCRIPTION_FIELDS,
    limit: -1,
  });
  const grouped = prescriptions.reduce((acc, item) => {
    const key = typeof item.record_id === 'object' ? item.record_id?.id : item.record_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return records.map((record) => ({ ...record, prescriptions: grouped[record.id] || [] }));
}

async function listRecords({ studentId, clinicianId, q, dateFrom, dateTo, diagnosis } = {}) {
  const filter = {};
  if (studentId) filter.student_id = { _eq: studentId };
  if (clinicianId) filter.clinician_id = { _eq: clinicianId };
  if (diagnosis) filter.diagnosis = { _icontains: diagnosis };
  if (dateFrom || dateTo) {
    filter.visit_date = {};
    if (dateFrom) filter.visit_date._gte = dateFrom;
    if (dateTo) filter.visit_date._lte = dateTo;
  }

  let records = await directus.list('medical_records', {
    filter: Object.keys(filter).length ? filter : undefined,
    sort: ['-visit_date', '-created_at'],
    fields: RECORD_FIELDS,
    limit: -1,
  });

  if (q) {
    const term = q.toLowerCase();
    records = records.filter((record) => [
      record.student_id?.full_name,
      record.student_id?.admission_number,
      record.clinician_id?.full_name,
      record.chief_complaint,
      record.diagnosis,
      record.symptoms,
    ].some((value) => String(value || '').toLowerCase().includes(term)));
  }

  return attachPrescriptions(records);
}

async function getRecord(id) {
  const record = await directus.get('medical_records', id, { fields: RECORD_FIELDS });
  if (!record) return null;
  const [withPrescriptions] = await attachPrescriptions([record]);
  return withPrescriptions;
}

async function validatePrescriptions(items = []) {
  const valid = [];
  for (const item of items) {
    const medicineId = item.medicine_id || item.medicineId;
    const quantity = Number(item.quantity || 0);
    if (!medicineId || quantity <= 0) continue;
    const medicine = await directus.get('medicines', medicineId);
    if (!medicine) throw new AppError('One of the selected medicines no longer exists.', 400);
    if (Number(medicine.quantity || 0) < quantity) {
      throw new AppError(`Not enough ${medicine.name} in stock for this prescription.`, 409);
    }
    valid.push({
      medicine,
      quantity,
      dosage: item.dosage?.trim() || '',
      frequency: item.frequency?.trim() || '',
      duration: item.duration?.trim() || '',
      instructions: item.instructions?.trim() || '',
    });
  }
  return valid;
}

async function createRecord({
  studentId,
  clinicianId,
  appointmentId,
  visitDate,
  chiefComplaint,
  symptoms,
  diagnosis,
  notes,
  prescriptions = [],
}) {
  if (!studentId) throw new AppError('Please select a student.', 400);
  if (!diagnosis?.trim()) throw new AppError('Diagnosis is required.', 400);

  const validated = await validatePrescriptions(prescriptions);

  const record = await directus.create('medical_records', {
    student_id: studentId,
    clinician_id: clinicianId,
    appointment_id: appointmentId || null,
    visit_date: visitDate || today(),
    chief_complaint: chiefComplaint?.trim() || null,
    symptoms: symptoms?.trim() || null,
    diagnosis: diagnosis.trim(),
    notes: notes?.trim() || null,
  });

  if (validated.length) {
    await directus.createMany('prescriptions', validated.map((item) => ({
      record_id: record.id,
      medicine_id: item.medicine.id,
      dosage: item.dosage || null,
      frequency: item.frequency || null,
      duration: item.duration || null,
      instructions: item.instructions || null,
      quantity: item.quantity,
    })));

    for (const item of validated) {
      await medicineService.adjustStock(item.medicine.id, -item.quantity);
    }
  }

  if (appointmentId) {
    try {
      await directus.update('appointments', appointmentId, { status: 'completed' });
    } catch (error) {
      console.error('Unable to mark appointment complete:', error.message);
    }
  }

  return getRecord(record.id);
}

async function updateRecord(id, data) {
  const record = await directus.get('medical_records', id);
  if (!record) throw new AppError('Medical record not found.', 404);
  return directus.update('medical_records', id, {
    chief_complaint: data.chief_complaint?.trim() ?? record.chief_complaint,
    symptoms: data.symptoms?.trim() ?? record.symptoms,
    diagnosis: data.diagnosis?.trim() ?? record.diagnosis,
    notes: data.notes?.trim() ?? record.notes,
    visit_date: data.visit_date || record.visit_date,
  });
}

module.exports = {
  today,
  attachPrescriptions,
  listRecords,
  getRecord,
  createRecord,
  updateRecord,
};
