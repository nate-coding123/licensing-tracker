module.exports = async function fetchMTI() {
  const url = "https://www.mtishows.com/map-search-ajax.php?bounds_north=88.850418&bounds_south=-65.072130&bounds_east=80.859375&bounds_west=-480.937500&include_jr_shows=1&limit=100000";

  const res = await fetch(url);
  const json = await res.json();

  return json?.data || [];
};
