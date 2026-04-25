fetch('/data/latest-mti.json')
  .then(res => res.json())
  .then(result => {
    console.log("FULL RESULT:", result);

    document.getElementById('count').innerText =
      "Total productions: " + result.count;
  })
  .catch(err => {
    console.error(err);
    document.getElementById('count').innerText =
      "Error loading data";
  });
