const fs = require("fs");

// -----------------------------
// CONFIG
// -----------------------------
const CONCORD_BASE =
  "https://shop.concordtheatricals.com/now-playing?Type=Object&HasValues=True&First=1&Last=1&Count=1&Root=%22table_page%22%3A%20%221%22";

// -----------------------------
// FETCH (Concord page)
// -----------------------------
async function fetchConcordPage(page) {
  const url = `https://shop.concordtheatricals.com/now-playing?Type=Object&HasValues=True&First=${page}&Last=${page}&Count=1&Root=%22table_page%22%3A%20%22${page}%22`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome Safari"
    }
  });

  return await res.text();
}

// -----------------------------
// PARSE HTML TABLE ROWS
// -----------------------------
function parseConcordRows(html) {
  const rows = [];

  const trMatches = html.match(/<tr[\s\S]*?<\/tr>/g) || [];

  for (const tr of trMatches) {
    // skip footer/pagination/header rows
    if (tr.includes("tfoot") || tr.includes("paging")) continue;
    if (!tr.includes("/p/")) continue;

    const cells = [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)]
      .map((m) =>
        m[1]
          .replace(/<[^>]*>/g, "")
          .replace(/\s+/g, " ")
          .trim()
      );

    if (cells.length < 6) continue;

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

  return rows;
}

// -----------------------------
// MAIN SCRAPER
// -----------------------------
(async () => {
  console.log("Starting Concord scrape...");

  let page = 1;
  let all = [];

  while (page <= 300) {
    console.log("Fetching page:", page);

    const html = await fetchConcordPage(page);
    const rows = parseConcordRows(html);

    console.log(`Page ${page}: ${rows.length} rows`);

    // stop condition
    if (!rows.length) break;

    all.push(...rows);
    page++;
  }

  console.log("Total Concord rows:", all.length);

  // -----------------------------
  // WRITE OUTPUT SAFELY
  // -----------------------------
  fs.mkdirSync("public/data", { recursive: true });

  const output = {
    success: true,
    count: all.length,
    data: all,
    source: "concord",
    updated_at: new Date().toISOString()
  };

  fs.writeFileSync(
    "public/data/latest-concord.json",
    JSON.stringify(output, null, 2)
  );

  console.log("DONE writing concord file");
})();
