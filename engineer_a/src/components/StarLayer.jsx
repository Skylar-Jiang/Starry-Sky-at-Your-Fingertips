import StarItem from "./StarItem";

export default function StarLayer({ records, onSelectStar }) {
  return (
    <div className="star-layer" aria-label="星星层">
      {records.map((record) => (
        <StarItem key={record.id} record={record} onClick={onSelectStar} />
      ))}
    </div>
  );
}
