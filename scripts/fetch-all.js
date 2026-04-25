const fs = require("fs");

async function fetchPage(start = 0, length = 50) {
  const url = `https://shop.concordtheatricals.com/now-playing?start=${start}&length=${length}`;

  const res = await fetch(url);
  return await res.text();
}

function parseRows(html) {
  const rows = [];
  const trMatches = html.match(/<tr[\s\S]*?<\/tr>/g) || [];

  for (const tr of trMatches) {
    if (tr.includes("tfoot") || tr.includes("paging")) continue;

    const cells = [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)]
      .map(m => m[1].replace(/<[^>]*>/g, "").trim());

    if (cells.length >= 5 && cells[0]) {
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
  }

  return rows;
}

async function run() {
  let start = 0;
  const length = 50;
  let all = [];

  while (true) {
    console.log("Fetching", start);

    const html = await fetchPage(start, length);
    const rows = parseRows(html);

    if (!rows.length) break;

    all.push(...rows);
    start += length;

    if (start > 200000) break;
  }

  const output = {
    success: true,
    count: all.length,
    data: all,
    updated: new Date().toISOString()
  };

  fs.mkdirSync("data", { recursive: true });

  fs.writeFileSync(
    "data/latest-concord.json",
    JSON.stringify(output, null, 2)
  );

  console.log("DONE:", all.length);
}

run();
