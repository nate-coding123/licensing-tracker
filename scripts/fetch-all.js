const fs = require("fs");
const path = require("path");

// ----------------------
// SAFE FS HELPERS
// ----------------------
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJSON(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ----------------------
// MTI FETCH (WORKING)
// ----------------------
async function fetchMTI() {
  const url =
    "https://www.mtishows.com/map-search-ajax.php?bounds_north=88.850418&bounds_south=-65.072130&bounds_east=180&bounds_west=-180&include_jr_shows=1&limit=100000";

  const res = await fetch(url);
  const json = await res.json();

  return json.data || [];
}

// ----------------------
// CONCORD FETCH
// ----------------------
async function fetchConcord() {
  const results = [];
  let page = 1;

  while (page < 300) {
    const url = `https://shop.concordtheatricals.com/NowPlayingTableSource?table_page=${page}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "X-Requested-With": "XMLHttpRequest",
        "Accept": "*/*"
      }
    });

    const text = await res.text();

    console.log("Page", page, "length:", text.length);

    const rows = parseConcord(text);

    console.log("Page", page, "rows:", rows.length);

    if (!rows.length) break;

    results.push(...rows);
    page++;
  }

  return results;
}

// ----------------------
// CONCORD PARSER (FIXED)
// ----------------------
function parseConcord(html) {
  const rows = [];

  const trMatches = html.match(/<tr[\s\S]*?<\/tr>/g) || [];

  for (const tr of trMatches) {
    // skip junk rows
    if (tr.includes("tfoot")) continue;
    if (tr.includes("paging")) continue;

    const cells = [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)]
      .map(m =>
        m[1]
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      );

    // IMPORTANT: don't over-restrict (this was killing your results)
    if (cells.length < 5) continue;

    const title = cells[0];
    if (!title || title.toLowerCase().includes("title")) continue;

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

// ----------------------
// MAIN RUNNER
// ----------------------
(async () => {
  console.log("Starting scrape...");

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

  console.log("\nDONE MTI:", mti.length);
  console.log("DONE CONCORD:", concord.length);
})();
