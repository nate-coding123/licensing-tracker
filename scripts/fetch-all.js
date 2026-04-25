const fs = require("fs");
const path = require("path");

const fetchMTI = require("./fetch-mti");
const fetchConcord = require("./fetch-concord");

// ALWAYS resolve absolute paths (THIS fixes Netlify issue)
const DATA_DIR = path.join(process.cwd(), "public", "data");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

(async () => {
  console.log("🚀 Scrape starting...");

  ensureDir(DATA_DIR);

  let mti = [];
  let concord = [];

  // ---------------- MTI ----------------
  try {
    mti = await fetchMTI();
    console.log("MTI:", mti.length);
  } catch (err) {
    console.log("MTI failed:", err.message);
  }

  // ---------------- CONCORD ----------------
  try {
    concord = await fetchConcord();
    console.log("Concord:", concord.length);
  } catch (err) {
    console.log("Concord failed:", err.message);
  }

  const outputMTI = {
    success: true,
    count: mti.length,
    data: mti,
    updated_at: new Date().toISOString()
  };

  const outputConcord = {
    success: true,
    count: concord.length,
    data: concord,
    updated_at: new Date().toISOString()
  };

  const mtiPath = path.join(DATA_DIR, "latest-mti.json");
  const concordPath = path.join(DATA_DIR, "latest-concord.json");

  fs.writeFileSync(mtiPath, JSON.stringify(outputMTI, null, 2));
  fs.writeFileSync(concordPath, JSON.stringify(outputConcord, null, 2));

  console.log("✅ Wrote:");
  console.log(" -", mtiPath);
  console.log(" -", concordPath);
})();
