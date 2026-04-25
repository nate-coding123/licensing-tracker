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
async function fetchConcord() {
  const base =
    "https://shop.concordtheatricals.com/now-playing/NowPlayingTableSource";

  const all = [];
  let page = 1;

  while (true) {
    const url =
      `${base}?Type=Object&HasValues=True&First=${page}&Last=${page}&Count=1&Root=%22table_page%22%3A%20%22${page}%22`;

    try {
      const res = await fetchFn(url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
          "referer": "https://shop.concordtheatricals.com/now-playing",
          "x-requested-with": "XMLHttpRequest"
        }
      });

      const html = await res.text();

      const rows = parseConcordRows(html);

      if (!rows.length) {
        console.log(`Concord stopped at page ${page}`);
        break;
      }

      all.push(...rows);

      console.log(`Concord page ${page}: ${rows.length}`);

      page++;

      if (page > 1000) break; // safety cap
    } catch (err) {
      console.log("Concord error page", page, err.message);
      break;
    }
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
