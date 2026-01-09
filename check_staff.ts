
import "dotenv/config";
import { db } from "./server/db";
import { staff } from "@shared/schema";

async function checkStaff() {
    const results = await db.select().from(staff);
    console.log("Staff Numbers:");
    results.forEach(s => console.log(`${s.name}: ${s.phone}`));
    process.exit(0);
}

checkStaff();
