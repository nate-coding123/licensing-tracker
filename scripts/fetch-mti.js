const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../public/data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
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
