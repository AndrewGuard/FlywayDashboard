// leadTimeStore.js
// Stores and retrieves lead time deltas for migrations
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'migration-lead-times.json');

function getLeadTimes() {
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

function setLeadTime(key, value) {
  const data = getLeadTimes();
  data[key] = value;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = { getLeadTimes, setLeadTime };
