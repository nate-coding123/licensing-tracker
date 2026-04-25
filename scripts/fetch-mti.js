import fs from "fs";

const URL = "https://www.mtishows.com/map-search-ajax.php?bounds_north=90&bounds_south=-90&bounds_east=180&bounds_west=-180&include_jr_shows=1&limit=100000";

async function run() {
  const res = await fetch(URL);
  const data = await res.json();

  const today = new Date().toISOString().slice(0, 10);

  fs.writeFileSync(`data/mti-${today}.json`, JSON.stringify(data, null, 2));
  fs.writeFileSync(`data/latest-mti.json`, JSON.stringify(data));

  console.log(`Saved ${data.length} records`);
}

run();