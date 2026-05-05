export function filterRecordsByEmotion(records, emotion) {
  if (!emotion || emotion === "all") return records;
  return records.filter((record) => record.emotion === emotion);
}

export function groupRecordsByDate(records) {
  const groups = new Map();

  for (const record of records) {
    const date = getRecordDateKey(record);
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date).push(record);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([date, dateRecords]) => ({ date, records: dateRecords }));
}

export function filterRecordsByDateRange(records, range, now = new Date()) {
  if (!range || range === "all") return records;

  const todayKey = toDateKey(now);
  if (range === "today") {
    return records.filter((record) => getRecordDateKey(record) === todayKey);
  }

  if (range === "last7") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);

    return records.filter((record) => {
      const recordDate = parseRecordDate(record);
      return recordDate >= start && recordDate <= now;
    });
  }

  return records;
}

export function getRecordDateKey(record) {
  return record.createdAt?.slice(0, 10) || "未知日期";
}

function parseRecordDate(record) {
  const value = record.createdAt || "";
  const normalized = value.includes(" ") ? value.replace(" ", "T") : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
