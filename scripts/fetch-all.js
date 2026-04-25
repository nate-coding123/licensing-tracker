const { execSync } = require("child_process");

console.log("Starting full scrape pipeline...");

try {
  console.log("\n--- Running MTI ---");
  execSync("node scripts/fetch-mti.js", { stdio: "inherit" });

  console.log("\n--- Running Concord ---");
  execSync("node scripts/fetch-concord.js", { stdio: "inherit" });

  console.log("\nDONE ALL SCRAPES");
} catch (err) {
  console.error("Fetch-all failed:", err);
  process.exit(1);
}
