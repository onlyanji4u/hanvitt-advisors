import { storage } from "./storage";

export async function seedDatabase() {
  try {
    // Check if any contact requests exist (just to ensure DB connection works)
    // We don't really need to seed contact requests for the user to see, 
    // but it confirms the DB is writable.
    
    console.log("Seeding database...");
    
    // Create a dummy contact request to verify storage
    // In a real app we might not want this, but for "functional testing" verification it's good.
    // We can just log that we *could* create it, or actually create one.
    // Let's create one "System Test" request.
    
    await storage.createContactRequest({
      name: "System Test",
      email: "help@hanvitt.in",
      message: "Initial system verification test.",
      phone: "0000000000"
    });

    console.log("Database seeded successfully.");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
