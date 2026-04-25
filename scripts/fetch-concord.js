const fs = require("fs");

async function fetchPage(page) {
  const url = `https://shop.concordtheatricals.com/now-playing?Type=Object&HasValues=True&First=${page}&Last=${page}&Count=1&Root=%22table_page%22%3A%20%22${page}%22`;

  const res = await fetch(url);
  return await res.text();
}

// extract rows from HTML
function parseRows(html) {
  const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
  const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g;

  const rows = [];
  let match;

  while ((match = rowRegex.exec(html)) !== null) {
    const rowHtml = match[1];

    const cells = [];
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      cells.push(
        cellMatch[1]
          .replace(/<[^>]*>/g, "") // strip HTML tags
          .trim()
      );
    }

    if (cells.length > 0) {
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

  while (true) {
    console.log("Fetching page", page);

    const html = await fetchPage(page);
    const rows = parseRows(html);

    if (!rows.length) break;

    all.push(...rows);
    page++;

    // safety limit so it doesn't loop forever while testing
    if (page > 200) break;
  }

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

  console.log("Done:", all.length);
})();
