const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const directus = require('../src/lib/directus');

async function main() {
  console.log('Connecting to Directus...');
  const response = await directus.query('/schema/snapshot');
  const snapshot = response?.data?.data;

  if (!snapshot || !Array.isArray(snapshot.collections)) {
    throw new Error('Directus did not return a valid schema snapshot');
  }

  const outputPath = path.join(__dirname, '..', 'snapshot.yaml');
  fs.writeFileSync(outputPath, yaml.dump(snapshot, { noRefs: true, lineWidth: 120 }), 'utf8');
  console.log(`Snapshot saved to ${outputPath} (${snapshot.collections.length} collections).`);
}

main().catch((error) => {
  console.error('Snapshot failed:', error.message);
  process.exitCode = 1;
});
