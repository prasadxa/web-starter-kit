import { db, hospitalsTable, doctorsTable, availabilityTable, appointmentsTable, reviewsTable } from "@workspace/db";
import { sql, inArray } from "drizzle-orm";

async function main() {
  console.log("Removing hospitals and doctors from USA/New York/California...");

  try {
    // 1. Find hospitals to delete
    const hospitalsToDelete = await db
      .select({ id: hospitalsTable.id })
      .from(hospitalsTable)
      .where(sql`location ILIKE '%NY%' OR location ILIKE '%CA%' OR location ILIKE '%FL%'`);

    if (hospitalsToDelete.length === 0) {
      console.log("No hospitals found matching USA, New York, or California.");
      return;
    }

    const hospitalIds = hospitalsToDelete.map(h => h.id);
    console.log(`Found ${hospitalIds.length} hospitals to delete.`);

    // 2. Find doctors belonging to those hospitals
    const doctorsToDelete = await db
      .select({ id: doctorsTable.id })
      .from(doctorsTable)
      .where(inArray(doctorsTable.hospitalId, hospitalIds));

    const doctorIds = doctorsToDelete.map(d => d.id);
    
    if (doctorIds.length > 0) {
        console.log(`Removing ${doctorIds.length} doctors belonging to those hospitals...`);
        
        // cascade deletes (if not set in schema)
        await db.delete(availabilityTable).where(inArray(availabilityTable.doctorId, doctorIds));
        await db.delete(appointmentsTable).where(inArray(appointmentsTable.doctorId, doctorIds));
        await db.delete(reviewsTable).where(inArray(reviewsTable.doctorId, doctorIds));
        
        // delete doctors
        await db.delete(doctorsTable).where(inArray(doctorsTable.id, doctorIds));
    }

    // 3. Delete the hospitals
    console.log("Removing hospitals...");
    await db.delete(hospitalsTable).where(inArray(hospitalsTable.id, hospitalIds));

    console.log("Successfully removed USA locations.");
  } catch (error) {
    console.error("Error during deletion:", error);
  } finally {
    process.exit(0);
  }
}

main();