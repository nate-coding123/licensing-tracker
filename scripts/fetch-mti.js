fetch('/data/latest-mti.json')
  .then(res => res.json())
  .then(data => {
    console.log("RAW DATA:", data);
    console.log("IS ARRAY:", Array.isArray(data));

    document.getElementById('count').innerText =
      Array.isArray(data)
        ? "Total productions: " + data.length
        : "Data format mismatch";
  })
  .catch(err => console.error("FETCH ERROR:", err));
