"use client";

export function NumberStepper({
  value,
  step,
  onChange,
  label,
}: {
  value: number;
  step: number;
  onChange: (value: number) => void;
  label: string;
}) {
  return (
    <div className="stepper" aria-label={label}>
      <button type="button" aria-label="减少" onClick={() => onChange(Math.max(0, value - step))}>
        −
      </button>
      <input
        aria-label={label}
        min={0}
        step={1}
        type="number"
        value={value}
        onChange={(event) => onChange(Math.max(0, Math.floor(Number(event.target.value) || 0)))}
      />
      <button type="button" aria-label="增加" onClick={() => onChange(value + step)}>
        +
      </button>
    </div>
  );
}
