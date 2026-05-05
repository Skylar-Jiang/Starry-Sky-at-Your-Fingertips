import { emotionOptions } from "../config/emotionConfig";
import { buildEmotionConstellationGroups } from "../utils/constellationGroups";
import { groupRecordsByDate } from "../utils/recordFilters";

const dateOptions = [
  { value: "all", label: "全部" },
  { value: "today", label: "今天" },
  { value: "last7", label: "最近 7 天" }
];

export default function ObservationPanel({
  totalCount,
  records,
  emotionFilter,
  dateFilter,
  onEmotionFilterChange,
  onDateFilterChange
}) {
  const activeConstellationCount = buildEmotionConstellationGroups(records).filter((group) => group.active).length;
  const dateGroups = groupRecordsByDate(records);

  return (
    <aside className="observation-panel" role="region" aria-label="观测控制">
      <div className="observation-controls">
        <label>
          <span>情绪筛选</span>
          <select value={emotionFilter} onChange={(event) => onEmotionFilterChange(event.target.value)}>
            <option value="all">全部</option>
            {emotionOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>日期筛选</span>
          <select value={dateFilter} onChange={(event) => onDateFilterChange(event.target.value)}>
            {dateOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="observation-stats" aria-label="观测统计">
        <span>总星星 {totalCount}</span>
        <span>当前筛选 {records.length}</span>
        <span>已形成星座 {activeConstellationCount}</span>
      </div>

      <div className="observation-list" aria-label="星星列表">
        {dateGroups.length ? (
          dateGroups.map((group) => (
            <div key={group.date} className="observation-date-group">
              <strong>{group.date}</strong>
              <span>{group.records.length} 颗星</span>
            </div>
          ))
        ) : (
          <p>当前筛选下还没有星星。</p>
        )}
      </div>
    </aside>
  );
}
