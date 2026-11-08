const { AppError } = require('../lib/errors');

function toArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function validateRecord(body) {
  if (!body.student_id) throw new AppError('Please select a student.', 400);
  if (!body.diagnosis || !String(body.diagnosis).trim()) throw new AppError('Diagnosis is required.', 400);

  const medicineIds = toArray(body.medicine_id);
  const quantities = toArray(body.quantity);
  const dosages = toArray(body.dosage);
  const frequencies = toArray(body.frequency);
  const durations = toArray(body.duration);
  const instructions = toArray(body.instructions);

  return medicineIds.map((medicineId, index) => ({
    medicine_id: medicineId,
    quantity: quantities[index],
    dosage: dosages[index],
    frequency: frequencies[index],
    duration: durations[index],
    instructions: instructions[index],
  })).filter((item) => item.medicine_id);
}

module.exports = { validateRecord, toArray };
