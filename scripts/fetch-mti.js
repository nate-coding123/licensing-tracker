const fs = require("fs");

const output = {
  success: true,
  count: data.length,
  data: data,
  updated_at: new Date().toISOString()
};

fs.writeFileSync(
  "public/data/latest-mti.json",
  JSON.stringify(output, null, 2)
);
