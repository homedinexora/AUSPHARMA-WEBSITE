// WCAG 2.x contrast checker for brand colours.
// Usage: node .claude/skills/auspharma-brand-guidelines/contrast.mjs "#0f7c80" "#ffffff" [more pairs...]
// Prints the ratio and whether it passes AA for normal text (4.5:1) and large text / UI (3:1).

const toLinear = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((x) => x + x).join("") : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`Invalid hex colour: ${hex}`);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
};

const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const args = process.argv.slice(2);
if (args.length < 2 || args.length % 2) {
  console.error('Pass colours in pairs: foreground background, e.g. "#0f7c80" "#ffffff"');
  process.exit(1);
}

let failed = false;
for (let i = 0; i < args.length; i += 2) {
  const [fg, bg] = [args[i], args[i + 1]];
  const r = ratio(fg, bg);
  const aa = r >= 4.5;
  if (!aa) failed = true;
  console.log(
    `${fg} on ${bg}: ${r.toFixed(2)}:1  text AA ${aa ? "PASS" : "FAIL"}  large/UI AA ${r >= 3 ? "PASS" : "FAIL"}`,
  );
}
process.exit(failed ? 1 : 0);
