/**
 * Server-rendered single-series charts. One hue (--chart-mark, validated per theme), thin bars with
 * 4px rounded data ends anchored to the baseline, 2px gaps, recessive grid, native hover tooltips,
 * and a table view for every chart. A single series needs no legend: the title names it.
 */
import type { Bucket } from "@/lib/analytics";

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

export function BarChart({ title, data, format = (v) => String(v), height = 180 }: { title: string; data: Bucket[]; format?: (v: number) => string; height?: number }) {
  const W = 560, H = height, padL = 44, padB = 24, padT = 12;
  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const slot = (W - padL) / data.length;
  const bw = Math.min(36, slot - 2);
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / max);
  const ticks = [0, max / 2, max];
  const id = title.replace(/\W+/g, "-").toLowerCase();
  return (
    <figure className="card p-5">
      <figcaption className="text-sm font-medium text-ink" id={`${id}-t`}>{title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-labelledby={`${id}-t`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} />
            <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="rgb(var(--muted))">{format(t)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = padL + i * slot + (slot - bw) / 2;
          const top = y(d.value);
          const h = Math.max(0, H - padB - top);
          const r = Math.min(4, h);
          return (
            <g key={d.label} className="group">
              <title>{`${d.label}: ${format(d.value)}`}</title>
              <rect x={padL + i * slot} y={padT} width={slot} height={H - padT - padB} fill="transparent" />
              {h > 0 && (
                <path
                  d={`M${x},${H - padB} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${H - padB} Z`}
                  fill="var(--chart-mark)" className="transition-opacity group-hover:opacity-80"
                />
              )}
              <text x={x + bw / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="rgb(var(--muted))">{d.label}</text>
            </g>
          );
        })}
        <line x1={padL} x2={W} y1={H - padB} y2={H - padB} stroke="var(--line-strong)" strokeWidth={1} />
      </svg>
      <details className="mt-2 text-xs text-muted">
        <summary className="cursor-pointer">Show table</summary>
        <table className="table-base mt-2"><tbody>{data.map((d) => <tr key={d.label}><td>{d.label}</td><td className="text-right font-mono">{format(d.value)}</td></tr>)}</tbody></table>
      </details>
    </figure>
  );
}

/** Ranked horizontal bars with the value written as text (text in ink, not series colour). */
export function RankList({ title, items, empty }: { title: string; items: { label: string; value: number; href?: string }[]; empty: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="card p-5">
      <p className="text-sm font-medium text-ink">{title}</p>
      {items.length === 0 ? <p className="mt-3 text-sm text-muted">{empty}</p> : (
        <ol className="mt-4 space-y-3">
          {items.map((i) => (
            <li key={i.label}>
              <div className="flex justify-between gap-3 text-sm"><span className="truncate text-ink">{i.href ? <a href={i.href} className="hover:underline">{i.label}</a> : i.label}</span><span className="font-mono text-muted">{i.value}</span></div>
              <div className="mt-1 h-1.5 rounded-full bg-ink/10"><div className="h-1.5 rounded-full" style={{ width: `${(i.value / max) * 100}%`, background: "var(--chart-mark)" }} /></div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function StatTile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 font-display text-4xl text-ink">{value}</p>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
  );
}
