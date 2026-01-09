
import "dotenv/config";
import { db } from "./server/db";
import { smsNotifications } from "@shared/schema";
import { desc } from "drizzle-orm";

async function check() {
    const results = await db.select().from(smsNotifications).orderBy(desc(smsNotifications.createdAt)).limit(5);
    console.log("ID | Status | CreatedAt | SentAt");
    results.forEach(r => {
        console.log(`${r.id} | ${r.status} | ${r.createdAt} | ${r.sentAt}`);
    });
    process.exit(0);
}

check();
