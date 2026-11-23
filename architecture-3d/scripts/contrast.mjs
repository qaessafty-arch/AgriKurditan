// WCAG 2.x contrast audit for the design tokens. Run: node scripts/contrast.mjs
const L = (hex) => {
  const c = hex.replace("#", "").match(/../g).map((h) => parseInt(h, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const themes = {
  dark: { canvas: "#101114", surface: "#202329", raised: "#2A2E35", ink: "#F5F3EF", muted: "#A6A6A2", accentInk: "#C9AF88", sage: "#8FA8A1", danger: "#F2827A", success: "#7BC59B", accent: "#B69A72" },
  light: { canvas: "#F5F3EF", surface: "#ECE9E3", raised: "#FFFFFF", ink: "#16171B", muted: "#5B5B55", accentInk: "#76603F", sage: "#4A645D", danger: "#B3261E", success: "#2A6545", accent: "#B69A72" },
};
let fail = 0;
for (const [name, t] of Object.entries(themes)) {
  for (const bg of ["canvas", "surface", "raised"]) {
    for (const fg of ["ink", "muted", "accentInk", "sage", "danger", "success"]) {
      const r = ratio(t[fg], t[bg]); const ok = r >= 4.5; if (!ok) fail++;
      console.log(`${ok ? "ok  " : "FAIL"} ${name.padEnd(5)} ${fg.padEnd(9)} on ${bg.padEnd(7)} ${r.toFixed(2)}`);
    }
  }
  const btn = ratio("#101114", t.accent); if (btn < 4.5) fail++;
  console.log(`${btn >= 4.5 ? "ok  " : "FAIL"} ${name.padEnd(5)} button text #101114 on accent ${btn.toFixed(2)}`);
}
process.exit(fail ? 1 : 0);
