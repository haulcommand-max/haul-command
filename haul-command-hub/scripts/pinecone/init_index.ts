import "dotenv/config";
import { initializePineconeIndex } from "../../src/lib/pinecone/client";

async function main() {
  try {
    console.log("Starting Pinecone Initialization (Step 1 & 2)...");
    await initializePineconeIndex();
    console.log("Initialization complete!");
  } catch (err) {
    console.error("Failed to initialize pinecone index:");
    console.error(err);
    process.exit(1);
  }
}

main();
