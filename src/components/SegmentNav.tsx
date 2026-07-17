export type SegmentItem<T extends string> = {
  id: T;
  label: string;
};

type SegmentNavProps<T extends string> = {
  label: string;
  items: SegmentItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
};

export function SegmentNav<T extends string>({ label, items, activeId, onChange }: SegmentNavProps<T>) {
  return (
    <div className="segment-nav section-tabs" aria-label={label} role="tablist" data-testid="section-tabs">
      {items.map((item) => (
        <button
          className={activeId === item.id ? "segment-button active" : "segment-button"}
          key={item.id}
          type="button"
          role="tab"
          aria-selected={activeId === item.id}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
