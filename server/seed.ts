import { db } from "./db";
import { roles, userRoles, auditLogs, users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedDatabase() {
  console.log("Seeding database...");
  try {
    const existingRoles = await db.select().from(roles);
    if (existingRoles.length === 0) {
      await db.insert(roles).values([
        { name: "Admin", description: "Full access to the system" },
        { name: "User", description: "Standard user access" },
        { name: "Manager", description: "Can manage other users" },
      ]);
      console.log("Seed: Roles created");
    }
    console.log("Database seeding completed.");
  } catch (err) {
    console.error("Error seeding database:", err);
  }
}

seedDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
