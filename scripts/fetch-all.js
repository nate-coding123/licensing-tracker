const fs = require("fs");
const path = require("path");

const fetchMTI = require("./fetch-mti");
const fetchConcord = require("./fetch-concord");

(async () => {
  console.log("Starting build...");

  const mti = await fetchMTI().catch(() => []);
  const concord = await fetchConcord().catch(() => []);

  const dataDir = path.join(process.cwd(), "public", "data");
  fs.mkdirSync(dataDir, { recursive: true });

  fs.writeFileSync(
    path.join(dataDir, "latest-mti.json"),
    JSON.stringify({ success: true, data: mti }, null, 2)
  );

  fs.writeFileSync(
    path.join(dataDir, "latest-concord.json"),
    JSON.stringify({ success: true, data: concord }, null, 2)
  );

  console.log("DONE:", mti.length, concord.length);
})();
