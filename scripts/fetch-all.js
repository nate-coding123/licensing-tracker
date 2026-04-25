const { execSync } = require("child_process");

console.log("Running MTI...");
execSync("node scripts/fetch-mti.js", { stdio: "inherit" });

console.log("Running Concord...");
execSync("node scripts/fetch-concord.js", { stdio: "inherit" });

console.log("DONE ALL");
