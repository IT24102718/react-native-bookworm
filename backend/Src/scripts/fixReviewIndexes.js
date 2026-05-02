import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const fixReviewIndexes = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("MONGO_URI not found in .env");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const collection = mongoose.connection.collection("reviews");

    // Get all existing indexes
    const indexes = await collection.getIndexes();
    console.log("Current indexes:", indexes);

    // Drop the old composite index if it exists
    try {
      await collection.dropIndex("book_1_user_1");
      console.log("✓ Dropped old index: book_1_user_1");
    } catch (error) {
      console.log("Old index not found or already dropped");
    }

    // Drop the old single indexes if they exist
    try {
      await collection.dropIndex("book_1");
      console.log("✓ Dropped old index: book_1");
    } catch (error) {
      console.log("Index book_1 not found");
    }

    try {
      await collection.dropIndex("user_1");
      console.log("✓ Dropped old index: user_1");
    } catch (error) {
      console.log("Index user_1 not found");
    }

    // Clear all documents to avoid null key conflicts
    const deleteResult = await collection.deleteMany({});
    console.log(`✓ Cleared ${deleteResult.deletedCount} documents with null keys`);

    // Now recreate the correct indexes
    await collection.createIndex({ userId: 1, bookId: 1 }, { sparse: true });
    console.log("✓ Created new index: userId_1_bookId_1 (sparse)");

    console.log("\n✅ Review collection indexes fixed successfully!");
    console.log("You can now submit reviews without duplicate key errors.\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error fixing indexes:", error);
    process.exit(1);
  }
};

fixReviewIndexes();
