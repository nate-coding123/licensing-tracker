const fs = require("fs");

const BASE = "https://shop.concordtheatricals.com";

// -----------------------------
// FETCH PAGE
// -----------------------------
async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  return await res.text();
}

// -----------------------------
// PARSE ROWS
// -----------------------------
function parseRows(html) {
  const rows = [];

  const trMatches = html.match(/<tr[\s\S]*?<\/tr>/g) || [];

  for (const tr of trMatches) {
    if (tr.includes("tfoot") || tr.includes("paging")) continue;
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
      title: cells[0],
      venue: cells[1],
      authors: cells[2],
      city: cells[3],
      state: cells[4],
      start: cells[5],
      end: cells[6]
    });
  }

  return rows;
}

// -----------------------------
// FIND NEXT PAGE
// -----------------------------
function getNextPage(html) {
  const match = html.match(/href="([^"]+table_page%22%3A%20%22\d+[^"]+)"[^>]*>Next</);

  if (!match) return null;

  return BASE + match[1];
}

// -----------------------------
// MAIN
// -----------------------------
(async () => {
  console.log("Starting Concord scrape...");

  let url =
    "https://shop.concordtheatricals.com/now-playing?Type=Object&HasValues=True&First=1&Last=1&Count=1&Root=%22table_page%22%3A%20%221%22";

  let all = [];
  let safety = 0;

  while (url && safety < 500) {
    console.log("Fetching:", url);

    const html = await fetchPage(url);
    const rows = parseRows(html);

    console.log("Rows:", rows.length);

    if (!rows.length) break;

    all.push(...rows);

    url = getNextPage(html);
    safety++;
  }

  console.log("TOTAL:", all.length);

  fs.mkdirSync("public/data", { recursive: true });

  fs.writeFileSync(
    "public/data/latest-concord.json",
    JSON.stringify(
      {
        success: true,
        count: all.length,
        data: all,
        updated_at: new Date().toISOString()
      },
      null,
      2
    )
  );

  console.log("DONE");
})();
