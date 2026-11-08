const directus = require('../lib/directus');
const { AppError } = require('../lib/errors');

async function listRemindersForUser(userId) {
  return directus.list('reminders', {
    filter: { user_id: { _eq: userId } },
    sort: ['-created_at'],
    fields: '*,created_by.id,created_by.full_name',
    limit: -1,
  });
}

async function unreadReminders(userId) {
  return directus.list('reminders', {
    filter: { user_id: { _eq: userId }, read_at: { _null: true } },
    sort: ['-created_at'],
    fields: '*,created_by.id,created_by.full_name',
    limit: -1,
  });
}

async function createReminder({ userId, title, message, type, createdBy }) {
  if (!userId) throw new AppError('Please select a student.', 400);
  if (!title?.trim()) throw new AppError('Reminder title is required.', 400);
  if (!message?.trim()) throw new AppError('Reminder message is required.', 400);
  return directus.create('reminders', {
    user_id: userId,
    title: title.trim(),
    message: message.trim(),
    type: type || 'general',
    created_by: createdBy,
  });
}

async function markRead(id, userId) {
  const reminder = await directus.get('reminders', id);
  if (!reminder) throw new AppError('Reminder not found.', 404);
  if (String(reminder.user_id ?? '') !== String(userId ?? '')) throw new AppError('You cannot update this reminder.', 403);
  return directus.update('reminders', id, { read_at: new Date().toISOString() });
}

async function listStudents() {
  return directus.list('users', {
    filter: { role: { _eq: 'student' }, status: { _eq: 'active' } },
    sort: ['full_name'],
    fields: 'id,full_name,admission_number,email',
    limit: -1,
  });
}

module.exports = {
  listRemindersForUser,
  unreadReminders,
  createReminder,
  markRead,
  listStudents,
};
