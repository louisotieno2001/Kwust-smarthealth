const directus = require('../src/lib/directus');

const choices = {
  role: [
    { text: 'Student', value: 'student' },
    { text: 'Clinician', value: 'clinician' },
    { text: 'Administrator', value: 'admin' },
  ],
  userStatus: [
    { text: 'Pending', value: 'pending' },
    { text: 'Active', value: 'active' },
    { text: 'Suspended', value: 'suspended' },
    { text: 'Rejected', value: 'rejected' },
  ],
  appointmentStatus: [
    { text: 'Booked', value: 'booked' },
    { text: 'Completed', value: 'completed' },
    { text: 'Cancelled', value: 'cancelled' },
    { text: 'No show', value: 'no_show' },
  ],
  slotStatus: [
    { text: 'Open', value: 'open' },
    { text: 'Closed', value: 'closed' },
    { text: 'Cancelled', value: 'cancelled' },
  ],
  medicineStatus: [
    { text: 'Available', value: 'available' },
    { text: 'Low stock', value: 'low_stock' },
    { text: 'Out of stock', value: 'out_of_stock' },
    { text: 'Expired', value: 'expired' },
  ],
  reminderType: [
    { text: 'General', value: 'general' },
    { text: 'Appointment', value: 'appointment' },
    { text: 'Medication', value: 'medication' },
  ],
};

function text(field, label, extra = {}) {
  return {
    field,
    type: 'string',
    meta: { interface: 'input', note: label, ...(extra.meta || {}) },
    schema: { is_nullable: true, ...(extra.schema || {}) },
  };
}

function longText(field, label, extra = {}) {
  return {
    field,
    type: 'text',
    meta: { interface: 'input-multiline', note: label, ...(extra.meta || {}) },
    schema: { is_nullable: true, ...(extra.schema || {}) },
  };
}

function integer(field, label, extra = {}) {
  return {
    field,
    type: 'integer',
    meta: { interface: 'input', note: label, ...(extra.meta || {}) },
    schema: { is_nullable: true, ...(extra.schema || {}) },
  };
}

function dateField(field, label, extra = {}) {
  return {
    field,
    type: 'date',
    meta: { interface: 'datetime', display: 'date', note: label, ...(extra.meta || {}) },
    schema: { is_nullable: true, ...(extra.schema || {}) },
  };
}

function timeField(field, label) {
  return {
    field,
    type: 'time',
    meta: { interface: 'datetime', display: 'time', note: label },
    schema: { is_nullable: true },
  };
}

function timestamp(field, label, extra = {}) {
  return {
    field,
    type: 'timestamp',
    meta: { interface: 'datetime', note: label, ...(extra.meta || {}) },
    schema: { is_nullable: true, ...(extra.schema || {}) },
  };
}

function booleanField(field, label, extra = {}) {
  return {
    field,
    type: 'boolean',
    meta: { interface: 'boolean', note: label, ...(extra.meta || {}) },
    schema: { is_nullable: true, default_value: false, ...(extra.schema || {}) },
  };
}

function select(field, label, list, extra = {}) {
  return {
    field,
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      options: { choices: list },
      note: label,
      ...(extra.meta || {}),
    },
    schema: { is_nullable: true, ...(extra.schema || {}) },
  };
}

function relationField(field, label) {
  return {
    field,
    type: 'integer',
    meta: {
      interface: 'select-dropdown-m2o',
      special: ['m2o'],
      note: label,
    },
    schema: { is_nullable: true },
  };
}

const collections = [
  {
    collection: 'users',
    icon: 'people',
    note: 'Application users: students, clinicians, and administrators',
    fields: [
      text('full_name', 'Full name', { schema: { is_nullable: false } }),
      text('email', 'Email address', { schema: { is_unique: true } }),
      text('password_hash', 'Password hash', { meta: { hidden: true } }),
      select('role', 'Role', choices.role, { schema: { default_value: 'student' } }),
      select('status', 'Account status', choices.userStatus, { schema: { default_value: 'active' } }),
      booleanField('is_verified', 'Verified for login'),
      text('admission_number', 'Admission number'),
      text('admission_number_canonical', 'Canonical admission number', { schema: { is_unique: true } }),
      text('staff_number', 'Staff number'),
      text('staff_title', 'Staff title'),
      text('phone', 'Phone number'),
      relationField('verified_by', 'Verified by'),
      timestamp('verified_at', 'Verified at'),
      timestamp('last_login_at', 'Last login'),
      timestamp('created_at', 'Created at', { meta: { hidden: true, readonly: true, special: ['date-created'] } }),
      timestamp('updated_at', 'Updated at', { meta: { hidden: true, readonly: true, special: ['date-updated'] } }),
    ],
  },
  {
    collection: 'appointment_slots',
    icon: 'schedule',
    note: 'Clinician-defined appointment slots',
    fields: [
      relationField('clinician_id', 'Clinician'),
      dateField('date', 'Date', { schema: { is_nullable: false } }),
      timeField('start_time', 'Start time'),
      timeField('end_time', 'End time'),
      integer('capacity', 'Capacity', { schema: { is_nullable: false, default_value: 1 } }),
      text('location', 'Location'),
      select('status', 'Status', choices.slotStatus, { schema: { default_value: 'open' } }),
      timestamp('created_at', 'Created at', { meta: { hidden: true, readonly: true, special: ['date-created'] } }),
      timestamp('updated_at', 'Updated at', { meta: { hidden: true, readonly: true, special: ['date-updated'] } }),
    ],
  },
  {
    collection: 'appointments',
    icon: 'event_available',
    note: 'Student appointments',
    fields: [
      relationField('student_id', 'Student'),
      relationField('slot_id', 'Slot'),
      relationField('clinician_id', 'Clinician'),
      longText('reason', 'Reason for visit'),
      select('status', 'Status', choices.appointmentStatus, { schema: { default_value: 'booked' } }),
      longText('notes', 'Clinician notes'),
      timestamp('created_at', 'Created at', { meta: { hidden: true, readonly: true, special: ['date-created'] } }),
      timestamp('updated_at', 'Updated at', { meta: { hidden: true, readonly: true, special: ['date-updated'] } }),
    ],
  },
  {
    collection: 'medical_records',
    icon: 'clinical_notes',
    note: 'Medical visit records',
    fields: [
      relationField('student_id', 'Student'),
      relationField('clinician_id', 'Clinician'),
      relationField('appointment_id', 'Appointment'),
      dateField('visit_date', 'Visit date', { schema: { is_nullable: false } }),
      longText('chief_complaint', 'Chief complaint'),
      longText('symptoms', 'Symptoms'),
      longText('diagnosis', 'Diagnosis'),
      longText('notes', 'Clinical notes'),
      timestamp('created_at', 'Created at', { meta: { hidden: true, readonly: true, special: ['date-created'] } }),
      timestamp('updated_at', 'Updated at', { meta: { hidden: true, readonly: true, special: ['date-updated'] } }),
    ],
  },
  {
    collection: 'medicines',
    icon: 'medication',
    note: 'Medicine inventory',
    fields: [
      text('name', 'Medicine name', { schema: { is_nullable: false } }),
      text('category', 'Category'),
      longText('description', 'Description'),
      integer('quantity', 'Quantity', { schema: { is_nullable: false, default_value: 0 } }),
      text('unit', 'Unit'),
      integer('reorder_level', 'Reorder level', { schema: { default_value: 5 } }),
      dateField('expiry_date', 'Expiry date'),
      select('status', 'Status', choices.medicineStatus, { schema: { default_value: 'available' } }),
      timestamp('created_at', 'Created at', { meta: { hidden: true, readonly: true, special: ['date-created'] } }),
      timestamp('updated_at', 'Updated at', { meta: { hidden: true, readonly: true, special: ['date-updated'] } }),
    ],
  },
  {
    collection: 'prescriptions',
    icon: 'prescription',
    note: 'Prescriptions belonging to medical records',
    fields: [
      relationField('record_id', 'Medical record'),
      relationField('medicine_id', 'Medicine'),
      text('dosage', 'Dosage'),
      text('frequency', 'Frequency'),
      text('duration', 'Duration'),
      longText('instructions', 'Instructions'),
      integer('quantity', 'Quantity', { schema: { default_value: 1 } }),
      timestamp('created_at', 'Created at', { meta: { hidden: true, readonly: true, special: ['date-created'] } }),
    ],
  },
  {
    collection: 'health_notes',
    icon: 'note',
    note: 'Student health notes',
    fields: [
      relationField('student_id', 'Student'),
      text('title', 'Title', { schema: { is_nullable: false } }),
      longText('content', 'Content'),
      timestamp('created_at', 'Created at', { meta: { hidden: true, readonly: true, special: ['date-created'] } }),
      timestamp('updated_at', 'Updated at', { meta: { hidden: true, readonly: true, special: ['date-updated'] } }),
    ],
  },
  {
    collection: 'todos',
    icon: 'checklist',
    note: 'Student health to-do items',
    fields: [
      relationField('student_id', 'Student'),
      text('title', 'Task', { schema: { is_nullable: false } }),
      dateField('due_date', 'Due date'),
      booleanField('completed', 'Completed'),
      timestamp('created_at', 'Created at', { meta: { hidden: true, readonly: true, special: ['date-created'] } }),
    ],
  },
  {
    collection: 'reminders',
    icon: 'notifications',
    note: 'Reminders sent to students',
    fields: [
      relationField('user_id', 'Student'),
      text('title', 'Title', { schema: { is_nullable: false } }),
      longText('message', 'Message'),
      select('type', 'Type', choices.reminderType, { schema: { default_value: 'general' } }),
      timestamp('read_at', 'Read at'),
      relationField('created_by', 'Created by'),
      timestamp('created_at', 'Created at', { meta: { hidden: true, readonly: true, special: ['date-created'] } }),
    ],
  },
  {
    collection: 'audit_logs',
    icon: 'history',
    note: 'Append-only system audit logs',
    fields: [
      relationField('actor_id', 'Actor'),
      text('action', 'Action'),
      text('entity', 'Entity'),
      text('entity_id', 'Entity ID'),
      { field: 'metadata', type: 'json', meta: { interface: 'input-code', options: { language: 'json' }, note: 'Additional context' }, schema: { is_nullable: true } },
      text('ip_address', 'IP address'),
      text('user_agent', 'User agent'),
      timestamp('created_at', 'Created at', { meta: { hidden: true, readonly: true, special: ['date-created'] } }),
    ],
  },
];

const relations = [
  { collection: 'appointment_slots', field: 'clinician_id', related_collection: 'users' },
  { collection: 'appointments', field: 'student_id', related_collection: 'users' },
  { collection: 'appointments', field: 'slot_id', related_collection: 'appointment_slots' },
  { collection: 'appointments', field: 'clinician_id', related_collection: 'users' },
  { collection: 'medical_records', field: 'student_id', related_collection: 'users' },
  { collection: 'medical_records', field: 'clinician_id', related_collection: 'users' },
  { collection: 'medical_records', field: 'appointment_id', related_collection: 'appointments' },
  { collection: 'prescriptions', field: 'record_id', related_collection: 'medical_records', oneField: 'prescriptions' },
  { collection: 'prescriptions', field: 'medicine_id', related_collection: 'medicines' },
  { collection: 'health_notes', field: 'student_id', related_collection: 'users' },
  { collection: 'todos', field: 'student_id', related_collection: 'users' },
  { collection: 'reminders', field: 'user_id', related_collection: 'users' },
  { collection: 'reminders', field: 'created_by', related_collection: 'users' },
  { collection: 'audit_logs', field: 'actor_id', related_collection: 'users' },
  { collection: 'users', field: 'verified_by', related_collection: 'users' },
];

let collectionNames = null;
let fieldNames = null;

async function loadCollectionNames() {
  if (!collectionNames) {
    const response = await directus.query('/collections?limit=-1');
    collectionNames = new Set((response?.data?.data || []).map((item) => item.collection));
  }
  return collectionNames;
}

async function loadFieldNames() {
  if (!fieldNames) {
    const response = await directus.query('/fields?limit=-1');
    fieldNames = new Set((response?.data?.data || []).map((item) => `${item.collection}.${item.field}`));
  }
  return fieldNames;
}

async function collectionExists(name) {
  return (await loadCollectionNames()).has(name);
}

async function fieldExists(collection, field) {
  return (await loadFieldNames()).has(`${collection}.${field}`);
}

async function ensureCollection(definition) {
  if (!(await collectionExists(definition.collection))) {
    console.log(`Creating collection: ${definition.collection}`);
    await directus.query('/collections', {
      method: 'POST',
      data: {
        collection: definition.collection,
        meta: {
          icon: definition.icon,
          note: definition.note,
          hidden: false,
          singleton: false,
        },
        schema: {},
      },
    });
    (await loadCollectionNames()).add(definition.collection);
    fieldNames = null;
  }

  if (!(await fieldExists(definition.collection, 'id'))) {
    console.log(`  Adding primary key: ${definition.collection}.id`);
    await directus.query(`/fields/${definition.collection}`, {
      method: 'POST',
      data: {
        field: 'id',
        type: 'integer',
        meta: { hidden: true, readonly: true, interface: 'input' },
        schema: { is_primary_key: true, has_auto_increment: true, is_nullable: false },
      },
    });
    (await loadFieldNames()).add(`${definition.collection}.id`);
  }

  for (const field of definition.fields) {
    if (await fieldExists(definition.collection, field.field)) continue;
    console.log(`  Adding field: ${definition.collection}.${field.field}`);
    await directus.query(`/fields/${definition.collection}`, { method: 'POST', data: field });
    (await loadFieldNames()).add(`${definition.collection}.${field.field}`);
  }
}

async function existingRelations() {
  try {
    const response = await directus.query('/relations?limit=-1');
    return new Set((response?.data?.data || []).map((item) => `${item.collection}.${item.field}`));
  } catch {
    return new Set();
  }
}

async function ensureRelations() {
  const existing = await existingRelations();
  for (const relation of relations) {
    const key = `${relation.collection}.${relation.field}`;
    if (existing.has(key)) continue;
    console.log(`Creating relation: ${key} -> ${relation.related_collection}`);
    const body = {
      collection: relation.collection,
      field: relation.field,
      related_collection: relation.related_collection,
      schema: { on_delete: 'SET NULL' },
    };
    if (relation.oneField) {
      body.meta = { one_field: relation.oneField };
    }
    await directus.query('/relations', { method: 'POST', data: body });
  }
}

async function main() {
  console.log('Connecting to Directus...');
  await directus.getToken();
  console.log('Connected.');

  for (const definition of collections) {
    await ensureCollection(definition);
  }
  await ensureRelations();
  console.log('\nDirectus schema setup complete.');
}

main().catch((error) => {
  console.error('Schema setup failed:', error.message);
  if (error.payload) console.error(JSON.stringify(error.payload, null, 2));
  process.exitCode = 1;
});
