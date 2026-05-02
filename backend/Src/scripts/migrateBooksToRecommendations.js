import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const SOURCE_COLLECTION = "books";
const TARGET_COLLECTION = "recommendations";

async function runMigration() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing. Set it in your environment or .env file.");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;
  const source = db.collection(SOURCE_COLLECTION);
  const target = db.collection(TARGET_COLLECTION);

  const documents = await source.find({}).toArray();

  if (documents.length === 0) {
    console.log("No documents found in books collection. Nothing to migrate.");
    return;
  }

  const ops = documents.map((doc) => ({
    replaceOne: {
      filter: { _id: doc._id },
      replacement: doc,
      upsert: true,
    },
  }));

  const result = await target.bulkWrite(ops, { ordered: false });

  console.log("Migration finished");
  console.log(`Source documents: ${documents.length}`);
  console.log(`Matched existing: ${result.matchedCount}`);
  console.log(`Inserted new: ${result.upsertedCount}`);
  console.log(`Modified existing: ${result.modifiedCount}`);
}

runMigration()
  .then(async () => {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Migration failed:", error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
