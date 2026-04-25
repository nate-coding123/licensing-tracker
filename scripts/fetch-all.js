function parseRows(html) {
  const rows = [];

  const trMatches = html.match(/<tr[\s\S]*?<\/tr>/g) || [];

  for (const tr of trMatches) {
    // ❌ skip footer/pagination/header junk
    if (
      tr.includes("tfoot") ||
      tr.includes("paging") ||
      tr.includes("Title</") ||
      tr.includes("Producer</")
    ) continue;

    // MUST contain a real production link
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
      title: cells[0] || "N/A",
      venue: cells[1] || "N/A",
      authors: cells[2] || "N/A",
      city: cells[3] || "N/A",
      state: cells[4] || "N/A",
      start: cells[5] || "N/A",
      end: cells[6] || "N/A"
    });
  }

  return rows;
}
