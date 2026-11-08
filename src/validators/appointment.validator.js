const { AppError } = require('../lib/errors');

function validateBooking(body) {
  if (!body.slot_id) throw new AppError('Please select an appointment slot.', 400);
  if (body.reason && String(body.reason).length > 1000) {
    throw new AppError('The reason for the visit is too long.', 400);
  }
}

function validateSlot(body) {
  if (!body.date) throw new AppError('Slot date is required.', 400);
  if (!body.start_time || !body.end_time) throw new AppError('Start and end times are required.', 400);
  if (body.start_time >= body.end_time) throw new AppError('The end time must be after the start time.', 400);
  if (Number(body.capacity || 0) < 1) throw new AppError('Capacity must be at least 1.', 400);
}

module.exports = { validateBooking, validateSlot };
