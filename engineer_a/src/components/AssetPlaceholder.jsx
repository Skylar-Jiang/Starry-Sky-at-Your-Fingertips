export default function AssetPlaceholder({ fileName, label, className = "" }) {
  return (
    <div className={`asset-placeholder ${className}`} aria-label={`${label}占位`}>
      <span>{label}</span>
      <strong>{fileName}</strong>
    </div>
  );
}
