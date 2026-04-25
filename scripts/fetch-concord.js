const fs = require("fs");

// Node 18+ on Netlify supports fetch
// If not, fallback to node-fetch
let fetchFn;

if (global.fetch) {
  fetchFn = global.fetch;
} else {
  fetchFn = (...args) =>
    import("node-fetch").then(({ default: fetch }) => fetch(...args));
}

async function fetchTablePage(page) {
  const url = `https://shop.concordtheatricals.com/now-playing?Type=Object&HasValues=True&First=${page}&Last=${page}&Count=1&Root=%22table_page%22%3A%20%22${page}%22`;

  const res = await fetchFn(url);

  if (!res.ok) {
    console.log("Failed page:", page, res.status);
    return "";
  }

  return await res.text();
}

function clean(html) {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseRows(html) {
  const rows = [];

  const trMatches = html.match(/<tr[\s\S]*?<\/tr>/g) || [];

  for (const tr of trMatches) {
    if (tr.includes("tfoot")) continue;

    const cellMatches = [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)];

    const cells = cellMatches.map(m => clean(m[1]));

    if (cells.length < 6) continue;

    const [title, venue, authors, city, state, start, end] = cells;

    rows.push({
      title: title || "N/A",
      venue: venue || "N/A",
      authors: authors || "N/A",
      city: city || "N/A",
      state: state || "N/A",
      start: start || "N/A",
      end: end || "N/A"
    });
  }

  return rows;
}

(async () => {
  let page = 1;
  let all = [];

  console.log("Starting Concord scrape...");

let page = 1;
let all = [];
let seen = new Set();

while (true) {
  console.log("Fetching page", page);

  const html = await fetchTablePage(page);
  const rows = parseRows(html);

  if (!rows.length) break;

  for (const r of rows) {
    const key = `${r.title}-${r.venue}-${r.start}`;
    if (seen.has(key)) continue;
    seen.add(key);
    all.push(r);
  }

  // stop if page stops changing meaningfully
  if (rows.length < 2) break;

  page++;
}
    const html = await fetchTablePage(page);

    const rows = parseRows(html);

    console.log(`Page ${page}:`, rows.length);

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

 const path = "public/data/latest-concord.json";

// ensure folder exists
fs.mkdirSync("public/data", { recursive: true });

fs.writeFileSync(path, JSON.stringify(output, null, 2));

  console.log("Done Concord:", all.length);
})();
