const fs = require("fs");

// allow Node 18+ / Netlify fetch safety
const fetchFn = global.fetch || ((...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args)));

// -----------------------------
// MTI FETCH (ROBUST SIMPLE VERSION)
// -----------------------------
async function fetchMTI() {
  const url =
    "https://www.mtishows.com/map-search-ajax.php?bounds_north=88.850418&bounds_south=-65.072130&bounds_east=180&bounds_west=-180&include_jr_shows=1&limit=100000";

  const res = await fetchFn(url, {
    headers: {
      "user-agent": "Mozilla/5.0"
    }
  });

  const json = await res.json();

  // OLD RELIABLE FALLBACK (this is what was working before)
  const data = json.data || [];

  console.log("MTI raw keys:", Object.keys(json || {}));
  console.log("MTI count:", data.length);

  return data;
}

// -----------------------------
// CONCORD FETCH (SAFE HTML PARSER)
// -----------------------------
async function fetchConcord() {
  const base =
    "https://shop.concordtheatricals.com/now-playing";

  const url =
    base +
    "?Type=Object&HasValues=True&First=1&Last=1&Count=1&Root=%22table_page%22%3A%20%221%22";

  const res = await fetchFn(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      "accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
      "referer": "https://shop.concordtheatricals.com/"
    }
  });

  const html = await res.text();

  // DEBUG (important for you right now)
  console.log("Concord HTML length:", html.length);

  return parseConcordRows(html);
}
function parseConcordRows(html) {
  const rows = [];

  const trMatches = html.match(/<tr[\s\S]*?<\/tr>/g) || [];

  for (const tr of trMatches) {
    // skip footer/pagination/header junk
    if (tr.includes("tfoot")) continue;
    if (tr.includes("paging")) continue;
    if (!tr.includes("/p/")) continue;

    const cells = [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)]
      .map(m =>
        m[1]
          .replace(/<[^>]*>/g, "")
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter(Boolean);

    // MUST have at least title + venue
    if (cells.length < 2) continue;

    rows.push({
      title: cells[0] || "",
      venue: cells[1] || "",
      authors: cells[2] || "",
      city: cells[3] || "",
      state: cells[4] || "",
      start: cells[5] || "",
      end: cells[6] || ""
    });
  }

  console.log("Parsed Concord rows:", rows.length);
  return rows;
}
// -----------------------------
// MAIN
// -----------------------------
(async () => {
  console.log("Starting scrape...");

  let mti = [];
  let concord = [];

  try {
    mti = await fetchMTI();
  } catch (e) {
    console.error("MTI failed:", e);
  }

  try {
    concord = await fetchConcord();
  } catch (e) {
    console.error("Concord failed:", e);
  }

  // ensure folder exists
  fs.mkdirSync("public/data", { recursive: true });

  fs.writeFileSync(
    "public/data/latest-mti.json",
    JSON.stringify(
      {
        success: true,
        count: mti.length,
        data: mti,
        source: "mti",
        updated_at: new Date().toISOString()
      },
      null,
      2
    )
  );

  fs.writeFileSync(
    "public/data/latest-concord.json",
    JSON.stringify(
      {
        success: true,
        count: concord.length,
        data: concord,
        source: "concord",
        updated_at: new Date().toISOString()
      },
      null,
      2
    )
  );

  console.log("DONE MTI:", mti.length);
  console.log("DONE CONCORD:", concord.length);
})();
