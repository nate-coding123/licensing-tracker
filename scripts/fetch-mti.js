fetch('/data/latest-mti.json')
  .then(res => {
    if (!res.ok) throw new Error("Failed to load JSON");
    return res.json();
  })
  .then(data => {
    console.log("DATA:", data);

    document.getElementById('count').innerText =
      "Total productions: " + data.length;
  })
  .catch(err => {
    console.error(err);
    document.getElementById('count').innerText =
      "Error loading data";
  });
