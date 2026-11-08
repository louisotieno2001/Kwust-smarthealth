const bcrypt = require('bcryptjs');
const directus = require('../src/lib/directus');
const { env } = require('../src/config/env');
const { canonicalizeAdmission } = require('../src/lib/admission');

const PASSWORDS = {
  admin: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
  clinician: process.env.SEED_CLINICIAN_PASSWORD || 'Clinician@12345',
  student: process.env.SEED_STUDENT_PASSWORD || 'Student@12345',
};

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function findUser(filter) {
  return directus.first('users', { filter, fields: '*' });
}

async function ensureUser(data, password) {
  const filter = data.email
    ? { email: { _eq: data.email } }
    : { admission_number_canonical: { _eq: data.admission_number_canonical } };
  const existing = await findUser(filter);
  if (existing) {
    console.log(`User exists: ${data.full_name}`);
    return existing;
  }
  console.log(`Creating user: ${data.full_name} (${data.role})`);
  return directus.create('users', {
    ...data,
    password_hash: await bcrypt.hash(password, env.auth.bcryptRounds),
  });
}

async function ensureMedicine(data) {
  const existing = await directus.first('medicines', { filter: { name: { _eq: data.name } }, fields: '*' });
  if (existing) {
    console.log(`Medicine exists: ${data.name}`);
    return existing;
  }
  console.log(`Creating medicine: ${data.name}`);
  return directus.create('medicines', data);
}

async function ensureSlot(data) {
  const existing = await directus.first('appointment_slots', {
    filter: {
      clinician_id: { _eq: data.clinician_id },
      date: { _eq: data.date },
      start_time: { _eq: data.start_time },
    },
    fields: '*',
  });
  if (existing) return existing;
  return directus.create('appointment_slots', data);
}

async function ensureItem(collection, filter, data) {
  const existing = await directus.first(collection, { filter, fields: 'id' });
  if (existing) return existing;
  return directus.create(collection, data);
}

async function main() {
  console.log('Connecting to Directus...');
  await directus.getToken();

  const admin = await ensureUser({
    full_name: 'System Administrator',
    email: 'admin@kwust.ac.ke',
    role: 'admin',
    status: 'active',
    is_verified: true,
    verified_at: new Date().toISOString(),
    staff_title: 'Administrator',
  }, PASSWORDS.admin);

  const clinicianOne = await ensureUser({
    full_name: 'Dr. Wanjiku Kamau',
    email: 'wanjiku@kwust.ac.ke',
    role: 'clinician',
    status: 'active',
    is_verified: true,
    verified_at: new Date().toISOString(),
    staff_title: 'Doctor',
    staff_number: 'KW-STF-001',
    phone: '+254700000001',
  }, PASSWORDS.clinician);

  const clinicianTwo = await ensureUser({
    full_name: 'Nurse Mary Atieno',
    email: 'mary@kwust.ac.ke',
    role: 'clinician',
    status: 'active',
    is_verified: true,
    verified_at: new Date().toISOString(),
    staff_title: 'Nurse',
    staff_number: 'KW-STF-002',
    phone: '+254700000002',
  }, PASSWORDS.clinician);

  const studentSeeds = [
    { full_name: 'Joyvender Awino', admission_number: 'KCS/063/24', email: 'joyvender@student.kwust.ac.ke', phone: '+254700000010' },
    { full_name: 'Amina Hassan', admission_number: 'BBIT/45/26', email: 'amina@student.kwust.ac.ke', phone: '+254700000011' },
    { full_name: 'Grace Wanjiku', admission_number: 'BCOM/7/25', email: 'grace@student.kwust.ac.ke', phone: '+254700000012' },
    { full_name: 'Mercy Njeri', admission_number: 'BBIT/46/26', email: 'mercy@student.kwust.ac.ke', phone: '+254700000013' },
    { full_name: 'Faith Chebet', admission_number: 'KCS/64/24', email: 'faith@student.kwust.ac.ke', phone: '+254700000014' },
  ];

  const students = [];
  for (const student of studentSeeds) {
    const canonical = canonicalizeAdmission(student.admission_number);
    students.push(await ensureUser({
      ...student,
      role: 'student',
      status: 'active',
      admission_number_canonical: canonical,
    }, PASSWORDS.student));
  }

  const medicines = [
    { name: 'Paracetamol 500mg', category: 'Analgesic', description: 'Pain and fever relief', quantity: 180, unit: 'tablets', reorder_level: 40, expiry_date: addDays(420), status: 'available' },
    { name: 'Ibuprofen 400mg', category: 'Anti-inflammatory', description: 'Pain and inflammation relief', quantity: 120, unit: 'tablets', reorder_level: 30, expiry_date: addDays(300), status: 'available' },
    { name: 'Amoxicillin 250mg', category: 'Antibiotic', description: 'Bacterial infections', quantity: 90, unit: 'capsules', reorder_level: 25, expiry_date: addDays(240), status: 'available' },
    { name: 'ORS Sachets', category: 'Rehydration', description: 'Oral rehydration salts', quantity: 75, unit: 'sachets', reorder_level: 20, expiry_date: addDays(500), status: 'available' },
    { name: 'Cetirizine 10mg', category: 'Antihistamine', description: 'Allergy relief', quantity: 18, unit: 'tablets', reorder_level: 25, expiry_date: addDays(210), status: 'low_stock' },
    { name: 'Metronidazole 400mg', category: 'Antibiotic', description: 'Anaerobic infections', quantity: 60, unit: 'tablets', reorder_level: 20, expiry_date: addDays(180), status: 'available' },
    { name: 'Ferrous Sulphate', category: 'Supplement', description: 'Iron supplement', quantity: 110, unit: 'tablets', reorder_level: 30, expiry_date: addDays(600), status: 'available' },
    { name: 'Vitamin C 100mg', category: 'Supplement', description: 'Vitamin C supplement', quantity: 200, unit: 'tablets', reorder_level: 40, expiry_date: addDays(550), status: 'available' },
    { name: 'Salbutamol Inhaler', category: 'Respiratory', description: 'Asthma relief inhaler', quantity: 6, unit: 'inhalers', reorder_level: 8, expiry_date: addDays(150), status: 'low_stock' },
    { name: 'Diclofenac Gel', category: 'Topical', description: 'Muscle and joint pain gel', quantity: 0, unit: 'tubes', reorder_level: 5, expiry_date: addDays(90), status: 'out_of_stock' },
    { name: 'Artemether-Lumefantrine 20/120mg', category: 'Antimalarial', description: 'Malaria treatment', quantity: 48, unit: 'tablets', reorder_level: 12, expiry_date: addDays(360), status: 'available' },
    { name: 'Chlorpheniramine 4mg', category: 'Antihistamine', description: 'Allergy relief', quantity: 80, unit: 'tablets', reorder_level: 20, expiry_date: addDays(330), status: 'available' },
  ];

  const medicineRecords = [];
  for (const medicine of medicines) medicineRecords.push(await ensureMedicine(medicine));
  const medicineByName = (name) => medicineRecords.find((item) => item.name === name);

  const slotDefinitions = [
    { key: 'day1Nine', clinician: clinicianOne, date: addDays(1), start: '09:00:00', end: '10:00:00', capacity: 5, status: 'open' },
    { key: 'day1NineMary', clinician: clinicianTwo, date: addDays(1), start: '09:00:00', end: '10:00:00', capacity: 5, status: 'open' },
    { key: 'day2Eleven', clinician: clinicianOne, date: addDays(2), start: '11:00:00', end: '12:00:00', capacity: 4, status: 'open' },
    { key: 'day2ElevenMary', clinician: clinicianTwo, date: addDays(2), start: '11:00:00', end: '12:00:00', capacity: 4, status: 'open' },
    { key: 'day3Afternoon', clinician: clinicianOne, date: addDays(3), start: '14:00:00', end: '15:00:00', capacity: 6, status: 'open' },
    { key: 'day3MorningMary', clinician: clinicianTwo, date: addDays(3), start: '10:00:00', end: '11:00:00', capacity: 5, status: 'open' },
    { key: 'day5Morning', clinician: clinicianOne, date: addDays(5), start: '09:30:00', end: '10:30:00', capacity: 4, status: 'open' },
    { key: 'day6AfternoonMary', clinician: clinicianTwo, date: addDays(6), start: '13:00:00', end: '14:00:00', capacity: 5, status: 'open' },
    { key: 'pastWeek', clinician: clinicianOne, date: addDays(-7), start: '09:00:00', end: '10:00:00', capacity: 5, status: 'closed' },
    { key: 'pastTwoWeeks', clinician: clinicianTwo, date: addDays(-14), start: '11:00:00', end: '12:00:00', capacity: 5, status: 'closed' },
  ];

  const slots = {};
  for (const definition of slotDefinitions) {
    slots[definition.key] = await ensureSlot({
      clinician_id: definition.clinician.id,
      date: definition.date,
      start_time: definition.start,
      end_time: definition.end,
      capacity: definition.capacity,
      location: 'University Health Center',
      status: definition.status,
    });
  }

  const appointmentDefinitions = [
    { key: 'aminaHeadache', student: students[1], clinician: clinicianOne, slot: slots.day1Nine, reason: 'Persistent headaches for three days', status: 'booked' },
    { key: 'graceRash', student: students[2], clinician: clinicianTwo, slot: slots.day2ElevenMary, reason: 'Itchy skin rash on both arms', status: 'booked' },
    { key: 'mercyStomach', student: students[3], clinician: clinicianOne, slot: slots.day3Afternoon, reason: 'Stomach pain and nausea', status: 'booked' },
    { key: 'faithAllergy', student: students[4], clinician: clinicianTwo, slot: slots.day3MorningMary, reason: 'Seasonal allergy review', status: 'booked' },
    { key: 'joyFever', student: students[0], clinician: clinicianOne, slot: slots.pastWeek, reason: 'Fever and fatigue', status: 'completed', notes: 'Reviewed and treated for malaria.' },
    { key: 'aminaCheckup', student: students[1], clinician: clinicianTwo, slot: slots.pastTwoWeeks, reason: 'Routine health check-up', status: 'completed', notes: 'Routine check-up completed.' },
    { key: 'graceCancelled', student: students[2], clinician: clinicianTwo, slot: slots.day5Morning, reason: 'Follow-up consultation', status: 'cancelled' },
  ];

  const appointments = {};
  for (const definition of appointmentDefinitions) {
    appointments[definition.key] = await ensureItem('appointments', {
      student_id: { _eq: definition.student.id },
      slot_id: { _eq: definition.slot.id },
    }, {
      student_id: definition.student.id,
      slot_id: definition.slot.id,
      clinician_id: definition.clinician.id,
      reason: definition.reason,
      status: definition.status,
      notes: definition.notes || null,
    });
  }

  const recordDefinitions = [
    {
      key: 'joyMalaria', student: students[0], clinician: clinicianOne, appointment: appointments.joyFever, visitDate: addDays(-7),
      complaint: 'Fever and chills', symptoms: 'High temperature, headache, and fatigue for three days.',
      diagnosis: 'Malaria', notes: 'Advised rest, oral fluids, and a full course of antimalarial medication. Review in one week if symptoms persist.',
    },
    {
      key: 'aminaAnaemia', student: students[1], clinician: clinicianTwo, appointment: appointments.aminaCheckup, visitDate: addDays(-14),
      complaint: 'Fatigue and dizziness', symptoms: 'Low energy and occasional dizziness when standing up.',
      diagnosis: 'Iron deficiency anaemia', notes: 'Advised an iron-rich diet and prescribed ferrous sulphate. Repeat blood test in one month.',
    },
    {
      key: 'graceRhinitis', student: students[2], clinician: clinicianTwo, appointment: null, visitDate: addDays(-21),
      complaint: 'Sneezing and itchy eyes', symptoms: 'Repeated sneezing, runny nose, and itchy eyes during windy weather.',
      diagnosis: 'Seasonal allergic rhinitis', notes: 'Advised to avoid dust and pollen, and prescribed an antihistamine.',
    },
    {
      key: 'mercyGastro', student: students[3], clinician: clinicianOne, appointment: null, visitDate: addDays(-10),
      complaint: 'Nausea and abdominal cramps', symptoms: 'Loose stools, mild abdominal cramps, and reduced appetite.',
      diagnosis: 'Gastroenteritis', notes: 'Advised oral rehydration and a light diet. Return if symptoms worsen.',
    },
    {
      key: 'faithAsthma', student: students[4], clinician: clinicianOne, appointment: null, visitDate: addDays(-30),
      complaint: 'Shortness of breath', symptoms: 'Wheezing and chest tightness after climbing stairs.',
      diagnosis: 'Mild asthma exacerbation', notes: 'Advised to carry an inhaler at all times and avoid known triggers.',
    },
  ];

  const records = {};
  for (const definition of recordDefinitions) {
    records[definition.key] = await ensureItem('medical_records', {
      student_id: { _eq: definition.student.id },
      visit_date: { _eq: definition.visitDate },
      diagnosis: { _eq: definition.diagnosis },
    }, {
      student_id: definition.student.id,
      clinician_id: definition.clinician.id,
      appointment_id: definition.appointment ? definition.appointment.id : null,
      visit_date: definition.visitDate,
      chief_complaint: definition.complaint,
      symptoms: definition.symptoms,
      diagnosis: definition.diagnosis,
      notes: definition.notes,
    });
  }

  const prescriptionDefinitions = [
    { record: records.joyMalaria, medicine: medicineByName('Artemether-Lumefantrine 20/120mg'), dosage: '4 tablets', frequency: 'Twice daily', duration: '3 days', quantity: 24, instructions: 'Take with fatty food.' },
    { record: records.joyMalaria, medicine: medicineByName('Paracetamol 500mg'), dosage: '2 tablets', frequency: 'Every 8 hours', duration: '3 days', quantity: 6, instructions: 'Take after food for fever.' },
    { record: records.aminaAnaemia, medicine: medicineByName('Ferrous Sulphate'), dosage: '1 tablet', frequency: 'Twice daily', duration: '30 days', quantity: 60, instructions: 'Take after meals with water.' },
    { record: records.graceRhinitis, medicine: medicineByName('Chlorpheniramine 4mg'), dosage: '1 tablet', frequency: 'At night', duration: '7 days', quantity: 7, instructions: 'May cause drowsiness.' },
    { record: records.mercyGastro, medicine: medicineByName('ORS Sachets'), dosage: '1 sachet', frequency: 'After each loose stool', duration: '3 days', quantity: 6, instructions: 'Dissolve in one litre of clean water.' },
    { record: records.faithAsthma, medicine: medicineByName('Salbutamol Inhaler'), dosage: '2 puffs', frequency: 'When needed', duration: '30 days', quantity: 1, instructions: 'Use during wheezing or shortness of breath.' },
  ];

  for (const definition of prescriptionDefinitions) {
    await ensureItem('prescriptions', {
      record_id: { _eq: definition.record.id },
      medicine_id: { _eq: definition.medicine.id },
    }, {
      record_id: definition.record.id,
      medicine_id: definition.medicine.id,
      dosage: definition.dosage,
      frequency: definition.frequency,
      duration: definition.duration,
      quantity: definition.quantity,
      instructions: definition.instructions,
    });
  }

  const noteDefinitions = [
    { student: students[0], title: 'Allergy history', content: 'No known drug allergies. Sensitive to dust and pollen.' },
    { student: students[0], title: 'Malaria recovery plan', content: 'Complete the antimalarial course and drink plenty of fluids. Return to the clinic if fever persists.' },
    { student: students[1], title: 'Iron supplement routine', content: 'Take ferrous sulphate after breakfast and supper. Pair with vitamin C to improve absorption.' },
    { student: students[2], title: 'Allergy triggers', content: 'Avoid dusty rooms and open fields during windy weather. Keep windows closed when pollen is high.' },
    { student: students[3], title: 'Hydration reminder', content: 'Drink oral rehydration solution after every loose stool until symptoms settle.' },
    { student: students[4], title: 'Asthma action plan', content: 'Carry the inhaler at all times. Seek urgent help if breathing does not improve after using it.' },
  ];

  for (const definition of noteDefinitions) {
    await ensureItem('health_notes', {
      student_id: { _eq: definition.student.id },
      title: { _eq: definition.title },
    }, {
      student_id: definition.student.id,
      title: definition.title,
      content: definition.content,
    });
  }

  const todoDefinitions = [
    { student: students[0], title: 'Finish antimalarial course', due: addDays(2), completed: false },
    { student: students[0], title: 'Book follow-up appointment', due: addDays(5), completed: false },
    { student: students[0], title: 'Drink two litres of water daily', due: addDays(1), completed: true },
    { student: students[1], title: 'Take iron tablets after breakfast', due: addDays(1), completed: false },
    { student: students[1], title: 'Attend headache review appointment', due: addDays(1), completed: false },
    { student: students[2], title: 'Avoid dusty areas this week', due: addDays(3), completed: false },
    { student: students[3], title: 'Collect ORS sachets from the pharmacy', due: addDays(1), completed: false },
    { student: students[4], title: 'Carry inhaler at all times', due: addDays(7), completed: false },
  ];

  for (const definition of todoDefinitions) {
    await ensureItem('todos', {
      student_id: { _eq: definition.student.id },
      title: { _eq: definition.title },
    }, {
      student_id: definition.student.id,
      title: definition.title,
      due_date: definition.due,
      completed: definition.completed,
    });
  }

  const reminderDefinitions = [
    { student: students[1], clinician: clinicianOne, title: 'Appointment reminder', message: 'You have an appointment tomorrow at 9:00 AM. Please arrive ten minutes early.', type: 'appointment' },
    { student: students[1], clinician: clinicianTwo, title: 'Iron supplement check', message: 'Remember to take your iron tablets and book a repeat blood test next month.', type: 'medication' },
    { student: students[0], clinician: clinicianOne, title: 'Malaria follow-up', message: 'Complete your antimalarial course. Visit the clinic if the fever returns.', type: 'general' },
    { student: students[3], clinician: clinicianOne, title: 'Stay hydrated', message: 'Continue taking oral rehydration solution and drink clean water throughout the day.', type: 'general' },
    { student: students[4], clinician: clinicianTwo, title: 'Asthma review', message: 'Bring your inhaler to the next appointment so we can review your technique.', type: 'appointment' },
  ];

  const reminders = {};
  for (const definition of reminderDefinitions) {
    reminders[definition.title] = await ensureItem('reminders', {
      user_id: { _eq: definition.student.id },
      title: { _eq: definition.title },
    }, {
      user_id: definition.student.id,
      title: definition.title,
      message: definition.message,
      type: definition.type,
      created_by: definition.clinician.id,
      read_at: null,
    });
  }

  const auditDefinitions = [
    { actor: admin, action: 'user.login', entity: 'user', entityId: admin.id },
    { actor: clinicianOne, action: 'appointment.book', entity: 'appointment', entityId: appointments.aminaHeadache.id },
    { actor: clinicianTwo, action: 'record.create', entity: 'medical_record', entityId: records.aminaAnaemia.id },
    { actor: clinicianOne, action: 'medicine.stock', entity: 'medicine', entityId: medicineByName('Cetirizine 10mg').id },
    { actor: clinicianTwo, action: 'reminder.create', entity: 'reminder', entityId: reminders['Appointment reminder'].id },
  ];

  for (const definition of auditDefinitions) {
    const entityId = String(definition.entityId);
    await ensureItem('audit_logs', {
      actor_id: { _eq: definition.actor.id },
      action: { _eq: definition.action },
      entity_id: { _eq: entityId },
    }, {
      actor_id: definition.actor.id,
      action: definition.action,
      entity: definition.entity,
      entity_id: entityId,
      metadata: null,
      ip_address: '127.0.0.1',
      user_agent: 'KWUST SmartHealth seed script',
    });
  }

  console.log('\nSeed complete.');
  console.log('App logins:');
  console.log(`  Admin:      admin@kwust.ac.ke / ${PASSWORDS.admin}`);
  console.log(`  Clinician:  wanjiku@kwust.ac.ke / ${PASSWORDS.clinician}`);
  console.log(`  Student:    BBIT/45/26 / ${PASSWORDS.student}`);
  console.log(`  Seeded students: ${students.length}, admin id: ${admin.id}.`);
  console.log(`  Seeded ${slotDefinitions.length} slots, ${appointmentDefinitions.length} appointments, ${recordDefinitions.length} records,`);
  console.log(`  ${prescriptionDefinitions.length} prescriptions, ${noteDefinitions.length} notes, ${todoDefinitions.length} todos,`);
  console.log(`  ${reminderDefinitions.length} reminders, ${auditDefinitions.length} audit logs.`);
}

main().catch((error) => {
  console.error('Seed failed:', error.message);
  if (error.payload) console.error(JSON.stringify(error.payload, null, 2));
  process.exitCode = 1;
});
