const fs = require("fs");

// IMPORTANT: DataTables-style pagination (this is what Concord is actually using)
async function fetchPage(start = 0, length = 50) {
  const url = `https://shop.concordtheatricals.com/now-playing?start=${start}&length=${length}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  return await res.text();
}

// Parse HTML <tr> rows into structured objects
function parseRows(html) {
  const rows = [];

  const trMatches = html.match(/<tr[\s\S]*?<\/tr>/g) || [];

  for (const tr of trMatches) {
    // skip footer/pagination row
    if (tr.includes("tfoot") || tr.includes("paging")) continue;

    const cells = [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)]
      .map(m =>
        m[1]
          .replace(/<[^>]*>/g, "") // strip HTML tags
          .replace(/\s+/g, " ")
          .trim()
      );

    // basic validation
    if (cells.length >= 5 && cells[0]) {
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
  }

  return rows;
}

(async () => {
  let start = 0;
  const length = 50;
  let all = [];

  while (true) {
    console.log(`Fetching start=${start}`);

    const html = await fetchPage(start, length);
    const rows = parseRows(html);

    console.log(`→ found ${rows.length} rows`);

    // stop condition
    if (!rows.length) break;

    all.push(...rows);
    start += length;

    // safety limit (prevents infinite loops during testing)
    if (start > 200000) break;
  }

  const output = {
    success: true,
    count: all.length,
    data: all,
    source: "concord",
    updated_at: new Date().toISOString()
  };

  // IMPORTANT: match MTI structure location
  fs.writeFileSync(
    "data/latest-concord.json",
    JSON.stringify(output, null, 2)
  );

  console.log("DONE. Total rows:", all.length);
})();
