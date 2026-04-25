const fs = require("fs");
const path = require("path");

const fetchMTI = require("./fetch-mti");
const fetchConcord = require("./fetch-concord");

const DATA_DIR = path.join(process.cwd(), "public", "data");

function safeWrite(filePath, data) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.log("Write failed:", filePath, e.message);
  }
}

(async () => {
  console.log("🚀 Build started");

  let mti = [];
  let concord = [];

  try {
    mti = await fetchMTI();
    console.log("MTI:", mti.length);
  } catch (e) {
    console.log("MTI error:", e.message);
  }

  try {
    concord = await fetchConcord();
    console.log("Concord:", concord.length);
  } catch (e) {
    console.log("Concord error:", e.message);
  }

  safeWrite(path.join(DATA_DIR, "latest-mti.json"), {
    success: true,
    count: mti.length,
    data: mti
  });

  safeWrite(path.join(DATA_DIR, "latest-concord.json"), {
    success: true,
    count: concord.length,
    data: concord
  });

  console.log("✅ Done build");
})();
