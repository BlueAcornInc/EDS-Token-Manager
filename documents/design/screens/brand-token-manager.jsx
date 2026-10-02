import React, { useState, useMemo } from "react";

// ============================================================
// TRAILHEAD — Brand Token Manager
// Lets a site owner edit controlled brand tokens (color, type,
// spacing, radius) and see a live component preview before
// opening a PR to staging. Diff viewer shows exactly what
// changed and which components are affected.
// ============================================================

const ENVS = ["dev", "staging", "production"];
const ENV_META = {
  dev: { label: "Dev", color: "#6B7780" },
  staging: { label: "Staging", color: "#C97D3F" },
  production: { label: "Production", color: "#1C6E8C" },
};

const Icon = {
  search: (p) => <svg viewBox="0 0 256 256" fill="currentColor" {...p}><path d="M229.66,218.34,179.6,168.28a88.21,88.21,0,1,0-11.32,11.32l50.06,50.06a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"/></svg>,
  bell: (p) => <svg viewBox="0 0 256 256" fill="currentColor" {...p}><path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216Z"/></svg>,
  globe: (p) => <svg viewBox="0 0 256 256" fill="currentColor" {...p}><path d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132,83.41,134.4a8,8,0,0,0,9.18,0C136,236,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,56a32,32,0,1,1-32,32A32,32,0,0,1,128,72Z"/></svg>,
  branch: (p) => <svg viewBox="0 0 256 256" fill="currentColor" {...p}><path d="M213.27,32.51a8,8,0,0,0-9-1.41C200.5,33,168.55,48,138.66,48a161.43,161.43,0,0,1-44.84-7.08,170.31,170.31,0,0,0-47.46-7.5C25,33.42,15.69,46.71,13.8,55.29a8,8,0,0,0,7.81,9.71h0a8,8,0,0,0,7.82-6.29c.91-4.16,5.49-10.71,17.42-10.71a155.07,155.07,0,0,1,43.13,6.87A177.96,177.96,0,0,0,138.66,64c34.66,0,69-16.18,79.51-21.69a8,8,0,0,0,4.33-9.06Z"/></svg>,
  reset: (p) => <svg viewBox="0 0 256 256" fill="currentColor" {...p}><path d="M232,128A104,104,0,0,1,57.36,206.39a8,8,0,1,1,11.31-11.31A88,88,0,1,0,42.42,108.24a3.07,3.07,0,0,1-.12.43L33.83,140l27.66-7.41a8,8,0,0,1,4.14,15.45L20.51,160a8,8,0,0,1-9.79-5.66L0,108.62a8,8,0,1,1,15.45-4.14l6.32,23.59a104.07,104.07,0,0,1,210.23,0Z"/></svg>,
  check: (p) => <svg viewBox="0 0 256 256" fill="currentColor" {...p}><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,1,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34Z"/></svg>,
  pin: (p) => <svg viewBox="0 0 256 256" fill="currentColor" {...p}><path d="M236.24,100.24a16,16,0,0,1-22.63,0L200,86.63,158.31,128.31l4,52.43a8,8,0,0,1-2.31,6.35l-14.06,14.06a8,8,0,0,1-11.31,0L98.74,165.27l-43.45,43.45a8,8,0,0,1-11.31-11.32l43.45-43.45L51.55,118.07a8,8,0,0,1,0-11.31l14.06-14.06a8,8,0,0,1,6.35-2.31l52.43,4L165.69,52,152.07,38.39a16,16,0,0,1,0-22.63h0a16,16,0,0,1,22.63,0l61.54,61.85A16,16,0,0,1,236.24,100.24Z"/></svg>,
  bell2: (p) => <svg viewBox="0 0 256 256" fill="currentColor" {...p}><path d="M236.8,188.09,149.35,36.22a24,24,0,0,0-41.6,0L19.2,188.09a24,24,0,0,0,20.8,36H216A24,24,0,0,0,236.8,188.09Z"/></svg>,
  star: (p) => <svg viewBox="0 0 256 256" fill="currentColor" {...p}><path d="M239.2,97.29a16,16,0,0,0-13.81-11L166,81.17,142.72,25.81h0a15.95,15.95,0,0,0-29.44,0L90.07,81.17,30.61,86.32a16,16,0,0,0-9.11,28.06L67.11,158l-13.94,59.69a16,16,0,0,0,23.84,17.34L128,205l51,30.07A16,16,0,0,0,202.83,217.6L188.89,158l45.61-43.62A16,16,0,0,0,239.2,97.29Z"/></svg>,
  waves: (p) => <svg viewBox="0 0 256 256" fill="currentColor" {...p}><path d="M248,64a8,8,0,0,1-8,8c-22.49,0-34.92,6.6-43,13.51A8.27,8.27,0,0,1,191.36,87C181.49,95.66,168.65,104,144,104s-37.49-8.34-47.36-15-23-13-44.64-13a8,8,0,0,1,0-16c25.74,0,40.85,8.34,52.36,15a8.13,8.13,0,0,1,1.36,1c9.87,6.69,17.77,15,38.64,15s28.77-8.34,38.64-15A8.27,8.27,0,0,1,184.36,75c10.13-7,22.56-11,55.64-11A8,8,0,0,1,248,64Z"/></svg>,
};

// ---- Token model: structured registry, grouped by category ----
const DEFAULT_TOKENS = {
  color: [
    { key: "color-primary", label: "Primary", value: "#1C6E8C", affects: ["Buttons (filled)", "Links", "Header active state", "Form focus ring"] },
    { key: "color-secondary", label: "Secondary", value: "#C97D3F", affects: ["Buttons (secondary)", "Badges", "Card CTA accents"] },
    { key: "color-dark-bg", label: "Dark section background", value: "#0B2B3C", affects: ["Hero overlay", "Footer", "Nav background"] },
    { key: "color-light-bg", label: "Light section background", value: "#F5F1E8", affects: ["Body background", "Card surfaces"] },
    { key: "color-text", label: "Body text", value: "#3D4A4F", affects: ["Paragraph text", "Labels"] },
  ],
  typography: [
    { key: "font-display", label: "Display font", value: "Archivo", affects: ["H1–H3", "Eyebrows", "Button labels"] },
    { key: "font-body", label: "Body font", value: "Inter", affects: ["Paragraphs", "Form inputs", "Nav labels"] },
    { key: "font-size-h1", label: "H1 size", value: "44px", affects: ["Hero headline"] },
  ],
  spacing: [
    { key: "space-section", label: "Section padding", value: "64px", affects: ["Vertical rhythm between full-bleed sections"] },
    { key: "space-card-gap", label: "Card grid gap", value: "20px", affects: ["Card grids", "Offer carousels"] },
  ],
  radius: [
    { key: "radius-button", label: "Button radius", value: "6px", affects: ["All button variants"] },
    { key: "radius-card", label: "Card radius", value: "8px", affects: ["Cards", "Panels", "Form fields"] },
  ],
};

const CATEGORY_LABEL = { color: "Color", typography: "Typography", spacing: "Spacing", radius: "Corner radius" };

function flattenTokens(tokenState) {
  const out = {};
  Object.values(tokenState).forEach((list) => list.forEach((t) => { out[t.key] = t.value; }));
  return out;
}

function ColorSwatchInput({ token, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 4px", borderBottom: "1px solid #F0EBDD" }}>
      <label style={{ position: "relative", width: 30, height: 30, borderRadius: 6, border: "1.5px solid #E8DCC4", overflow: "hidden", flex: "none", cursor: "pointer" }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(token.key, e.target.value)}
          style={{ position: "absolute", inset: -4, width: 40, height: 40, border: "none", cursor: "pointer" }}
        />
      </label>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0B2B3C" }}>{token.label}</div>
        <div style={{ fontSize: 11, color: "#6B7780" }}>{token.affects.length} component{token.affects.length !== 1 ? "s" : ""} affected</div>
      </div>
      <input
        value={value}
        onChange={(e) => onChange(token.key, e.target.value)}
        style={{ width: 80, fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, padding: "5px 7px", border: "1px solid #E8DCC4", borderRadius: 4, color: "#3D4A4F" }}
      />
    </div>
  );
}

function TextTokenInput({ token, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 4px", borderBottom: "1px solid #F0EBDD" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0B2B3C" }}>{token.label}</div>
        <div style={{ fontSize: 11, color: "#6B7780" }}>{token.affects.length} component{token.affects.length !== 1 ? "s" : ""} affected</div>
      </div>
      <input
        value={value}
        onChange={(e) => onChange(token.key, e.target.value)}
        style={{ width: 120, fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, padding: "5px 7px", border: "1px solid #E8DCC4", borderRadius: 4, color: "#3D4A4F" }}
      />
    </div>
  );
}

function btn(variant, extra) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "Inter, sans-serif",
    fontWeight: 600, fontSize: 13, padding: "9px 16px", borderRadius: 6, border: "1.5px solid transparent",
    cursor: "pointer", whiteSpace: "nowrap",
  };
  const variants = {
    "filled-primary": { background: "var(--p)", color: "#fff" },
    "filled-secondary": { background: "var(--s)", color: "#fff" },
    outlined: { background: "transparent", borderColor: "#E8DCC4", color: "#3D4A4F" },
    "outlined-white": { background: "transparent", borderColor: "rgba(255,255,255,0.5)", color: "#fff" },
    text: { background: "transparent", color: "var(--p)", padding: "9px 4px" },
  };
  return { ...base, ...variants[variant], ...extra };
}

export default function BrandTokenManager() {
  const [tokens, setTokens] = useState(DEFAULT_TOKENS);
  const [original] = useState(DEFAULT_TOKENS);
  const [activeCategory, setActiveCategory] = useState("color");
  const [previewTheme, setPreviewTheme] = useState("light");
  const [showDiff, setShowDiff] = useState(false);
  const [prOpen, setPrOpen] = useState(false);

  const flat = useMemo(() => flattenTokens(tokens), [tokens]);
  const originalFlat = useMemo(() => flattenTokens(original), [original]);

  const changedTokens = useMemo(() => {
    const changes = [];
    Object.keys(flat).forEach((key) => {
      if (flat[key] !== originalFlat[key]) {
        const def = Object.values(tokens).flat().find((t) => t.key === key);
        changes.push({ key, from: originalFlat[key], to: flat[key], label: def?.label, affects: def?.affects || [] });
      }
    });
    return changes;
  }, [flat, originalFlat, tokens]);

  function updateToken(key, value) {
    setTokens((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((cat) => {
        next[cat] = next[cat].map((t) => (t.key === key ? { ...t, value } : t));
      });
      return next;
    });
  }

  function resetAll() {
    setTokens(original);
  }

  const previewVars = {
    "--p": flat["color-primary"],
    "--s": flat["color-secondary"],
    "--darkbg": flat["color-dark-bg"],
    "--lightbg": flat["color-light-bg"],
    "--text": flat["color-text"],
    "--radius-btn": flat["radius-button"],
    "--radius-card": flat["radius-card"],
    "--font-display": flat["font-display"] + ", sans-serif",
    "--font-body": flat["font-body"] + ", sans-serif",
    "--h1size": flat["font-size-h1"],
    "--gap": flat["space-card-gap"],
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: "#F5F1E8", color: "#3D4A4F", height: "100vh", display: "flex", flexDirection: "column", fontSize: 14 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 9px; height: 9px; }
        ::-webkit-scrollbar-thumb { background: #E8DCC4; border-radius: 6px; }
        input[type=color]::-webkit-color-swatch-wrapper { padding: 0; }
        input[type=color]::-webkit-color-swatch { border: none; border-radius: 0; }
      `}</style>

      {/* TOP BAR */}
      <header style={{ background: "#0B2B3C", color: "#F5F1E8", display: "flex", alignItems: "center", padding: "0 20px", height: 56, gap: 16, borderBottom: "1px solid #1F4A5E", flex: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 16, paddingRight: 16, borderRight: "1px solid #1F4A5E" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E0A165" strokeWidth="2" strokeLinecap="round"><path d="M3 18l5-9 4 6 3-5 6 8" /></svg>
          Trailhead
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#AFC4CC" }}>
          <Icon.globe style={{ width: 14, height: 14 }} />
          <strong style={{ color: "#F5F1E8" }}>lake-powell</strong>
          <span>· Brand tokens</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#11384B", border: "1px solid #1F4A5E", borderRadius: 5, padding: "6px 10px", width: 220 }}>
          <Icon.search style={{ width: 14, height: 14, color: "#AFC4CC" }} />
          <input placeholder="Search tokens…" style={{ background: "none", border: "none", outline: "none", color: "#F5F1E8", fontSize: 13, width: "100%", fontFamily: "Inter, sans-serif" }} />
        </div>
        <button style={{ width: 32, height: 32, borderRadius: 5, background: "none", border: "none", color: "#AFC4CC", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon.bell style={{ width: 17, height: 17 }} />
        </button>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#C97D3F", color: "#0B2B3C", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 12 }}>JD</div>
      </header>

      {/* PAGE HEAD */}
      <div style={{ padding: "20px 28px 0", flex: "none" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, marginBottom: 18 }}>
          <div>
            <span style={{ fontFamily: "Archivo, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1C6E8C", display: "block", marginBottom: 6 }}>
              Brand &amp; Theme
            </span>
            <h1 style={{ fontFamily: "Archivo, sans-serif", fontSize: 23, fontWeight: 700, color: "#0B2B3C", margin: "0 0 4px", letterSpacing: "-0.01em" }}>
              Brand tokens — lake-powell
            </h1>
            <p style={{ margin: 0, color: "#6B7780", fontSize: 13.5, maxWidth: 580 }}>
              Edit controlled tokens and preview the effect on real components before opening a PR to staging.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flex: "none" }}>
            <button style={btn("outlined")} onClick={resetAll}>
              <Icon.reset style={{ width: 14, height: 14 }} /> Reset all
            </button>
            <button
              style={{ ...btn(changedTokens.length ? "filled-secondary" : "outlined"), "--s": "#C97D3F", opacity: changedTokens.length ? 1 : 0.5, cursor: changedTokens.length ? "pointer" : "default" }}
              onClick={() => changedTokens.length && setShowDiff(true)}
            >
              <Icon.branch style={{ width: 14, height: 14 }} /> Request release to staging {changedTokens.length > 0 && `(${changedTokens.length})`}
            </button>
          </div>
        </div>

        {/* category tabs */}
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #E8DCC4" }}>
          {Object.keys(CATEGORY_LABEL).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, padding: "10px 16px",
                background: "none", border: "none", cursor: "pointer",
                color: activeCategory === cat ? "#0B2B3C" : "#6B7780",
                borderBottom: activeCategory === cat ? "2.5px solid #1C6E8C" : "2.5px solid transparent",
                marginBottom: -1,
              }}
            >
              {CATEGORY_LABEL[cat]} <span style={{ color: "#AFB8BC", fontWeight: 500 }}>({tokens[cat].length})</span>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN: token list + live preview */}
      <div style={{ flex: 1, overflow: "hidden", display: "grid", gridTemplateColumns: "340px 1fr", gap: 0 }}>

        {/* TOKEN LIST */}
        <div style={{ overflowY: "auto", padding: "16px 20px", borderRight: "1px solid #E8DCC4" }}>
          {tokens[activeCategory].map((t) =>
            activeCategory === "color" ? (
              <ColorSwatchInput key={t.key} token={t} value={t.value} onChange={updateToken} />
            ) : (
              <TextTokenInput key={t.key} token={t} value={t.value} onChange={updateToken} />
            )
          )}

          <div style={{ marginTop: 18, padding: "12px 14px", background: "#fff", border: "1px solid #E8DCC4", borderRadius: 8 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#1C6E8C", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
              What's affected
            </div>
            <div style={{ fontSize: 12, color: "#6B7780", lineHeight: 1.6 }}>
              {Array.from(new Set(tokens[activeCategory].flatMap((t) => t.affects))).map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 3 }}>
                  <span style={{ color: "#C97D3F" }}>•</span>{a}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LIVE PREVIEW SANDBOX */}
        <div style={{ overflowY: "auto", background: "#EFE9DA" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 22px", background: "#fff", borderBottom: "1px solid #E8DCC4", position: "sticky", top: 0, zIndex: 5 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0B2B3C" }}>Live preview · updates as you edit</div>
            <div style={{ display: "flex", gap: 2, background: "#F5F1E8", borderRadius: 5, padding: 3 }}>
              {["light", "dark"].map((th) => (
                <button
                  key={th}
                  onClick={() => setPreviewTheme(th)}
                  style={{
                    fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 4, border: "none", cursor: "pointer",
                    background: previewTheme === th ? "#0B2B3C" : "transparent",
                    color: previewTheme === th ? "#fff" : "#6B7780",
                    textTransform: "capitalize",
                  }}
                >
                  {th}
                </button>
              ))}
            </div>
          </div>

          <div style={{ ...previewVars, padding: 24 }}>
            <PreviewSandbox theme={previewTheme} />
          </div>
        </div>
      </div>

      {/* DIFF / PR MODAL */}
      {showDiff && (
        <DiffModal
          changes={changedTokens}
          onClose={() => setShowDiff(false)}
          onCreatePR={() => { setShowDiff(false); setPrOpen(true); }}
        />
      )}
      {prOpen && <PRToast onDismiss={() => setPrOpen(false)} count={changedTokens.length} />}
    </div>
  );
}

// ---- The actual preview components, styled entirely from CSS custom properties set above ----
function PreviewSandbox({ theme }) {
  const dark = theme === "dark";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, fontFamily: "var(--font-body)" }}>

      {/* Hero */}
      <div style={{
        background: dark ? "var(--darkbg)" : "linear-gradient(135deg, var(--darkbg), #163F54)",
        borderRadius: "var(--radius-card)", padding: "40px 32px", color: "#fff", position: "relative", overflow: "hidden",
      }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--s)", marginBottom: 10 }}>
          Special offer
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--h1size)", lineHeight: 1.08, marginBottom: 10, maxWidth: 480 }}>
          Save 15% on houseboats — plus fuel credits
        </div>
        <p style={{ maxWidth: 420, color: "#D7E3E8", fontSize: 13.5, marginBottom: 18 }}>
          Make this year unforgettable on the water. Book a Lake Powell houseboat and enjoy fuel credits to take you farther.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={btn("filled-primary")}>Book now</button>
          <button style={btn("outlined-white")}>Learn more</button>
        </div>
      </div>

      {/* Card grid */}
      <div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0B2B3C", marginBottom: 10 }}>Card grid</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--gap)" }}>
          {[
            { tag: "Stay", title: "Houseboating" },
            { tag: "Activities", title: "Water sports" },
            { tag: "Stay", title: "RV & camping" },
          ].map((c, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: "var(--radius-card)", overflow: "hidden", border: "1px solid #E8DCC4" }}>
              <div style={{ height: 90, background: `linear-gradient(135deg, var(--p), var(--darkbg))` }} />
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--s)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{c.tag}</div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0B2B3C", marginBottom: 10 }}>{c.title}</div>
                <button style={{ ...btn("filled-primary"), padding: "6px 12px", fontSize: 12 }}>{c.title}</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buttons row */}
      <div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0B2B3C", marginBottom: 10 }}>Buttons</div>
        <div style={{ background: "#fff", border: "1px solid #E8DCC4", borderRadius: "var(--radius-card)", padding: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={btn("filled-primary")}>Filled primary</button>
          <button style={btn("filled-secondary")}>Filled secondary</button>
          <button style={btn("outlined")}>Outlined</button>
          <button style={btn("text")}>Text only</button>
        </div>
      </div>

      {/* Form + alert */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#fff", border: "1px solid #E8DCC4", borderRadius: "var(--radius-card)", padding: 16 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "#0B2B3C", marginBottom: 10 }}>Form field</div>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text)", display: "block", marginBottom: 5 }}>Email address</label>
          <input
            placeholder="you@example.com"
            style={{ width: "100%", padding: "9px 11px", borderRadius: 5, border: "1.5px solid #E8DCC4", fontSize: 13, outline: "none" }}
            onFocus={(e) => (e.target.style.borderColor = "var(--p)")}
            onBlur={(e) => (e.target.style.borderColor = "#E8DCC4")}
          />
        </div>
        <div style={{ background: "color-mix(in srgb, var(--s) 12%, white)", border: "1.5px solid var(--s)", borderRadius: "var(--radius-card)", padding: 16, display: "flex", gap: 10 }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--s)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <svg width="12" height="12" viewBox="0 0 256 256" fill="currentColor"><path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Z" /></svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 12.5, color: "#0B2B3C", marginBottom: 2 }}>Alert / banner</div>
            <div style={{ fontSize: 12, color: "#6B7780" }}>This is how a notice banner reads with secondary color applied.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiffModal({ changes, onClose, onCreatePR }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(11,43,60,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div style={{ background: "#fff", borderRadius: 10, width: 560, maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 12px 40px rgba(11,43,60,0.3)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E8DCC4" }}>
          <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 16, color: "#0B2B3C" }}>Request release to staging</div>
          <div style={{ fontSize: 12.5, color: "#6B7780", marginTop: 2 }}>{changes.length} token{changes.length !== 1 ? "s" : ""} changed · review before sending to <strong>staging</strong></div>
        </div>
        <div style={{ overflowY: "auto", padding: "8px 20px" }}>
          {changes.map((c) => (
            <div key={c.key} style={{ padding: "12px 0", borderBottom: "1px solid #F0EBDD" }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0B2B3C", marginBottom: 6 }}>{c.label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                <span style={{ background: "#FAE7E4", color: "#B0473D", padding: "3px 8px", borderRadius: 4, textDecoration: "line-through" }}>{c.from}</span>
                <svg width="12" height="12" viewBox="0 0 256 256" fill="#6B7780"><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z" /></svg>
                <span style={{ background: "#E7F2EA", color: "#3F8F5F", padding: "3px 8px", borderRadius: 4 }}>{c.to}</span>
              </div>
              <div style={{ fontSize: 11.5, color: "#6B7780", marginTop: 6 }}>
                Affects: {c.affects.join(", ")}
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "14px 20px", borderTop: "1px solid #E8DCC4", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button style={btn("outlined")} onClick={onClose}>Cancel</button>
          <button style={{ ...btn("filled-primary"), "--p": "#1C6E8C" }} onClick={onCreatePR}>
            <Icon.branch style={{ width: 14, height: 14 }} /> Confirm release request
          </button>
        </div>
      </div>
    </div>
  );
}

function PRToast({ onDismiss, count }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, background: "#0B2B3C", color: "#fff", borderRadius: 8, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 8px 24px rgba(11,43,60,0.35)", zIndex: 60, maxWidth: 360 }}>
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#3F8F5F", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
        <Icon.check style={{ width: 16, height: 16, color: "#fff" }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>Release requested</div>
        <div style={{ fontSize: 12, color: "#AFC4CC" }}>{count} token change{count !== 1 ? "s" : ""} · awaiting review on staging</div>
      </div>
      <button onClick={onDismiss} style={{ background: "none", border: "none", color: "#AFC4CC", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
    </div>
  );
}
