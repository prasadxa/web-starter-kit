import { db, hospitalsTable, departmentsTable, doctorsTable, availabilityTable, appointmentsTable, reviewsTable, usersTable } from "@workspace/db";
import { sql, eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  const departments = await db
    .insert(departmentsTable)
    .values([
      { name: "Cardiology", description: "Heart and cardiovascular system", icon: "Heart" },
      { name: "Dermatology", description: "Skin, hair, and nails", icon: "Sparkles" },
      { name: "Neurology", description: "Brain and nervous system", icon: "Brain" },
      { name: "Orthopedics", description: "Bones, joints, and muscles", icon: "Bone" },
      { name: "Pediatrics", description: "Medical care for children", icon: "Baby" },
      { name: "Ophthalmology", description: "Eyes and vision care", icon: "Eye" },
      { name: "Gynecology", description: "Women's reproductive health", icon: "Activity" },
      { name: "General Medicine", description: "Primary care and general health", icon: "Stethoscope" },
      { name: "Dentistry", description: "Oral health and dental care", icon: "Smile" },
      { name: "Psychiatry", description: "Mental health and behavioral disorders", icon: "Brain" },
    ])
    .onConflictDoNothing()
    .returning();

  const hospitals = await db
    .insert(hospitalsTable)
    .values([
      { name: "City Medical Center", location: "123 Main St, Downtown, NY 10001", approved: true, phone: "+1-555-0101", email: "info@citymedical.com", description: "A leading multi-specialty hospital serving the city for over 50 years." },
      { name: "Green Valley Hospital", location: "456 Oak Avenue, Green Valley, CA 90210", approved: true, phone: "+1-555-0202", email: "contact@greenvalley.com", description: "State-of-the-art facility with world-class specialists." },
      { name: "Sunrise Health Clinic", location: "789 Sunrise Blvd, Miami, FL 33101", approved: true, phone: "+1-555-0303", email: "hello@sunrisehealth.com", description: "Comprehensive outpatient care with compassionate service." },
    ])
    .onConflictDoNothing()
    .returning();

  let depts = departments;
  let hosps = hospitals;

  if (departments.length === 0) {
    depts = await db.select().from(departmentsTable).orderBy(departmentsTable.id);
  }
  if (hospitals.length === 0) {
    hosps = await db.select().from(hospitalsTable).orderBy(hospitalsTable.id);
  }

  if (depts.length === 0 || hosps.length === 0) {
    console.log("No departments or hospitals found. Cannot seed doctors.");
    return;
  }

  const [cardio, derma, neuro, ortho, peds, ophtha, gyno, general, dental, psych] = depts;
  const [cityMed, greenValley, sunrise] = hosps;

  const doctorData = [
    { specialization: "Interventional Cardiology", bio: "Expert in minimally invasive cardiac procedures with 15+ years of experience.", experience: 15, consultationFee: 150, departmentId: cardio.id, hospitalId: cityMed.id, qualification: "MD, FACC" },
    { specialization: "Electrophysiology", bio: "Specialized in heart rhythm disorders and cardiac ablation procedures.", experience: 12, consultationFee: 140, departmentId: cardio.id, hospitalId: greenValley.id, qualification: "MD, PhD" },
    { specialization: "Clinical Dermatology", bio: "Board-certified dermatologist specializing in skin cancer and cosmetic treatments.", experience: 10, consultationFee: 120, departmentId: derma.id, hospitalId: cityMed.id, qualification: "MD, FAAD" },
    { specialization: "Cosmetic Dermatology", bio: "Expert in laser treatments, fillers, and advanced skincare procedures.", experience: 8, consultationFee: 130, departmentId: derma.id, hospitalId: sunrise.id, qualification: "MD" },
    { specialization: "Neurology & Epilepsy", bio: "Leading neurologist with expertise in epilepsy management and neurological disorders.", experience: 20, consultationFee: 160, departmentId: neuro.id, hospitalId: greenValley.id, qualification: "MD, DM Neurology" },
    { specialization: "Spine Surgery", bio: "Orthopedic surgeon specializing in complex spine surgeries and joint replacements.", experience: 18, consultationFee: 200, departmentId: ortho.id, hospitalId: cityMed.id, qualification: "MS Orthopedics, FRCS" },
    { specialization: "Pediatric Cardiology", bio: "Dedicated to providing comprehensive cardiac care for children from birth to 18.", experience: 14, consultationFee: 110, departmentId: peds.id, hospitalId: sunrise.id, qualification: "MD, DNB Pediatrics" },
    { specialization: "Retinal Surgery", bio: "Expert in vitreoretinal surgery and treatment of complex retinal diseases.", experience: 16, consultationFee: 175, departmentId: ophtha.id, hospitalId: greenValley.id, qualification: "MS Ophthalmology, FVRS" },
    { specialization: "Reproductive Medicine", bio: "Specialist in fertility treatments, IVF, and women's reproductive health.", experience: 11, consultationFee: 135, departmentId: gyno.id, hospitalId: cityMed.id, qualification: "MD, MRCOG" },
    { specialization: "Family Medicine", bio: "Compassionate primary care physician providing comprehensive healthcare for all ages.", experience: 9, consultationFee: 80, departmentId: general.id, hospitalId: sunrise.id, qualification: "MD, MBBS" },
    { specialization: "Endodontics", bio: "Specialist in root canal treatments and complex dental procedures.", experience: 7, consultationFee: 90, departmentId: dental.id, hospitalId: greenValley.id, qualification: "BDS, MDS" },
    { specialization: "Cognitive Behavioral Therapy", bio: "Psychiatrist specializing in anxiety, depression, and behavioral disorders.", experience: 13, consultationFee: 145, departmentId: psych.id, hospitalId: cityMed.id, qualification: "MD Psychiatry" },
  ];

  const doctorNames = [
    { first: "James", last: "Wilson" },
    { first: "Emily", last: "Chen" },
    { first: "Robert", last: "Patel" },
    { first: "Sarah", last: "Johnson" },
    { first: "Michael", last: "Davis" },
    { first: "Priya", last: "Sharma" },
    { first: "Thomas", last: "Anderson" },
    { first: "Aisha", last: "Khan" },
    { first: "David", last: "Lee" },
    { first: "Maria", last: "Garcia" },
    { first: "Kevin", last: "Brown" },
    { first: "Lisa", last: "Martinez" },
  ];

  const seedRatings = [4.8, 4.6, 4.9, 4.3, 4.7, 4.5, 4.4, 4.8, 4.2, 4.6, 4.1, 4.5];
  const seedReviews = [52, 34, 78, 18, 65, 45, 12, 89, 9, 37, 6, 28];

  const timeSlots = ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "02:00 PM", "02:30 PM", "03:00 PM", "04:00 PM"];

  const today = new Date();

  for (let i = 0; i < doctorData.length; i++) {
    const dData = doctorData[i];
    const name = doctorNames[i];
    const fakeUserId = `seed-doctor-${i + 1}`;

    const [doctor] = await db
      .insert(doctorsTable)
      .values({
        userId: fakeUserId,
        hospitalId: dData.hospitalId,
        departmentId: dData.departmentId,
        firstName: name.first,
        lastName: name.last,
        experience: dData.experience,
        consultationFee: dData.consultationFee,
        averageRating: seedRatings[i],
        totalReviews: seedReviews[i],
        bio: dData.bio,
        specialization: dData.specialization,
        qualification: dData.qualification,
      })
      .onConflictDoNothing()
      .returning();

    if (!doctor) continue;

    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() + d);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      const dateStr = date.toISOString().split("T")[0];

      const slots = timeSlots.filter((_, idx) => idx % 2 === d % 2 ? true : Math.random() > 0.3);

      await db
        .insert(availabilityTable)
        .values({ doctorId: doctor.id, date: dateStr, timeSlots: slots })
        .onConflictDoNothing();
    }
  }

  // Seed sample patients
  const patientData = [
    { id: "seed-patient-1", firstName: "Alice", lastName: "Thompson", email: "alice.thompson@example.com" },
    { id: "seed-patient-2", firstName: "Bob", lastName: "Williams", email: "bob.williams@example.com" },
    { id: "seed-patient-3", firstName: "Carol", lastName: "Davis", email: "carol.davis@example.com" },
  ];

  for (const p of patientData) {
    await db.insert(usersTable).values({ id: p.id, firstName: p.firstName, lastName: p.lastName, email: p.email, role: "patient" }).onConflictDoNothing();
  }

  // Fetch seeded doctors
  const seededDoctors = await db.select().from(doctorsTable).where(sql`${doctorsTable.userId} LIKE 'seed-doctor-%'`).orderBy(doctorsTable.id);
  if (seededDoctors.length === 0) {
    console.log("No seeded doctors found; skipping appointments/reviews.");
    console.log("Database seeded successfully!");
    return;
  }

  const past = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split("T")[0];
  };

  const sampleAppointments = [
    { patientId: "seed-patient-1", doctor: seededDoctors[0], date: past(10), timeSlot: "09:00 AM", status: "completed" as const, notes: "Follow-up on ECG results" },
    { patientId: "seed-patient-1", doctor: seededDoctors[1], date: past(5), timeSlot: "10:00 AM", status: "completed" as const, notes: "Skin rash evaluation" },
    { patientId: "seed-patient-2", doctor: seededDoctors[2], date: past(7), timeSlot: "09:30 AM", status: "completed" as const, notes: "Annual skin check" },
    { patientId: "seed-patient-2", doctor: seededDoctors[4], date: past(3), timeSlot: "11:00 AM", status: "booked" as const, notes: "Headache and dizziness" },
    { patientId: "seed-patient-3", doctor: seededDoctors[5], date: past(14), timeSlot: "02:00 PM", status: "completed" as const, notes: "Lower back pain" },
    { patientId: "seed-patient-3", doctor: seededDoctors[6], date: past(2), timeSlot: "09:00 AM", status: "pending" as const, notes: "Child checkup" },
  ];

  const insertedAppts: { id: number; patientId: string; doctorId: number; status: string }[] = [];
  for (const a of sampleAppointments) {
    const [appt] = await db
      .insert(appointmentsTable)
      .values({
        patientId: a.patientId,
        doctorId: a.doctor.id,
        hospitalId: a.doctor.hospitalId,
        date: a.date,
        timeSlot: a.timeSlot,
        status: a.status,
        notes: a.notes,
      })
      .onConflictDoNothing()
      .returning();
    if (appt) insertedAppts.push(appt);
  }

  // Seed reviews for completed appointments
  const completedAppts = insertedAppts.filter(a => a.status === "completed");
  const reviewTexts = [
    "Excellent doctor, very thorough and caring. Highly recommend!",
    "Great experience, explained everything clearly and patiently.",
    "Very professional, diagnosis was spot on. Will visit again.",
  ];
  for (let i = 0; i < completedAppts.length && i < reviewTexts.length; i++) {
    const appt = completedAppts[i];
    const existingAppt = sampleAppointments.find(a => a.patientId === appt.patientId && a.status === "completed" && insertedAppts.some(ia => ia.id === appt.id));
    if (!existingAppt) continue;
    await db
      .insert(reviewsTable)
      .values({
        appointmentId: appt.id,
        patientId: appt.patientId,
        doctorId: existingAppt.doctor.id,
        rating: 4 + (i % 2),
        comment: reviewTexts[i],
      })
      .onConflictDoNothing();
  }

  console.log("Database seeded successfully!");
}

seed().catch(console.error).finally(() => process.exit(0));
