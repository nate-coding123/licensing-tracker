const fs = require("fs");
const path = require("path");

// ---------------- SAFE HELPERS ----------------
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJSON(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ---------------- MTI ----------------
async function fetchMTI() {
  const url =
    "https://www.mtishows.com/map-search-ajax.php?bounds_north=88.850418&bounds_south=-65.072130&bounds_east=180&bounds_west=-180&include_jr_shows=1&limit=100000";

  const res = await fetch(url);
  const json = await res.json();

  return json.data || [];
}

// ---------------- CONCORD ----------------
async function fetchConcord() {
  const results = [];
  let page = 1;

  while (page < 300) {
    const url = `https://shop.concordtheatricals.com/now-playing?Type=Object&HasValues=True&First=${page}&Last=${page}&Count=1&Root=%22table_page%22%3A%20%22${page}%22`;

    const res = await fetch(url);
    const html = await res.text();

    const rows = parseConcord(html);

    if (!rows.length) break;

    results.push(...rows);
    page++;
  }

  return results;
}

// ---------------- CONCORD PARSER ----------------
function parseConcord(html) {
  const rows = [];

  const tr = html.match(/<tr[\s\S]*?<\/tr>/g) || [];

  for (const row of tr) {
    if (row.includes("tfoot")) continue;
    if (!row.includes("/p/")) continue;

    const cells = [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)]
      .map(m => m[1].replace(/<[^>]*>/g, "").trim());

    if (cells.length < 6) continue;

    rows.push({
      title: cells[0] || "N/A",
      venue: cells[1] || "N/A",
      authors: cells[2] || "N/A",
      city: cells[3] || "N/A",
      state: cells[4] || "N/A",
      start: cells[5] || "N/A",
      end: cells[6] || "N/A"
    });
  }

  return rows;
}

// ---------------- MAIN ----------------
(async () => {
  console.log("Starting build...");

  let mti = [];
  let concord = [];

  try {
    console.log("Fetching MTI...");
    mti = await fetchMTI();
  } catch (e) {
    console.log("MTI failed:", e.message);
  }

  try {
    console.log("Fetching Concord...");
    concord = await fetchConcord();
  } catch (e) {
    console.log("Concord failed:", e.message);
  }

  const base = path.join(process.cwd(), "public", "data");

  ensureDir(base);

  writeJSON(path.join(base, "latest-mti.json"), {
    success: true,
    count: mti.length,
    data: mti,
    updated_at: new Date().toISOString()
  });

  writeJSON(path.join(base, "latest-concord.json"), {
    success: true,
    count: concord.length,
    data: concord,
    updated_at: new Date().toISOString()
  });

  console.log("DONE MTI:", mti.length);
  console.log("DONE CONCORD:", concord.length);
})();
