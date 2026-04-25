const fs = require("fs");

// Node 18+ / 22 safe fetch
const fetchFn = global.fetch;

// -----------------------------
// CONCORD FETCH (PAGINATED HTML)
// -----------------------------
async function fetchConcordPage(page) {
  const url = `https://shop.concordtheatricals.com/now-playing?Type=Object&HasValues=True&First=${page}&Last=${page}&Count=1&Root=%22table_page%22%3A%20%22${page}%22`;

  const res = await fetchFn(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    }
  });

  return await res.text();
}

// -----------------------------
// FIXED PARSER (VERY IMPORTANT)
// -----------------------------
function parseConcord(html) {
  const rows = [];

  // grab ALL table rows
  const trMatches = html.match(/<tr[\s\S]*?<\/tr>/g) || [];

  for (const tr of trMatches) {
    if (tr.includes("tfoot") || tr.includes("paging")) continue;

    const cells = [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)]
      .map(m =>
        m[1]
          .replace(/<[^>]*>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/\s+/g, " ")
          .trim()
      );

    // IMPORTANT FIX:
    // some rows include hidden columns or slightly different structure
    if (cells.length < 5) continue;

    const titleMatch = tr.match(/\/p\/\d+\//);

    // DO NOT hard-filter too aggressively
    rows.push({
      title: cells[0] || "N/A",
      venue: cells[1] || "N/A",
      authors: cells[2] || "N/A",
      city: cells[3] || "N/A",
      state: cells[4] || "N/A",
      start: cells[5] || "",
      end: cells[6] || "",
      hasLink: !!titleMatch
    });
  }

  return rows;
}

// -----------------------------
// MAIN SCRAPER
// -----------------------------
async function fetchConcordAll() {
  console.log("Fetching Concord...");

  let page = 1;
  let all = [];

  while (page <= 500) {
    console.log("Page", page);

    const html = await fetchConcordPage(page);
    const rows = parseConcord(html);

    // DEBUG (IMPORTANT)
    console.log(`Page ${page}: rows=${rows.length}`);

    // STOP ONLY if page is truly empty
    if (!rows.length) break;

    all.push(...rows);
    page++;
  }

  console.log("DONE CONCORD:", all.length);
  return all;
}

// -----------------------------
// RUN
// -----------------------------
(async () => {
  const concord = await fetchConcordAll().catch((e) => {
    console.error("Concord failed:", e);
    return [];
  });

  fs.mkdirSync("public/data", { recursive: true });

  fs.writeFileSync(
    "public/data/latest-concord.json",
    JSON.stringify(
      {
        success: true,
        count: concord.length,
        data: concord,
        updated_at: new Date().toISOString()
      },
      null,
      2
    )
  );

  console.log("Saved concord:", concord.length);
})();
