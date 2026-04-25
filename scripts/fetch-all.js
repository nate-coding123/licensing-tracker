const fs = require("fs");

// -----------------------------
// Safe fetch (Node 22 + Netlify)
// -----------------------------
const fetchFn = global.fetch;

// -----------------------------
// MTI FETCH (JSON API)
// -----------------------------
async function fetchMTI() {
  try {
    const url =
      "https://www.mtishows.com/map-search-ajax.php?bounds_north=88.850418&bounds_south=-65.072130&bounds_east=80.859375&bounds_west=-480.937500&include_jr_shows=1&limit=100000";

    const res = await fetchFn(url);
    const json = await res.json();

    console.log("MTI raw count:", json?.count);

    return json?.data || [];
  } catch (err) {
    console.log("MTI fetch failed:", err.message);
    return [];
  }
}

// -----------------------------
// CONCORD FETCH (XHR ENDPOINT)
// -----------------------------
const fetch = require("node-fetch");

async function fetchConcord() {
  const all = [];

  for (let page = 1; page <= 200; page++) {
    const res = await fetch(
      "https://shop.concordtheatricals.com/now-playing",
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
          "x-requested-with": "XMLHttpRequest",
          "referer":
            "https://shop.concordtheatricals.com/now-playing"
        },
        body: new URLSearchParams({
          Type: "Object",
          HasValues: "True",
          First: String(page),
          Last: String(page),
          Count: "1",
          Root: `"table_page": "${page}"`
        })
      }
    );

    const html = await res.text();
    const rows = parseConcordRows(html);

    console.log(`Page ${page}:`, rows.length);

    if (!rows.length) break;

    all.push(...rows);
  }

  return all;
}
// -----------------------------
// CONCORD PARSER (robust)
// -----------------------------
function parseConcordRows(html) {
  const rows = [];

  const trMatches = html.match(/<tr[\s\S]*?<\/tr>/g) || [];

  for (const tr of trMatches) {
    if (!tr.includes("/p/")) continue;
    if (tr.includes("tfoot")) continue;

    const cells = [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)]
      .map(m =>
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
// WRITE SAFE FILE
// -----------------------------
function writeJSON(path, data) {
  fs.mkdirSync(require("path").dirname(path), { recursive: true });

  fs.writeFileSync(
    path,
    JSON.stringify(
      {
        success: true,
        count: data.length,
        data,
        updated_at: new Date().toISOString()
      },
      null,
      2
    )
  );
}

// -----------------------------
// MAIN
// -----------------------------
(async () => {
  console.log("Starting scrape...");

  const mti = await fetchMTI();
  const concord = await fetchConcord();

  console.log("MTI FINAL:", mti.length);
  console.log("CONCORD FINAL:", concord.length);

  writeJSON("public/data/latest-mti.json", mti);
  writeJSON("public/data/latest-concord.json", concord);

  console.log("DONE ALL SCRAPES");
})();
