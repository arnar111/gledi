
import "dotenv/config";
import { db } from "./server/db";
import { smsNotifications } from "@shared/schema";
import { desc } from "drizzle-orm";

async function checkNotifications() {
    try {
        const results = await db.select().from(smsNotifications).orderBy(desc(smsNotifications.createdAt)).limit(5);
        console.log("Recent SMS Notifications:");
        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        process.exit(1);
    }
}

checkNotifications();
