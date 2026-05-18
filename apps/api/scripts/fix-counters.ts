import * as path from "path";
import * as dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is required");

  await mongoose.connect(uri);
  const db = mongoose.connection.db!;
  const counters = db.collection("counters");

  const broken = await counters.countDocuments({ key: { $exists: true } });
  console.log(`Removing ${broken} broken counter docs (with 'key' field)`);
  if (broken) await counters.deleteMany({ key: { $exists: true } });

  const year = new Date().getFullYear();

  const items = db.collection("items");
  const maxItem = await items
    .find({ itemNumber: { $regex: `^LF-${year}-` } })
    .sort({ itemNumber: -1 })
    .limit(1)
    .toArray();
  const maxItemSeq = maxItem.length
    ? parseInt(maxItem[0].itemNumber.split("-").pop()!, 10)
    : 0;

  const claims = db.collection("claims");
  const maxClaim = await claims
    .find({ claimNumber: { $regex: `^CL-${year}-` } })
    .sort({ claimNumber: -1 })
    .limit(1)
    .toArray();
  const maxClaimSeq = maxClaim.length
    ? parseInt(maxClaim[0].claimNumber.split("-").pop()!, 10)
    : 0;

  console.log(`Setting items:${year} seq=${maxItemSeq}`);
  await counters.updateOne(
    { _id: `items:${year}` as unknown as never },
    { $set: { seq: maxItemSeq } },
    { upsert: true },
  );

  console.log(`Setting claims:${year} seq=${maxClaimSeq}`);
  await counters.updateOne(
    { _id: `claims:${year}` as unknown as never },
    { $set: { seq: maxClaimSeq } },
    { upsert: true },
  );

  console.log("Done. Counters now:");
  console.log(await counters.find({}).toArray());

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
