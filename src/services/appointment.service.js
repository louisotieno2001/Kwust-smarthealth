const directus = require('../lib/directus');
const { AppError } = require('../lib/errors');

const SLOT_FIELDS = '*,clinician_id.id,clinician_id.full_name,clinician_id.staff_title';
const APPOINTMENT_FIELDS = [
  '*',
  'student_id.id',
  'student_id.full_name',
  'student_id.admission_number',
  'student_id.email',
  'clinician_id.id',
  'clinician_id.full_name',
  'clinician_id.staff_title',
  'slot_id.id',
  'slot_id.date',
  'slot_id.start_time',
  'slot_id.end_time',
  'slot_id.location',
].join(',');

function sameId(a, b) {
  return String(a ?? '') === String(b ?? '');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function listSlots({ onlyOpen = false, clinicianId, dateFrom } = {}) {
  const filter = {};
  if (onlyOpen) filter.status = { _eq: 'open' };
  if (clinicianId) filter.clinician_id = { _eq: clinicianId };
  if (dateFrom) filter.date = { _gte: dateFrom };
  return directus.list('appointment_slots', {
    filter: Object.keys(filter).length ? filter : undefined,
    sort: ['date', 'start_time'],
    fields: SLOT_FIELDS,
    limit: -1,
  });
}

async function listSlotsWithBookings({ onlyOpen = false, clinicianId } = {}) {
  const slots = await listSlots({ onlyOpen, clinicianId, dateFrom: onlyOpen ? today() : undefined });
  if (!slots.length) return [];

  const slotIds = slots.map((slot) => slot.id);
  const bookings = await directus.list('appointments', {
    filter: {
      slot_id: { _in: slotIds },
      status: { _eq: 'booked' },
    },
    fields: 'id,slot_id',
    limit: -1,
  });

  const counts = bookings.reduce((acc, booking) => {
    acc[booking.slot_id] = (acc[booking.slot_id] || 0) + 1;
    return acc;
  }, {});

  return slots.map((slot) => {
    const booked = counts[slot.id] || 0;
    return {
      ...slot,
      booked_count: booked,
      remaining: Math.max(0, Number(slot.capacity || 0) - booked),
    };
  });
}

async function getSlot(id) {
  return directus.get('appointment_slots', id, { fields: SLOT_FIELDS });
}

async function bookAppointment({ studentId, slotId, reason }) {
  const slot = await getSlot(slotId);
  if (!slot) throw new AppError('The selected appointment slot was not found.', 404);
  if (slot.status !== 'open') throw new AppError('This appointment slot is no longer open.', 409);
  if (slot.date < today()) throw new AppError('This appointment slot is in the past.', 409);

  const existing = await directus.first('appointments', {
    filter: {
      slot_id: { _eq: slotId },
      student_id: { _eq: studentId },
      status: { _eq: 'booked' },
    },
    fields: 'id',
  });
  if (existing) throw new AppError('You have already booked this appointment slot.', 409);

  const booked = await directus.count('appointments', {
    slot_id: { _eq: slotId },
    status: { _eq: 'booked' },
  });
  if (booked >= Number(slot.capacity || 0)) {
    throw new AppError('This appointment slot is already full.', 409);
  }

  try {
    return await directus.create('appointments', {
      student_id: studentId,
      slot_id: slotId,
      clinician_id: slot.clinician_id?.id || slot.clinician_id || null,
      reason: reason?.trim() || null,
      status: 'booked',
    });
  } catch (error) {
    if (error.status === 400 && /unique/i.test(error.message)) {
      throw new AppError('You have already booked this appointment slot.', 409);
    }
    throw error;
  }
}

async function listAppointmentsForStudent(studentId) {
  return directus.list('appointments', {
    filter: { student_id: { _eq: studentId } },
    sort: ['-created_at'],
    fields: APPOINTMENT_FIELDS,
    limit: -1,
  });
}

async function listAppointmentsForClinician(clinicianId) {
  return directus.list('appointments', {
    filter: { clinician_id: { _eq: clinicianId } },
    sort: ['-created_at'],
    fields: APPOINTMENT_FIELDS,
    limit: -1,
  });
}

async function listAllAppointments({ status, q } = {}) {
  const filter = {};
  if (status) filter.status = { _eq: status };
  const appointments = await directus.list('appointments', {
    filter: Object.keys(filter).length ? filter : undefined,
    sort: ['-created_at'],
    fields: APPOINTMENT_FIELDS,
    limit: -1,
  });

  if (!q) return appointments;
  const term = q.toLowerCase();
  return appointments.filter((item) => [
    item.student_id?.full_name,
    item.student_id?.admission_number,
    item.clinician_id?.full_name,
    item.reason,
  ].some((value) => String(value || '').toLowerCase().includes(term)));
}

async function getAppointment(id) {
  return directus.get('appointments', id, { fields: APPOINTMENT_FIELDS });
}

async function cancelAppointment({ id, userId, role }) {
  const appointment = await getAppointment(id);
  if (!appointment) throw new AppError('Appointment not found.', 404);
  if (role === 'student' && !sameId(appointment.student_id?.id, userId)) {
    throw new AppError('You can only cancel your own appointments.', 403);
  }
  if (role === 'clinician' && !sameId(appointment.clinician_id?.id, userId)) {
    throw new AppError('You can only manage your own appointments.', 403);
  }
  if (appointment.status !== 'booked') {
    throw new AppError('Only booked appointments can be cancelled.', 409);
  }
  return directus.update('appointments', id, { status: 'cancelled' });
}

async function setAppointmentStatus({ id, userId, role, status }) {
  const appointment = await getAppointment(id);
  if (!appointment) throw new AppError('Appointment not found.', 404);
  if (role === 'clinician' && !sameId(appointment.clinician_id?.id, userId)) {
    throw new AppError('You can only manage your own appointments.', 403);
  }
  return directus.update('appointments', id, { status });
}

async function todayAppointmentsForClinician(clinicianId) {
  const appointments = await directus.list('appointments', {
    filter: { clinician_id: { _eq: clinicianId }, status: { _eq: 'booked' } },
    fields: APPOINTMENT_FIELDS,
    limit: -1,
  });
  return appointments.filter((item) => item.slot_id?.date === today());
}

module.exports = {
  today,
  listSlots,
  listSlotsWithBookings,
  getSlot,
  bookAppointment,
  listAppointmentsForStudent,
  listAppointmentsForClinician,
  listAllAppointments,
  getAppointment,
  cancelAppointment,
  setAppointmentStatus,
  todayAppointmentsForClinician,
};
