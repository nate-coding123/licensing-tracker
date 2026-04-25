const fs = require("fs");

async function fetchPage(page) {
  const url = `https://shop.concordtheatricals.com/now-playing?Type=Object&HasValues=True&First=${page}&Last=${page}&Count=1&Root=%22table_page%22%3A%20%22${page}%22`;

  const res = await fetch(url);
  return await res.text();
}

function parseRows(html) {
  const rows = [];

  const trMatches = html.match(/<tr[\s\S]*?<\/tr>/g) || [];

  for (const tr of trMatches) {
    if (tr.includes("tfoot")) continue;

    const cells = [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)]
      .map(m =>
        m[1]
          .replace(/<[^>]*>/g, "")
          .trim()
      );

    if (cells.length >= 6) {
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

(async () => {
  let page = 1;
  let all = [];

  while (page <= 200) {
    console.log("Fetching page", page);

    const html = await fetchPage(page);
    const rows = parseRows(html);

    if (!rows.length) break;

    all.push(...rows);
    page++;
  }

  const output = {
    success: true,
    count: all.length,
    data: all,
    source: "concord",
    updated_at: new Date().toISOString()
  };

  fs.writeFileSync(
    "data/latest-concord.json",
    JSON.stringify(output, null, 2)
  );

  console.log("Done:", all.length);
})();
