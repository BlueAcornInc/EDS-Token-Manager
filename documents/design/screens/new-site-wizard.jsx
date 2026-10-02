import React, { useState, useMemo } from "react";

// ============================================================
// TRAILHEAD — New Site wizard (Site Creation / Promotion Automation)
// Spins up a new site on the shared repoless Helix 5 instance.
// Lets the user start from an existing site as a template — the
// highest-leverage option at 30+ sites — or from a blank config.
// Ends in a review step showing exactly what gets created before
// committing, mirroring the diff-before-commit pattern used in
// Brand Tokens and Icon Manager.
// ============================================================

const Icon = {
  search: (p) => <svg viewBox="0 0 256 256" fill="currentColor" {...p}><path d="M229.66,218.34,179.6,168.28a88.21,88.21,0,1,0-11.32,11.32l50.06,50.06a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"/></svg>,
  bell: (p) => <svg viewBox="0 0 256 256" fill="currentColor" {...p}><path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216Z"/></svg>,
  check: (p) => <svg viewBox="0 0 256 256" fill="currentColor" {...p}><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,1,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34Z"/></svg>,
  checkCircle: (p) => <svg viewBox="0 0 256 256" fill="currentColor" {...p}><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,1,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34Z" opacity="0.001"/><circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" strokeWidth="14"/><path d="M88,132l24,24,56-56" fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  globe: (p) => <svg viewBox="0 0 256 256" fill="currentColor" {...p}><path d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132,83.41,134.4a8,8,0,0,0,9.18,0C136,236,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,56a32,32,0,1,1-32,32A32,32,0,0,1,128,72Z"/></svg>,
  branch: (p) => <svg viewBox="0 0 256 256" fill="currentColor" {...p}><path d="M213.27,32.51a8,8,0,0,0-9-1.41C200.5,33,168.55,48,138.66,48a161.43,161.43,0,0,1-44.84-7.08,170.31,170.31,0,0,0-47.46-7.5C25,33.42,15.69,46.71,13.8,55.29a8,8,0,0,0,7.81,9.71h0a8,8,0,0,0,7.82-6.29c.91-4.16,5.49-10.71,17.42-10.71a155.07,155.07,0,0,1,43.13,6.87A177.96,177.96,0,0,0,138.66,64c34.66,0,69-16.18,79.51-21.69a8,8,0,0,0,4.33-9.06Z"/></svg>,
  blocks: (p) => <svg viewBox="0 0 256 256" fill="currentColor" {...p}><path d="M236.8,168.64l-31.95-19.69,31.95-19.68a8,8,0,0,0,0-13.62L130.34,52.36a8,8,0,0,0-8.67,0L15.2,115.65a8,8,0,0,0,0,13.62l31.95,19.68L15.2,168.64a8,8,0,0,0,0,13.61L121.67,247a8,8,0,0,0,8.67,0L236.8,182.25A8,8,0,0,0,236.8,168.64Z"/></svg>,
  tag: (p) => <svg viewBox="0 0 256 256" fill="currentColor" {...p}><path d="M243.31,136,144,36.69A15.86,15.86,0,0,0,132.69,32H40a8,8,0,0,0-8,8v92.69A15.86,15.86,0,0,0,36.69,144L136,243.31a16,16,0,0,0,22.63,0l84.68-84.68A16,16,0,0,0,243.31,136ZM92,108a16,16,0,1,1,16-16A16,16,0,0,1,92,108Z"/></svg>,
  file: (p) => <svg viewBox="0 0 256 256" fill="currentColor" {...p}><path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34Z"/></svg>,
  users: (p) => <svg viewBox="0 0 256 256" fill="currentColor" {...p}><path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,1,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM44,109a44,44,0,1,1,44,44A44.05,44.05,0,0,1,44,109Z"/></svg>,
  redirect: (p) => <svg viewBox="0 0 256 256" fill="currentColor" {...p}><path d="M137.54,186.85l-9.94,9.95a45.25,45.25,0,0,1-64,0,45.31,45.31,0,0,1,0-64l9.95-9.94a8,8,0,0,0-11.31-11.32l-9.95,10A61.26,61.26,0,0,0,138,207.8l9.94-9.95a8,8,0,1,0-11.31-11.31Z"/></svg>,
  rocket: (p) => <svg viewBox="0 0 256 256" fill="currentColor" {...p}><path d="M152,224a8,8,0,0,1-8,8H112a8,8,0,0,1,0-16h32A8,8,0,0,1,152,224ZM221.66,68.34a85.4,85.4,0,0,0-71.62-23.94c-22.32,2.45-43.63,13.66-61.65,32.42L73.55,92.4,32,86.63a8,8,0,0,0-7.51,3.85L8.84,118.21a8,8,0,0,0,1.41,9.69l24,24a8,8,0,0,0,9.69,1.41l27.73-15.65,15.59,15.59L71.62,181a8,8,0,0,0,1.41,9.69l24,24a8,8,0,0,0,9.69,1.41l27.73-15.66,4.39-4.39c18.76-18,30-39.33,32.42-61.65A85.4,85.4,0,0,0,221.66,68.34Z"/></svg>,
  chevronRight: (p) => <svg viewBox="0 0 256 256" fill="currentColor" {...p}><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/></svg>,
  copy: (p) => <svg viewBox="0 0 256 256" fill="currentColor" {...p}><path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32Z"/></svg>,
};

const STEPS = ["Start", "Basics", "Brand & domain", "Content & access", "Review"];

const EXISTING_SITES = [
  { id: "lake-powell", name: "lake-powell", group: "Parks & Destinations", domain: "lakepowell.com" },
  { id: "yellowstone-lodges", name: "yellowstone-lodges", group: "Parks & Destinations", domain: "yellowstonenationalparklodges.com" },
  { id: "denali-lodges", name: "denali-lodges", group: "Parks & Destinations", domain: "denaliparkresorts.com" },
  { id: "pnw-collegiate-dining", name: "pnw-collegiate-dining", group: "Collegiate Hospitality", domain: "pnwcollegiate.edu-dining.com" },
  { id: "ecu-dining", name: "east-central-dining", group: "Collegiate Hospitality", domain: "ecu-dining.com" },
];

const GROUPS = ["Parks & Destinations", "Collegiate Hospitality", "Shared Fragments"];
const CODEBASES = ["parks-destinations-eds (GitHub)", "collegiate-hospitality-eds (GitHub)"];
const LOCALES = ["en-US", "en-CA", "es-US", "fr-CA"];

function btn(variant) {
  const base = { display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 13, padding: "9px 16px", borderRadius: 6, border: "1.5px solid transparent", cursor: "pointer", whiteSpace: "nowrap" };
  if (variant === "outlined") return { ...base, background: "transparent", borderColor: "#E8DCC4", color: "#3D4A4F" };
  if (variant === "filled-secondary") return { ...base, background: "#C97D3F", color: "#fff" };
  if (variant === "filled-primary") return { ...base, background: "#1C6E8C", color: "#fff" };
  if (variant === "disabled") return { ...base, background: "#EFEAE0", color: "#AFB8BC", cursor: "default" };
  return base;
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#0B2B3C", display: "block", marginBottom: 5 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: "#6B7780", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

const inputStyle = { width: "100%", padding: "9px 11px", borderRadius: 5, border: "1.5px solid #E8DCC4", fontSize: 13, color: "#3D4A4F", fontFamily: "Inter, sans-serif" };
const selectStyle = { ...inputStyle, background: "#fff" };

export default function NewSiteWizard() {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState(null); // "template" | "blank"
  const [templateSite, setTemplateSite] = useState(null);

  const [form, setForm] = useState({
    siteName: "",
    group: GROUPS[0],
    codebase: CODEBASES[0],
    domain: "",
    locale: LOCALES[0],
    aemRoot: "",
    brandPreset: "inherit",
    authors: "",
    redirectStrategy: "inherit",
    metadataDefaults: true,
    sitemapEnabled: true,
    robotsIndexable: false,
    launchChecklist: true,
  });

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const canAdvance = useMemo(() => {
    if (step === 0) return mode === "blank" || (mode === "template" && templateSite);
    if (step === 1) return form.siteName.trim().length > 0 && form.domain.trim().length > 0;
    return true;
  }, [step, mode, templateSite, form.siteName, form.domain]);

  function next() { if (step < STEPS.length - 1) setStep(step + 1); }
  function back() { if (step > 0) setStep(step - 1); }

  const templateSiteObj = EXISTING_SITES.find((s) => s.id === templateSite);

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: "#F5F1E8", color: "#3D4A4F", height: "100vh", display: "flex", flexDirection: "column", fontSize: 14 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 9px; height: 9px; }
        ::-webkit-scrollbar-thumb { background: #E8DCC4; border-radius: 6px; }
      `}</style>

      {/* TOP BAR */}
      <header style={{ background: "#0B2B3C", color: "#F5F1E8", display: "flex", alignItems: "center", padding: "0 20px", height: 56, gap: 16, borderBottom: "1px solid #1F4A5E", flex: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 16, paddingRight: 16, borderRight: "1px solid #1F4A5E" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E0A165" strokeWidth="2" strokeLinecap="round"><path d="M3 18l5-9 4 6 3-5 6 8" /></svg>
          Trailhead
        </div>
        <div style={{ fontSize: 13, color: "#AFC4CC" }}>Site Factory · <strong style={{ color: "#F5F1E8" }}>New site</strong></div>
        <div style={{ flex: 1 }} />
        <button style={{ width: 32, height: 32, borderRadius: 5, background: "none", border: "none", color: "#AFC4CC", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon.bell style={{ width: 17, height: 17 }} />
        </button>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#C97D3F", color: "#0B2B3C", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 12 }}>JD</div>
      </header>

      {/* STEP RAIL */}
      <div style={{ padding: "18px 28px 0", flex: "none" }}>
        <span style={{ fontFamily: "Archivo, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1C6E8C", display: "block", marginBottom: 6 }}>
          Site Creation
        </span>
        <h1 style={{ fontFamily: "Archivo, sans-serif", fontSize: 23, fontWeight: 700, color: "#0B2B3C", margin: "0 0 16px", letterSpacing: "-0.01em" }}>
          Create a new site
        </h1>

        <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11.5, fontWeight: 700, flex: "none",
                  background: i < step ? "#1C6E8C" : i === step ? "#0B2B3C" : "#E8DCC4",
                  color: i <= step ? "#fff" : "#6B7780",
                }}>
                  {i < step ? <Icon.check style={{ width: 12, height: 12 }} /> : i + 1}
                </div>
                <span style={{ fontSize: 12.5, fontWeight: i === step ? 700 : 500, color: i === step ? "#0B2B3C" : "#6B7780" }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: "#E8DCC4", margin: "0 12px" }} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px 0" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>

          {/* STEP 0: Start mode */}
          {step === 0 && (
            <div>
              <p style={{ color: "#6B7780", fontSize: 13.5, marginTop: 0, marginBottom: 18 }}>
                Start from an existing site to inherit its brand, blocks, and config — recommended for most new
                properties — or start blank for something fully custom.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <button onClick={() => setMode("template")} style={{
                  textAlign: "left", padding: 16, borderRadius: 8, cursor: "pointer",
                  border: mode === "template" ? "1.5px solid #1C6E8C" : "1.5px solid #E8DCC4",
                  background: mode === "template" ? "#E3EEF1" : "#fff",
                }}>
                  <Icon.copy style={{ width: 20, height: 20, color: "#1C6E8C", marginBottom: 8 }} />
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: "#0B2B3C", marginBottom: 3 }}>Clone an existing site</div>
                  <div style={{ fontSize: 12, color: "#6B7780" }}>Inherit brand tokens, icon set, blocks, and redirect strategy. Recommended.</div>
                </button>
                <button onClick={() => setMode("blank")} style={{
                  textAlign: "left", padding: 16, borderRadius: 8, cursor: "pointer",
                  border: mode === "blank" ? "1.5px solid #1C6E8C" : "1.5px solid #E8DCC4",
                  background: mode === "blank" ? "#E3EEF1" : "#fff",
                }}>
                  <Icon.file style={{ width: 20, height: 20, color: "#1C6E8C", marginBottom: 8 }} />
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: "#0B2B3C", marginBottom: 3 }}>Start blank</div>
                  <div style={{ fontSize: 12, color: "#6B7780" }}>Base brand only, no inherited content or block config.</div>
                </button>
              </div>

              {mode === "template" && (
                <div style={{ background: "#fff", border: "1px solid #E8DCC4", borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0B2B3C", marginBottom: 10 }}>Choose a site to clone from</div>
                  {EXISTING_SITES.map((s) => (
                    <label key={s.id} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "9px 8px", borderRadius: 6, cursor: "pointer",
                      background: templateSite === s.id ? "#F5F1E8" : "transparent",
                    }}>
                      <input type="radio" name="template" checked={templateSite === s.id} onChange={() => setTemplateSite(s.id)} />
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: "#0B2B3C", display: "flex", alignItems: "center", justifyContent: "center", color: "#E0A165", flex: "none" }}>
                        <Icon.globe style={{ width: 13, height: 13 }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0B2B3C" }}>{s.name}</div>
                        <div style={{ fontSize: 11.5, color: "#6B7780" }}>{s.domain} · {s.group}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 1: Basics */}
          {step === 1 && (
            <div>
              {mode === "template" && templateSiteObj && (
                <div style={{ background: "#E3EEF1", border: "1px solid #BFD8E0", borderRadius: 6, padding: "9px 12px", fontSize: 12.5, color: "#0B2B3C", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon.copy style={{ width: 14, height: 14, color: "#1C6E8C" }} />
                  Cloning configuration from <strong>{templateSiteObj.name}</strong>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Site name" hint="Lowercase, hyphenated — becomes the internal identifier">
                  <input style={inputStyle} placeholder="e.g. arches-resort" value={form.siteName} onChange={(e) => update("siteName", e.target.value)} />
                </Field>
                <Field label="Primary domain">
                  <input style={inputStyle} placeholder="e.g. archesresort.com" value={form.domain} onChange={(e) => update("domain", e.target.value)} />
                </Field>
                <Field label="Group">
                  <select style={selectStyle} value={form.group} onChange={(e) => update("group", e.target.value)}>
                    {GROUPS.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </Field>
                <Field label="GitHub codebase" hint="Which shared repo this site's code lives in">
                  <select style={selectStyle} value={form.codebase} onChange={(e) => update("codebase", e.target.value)}>
                    {CODEBASES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Default locale">
                  <select style={selectStyle} value={form.locale} onChange={(e) => update("locale", e.target.value)}>
                    {LOCALES.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </Field>
                <Field label="AEM content root" hint="Source content path for this site">
                  <input style={inputStyle} placeholder="/content/parks-destinations/arches-resort" value={form.aemRoot} onChange={(e) => update("aemRoot", e.target.value)} />
                </Field>
              </div>
            </div>
          )}

          {/* STEP 2: Brand & domain */}
          {step === 2 && (
            <div>
              <Field label="Brand starting point">
                <div style={{ display: "flex", gap: 10 }}>
                  {[
                    { v: "inherit", l: mode === "template" ? `Inherit from ${templateSiteObj?.name || "template"}` : "Inherit group default" },
                    { v: "base", l: "Base brand (neutral)" },
                    { v: "custom", l: "Start custom" },
                  ].map((opt) => (
                    <label key={opt.v} style={{
                      flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 6, cursor: "pointer",
                      border: form.brandPreset === opt.v ? "1.5px solid #1C6E8C" : "1.5px solid #E8DCC4",
                      background: form.brandPreset === opt.v ? "#E3EEF1" : "#fff", fontSize: 12.5,
                    }}>
                      <input type="radio" checked={form.brandPreset === opt.v} onChange={() => update("brandPreset", opt.v)} />
                      {opt.l}
                    </label>
                  ))}
                </div>
              </Field>
              <div style={{ fontSize: 12, color: "#6B7780", marginBottom: 18, marginTop: -6 }}>
                You can fine-tune individual tokens in Brand Tokens after the site is created.
              </div>

              <Field label="Redirect strategy">
                <select style={selectStyle} value={form.redirectStrategy} onChange={(e) => update("redirectStrategy", e.target.value)}>
                  <option value="inherit">Inherit group redirect rules</option>
                  <option value="none">No redirects at launch</option>
                  <option value="custom">Configure later in Redirects</option>
                </select>
              </Field>

              <Field label="Sitemap & indexing">
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 8 }}>
                  <input type="checkbox" checked={form.sitemapEnabled} onChange={(e) => update("sitemapEnabled", e.target.checked)} />
                  Generate sitemap.xml automatically
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <input type="checkbox" checked={form.robotsIndexable} onChange={(e) => update("robotsIndexable", e.target.checked)} />
                  Allow search engine indexing immediately
                </label>
                <div style={{ fontSize: 11.5, color: "#C97D3F", marginTop: 6 }}>
                  Most new sites stay non-indexable until launch review passes — leave unchecked unless you're sure.
                </div>
              </Field>
            </div>
          )}

          {/* STEP 3: Content & access */}
          {step === 3 && (
            <div>
              <Field label="Initial authors / groups" hint="Comma-separated emails or AEM group names">
                <input style={inputStyle} placeholder="jane@aramark.com, content-team-parks" value={form.authors} onChange={(e) => update("authors", e.target.value)} />
              </Field>

              <Field label="Starter content">
                <div style={{ background: "#fff", border: "1px solid #E8DCC4", borderRadius: 8, padding: 14, fontSize: 12.5, color: "#3D4A4F" }}>
                  {mode === "template" ? (
                    <>
                      <div style={{ display: "flex", gap: 8, marginBottom: 6 }}><Icon.blocks style={{ width: 14, height: 14, color: "#1C6E8C" }} /> Block registry copied from {templateSiteObj?.name}</div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 6 }}><Icon.tag style={{ width: 14, height: 14, color: "#1C6E8C" }} /> Approved icon set copied from {templateSiteObj?.name}</div>
                      <div style={{ display: "flex", gap: 8 }}><Icon.file style={{ width: 14, height: 14, color: "#1C6E8C" }} /> Page templates copied (home, landing, article)</div>
                    </>
                  ) : (
                    <div style={{ color: "#6B7780" }}>Starting blank — only base blocks and the default icon set will be available. You'll configure templates and content after creation.</div>
                  )}
                </div>
              </Field>

              <Field label="Launch checklist">
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <input type="checkbox" checked={form.launchChecklist} onChange={(e) => update("launchChecklist", e.target.checked)} />
                  Open a tracking issue with the standard pre-launch checklist
                </label>
              </Field>
            </div>
          )}

          {/* STEP 4: Review */}
          {step === 4 && (
            <ReviewStep form={form} mode={mode} templateSiteObj={templateSiteObj} />
          )}

        </div>
      </div>

      {/* FOOTER NAV */}
      <div style={{ flex: "none", borderTop: "1px solid #E8DCC4", background: "#fff", padding: "14px 28px", display: "flex", justifyContent: "center" }}>
        <div style={{ maxWidth: 680, width: "100%", display: "flex", justifyContent: "space-between" }}>
          <button style={step === 0 ? btn("disabled") : btn("outlined")} onClick={back} disabled={step === 0}>Back</button>
          {step < STEPS.length - 1 ? (
            <button style={canAdvance ? btn("filled-primary") : btn("disabled")} onClick={() => canAdvance && next()} disabled={!canAdvance}>
              Continue <Icon.chevronRight style={{ width: 14, height: 14 }} />
            </button>
          ) : (
            <button style={btn("filled-secondary")}>
              <Icon.rocket style={{ width: 14, height: 14 }} /> Create site
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ form, mode, templateSiteObj }) {
  const items = [
    { icon: "globe", label: "Site", value: form.siteName || "(not set)" },
    { icon: "globe", label: "Domain", value: form.domain || "(not set)" },
    { icon: "tag", label: "Group", value: form.group },
    { icon: "branch", label: "Codebase", value: form.codebase },
    { icon: "file", label: "AEM root", value: form.aemRoot || "(default for group)" },
    { icon: "tag", label: "Locale", value: form.locale },
    { icon: "blocks", label: "Brand starting point", value: form.brandPreset === "inherit" ? (mode === "template" ? `Inherited from ${templateSiteObj?.name}` : "Group default") : form.brandPreset === "base" ? "Base brand" : "Custom" },
    { icon: "redirect", label: "Redirect strategy", value: form.redirectStrategy === "inherit" ? "Inherit group rules" : form.redirectStrategy === "none" ? "None at launch" : "Configure later" },
    { icon: "users", label: "Initial authors", value: form.authors || "(none specified)" },
  ];

  return (
    <div>
      <p style={{ color: "#6B7780", fontSize: 13.5, marginTop: 0, marginBottom: 18 }}>
        Review what will be created. You can change brand tokens, icons, and redirects after the site exists —
        this just sets up the starting point.
      </p>

      <div style={{ background: "#fff", border: "1px solid #E8DCC4", borderRadius: 8, marginBottom: 16, overflow: "hidden" }}>
        {items.map((it, i) => {
          const G = Icon[it.icon];
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", borderBottom: i < items.length - 1 ? "1px solid #F0EBDD" : "none" }}>
              <G style={{ width: 14, height: 14, color: "#1C6E8C", flex: "none" }} />
              <div style={{ fontSize: 12, color: "#6B7780", width: 150, flex: "none" }}>{it.label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0B2B3C" }}>{it.value}</div>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 11.5, fontWeight: 700, color: "#1C6E8C", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
        What gets created
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 }}>
        <div style={{ background: "#fff", border: "1px solid #E8DCC4", borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0B2B3C", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon.branch style={{ width: 13, height: 13, color: "#1C6E8C" }} /> GitHub
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#3D4A4F", lineHeight: 1.7 }}>
            <li>New branch in {form.codebase.split(" ")[0]}</li>
            <li>Site config + brand token files</li>
            {mode === "template" && <li>Starter blocks, icons, templates copied</li>}
            {form.sitemapEnabled && <li>Sitemap config scaffolded</li>}
            {form.launchChecklist && <li>Launch checklist issue opened</li>}
          </ul>
        </div>
        <div style={{ background: "#fff", border: "1px solid #E8DCC4", borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0B2B3C", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon.globe style={{ width: 13, height: 13, color: "#1C6E8C" }} /> Helix 5 / AEM
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#3D4A4F", lineHeight: 1.7 }}>
            <li>Site config registered via Configuration Service API</li>
            <li>Content source mapped to {form.aemRoot || "default root"}</li>
            <li>Sidekick config for {form.domain || "domain"}</li>
            <li>Author access for: {form.authors || "none yet — add later"}</li>
          </ul>
        </div>
      </div>

      <div style={{ background: "#FBEDE0", border: "1px solid #E0A165", borderRadius: 6, padding: "10px 14px", fontSize: 12.5, color: "#0B2B3C", display: "flex", gap: 8, alignItems: "flex-start" }}>
        <span>New sites are created directly in <strong>dev</strong>. Use Promotion from the site health dashboard to push to staging and production once content is ready.</span>
      </div>
    </div>
  );
}
