const express = require('express');
const directus = require('../lib/directus');
const { asyncHandler, AppError } = require('../lib/errors');
const { requireRole } = require('../middleware/auth');
const { setFlash } = require('../middleware/flash');
const { logAudit } = require('../lib/audit');
const { back } = require('../lib/http');
const appointmentService = require('../services/appointment.service');
const recordService = require('../services/record.service');
const reminderService = require('../services/reminder.service');
const pdfService = require('../services/pdf.service');
const { validateBooking } = require('../validators/appointment.validator');

const router = express.Router();
router.use(requireRole('student'));

function sameId(a, b) {
  return String(a ?? '') === String(b ?? '');
}

router.get('/dashboard', asyncHandler(async (req, res) => {
  const [appointments, records, reminders, notes, todos] = await Promise.all([
    appointmentService.listAppointmentsForStudent(req.user.id),
    recordService.listRecords({ studentId: req.user.id }),
    reminderService.unreadReminders(req.user.id),
    directus.list('health_notes', {
      filter: { student_id: { _eq: req.user.id } },
      sort: ['-created_at'],
      limit: 5,
    }),
    directus.list('todos', {
      filter: { student_id: { _eq: req.user.id } },
      sort: ['completed', 'due_date'],
      limit: 8,
    }),
  ]);

  const upcoming = appointments
    .filter((item) => item.status === 'booked')
    .sort((a, b) => `${a.slot_id?.date || ''}${a.slot_id?.start_time || ''}`.localeCompare(`${b.slot_id?.date || ''}${b.slot_id?.start_time || ''}`));

  res.render('student/dashboard', {
    title: 'Student dashboard',
    appointments,
    upcoming,
    records: records.slice(0, 3),
    reminders,
    notes,
    todos,
  });
}));

router.get('/appointments', asyncHandler(async (req, res) => {
  const appointments = await appointmentService.listAppointmentsForStudent(req.user.id);
  res.render('student/appointments', { title: 'My appointments', appointments });
}));

router.get('/appointments/book', asyncHandler(async (req, res) => {
  const [slots, appointments] = await Promise.all([
    appointmentService.listSlotsWithBookings({ onlyOpen: true }),
    appointmentService.listAppointmentsForStudent(req.user.id),
  ]);
  const bookedSlotIds = new Set(
    appointments
      .filter((item) => item.status === 'booked')
      .map((item) => String(item.slot_id?.id ?? item.slot_id)),
  );
  res.render('student/book', { title: 'Book appointment', slots, bookedSlotIds });
}));

router.post('/appointments', asyncHandler(async (req, res) => {
  try {
    validateBooking(req.body);
    const appointment = await appointmentService.bookAppointment({
      studentId: req.user.id,
      slotId: req.body.slot_id,
      reason: req.body.reason,
    });
    await logAudit(req, { action: 'appointment.book', entity: 'appointment', entityId: appointment.id });
    setFlash(res, 'success', 'Appointment booked successfully.');
  } catch (error) {
    setFlash(res, 'error', error.message);
  }
  return back(req, res, '/student/appointments');
}));

router.post('/appointments/:id/cancel', asyncHandler(async (req, res) => {
  try {
    await appointmentService.cancelAppointment({
      id: req.params.id,
      userId: req.user.id,
      role: req.user.role,
    });
    await logAudit(req, { action: 'appointment.cancel', entity: 'appointment', entityId: req.params.id });
    setFlash(res, 'success', 'Appointment cancelled.');
  } catch (error) {
    setFlash(res, 'error', error.message);
  }
  return back(req, res, '/student/appointments');
}));

router.get('/records', asyncHandler(async (req, res) => {
  const records = await recordService.listRecords({ studentId: req.user.id, q: req.query.q });
  res.render('student/records', { title: 'My medical records', records, q: req.query.q || '' });
}));

router.get('/records/:id', asyncHandler(async (req, res) => {
  const record = await recordService.getRecord(req.params.id);
  if (!record) throw new AppError('Medical record not found.', 404);
  if (!sameId(record.student_id?.id, req.user.id)) throw new AppError('You cannot view this record.', 403);
  res.render('student/record-show', { title: 'Medical record', record });
}));

router.get('/records/:id/pdf', asyncHandler(async (req, res) => {
  const record = await recordService.getRecord(req.params.id);
  if (!record) throw new AppError('Medical record not found.', 404);
  if (!sameId(record.student_id?.id, req.user.id)) throw new AppError('You cannot download this record.', 403);
  await logAudit(req, { action: 'record.pdf', entity: 'medical_record', entityId: record.id });
  pdfService.streamRecordPdf(record, res);
}));

router.get('/records/:id/prescription.pdf', asyncHandler(async (req, res) => {
  const record = await recordService.getRecord(req.params.id);
  if (!record) throw new AppError('Medical record not found.', 404);
  if (!sameId(record.student_id?.id, req.user.id)) throw new AppError('You cannot download this prescription.', 403);
  await logAudit(req, { action: 'prescription.pdf', entity: 'medical_record', entityId: record.id });
  pdfService.streamPrescriptionPdf(record, res);
}));

router.get('/notes', asyncHandler(async (req, res) => {
  const notes = await directus.list('health_notes', {
    filter: { student_id: { _eq: req.user.id } },
    sort: ['-created_at'],
    limit: -1,
  });
  res.render('student/notes', { title: 'Health notes', notes });
}));

router.post('/notes', asyncHandler(async (req, res) => {
  try {
    if (!req.body.title?.trim()) throw new AppError('Note title is required.', 400);
    if (!req.body.content?.trim()) throw new AppError('Note content is required.', 400);
    const note = await directus.create('health_notes', {
      student_id: req.user.id,
      title: req.body.title.trim(),
      content: req.body.content.trim(),
    });
    await logAudit(req, { action: 'note.create', entity: 'health_note', entityId: note.id });
    setFlash(res, 'success', 'Health note saved.');
  } catch (error) {
    setFlash(res, 'error', error.message);
  }
  return back(req, res, '/student/notes');
}));

router.post('/notes/:id/delete', asyncHandler(async (req, res) => {
  try {
    const note = await directus.get('health_notes', req.params.id);
    if (!note) throw new AppError('Note not found.', 404);
    if (!sameId(note.student_id, req.user.id)) throw new AppError('You cannot delete this note.', 403);
    await directus.remove('health_notes', req.params.id);
    await logAudit(req, { action: 'note.delete', entity: 'health_note', entityId: req.params.id });
    setFlash(res, 'success', 'Note deleted.');
  } catch (error) {
    setFlash(res, 'error', error.message);
  }
  return back(req, res, '/student/notes');
}));

router.get('/todos', asyncHandler(async (req, res) => {
  const todos = await directus.list('todos', {
    filter: { student_id: { _eq: req.user.id } },
    sort: ['completed', 'due_date', '-created_at'],
    limit: -1,
  });
  res.render('student/todos', { title: 'Health to-do list', todos });
}));

router.post('/todos', asyncHandler(async (req, res) => {
  try {
    if (!req.body.title?.trim()) throw new AppError('Task title is required.', 400);
    const todo = await directus.create('todos', {
      student_id: req.user.id,
      title: req.body.title.trim(),
      due_date: req.body.due_date || null,
      completed: false,
    });
    await logAudit(req, { action: 'todo.create', entity: 'todo', entityId: todo.id });
    setFlash(res, 'success', 'Task added.');
  } catch (error) {
    setFlash(res, 'error', error.message);
  }
  return back(req, res, '/student/todos');
}));

router.post('/todos/:id/toggle', asyncHandler(async (req, res) => {
  try {
    const todo = await directus.get('todos', req.params.id);
    if (!todo) throw new AppError('Task not found.', 404);
    if (!sameId(todo.student_id, req.user.id)) throw new AppError('You cannot update this task.', 403);
    await directus.update('todos', req.params.id, { completed: !todo.completed });
    await logAudit(req, { action: 'todo.toggle', entity: 'todo', entityId: req.params.id });
  } catch (error) {
    setFlash(res, 'error', error.message);
  }
  return back(req, res, '/student/todos');
}));

router.post('/todos/:id/delete', asyncHandler(async (req, res) => {
  try {
    const todo = await directus.get('todos', req.params.id);
    if (!todo) throw new AppError('Task not found.', 404);
    if (!sameId(todo.student_id, req.user.id)) throw new AppError('You cannot delete this task.', 403);
    await directus.remove('todos', req.params.id);
    await logAudit(req, { action: 'todo.delete', entity: 'todo', entityId: req.params.id });
    setFlash(res, 'success', 'Task deleted.');
  } catch (error) {
    setFlash(res, 'error', error.message);
  }
  return back(req, res, '/student/todos');
}));

router.post('/reminders/:id/read', asyncHandler(async (req, res) => {
  try {
    await reminderService.markRead(req.params.id, req.user.id);
  } catch (error) {
    setFlash(res, 'error', error.message);
  }
  return back(req, res, '/student/dashboard');
}));

module.exports = router;
