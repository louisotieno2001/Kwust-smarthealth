const express = require('express');
const directus = require('../lib/directus');
const { asyncHandler, AppError } = require('../lib/errors');
const { requireRole } = require('../middleware/auth');
const { setFlash } = require('../middleware/flash');
const { logAudit } = require('../lib/audit');
const { back } = require('../lib/http');
const appointmentService = require('../services/appointment.service');
const recordService = require('../services/record.service');
const medicineService = require('../services/medicine.service');
const reminderService = require('../services/reminder.service');
const pdfService = require('../services/pdf.service');
const { validateSlot } = require('../validators/appointment.validator');
const { validateMedicine } = require('../validators/medicine.validator');
const { validateRecord } = require('../validators/record.validator');

const router = express.Router();
router.use(requireRole('clinician'));

function sameId(a, b) {
  return String(a ?? '') === String(b ?? '');
}

router.get('/dashboard', asyncHandler(async (req, res) => {
  const [appointments, slots, lowStock, records] = await Promise.all([
    appointmentService.listAppointmentsForClinician(req.user.id),
    appointmentService.listSlotsWithBookings({ clinicianId: req.user.id }),
    medicineService.lowStock(),
    recordService.listRecords({ clinicianId: req.user.id }),
  ]);

  const today = appointmentService.today();
  const todayAppointments = appointments.filter((item) => item.slot_id?.date === today && item.status === 'booked');
  const upcoming = appointments
    .filter((item) => item.status === 'booked')
    .sort((a, b) => `${a.slot_id?.date || ''}${a.slot_id?.start_time || ''}`.localeCompare(`${b.slot_id?.date || ''}${b.slot_id?.start_time || ''}`));
  const availableSlots = slots.filter((slot) => slot.remaining > 0);

  res.render('clinician/dashboard', {
    title: 'Clinician dashboard',
    todayAppointments,
    upcoming,
    availableSlots,
    lowStock,
    records: records.slice(0, 5),
  });
}));

router.get('/slots', asyncHandler(async (req, res) => {
  const slots = await appointmentService.listSlotsWithBookings({ clinicianId: req.user.id });
  res.render('clinician/slots', { title: 'Appointment slots', slots });
}));

router.post('/slots', asyncHandler(async (req, res) => {
  try {
    validateSlot(req.body);
    const slot = await directus.create('appointment_slots', {
      clinician_id: req.user.id,
      date: req.body.date,
      start_time: req.body.start_time,
      end_time: req.body.end_time,
      capacity: Number(req.body.capacity),
      location: req.body.location?.trim() || 'University Health Center',
      status: 'open',
    });
    await logAudit(req, { action: 'slot.create', entity: 'appointment_slot', entityId: slot.id });
    setFlash(res, 'success', 'Appointment slot created.');
  } catch (error) {
    setFlash(res, 'error', error.message);
  }
  return back(req, res, '/clinician/slots');
}));

router.post('/slots/:id/close', asyncHandler(async (req, res) => {
  try {
    const slot = await directus.get('appointment_slots', req.params.id);
    if (!slot) throw new AppError('Slot not found.', 404);
    if (!sameId(slot.clinician_id, req.user.id)) throw new AppError('You cannot manage this slot.', 403);
    await directus.update('appointment_slots', req.params.id, { status: 'closed' });
    await logAudit(req, { action: 'slot.close', entity: 'appointment_slot', entityId: req.params.id });
    setFlash(res, 'success', 'Slot closed.');
  } catch (error) {
    setFlash(res, 'error', error.message);
  }
  return back(req, res, '/clinician/slots');
}));

router.get('/appointments', asyncHandler(async (req, res) => {
  const appointments = await appointmentService.listAppointmentsForClinician(req.user.id);
  res.render('clinician/appointments', { title: 'Appointments', appointments });
}));

router.post('/appointments/:id/complete', asyncHandler(async (req, res) => {
  try {
    await appointmentService.setAppointmentStatus({
      id: req.params.id,
      userId: req.user.id,
      role: req.user.role,
      status: 'completed',
    });
    await logAudit(req, { action: 'appointment.complete', entity: 'appointment', entityId: req.params.id });
    setFlash(res, 'success', 'Appointment marked as completed.');
  } catch (error) {
    setFlash(res, 'error', error.message);
  }
  return back(req, res, '/clinician/appointments');
}));

router.post('/appointments/:id/cancel', asyncHandler(async (req, res) => {
  try {
    await appointmentService.setAppointmentStatus({
      id: req.params.id,
      userId: req.user.id,
      role: req.user.role,
      status: 'cancelled',
    });
    await logAudit(req, { action: 'appointment.cancel', entity: 'appointment', entityId: req.params.id });
    setFlash(res, 'success', 'Appointment cancelled.');
  } catch (error) {
    setFlash(res, 'error', error.message);
  }
  return back(req, res, '/clinician/appointments');
}));

router.get('/records', asyncHandler(async (req, res) => {
  const records = await recordService.listRecords({
    clinicianId: req.user.id,
    q: req.query.q,
    diagnosis: req.query.diagnosis,
  });
  res.render('clinician/records', { title: 'Medical records', records, q: req.query.q || '', diagnosis: req.query.diagnosis || '' });
}));

router.get('/records/new', asyncHandler(async (req, res) => {
  const [students, medicines, appointments] = await Promise.all([
    reminderService.listStudents(),
    medicineService.listMedicines(),
    appointmentService.listAppointmentsForClinician(req.user.id),
  ]);
  res.render('clinician/record-form', {
    title: 'New medical record',
    students,
    medicines: medicines.filter((item) => item.effective_status !== 'expired'),
    appointments: appointments.filter((item) => item.status === 'booked'),
    selectedStudent: req.query.student_id || '',
    selectedAppointment: req.query.appointment_id || '',
  });
}));

router.post('/records', asyncHandler(async (req, res) => {
  try {
    const prescriptions = validateRecord(req.body);
    const record = await recordService.createRecord({
      studentId: req.body.student_id,
      clinicianId: req.user.id,
      appointmentId: req.body.appointment_id || null,
      visitDate: req.body.visit_date,
      chiefComplaint: req.body.chief_complaint,
      symptoms: req.body.symptoms,
      diagnosis: req.body.diagnosis,
      notes: req.body.notes,
      prescriptions,
    });
    await logAudit(req, { action: 'record.create', entity: 'medical_record', entityId: record.id });
    setFlash(res, 'success', 'Medical record saved and prescriptions issued.');
    return res.redirect(`/clinician/records/${record.id}`);
  } catch (error) {
    setFlash(res, 'error', error.message);
    return back(req, res, '/clinician/records/new');
  }
}));

router.get('/records/:id', asyncHandler(async (req, res) => {
  const record = await recordService.getRecord(req.params.id);
  if (!record) throw new AppError('Medical record not found.', 404);
  if (!sameId(record.clinician_id?.id, req.user.id)) throw new AppError('You cannot view this record.', 403);
  res.render('clinician/record-show', { title: 'Medical record', record });
}));

router.get('/records/:id/pdf', asyncHandler(async (req, res) => {
  const record = await recordService.getRecord(req.params.id);
  if (!record) throw new AppError('Medical record not found.', 404);
  if (!sameId(record.clinician_id?.id, req.user.id)) throw new AppError('You cannot download this record.', 403);
  await logAudit(req, { action: 'record.pdf', entity: 'medical_record', entityId: record.id });
  pdfService.streamRecordPdf(record, res);
}));

router.get('/prescriptions/:id/pdf', asyncHandler(async (req, res) => {
  const record = await recordService.getRecord(req.params.id);
  if (!record) throw new AppError('Medical record not found.', 404);
  if (!sameId(record.clinician_id?.id, req.user.id)) throw new AppError('You cannot download this prescription.', 403);
  await logAudit(req, { action: 'prescription.pdf', entity: 'medical_record', entityId: record.id });
  pdfService.streamPrescriptionPdf(record, res);
}));

router.get('/medicines', asyncHandler(async (req, res) => {
  const [medicines, categories] = await Promise.all([
    medicineService.listMedicines({ q: req.query.q, category: req.query.category, status: req.query.status }),
    medicineService.categories(),
  ]);
  res.render('clinician/medicines', {
    title: 'Medicine inventory',
    medicines,
    categories,
    q: req.query.q || '',
    selectedCategory: req.query.category || '',
    selectedStatus: req.query.status || '',
  });
}));

router.post('/medicines', asyncHandler(async (req, res) => {
  try {
    validateMedicine(req.body);
    const medicine = await medicineService.createMedicine(req.body);
    await logAudit(req, { action: 'medicine.create', entity: 'medicine', entityId: medicine.id });
    setFlash(res, 'success', 'Medicine added to inventory.');
  } catch (error) {
    setFlash(res, 'error', error.message);
  }
  return back(req, res, '/clinician/medicines');
}));

router.post('/medicines/:id', asyncHandler(async (req, res) => {
  try {
    validateMedicine(req.body);
    const medicine = await medicineService.updateMedicine(req.params.id, req.body);
    await logAudit(req, { action: 'medicine.update', entity: 'medicine', entityId: medicine.id });
    setFlash(res, 'success', 'Medicine updated.');
  } catch (error) {
    setFlash(res, 'error', error.message);
  }
  return back(req, res, '/clinician/medicines');
}));

router.post('/medicines/:id/stock', asyncHandler(async (req, res) => {
  try {
    const medicine = await directus.get('medicines', req.params.id);
    if (!medicine) throw new AppError('Medicine not found.', 404);
    const nextQuantity = Number(req.body.quantity);
    if (!Number.isInteger(nextQuantity) || nextQuantity < 0) {
      throw new AppError('Enter a valid stock quantity of zero or more.', 400);
    }
    await medicineService.adjustStock(req.params.id, nextQuantity - Number(medicine.quantity || 0));
    await logAudit(req, {
      action: 'medicine.stock',
      entity: 'medicine',
      entityId: req.params.id,
      metadata: { from: Number(medicine.quantity || 0), to: nextQuantity },
    });
    setFlash(res, 'success', `${medicine.name} stock updated to ${nextQuantity}.`);
  } catch (error) {
    setFlash(res, 'error', error.message);
  }
  return back(req, res, '/clinician/medicines');
}));

router.get('/reminders', asyncHandler(async (req, res) => {
  const students = await reminderService.listStudents();
  res.render('clinician/reminders', { title: 'Send reminders', students });
}));

router.post('/reminders', asyncHandler(async (req, res) => {
  try {
    const reminder = await reminderService.createReminder({
      userId: req.body.student_id,
      title: req.body.title,
      message: req.body.message,
      type: req.body.type,
      createdBy: req.user.id,
    });
    await logAudit(req, { action: 'reminder.create', entity: 'reminder', entityId: reminder.id });
    setFlash(res, 'success', 'Reminder sent to the student.');
  } catch (error) {
    setFlash(res, 'error', error.message);
  }
  return back(req, res, '/clinician/reminders');
}));

module.exports = router;
