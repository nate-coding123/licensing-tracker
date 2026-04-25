module.exports = async function fetchConcord() {
  try {
    const all = [];

    const url =
      "https://shop.concordtheatricals.com/now-playing?Type=Object&HasValues=True&First=1&Last=1&Count=1&Root=%22table_page%22%3A%20%221%22";

    const res = await fetch(url);
    const html = await res.text();

    const rows = html.match(/<tr[\s\S]*?<\/tr>/g) || [];

    for (const tr of rows) {
      if (!tr.includes("/p/")) continue;
      if (tr.includes("tfoot")) continue;

      const cells = [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)]
        .map(m =>
          m[1]
            .replace(/<[^>]*>/g, "")
            .trim()
        );

      if (cells.length < 6) continue;

      all.push({
        title: cells[0] || "N/A",
        venue: cells[1] || "N/A",
        authors: cells[2] || "N/A",
        city: cells[3] || "N/A",
        state: cells[4] || "N/A",
        start: cells[5] || "N/A",
        end: cells[6] || "N/A"
      });
    }

    return all;
  } catch (e) {
    console.log("Concord scrape failed:", e.message);
    return [];
  }
};
