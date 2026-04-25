const fs = require("fs");

async function fetchPage(page) {
  const url = `https://shop.concordtheatricals.com/now-playing?Type=Object&HasValues=True&First=1&Last=1&Count=1&Root=%22table_page%22%3A%20%22${page}%22`;

  const res = await fetch(url);
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

(async () => {
  let page = 1;
  let all = [];

  while (true) {
    console.log("Fetching page", page);

    const data = await fetchPage(page);

    if (!data) break;

    // adjust this depending on structure
    const rows =
      data.data ||
      data.results ||
      data.items ||
      [];

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
    "public/data/latest-concord.json",
    JSON.stringify(output, null, 2)
  );

  console.log("Done:", all.length);
})();
