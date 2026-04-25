fetch('/data/latest-mti.json')
  .then(res => res.json())
  .then(result => {
    console.log("API RESULT:", result);

    document.getElementById('count').innerText =
      "Total productions: " + result.count;
  })
  .catch(err => {
    console.error("FETCH ERROR:", err);

    document.getElementById('count').innerText =
      "Failed to load data";
  });
