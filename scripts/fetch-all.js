const fs = require("fs");

// -----------------------------
// MTI FETCH (JSON API)
// -----------------------------
async function fetchMTI() {
  const url =
    "https://www.mtishows.com/map-search-ajax.php?bounds_north=88.850418&bounds_south=-65.072130&bounds_east=80.859375&bounds_west=-480.937500&include_jr_shows=1&limit=100000";

  const res = await fetch(url);
  const json = await res.json();

  console.log("MTI count:", json.count);

  return json.data || [];
}

// -----------------------------
// CONCORD FETCH (HTML TABLE)
// -----------------------------
async function fetchConcord() {
  const url =
    "https://shop.concordtheatricals.com/now-playing?Type=Object&HasValues=True&First=1&Last=1&Count=1&Root=%22table_page%22%3A%20%221%22";

  const res = await fetch(url);
  const html = await res.text();

  return parseConcordRows(html);
}

// -----------------------------
// CONCORD PARSER (FIXED)
// -----------------------------
function parseConcordRows(html) {
  const rows = [];

  const trMatches = html.match(/<tr[\s\S]*?<\/tr>/g) || [];

  for (const tr of trMatches) {
    // skip junk rows
    if (
      tr.includes("tfoot") ||
      tr.includes("paging") ||
      tr.includes("Title</") ||
      tr.includes("Producer</")
    ) continue;

    // must be real production row
    if (!tr.includes("/p/")) continue;

    const cells = [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)]
      .map(m =>
        m[1]
          .replace(/<[^>]*>/g, "")
          .replace(/\s+/g, " ")
          .trim()
      );

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

// -----------------------------
// MAIN RUNNER
// -----------------------------
(async () => {
  console.log("Starting scrape...");

  const mti = await fetchMTI();
  const concord = await fetchConcord();

  const outputMTI = {
    success: true,
    count: mti.length,
    data: mti,
    source: "mti",
    updated_at: new Date().toISOString()
  };

  const outputConcord = {
    success: true,
    count: concord.length,
    data: concord,
    source: "concord",
    updated_at: new Date().toISOString()
  };

  // ensure folder exists
  fs.mkdirSync("public/data", { recursive: true });

  fs.writeFileSync(
    "public/data/latest-mti.json",
    JSON.stringify(outputMTI, null, 2)
  );

  fs.writeFileSync(
    "public/data/latest-concord.json",
    JSON.stringify(outputConcord, null, 2)
  );

  console.log("DONE MTI:", mti.length);
  console.log("DONE CONCORD:", concord.length);
})();
