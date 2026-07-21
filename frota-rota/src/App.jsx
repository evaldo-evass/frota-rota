import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Building2, Car, UserRound, FileText, Fuel, BarChart3, Users, LogOut,
  Plus, Pencil, Trash2, Menu, X, TriangleAlert, Check, Upload, Search,
  ChevronRight, ChevronDown, Paperclip, CircleCheck, CircleAlert, Shield
} from "lucide-react";
import { loadKey, saveKey } from "./storage.js";

/* ---------- design tokens ---------- */
const T = {
  bg: "#F3F4F1",
  surface: "#FFFFFF",
  surfaceSoft: "#EEF0EC",
  ink: "#17242C",
  inkSoft: "#5C6B70",
  primary: "#163C46",
  primaryDark: "#0E282F",
  accent: "#DD7A22",
  accentSoft: "#FBE7D4",
  line: "#E0E3DD",
  danger: "#B3402F",
  dangerSoft: "#F6E2DE",
  success: "#2F6E52",
  successSoft: "#DEEAE2",
  warning: "#B3860B",
  warningSoft: "#F5EAD1",
};

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');`;

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => (d ? new Date(d + "T00:00:00").toLocaleDateString("pt-PT") : "—");
const daysUntil = (d) => {
  if (!d) return null;
  const diff = (new Date(d + "T00:00:00") - new Date(new Date().toDateString())) / 86400000;
  return Math.round(diff);
};
const fileToDataUrl = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

const ROLE_LABEL = { leitura: "Leitura", lancamento: "Lançamento", admin: "Administrador" };
const ROLE_DESC = {
  leitura: "Pode consultar todos os dados, sem editar.",
  lancamento: "Pode consultar e lançar/editar dados.",
  admin: "Acesso total, incluindo gestão de utilizadores.",
};

/* ================= APP ================= */
export default function App() {
  const [ready, setReady] = useState(false);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [pos, setPos] = useState([]);
  const [fuel, setFuel] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const [u, c, v, d, p, f] = await Promise.all([
        loadKey("users", []),
        loadKey("companies", []),
        loadKey("vehicles", []),
        loadKey("drivers", []),
        loadKey("pos", []),
        loadKey("fuel", []),
      ]);
      let finalUsers = u;
      if (!u || u.length === 0) {
        finalUsers = [{ id: uid(), username: "admin", password: "admin123", name: "Administrador", role: "admin" }];
        await saveKey("users", finalUsers);
      }
      setUsers(finalUsers);
      setCompanies(c);
      setVehicles(v);
      setDrivers(d);
      setPos(p);
      setFuel(f);
      setReady(true);
    })();
  }, []);

  const persist = useCallback((key, setter, value) => {
    setter(value);
    saveKey(key, value);
  }, []);

  const can = {
    edit: currentUser && (currentUser.role === "lancamento" || currentUser.role === "admin"),
    admin: currentUser && currentUser.role === "admin",
  };

  if (!ready) {
    return (
      <div style={{ background: T.bg, minHeight: "100%" }} className="flex items-center justify-center p-10">
        <style>{FONT_IMPORT}</style>
        <div style={{ fontFamily: "Inter", color: T.inkSoft }}>A carregar sistema…</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login users={users} onLogin={setCurrentUser} />;
  }

  const NAV = [
    { id: "dashboard", label: "Painel", icon: BarChart3 },
    { id: "companies", label: "Empresas", icon: Building2 },
    { id: "vehicles", label: "Viaturas", icon: Car },
    { id: "drivers", label: "Motoristas", icon: UserRound },
    { id: "pos", label: "PO's", icon: FileText },
    { id: "fuel", label: "Combustível", icon: Fuel },
    { id: "reports", label: "Relatórios", icon: BarChart3 },
    ...(can.admin ? [{ id: "users", label: "Utilizadores", icon: Users }] : []),
  ];

  const data = { users, companies, vehicles, drivers, pos, fuel };
  const setters = {
    users: (v) => persist("users", setUsers, v),
    companies: (v) => persist("companies", setCompanies, v),
    vehicles: (v) => persist("vehicles", setVehicles, v),
    drivers: (v) => persist("drivers", setDrivers, v),
    pos: (v) => persist("pos", setPos, v),
    fuel: (v) => persist("fuel", setFuel, v),
  };

  return (
    <div style={{ background: T.bg, minHeight: "100%", fontFamily: "Inter, sans-serif", color: T.ink }}>
      <style>{FONT_IMPORT}
      {`
        .disp { font-family: 'Space Grotesk', sans-serif; }
        .mono { font-family: 'IBM Plex Mono', monospace; }
        .dashline {
          background-image: repeating-linear-gradient(90deg, ${T.line} 0 10px, transparent 10px 18px);
          height: 2px; width: 100%;
        }
        .scrollbar-thin::-webkit-scrollbar{height:6px;width:6px}
        .scrollbar-thin::-webkit-scrollbar-thumb{background:${T.line};border-radius:4px}
      `}</style>

      <div className="flex min-h-screen">
        {/* mobile overlay */}
        {navOpen && (
          <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setNavOpen(false)} />
        )}

        {/* sidebar */}
        <aside
          className={`fixed md:static z-40 top-0 left-0 h-full md:h-auto w-64 flex-shrink-0 transition-transform duration-200 ${
            navOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0`}
          style={{ background: T.primary }}
        >
          <div className="flex flex-col h-full p-5">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="disp text-white text-lg font-semibold leading-tight">Frota&Rota</div>
                <div style={{ color: "#9DB4B9" }} className="text-xs">gestão de viaturas alugadas</div>
              </div>
              <button className="md:hidden text-white" onClick={() => setNavOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV.map((n) => {
                const Icon = n.icon;
                const active = view === n.id;
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      setView(n.id);
                      setNavOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
                    style={{
                      background: active ? "rgba(255,255,255,0.12)" : "transparent",
                      color: active ? "#fff" : "#B9CBCE",
                      fontWeight: active ? 600 : 500,
                    }}
                  >
                    <Icon size={17} />
                    {n.label}
                  </button>
                );
              })}
            </nav>
            <div className="mt-auto pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{ background: T.accent, color: "#fff" }}
                >
                  {currentUser.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="text-xs">
                  <div className="text-white font-medium">{currentUser.name}</div>
                  <div style={{ color: "#9DB4B9" }}>{ROLE_LABEL[currentUser.role]}</div>
                </div>
              </div>
              <button
                onClick={() => setCurrentUser(null)}
                className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg w-full"
                style={{ color: "#B9CBCE", background: "rgba(255,255,255,0.06)" }}
              >
                <LogOut size={14} /> Terminar sessão
              </button>
            </div>
          </div>
        </aside>

        {/* main */}
        <div className="flex-1 min-w-0">
          <div
            className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-20"
            style={{ background: T.primary }}
          >
            <button onClick={() => setNavOpen(true)} className="text-white"><Menu size={22} /></button>
            <div className="disp text-white font-semibold">Frota&Rota</div>
            <div style={{ width: 22 }} />
          </div>
          <main className="p-4 md:p-8 max-w-6xl mx-auto">
            {view === "dashboard" && <Dashboard data={data} setView={setView} />}
            {view === "companies" && <CompaniesView data={data} setters={setters} can={can} />}
            {view === "vehicles" && <VehiclesView data={data} setters={setters} can={can} />}
            {view === "drivers" && <DriversView data={data} setters={setters} can={can} />}
            {view === "pos" && <POsView data={data} setters={setters} can={can} />}
            {view === "fuel" && <FuelView data={data} setters={setters} can={can} />}
            {view === "reports" && <ReportsView data={data} />}
            {view === "users" && can.admin && <UsersView data={data} setters={setters} currentUser={currentUser} />}
          </main>
        </div>
      </div>
    </div>
  );
}

/* ================= LOGIN ================= */
function Login({ users, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const u = users.find((x) => x.username.toLowerCase() === username.trim().toLowerCase() && x.password === password);
    if (u) onLogin(u);
    else setError("Utilizador ou palavra-passe incorretos.");
  };
  const onKeyDown = (e) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div style={{ background: T.primary, minHeight: "100vh" }} className="flex items-center justify-center p-6">
      <style>{FONT_IMPORT}
      {`.disp { font-family: 'Space Grotesk', sans-serif; } body,input,button{font-family:'Inter',sans-serif;}`}</style>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: T.accent }}
          >
            <Car color="#fff" size={26} />
          </div>
          <div className="disp text-white text-2xl font-semibold">Frota&Rota</div>
          <div style={{ color: "#9DB4B9" }} className="text-sm mt-1">gestão de viaturas alugadas</div>
        </div>
        <div style={{ background: T.surface }} className="rounded-2xl p-6 shadow-xl">
          <label className="block text-xs font-medium mb-1.5" style={{ color: T.inkSoft }}>Utilizador</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={onKeyDown}
            className="w-full px-3 py-2.5 rounded-lg mb-4 text-sm outline-none"
            style={{ border: `1px solid ${T.line}` }}
            placeholder="ex: admin"
          />
          <label className="block text-xs font-medium mb-1.5" style={{ color: T.inkSoft }}>Palavra-passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onKeyDown}
            className="w-full px-3 py-2.5 rounded-lg mb-2 text-sm outline-none"
            style={{ border: `1px solid ${T.line}` }}
            placeholder="••••••••"
          />
          {error && <div className="text-xs mb-3" style={{ color: T.danger }}>{error}</div>}
          <button
            onClick={submit}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white mt-3"
            style={{ background: T.accent }}
          >
            Entrar
          </button>
          <div className="text-center text-xs mt-4" style={{ color: T.inkSoft }}>
            1º acesso: <span className="mono">admin</span> / <span className="mono">admin123</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= SHARED UI ================= */
function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="disp text-2xl font-semibold" style={{ color: T.ink }}>{title}</h1>
          {subtitle && <p className="text-sm mt-1" style={{ color: T.inkSoft }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="dashline mt-4" />
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", size = "md", type = "button", disabled }) {
  const styles = {
    primary: { background: T.accent, color: "#fff" },
    dark: { background: T.primary, color: "#fff" },
    ghost: { background: T.surfaceSoft, color: T.ink },
    danger: { background: T.dangerSoft, color: T.danger },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-opacity hover:opacity-85 ${
        size === "sm" ? "text-xs px-2.5 py-1.5" : "text-sm px-4 py-2.5"
      } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      style={styles[variant]}
    >
      {children}
    </button>
  );
}

function Card({ children, className = "", style }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{ background: T.surface, border: `1px solid ${T.line}`, ...style }}
    >
      {children}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone = "primary" }) {
  const tones = {
    primary: { bg: T.surface, fg: T.primary },
    accent: { bg: T.accentSoft, fg: T.accent },
    warning: { bg: T.warningSoft, fg: T.warning },
    danger: { bg: T.dangerSoft, fg: T.danger },
  };
  const c = tones[tone];
  return (
    <Card className="p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: c.bg }}>
        <Icon size={20} color={c.fg} />
      </div>
      <div>
        <div className="disp text-2xl font-semibold" style={{ color: T.ink }}>{value}</div>
        <div className="text-xs" style={{ color: T.inkSoft }}>{label}</div>
      </div>
    </Card>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: T.inkSoft }}>{label}</label>
      {children}
    </div>
  );
}
const inputStyle = { border: `1px solid ${T.line}`, background: "#fff" };
const inputCls = "w-full px-3 py-2 rounded-lg text-sm outline-none";

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,20,20,0.5)" }}>
      <div
        className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-2xl overflow-hidden max-h-[90vh] flex flex-col`}
        style={{ background: T.surface }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${T.line}` }}>
          <div className="disp font-semibold text-base">{title}</div>
          <button onClick={onClose} style={{ color: T.inkSoft }}><X size={18} /></button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDelete({ onConfirm, onClose, label }) {
  return (
    <Modal title="Confirmar eliminação" onClose={onClose}>
      <p className="text-sm mb-5" style={{ color: T.inkSoft }}>
        Tem a certeza que quer eliminar <b>{label}</b>? Esta ação não pode ser revertida.
      </p>
      <div className="flex gap-2 justify-end">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="danger" onClick={onConfirm}>Eliminar</Btn>
      </div>
    </Modal>
  );
}

function Empty({ text }) {
  return (
    <div className="text-center py-12 text-sm" style={{ color: T.inkSoft }}>{text}</div>
  );
}

function Badge({ children, tone = "default" }) {
  const tones = {
    default: { bg: T.surfaceSoft, fg: T.inkSoft },
    success: { bg: T.successSoft, fg: T.success },
    warning: { bg: T.warningSoft, fg: T.warning },
    danger: { bg: T.dangerSoft, fg: T.danger },
    accent: { bg: T.accentSoft, fg: T.accent },
  };
  const c = tones[tone];
  return (
    <span className="text-xs font-medium px-2 py-1 rounded-md inline-block" style={{ background: c.bg, color: c.fg }}>
      {children}
    </span>
  );
}

function DocUploader({ docs, setDocs }) {
  const handle = async (e) => {
    const files = Array.from(e.target.files || []);
    const added = [];
    for (const f of files) {
      if (f.size > 1.5 * 1024 * 1024) {
        alert(`"${f.name}" excede 1.5MB — escolha um ficheiro mais leve.`);
        continue;
      }
      const data = await fileToDataUrl(f);
      added.push({ id: uid(), name: f.name, data });
    }
    setDocs([...(docs || []), ...added]);
  };
  return (
    <div>
      <label
        className="flex items-center gap-2 justify-center border-2 border-dashed rounded-lg py-3 text-xs cursor-pointer"
        style={{ borderColor: T.line, color: T.inkSoft }}
      >
        <Upload size={14} /> Anexar documentos (máx. 1.5MB cada)
        <input type="file" multiple className="hidden" onChange={handle} />
      </label>
      {docs && docs.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {docs.map((d) => (
            <span
              key={d.id}
              className="text-xs px-2 py-1 rounded-md flex items-center gap-1"
              style={{ background: T.surfaceSoft }}
            >
              <Paperclip size={11} /> {d.name}
              <button onClick={() => setDocs(docs.filter((x) => x.id !== d.id))} style={{ color: T.danger }}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.inkSoft }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-8 pr-3 py-2 rounded-lg text-sm outline-none w-full sm:w-64"
        style={inputStyle}
      />
    </div>
  );
}

/* ================= DASHBOARD ================= */
function Dashboard({ data, setView }) {
  const { companies, vehicles, drivers, pos, fuel } = data;

  const expiringLicenses = drivers.filter((d) => {
    const dd = daysUntil(d.licenseExpiry);
    return dd !== null && dd <= 30;
  });

  const openPOs = pos.filter((p) => p.status !== "fechada");

  const pendingRefuel = useMemo(() => {
    const list = [];
    pos.forEach((p) =>
      (p.allocations || []).forEach((a) => {
        if (!a.fuelIncluded) {
          const done = fuel.some((f) => f.allocationId === a.id && f.type === "reposicao");
          if (!done) list.push({ ...a, poNumber: p.number });
        }
      })
    );
    return list;
  }, [pos, fuel]);

  return (
    <div>
      <PageHeader title="Painel" subtitle="Resumo geral da operação" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Viaturas" value={vehicles.length} icon={Car} />
        <StatCard label="Empresas" value={companies.length} icon={Building2} />
        <StatCard label="Motoristas" value={drivers.length} icon={UserRound} />
        <StatCard label="PO's abertas" value={openPOs.length} icon={FileText} tone="accent" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <TriangleAlert size={16} color={T.warning} />
            <div className="font-semibold text-sm">Cartas de condução a expirar (30 dias)</div>
          </div>
          {expiringLicenses.length === 0 ? (
            <Empty text="Nenhum alerta de carta a expirar." />
          ) : (
            <div className="flex flex-col gap-2">
              {expiringLicenses.map((d) => {
                const dd = daysUntil(d.licenseExpiry);
                return (
                  <div key={d.id} className="flex items-center justify-between text-sm py-1.5" style={{ borderBottom: `1px solid ${T.line}` }}>
                    <span>{d.name}</span>
                    <Badge tone={dd < 0 ? "danger" : "warning"}>{dd < 0 ? "expirada" : `${dd}d`}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Fuel size={16} color={T.accent} />
            <div className="font-semibold text-sm">Reposição de combustível pendente</div>
          </div>
          {pendingRefuel.length === 0 ? (
            <Empty text="Sem reposições pendentes." />
          ) : (
            <div className="flex flex-col gap-2">
              {pendingRefuel.slice(0, 6).map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm py-1.5" style={{ borderBottom: `1px solid ${T.line}` }}>
                  <span className="mono text-xs">PO {a.poNumber}</span>
                  <Badge tone="danger">pendente</Badge>
                </div>
              ))}
              {pendingRefuel.length > 6 && (
                <button onClick={() => setView("reports")} className="text-xs text-left mt-1" style={{ color: T.accent }}>
                  Ver todos ({pendingRefuel.length}) nos relatórios →
                </button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ================= COMPANIES ================= */
function CompaniesView({ data, setters, can }) {
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);
  const list = data.companies.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));

  const save = (item) => {
    const exists = data.companies.some((c) => c.id === item.id);
    setters.companies(exists ? data.companies.map((c) => (c.id === item.id ? item : c)) : [...data.companies, item]);
    setModal(null);
  };

  return (
    <div>
      <PageHeader
        title="Empresas"
        subtitle="Fornecedores de viaturas"
        action={
          <div className="flex gap-2 items-center">
            <SearchBox value={q} onChange={setQ} placeholder="Procurar empresa…" />
            {can.edit && <Btn onClick={() => setModal({})}><Plus size={15} /> Nova</Btn>}
          </div>
        }
      />
      <Card className="overflow-x-auto scrollbar-thin">
        {list.length === 0 ? (
          <Empty text="Nenhuma empresa registada." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: T.surfaceSoft }}>
                {["Empresa", "NUIT", "Contacto", "Estado", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-xs" style={{ color: T.inkSoft }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} style={{ borderTop: `1px solid ${T.line}` }}>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 mono text-xs">{c.nuit || "—"}</td>
                  <td className="px-4 py-3">{c.contact || "—"}</td>
                  <td className="px-4 py-3"><Badge tone={c.status === "inativo" ? "danger" : "success"}>{c.status || "ativo"}</Badge></td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {can.edit && (
                      <>
                        <button onClick={() => setModal(c)} className="p-1.5" style={{ color: T.inkSoft }}><Pencil size={14} /></button>
                        <button onClick={() => setDel(c)} className="p-1.5" style={{ color: T.danger }}><Trash2 size={14} /></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {modal && (
        <CompanyModal item={modal} onSave={save} onClose={() => setModal(null)} />
      )}
      {del && (
        <ConfirmDelete
          label={del.name}
          onClose={() => setDel(null)}
          onConfirm={() => {
            setters.companies(data.companies.filter((c) => c.id !== del.id));
            setDel(null);
          }}
        />
      )}
    </div>
  );
}

function CompanyModal({ item, onSave, onClose }) {
  const [f, setF] = useState({ id: item.id || uid(), name: item.name || "", nuit: item.nuit || "", contact: item.contact || "", address: item.address || "", status: item.status || "ativo" });
  return (
    <Modal title={item.id ? "Editar empresa" : "Nova empresa"} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <Field label="Nome da empresa"><input className={inputCls} style={inputStyle} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="NUIT"><input className={inputCls} style={inputStyle} value={f.nuit} onChange={(e) => setF({ ...f, nuit: e.target.value })} /></Field>
        <Field label="Contacto"><input className={inputCls} style={inputStyle} value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} /></Field>
        <Field label="Endereço"><input className={inputCls} style={inputStyle} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
        <Field label="Estado">
          <select className={inputCls} style={inputStyle} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </Field>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={() => f.name.trim() && onSave(f)}>Guardar</Btn>
      </div>
    </Modal>
  );
}

/* ================= VEHICLES ================= */
const VEHICLE_STATUS = ["disponível", "alugada", "manutenção"];

function VehiclesView({ data, setters, can }) {
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);
  const companyName = (id) => data.companies.find((c) => c.id === id)?.name || "—";
  const list = data.vehicles.filter((v) =>
    [v.plate, v.brand, v.model].join(" ").toLowerCase().includes(q.toLowerCase())
  );

  const save = (item) => {
    const exists = data.vehicles.some((v) => v.id === item.id);
    setters.vehicles(exists ? data.vehicles.map((v) => (v.id === item.id ? item : v)) : [...data.vehicles, item]);
    setModal(null);
  };

  return (
    <div>
      <PageHeader
        title="Viaturas"
        subtitle="Cadastro e documentação das viaturas"
        action={
          <div className="flex gap-2 items-center">
            <SearchBox value={q} onChange={setQ} placeholder="Matrícula, marca, modelo…" />
            {can.edit && <Btn onClick={() => setModal({})}><Plus size={15} /> Nova</Btn>}
          </div>
        }
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.length === 0 && <Empty text="Nenhuma viatura registada." />}
        {list.map((v) => (
          <Card key={v.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="mono font-semibold text-sm">{v.plate}</div>
                <div className="text-xs" style={{ color: T.inkSoft }}>{v.brand} {v.model} · {v.type}</div>
              </div>
              <Badge tone={v.status === "disponível" ? "success" : v.status === "manutenção" ? "warning" : "accent"}>{v.status}</Badge>
            </div>
            <div className="text-xs mb-3" style={{ color: T.inkSoft }}>Empresa: <b style={{ color: T.ink }}>{companyName(v.companyId)}</b></div>
            {v.docs?.length > 0 && (
              <div className="flex items-center gap-1 text-xs mb-3" style={{ color: T.inkSoft }}>
                <Paperclip size={11} /> {v.docs.length} documento(s)
              </div>
            )}
            {can.edit && (
              <div className="flex gap-2 mt-2">
                <Btn size="sm" variant="ghost" onClick={() => setModal(v)}><Pencil size={12} /> Editar</Btn>
                <Btn size="sm" variant="danger" onClick={() => setDel(v)}><Trash2 size={12} /> Eliminar</Btn>
              </div>
            )}
          </Card>
        ))}
      </div>

      {modal && <VehicleModal item={modal} companies={data.companies} onSave={save} onClose={() => setModal(null)} />}
      {del && (
        <ConfirmDelete
          label={del.plate}
          onClose={() => setDel(null)}
          onConfirm={() => {
            setters.vehicles(data.vehicles.filter((v) => v.id !== del.id));
            setDel(null);
          }}
        />
      )}
    </div>
  );
}

function VehicleModal({ item, companies, onSave, onClose }) {
  const [f, setF] = useState({
    id: item.id || uid(),
    plate: item.plate || "",
    type: item.type || "",
    brand: item.brand || "",
    model: item.model || "",
    companyId: item.companyId || "",
    status: item.status || "disponível",
    docs: item.docs || [],
  });
  return (
    <Modal title={item.id ? "Editar viatura" : "Nova viatura"} onClose={onClose} wide>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Matrícula"><input className={inputCls} style={inputStyle} value={f.plate} onChange={(e) => setF({ ...f, plate: e.target.value.toUpperCase() })} /></Field>
        <Field label="Tipo (ligeiro, pick-up, camião…)"><input className={inputCls} style={inputStyle} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} /></Field>
        <Field label="Marca"><input className={inputCls} style={inputStyle} value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} /></Field>
        <Field label="Modelo"><input className={inputCls} style={inputStyle} value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} /></Field>
        <Field label="Empresa">
          <select className={inputCls} style={inputStyle} value={f.companyId} onChange={(e) => setF({ ...f, companyId: e.target.value })}>
            <option value="">Selecionar…</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Estado">
          <select className={inputCls} style={inputStyle} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            {VEHICLE_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <div className="mt-3">
        <Field label="Documentação"><DocUploader docs={f.docs} setDocs={(d) => setF({ ...f, docs: d })} /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={() => f.plate.trim() && onSave(f)}>Guardar</Btn>
      </div>
    </Modal>
  );
}

/* ================= DRIVERS ================= */
function DriversView({ data, setters, can }) {
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);
  const companyName = (id) => data.companies.find((c) => c.id === id)?.name || "—";
  const list = data.drivers.filter((d) => d.name.toLowerCase().includes(q.toLowerCase()));

  const save = (item) => {
    const exists = data.drivers.some((d) => d.id === item.id);
    setters.drivers(exists ? data.drivers.map((d) => (d.id === item.id ? item : d)) : [...data.drivers, item]);
    setModal(null);
  };

  return (
    <div>
      <PageHeader
        title="Motoristas"
        subtitle="Cadastro, carta de condução e documentação"
        action={
          <div className="flex gap-2 items-center">
            <SearchBox value={q} onChange={setQ} placeholder="Procurar motorista…" />
            {can.edit && <Btn onClick={() => setModal({})}><Plus size={15} /> Novo</Btn>}
          </div>
        }
      />
      <Card className="overflow-x-auto scrollbar-thin">
        {list.length === 0 ? (
          <Empty text="Nenhum motorista registado." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: T.surfaceSoft }}>
                {["Nome", "Carta Nº", "Validade", "Empresa", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-xs" style={{ color: T.inkSoft }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((d) => {
                const dd = daysUntil(d.licenseExpiry);
                return (
                  <tr key={d.id} style={{ borderTop: `1px solid ${T.line}` }}>
                    <td className="px-4 py-3 font-medium">{d.name}</td>
                    <td className="px-4 py-3 mono text-xs">{d.license || "—"}</td>
                    <td className="px-4 py-3">
                      {fmtDate(d.licenseExpiry)}{" "}
                      {dd !== null && dd <= 30 && <Badge tone={dd < 0 ? "danger" : "warning"}>{dd < 0 ? "expirada" : `${dd}d`}</Badge>}
                    </td>
                    <td className="px-4 py-3">{companyName(d.companyId)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {can.edit && (
                        <>
                          <button onClick={() => setModal(d)} className="p-1.5" style={{ color: T.inkSoft }}><Pencil size={14} /></button>
                          <button onClick={() => setDel(d)} className="p-1.5" style={{ color: T.danger }}><Trash2 size={14} /></button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {modal && <DriverModal item={modal} companies={data.companies} onSave={save} onClose={() => setModal(null)} />}
      {del && (
        <ConfirmDelete
          label={del.name}
          onClose={() => setDel(null)}
          onConfirm={() => {
            setters.drivers(data.drivers.filter((d) => d.id !== del.id));
            setDel(null);
          }}
        />
      )}
    </div>
  );
}

function DriverModal({ item, companies, onSave, onClose }) {
  const [f, setF] = useState({
    id: item.id || uid(),
    name: item.name || "",
    license: item.license || "",
    licenseExpiry: item.licenseExpiry || "",
    companyId: item.companyId || "",
    phone: item.phone || "",
    docs: item.docs || [],
  });
  return (
    <Modal title={item.id ? "Editar motorista" : "Novo motorista"} onClose={onClose} wide>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Nome completo"><input className={inputCls} style={inputStyle} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Telefone"><input className={inputCls} style={inputStyle} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label="Nº da carta de condução"><input className={inputCls} style={inputStyle} value={f.license} onChange={(e) => setF({ ...f, license: e.target.value })} /></Field>
        <Field label="Validade da carta"><input type="date" className={inputCls} style={inputStyle} value={f.licenseExpiry} onChange={(e) => setF({ ...f, licenseExpiry: e.target.value })} /></Field>
        <Field label="Empresa">
          <select className={inputCls} style={inputStyle} value={f.companyId} onChange={(e) => setF({ ...f, companyId: e.target.value })}>
            <option value="">— nenhuma —</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
      </div>
      <div className="mt-3">
        <Field label="Documentação"><DocUploader docs={f.docs} setDocs={(d) => setF({ ...f, docs: d })} /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={() => f.name.trim() && onSave(f)}>Guardar</Btn>
      </div>
    </Modal>
  );
}

/* ================= PO's ================= */
function POsView({ data, setters, can }) {
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);
  const [open, setOpen] = useState(null);

  const save = (item) => {
    const exists = data.pos.some((p) => p.id === item.id);
    setters.pos(exists ? data.pos.map((p) => (p.id === item.id ? item : p)) : [...data.pos, item]);
    setModal(null);
  };

  return (
    <div>
      <PageHeader
        title="PO's (Ordens de Compra)"
        subtitle="Cada PO agrupa as viaturas alocadas por fornecedor"
        action={can.edit && <Btn onClick={() => setModal({})}><Plus size={15} /> Nova PO</Btn>}
      />
      <div className="flex flex-col gap-3">
        {data.pos.length === 0 && <Empty text="Nenhuma PO registada." />}
        {data.pos.map((p) => {
          const allocs = p.allocations || [];
          const totalDays = allocs.reduce((s, a) => s + (Number(a.days) || 0), 0);
          const isOpen = open === p.id;
          return (
            <Card key={p.id} className="overflow-hidden">
              <button onClick={() => setOpen(isOpen ? null : p.id)} className="w-full flex items-center justify-between p-4 text-left">
                <div className="flex items-center gap-3">
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <div>
                    <div className="font-semibold text-sm mono">PO {p.number}</div>
                    <div className="text-xs" style={{ color: T.inkSoft }}>{fmtDate(p.date)} · {allocs.length} viatura(s) · {totalDays} dias-viatura</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={p.status === "fechada" ? "default" : "success"}>{p.status || "aberta"}</Badge>
                  {can.edit && (
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setModal(p)} className="p-1.5" style={{ color: T.inkSoft }}><Pencil size={14} /></button>
                      <button onClick={() => setDel(p)} className="p-1.5" style={{ color: T.danger }}><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
              </button>
              {isOpen && (
                <div className="px-4 pb-4">
                  <div className="dashline mb-4" />
                  <div className="grid sm:grid-cols-3 gap-3 mb-4 text-sm">
                    <div><span style={{ color: T.inkSoft }}>Valor: </span><b>{Number(p.value || 0).toLocaleString("pt-PT")} MT</b></div>
                    <div><span style={{ color: T.inkSoft }}>Dias contratados: </span><b>{p.days || "—"}</b></div>
                    <div><span style={{ color: T.inkSoft }}>Dias já usados: </span><b>{totalDays}</b></div>
                  </div>
                  <AllocationsBlock po={p} data={data} setters={setters} can={can} onUpdate={(updated) => save(updated)} />
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {modal && <POModal item={modal} onSave={save} onClose={() => setModal(null)} />}
      {del && (
        <ConfirmDelete
          label={`PO ${del.number}`}
          onClose={() => setDel(null)}
          onConfirm={() => {
            setters.pos(data.pos.filter((p) => p.id !== del.id));
            setDel(null);
          }}
        />
      )}
    </div>
  );
}

function POModal({ item, onSave, onClose }) {
  const [f, setF] = useState({
    id: item.id || uid(),
    number: item.number || "",
    date: item.date || todayISO(),
    value: item.value || "",
    days: item.days || "",
    status: item.status || "aberta",
    allocations: item.allocations || [],
  });
  return (
    <Modal title={item.id ? "Editar PO" : "Nova PO"} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <Field label="Número da PO"><input className={inputCls} style={inputStyle} value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} /></Field>
        <Field label="Data da PO"><input type="date" className={inputCls} style={inputStyle} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <Field label="Valor da PO (MT)"><input type="number" className={inputCls} style={inputStyle} value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></Field>
        <Field label="Dias que a PO cobre"><input type="number" className={inputCls} style={inputStyle} value={f.days} onChange={(e) => setF({ ...f, days: e.target.value })} /></Field>
        <Field label="Estado">
          <select className={inputCls} style={inputStyle} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            <option value="aberta">Aberta</option>
            <option value="fechada">Fechada</option>
          </select>
        </Field>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={() => f.number.trim() && onSave(f)}>Guardar</Btn>
      </div>
    </Modal>
  );
}

function AllocationsBlock({ po, data, setters, can, onUpdate }) {
  const [modal, setModal] = useState(null);
  const companyName = (vid) => {
    const v = data.vehicles.find((x) => x.id === vid);
    return v ? data.companies.find((c) => c.id === v.companyId)?.name || "—" : "—";
  };
  const vehiclePlate = (vid) => data.vehicles.find((v) => v.id === vid)?.plate || "—";
  const driverName = (did) => data.drivers.find((d) => d.id === did)?.name || "—";

  const saveAlloc = (a) => {
    const allocs = po.allocations || [];
    const exists = allocs.some((x) => x.id === a.id);
    const updated = { ...po, allocations: exists ? allocs.map((x) => (x.id === a.id ? a : x)) : [...allocs, a] };
    onUpdate(updated);
    setModal(null);
  };
  const removeAlloc = (id) => {
    onUpdate({ ...po, allocations: (po.allocations || []).filter((x) => x.id !== id) });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold" style={{ color: T.inkSoft }}>VIATURAS ALOCADAS</div>
        {can.edit && <Btn size="sm" onClick={() => setModal({})}><Plus size={12} /> Alocar viatura</Btn>}
      </div>
      {(po.allocations || []).length === 0 ? (
        <Empty text="Nenhuma viatura alocada nesta PO." />
      ) : (
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: T.surfaceSoft }}>
                {["Viatura", "Empresa", "Motorista", "Dias", "Destino", "Combustível", ""].map((h) => (
                  <th key={h} className="text-left px-2.5 py-2 font-medium" style={{ color: T.inkSoft }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(po.allocations || []).map((a) => (
                <tr key={a.id} style={{ borderTop: `1px solid ${T.line}` }}>
                  <td className="px-2.5 py-2 mono">{vehiclePlate(a.vehicleId)}</td>
                  <td className="px-2.5 py-2">{companyName(a.vehicleId)}</td>
                  <td className="px-2.5 py-2">{driverName(a.driverId)}</td>
                  <td className="px-2.5 py-2">{a.days}</td>
                  <td className="px-2.5 py-2">{a.destination}</td>
                  <td className="px-2.5 py-2"><Badge tone={a.fuelIncluded ? "success" : "warning"}>{a.fuelIncluded ? "com" : "sem"}</Badge></td>
                  <td className="px-2.5 py-2 text-right whitespace-nowrap">
                    {can.edit && (
                      <>
                        <button onClick={() => setModal(a)} className="p-1" style={{ color: T.inkSoft }}><Pencil size={12} /></button>
                        <button onClick={() => removeAlloc(a.id)} className="p-1" style={{ color: T.danger }}><Trash2 size={12} /></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal && (
        <AllocationModal item={modal} vehicles={data.vehicles} drivers={data.drivers} onSave={saveAlloc} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

function AllocationModal({ item, vehicles, drivers, onSave, onClose }) {
  const [f, setF] = useState({
    id: item.id || uid(),
    vehicleId: item.vehicleId || "",
    driverId: item.driverId || "",
    days: item.days || "",
    destination: item.destination || "",
    fuelIncluded: item.fuelIncluded ?? true,
    startDate: item.startDate || todayISO(),
  });
  return (
    <Modal title={item.id ? "Editar alocação" : "Alocar viatura"} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <Field label="Viatura">
          <select className={inputCls} style={inputStyle} value={f.vehicleId} onChange={(e) => setF({ ...f, vehicleId: e.target.value })}>
            <option value="">Selecionar…</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</option>)}
          </select>
        </Field>
        <Field label="Motorista">
          <select className={inputCls} style={inputStyle} value={f.driverId} onChange={(e) => setF({ ...f, driverId: e.target.value })}>
            <option value="">— nenhum —</option>
            {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <Field label="Data de início"><input type="date" className={inputCls} style={inputStyle} value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} /></Field>
        <Field label="Dias alocados"><input type="number" className={inputCls} style={inputStyle} value={f.days} onChange={(e) => setF({ ...f, days: e.target.value })} /></Field>
        <Field label="Destino"><input className={inputCls} style={inputStyle} value={f.destination} onChange={(e) => setF({ ...f, destination: e.target.value })} /></Field>
        <Field label="Aluguel">
          <div className="flex gap-2">
            <button
              onClick={() => setF({ ...f, fuelIncluded: true })}
              className="flex-1 py-2 rounded-lg text-sm"
              style={{ background: f.fuelIncluded ? T.successSoft : T.surfaceSoft, color: f.fuelIncluded ? T.success : T.inkSoft, fontWeight: f.fuelIncluded ? 600 : 400 }}
            >
              Com combustível
            </button>
            <button
              onClick={() => setF({ ...f, fuelIncluded: false })}
              className="flex-1 py-2 rounded-lg text-sm"
              style={{ background: !f.fuelIncluded ? T.warningSoft : T.surfaceSoft, color: !f.fuelIncluded ? T.warning : T.inkSoft, fontWeight: !f.fuelIncluded ? 600 : 400 }}
            >
              Sem combustível
            </button>
          </div>
        </Field>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={() => f.vehicleId && onSave(f)}>Guardar</Btn>
      </div>
    </Modal>
  );
}

/* ================= FUEL ================= */
function FuelView({ data, setters, can }) {
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);
  const vehiclePlate = (id) => data.vehicles.find((v) => v.id === id)?.plate || "—";

  const pendingAllocs = useMemo(() => {
    const list = [];
    data.pos.forEach((p) =>
      (p.allocations || []).forEach((a) => {
        if (!a.fuelIncluded) {
          const done = data.fuel.some((f) => f.allocationId === a.id && f.type === "reposicao");
          if (!done) list.push({ ...a, poNumber: p.number });
        }
      })
    );
    return list;
  }, [data.pos, data.fuel]);

  const save = (item) => {
    const exists = data.fuel.some((f) => f.id === item.id);
    setters.fuel(exists ? data.fuel.map((f) => (f.id === item.id ? item : f)) : [...data.fuel, item]);
    setModal(null);
  };

  return (
    <div>
      <PageHeader
        title="Combustível"
        subtitle="Abastecimentos e reposições"
        action={can.edit && <Btn onClick={() => setModal({})}><Plus size={15} /> Lançar abastecimento</Btn>}
      />

      {pendingAllocs.length > 0 && (
        <Card className="p-4 mb-5" style={{ background: T.warningSoft, border: "none" }}>
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: T.warning }}>
            <TriangleAlert size={15} /> {pendingAllocs.length} viatura(s) circularam sem combustível e aguardam reposição
          </div>
        </Card>
      )}

      <Card className="overflow-x-auto scrollbar-thin">
        {data.fuel.length === 0 ? (
          <Empty text="Nenhum abastecimento lançado." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: T.surfaceSoft }}>
                {["Data", "Viatura", "Bomba", "Litros", "Valor", "Tipo", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-xs" style={{ color: T.inkSoft }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...data.fuel].sort((a, b) => (b.date > a.date ? 1 : -1)).map((f) => (
                <tr key={f.id} style={{ borderTop: `1px solid ${T.line}` }}>
                  <td className="px-4 py-3">{fmtDate(f.date)}</td>
                  <td className="px-4 py-3 mono">{vehiclePlate(f.vehicleId)}</td>
                  <td className="px-4 py-3">{f.pump}</td>
                  <td className="px-4 py-3">{f.liters} L</td>
                  <td className="px-4 py-3">{Number(f.value || 0).toLocaleString("pt-PT")} MT</td>
                  <td className="px-4 py-3"><Badge tone={f.type === "reposicao" ? "accent" : "default"}>{f.type === "reposicao" ? "reposição" : "normal"}</Badge></td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {can.edit && (
                      <>
                        <button onClick={() => setModal(f)} className="p-1.5" style={{ color: T.inkSoft }}><Pencil size={14} /></button>
                        <button onClick={() => setDel(f)} className="p-1.5" style={{ color: T.danger }}><Trash2 size={14} /></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {modal && (
        <FuelModal item={modal} vehicles={data.vehicles} pendingAllocs={pendingAllocs} onSave={save} onClose={() => setModal(null)} />
      )}
      {del && (
        <ConfirmDelete
          label={`abastecimento de ${fmtDate(del.date)}`}
          onClose={() => setDel(null)}
          onConfirm={() => {
            setters.fuel(data.fuel.filter((f) => f.id !== del.id));
            setDel(null);
          }}
        />
      )}
    </div>
  );
}

function FuelModal({ item, vehicles, pendingAllocs, onSave, onClose }) {
  const [f, setF] = useState({
    id: item.id || uid(),
    vehicleId: item.vehicleId || "",
    date: item.date || todayISO(),
    liters: item.liters || "",
    value: item.value || "",
    pump: item.pump || "",
    type: item.type || "normal",
    allocationId: item.allocationId || "",
  });
  return (
    <Modal title={item.id ? "Editar lançamento" : "Lançar abastecimento"} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <Field label="Tipo de lançamento">
          <div className="flex gap-2">
            <button onClick={() => setF({ ...f, type: "normal" })} className="flex-1 py-2 rounded-lg text-sm" style={{ background: f.type === "normal" ? T.accentSoft : T.surfaceSoft, color: f.type === "normal" ? T.accent : T.inkSoft, fontWeight: f.type === "normal" ? 600 : 400 }}>Abastecimento</button>
            <button onClick={() => setF({ ...f, type: "reposicao" })} className="flex-1 py-2 rounded-lg text-sm" style={{ background: f.type === "reposicao" ? T.warningSoft : T.surfaceSoft, color: f.type === "reposicao" ? T.warning : T.inkSoft, fontWeight: f.type === "reposicao" ? 600 : 400 }}>Reposição</button>
          </div>
        </Field>
        {f.type === "reposicao" && (
          <Field label="Alocação a repor (viatura que circulou sem combustível)">
            <select className={inputCls} style={inputStyle} value={f.allocationId} onChange={(e) => {
              const a = pendingAllocs.find((x) => x.id === e.target.value);
              setF({ ...f, allocationId: e.target.value, vehicleId: a ? a.vehicleId : f.vehicleId });
            }}>
              <option value="">Selecionar…</option>
              {pendingAllocs.map((a) => (
                <option key={a.id} value={a.id}>PO {a.poNumber} — {vehicles.find((v) => v.id === a.vehicleId)?.plate}</option>
              ))}
            </select>
          </Field>
        )}
        {f.type === "normal" && (
          <Field label="Viatura">
            <select className={inputCls} style={inputStyle} value={f.vehicleId} onChange={(e) => setF({ ...f, vehicleId: e.target.value })}>
              <option value="">Selecionar…</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</option>)}
            </select>
          </Field>
        )}
        <Field label="Data"><input type="date" className={inputCls} style={inputStyle} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Litros"><input type="number" className={inputCls} style={inputStyle} value={f.liters} onChange={(e) => setF({ ...f, liters: e.target.value })} /></Field>
          <Field label="Valor (MT)"><input type="number" className={inputCls} style={inputStyle} value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></Field>
        </div>
        <Field label="Bomba de abastecimento"><input className={inputCls} style={inputStyle} value={f.pump} onChange={(e) => setF({ ...f, pump: e.target.value })} placeholder="ex: Petromoc — Av. 24 de Julho" /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={() => f.vehicleId && onSave(f)}>Guardar</Btn>
      </div>
    </Modal>
  );
}

/* ================= REPORTS ================= */
function ReportsView({ data }) {
  const [tab, setTab] = useState("po");
  const tabs = [
    { id: "po", label: "Resumo por PO" },
    { id: "sem-combustivel", label: "Sem combustível" },
    { id: "reposicao", label: "Reposições" },
    { id: "abastecidas", label: "Viaturas abastecidas" },
  ];
  return (
    <div>
      <PageHeader title="Relatórios" subtitle="Análises cruzadas de PO's, alocações e combustível" />
      <div className="flex gap-2 mb-5 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="text-xs font-medium px-3 py-2 rounded-lg"
            style={{ background: tab === t.id ? T.primary : T.surfaceSoft, color: tab === t.id ? "#fff" : T.inkSoft }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "po" && <ReportPO data={data} />}
      {tab === "sem-combustivel" && <ReportSemCombustivel data={data} />}
      {tab === "reposicao" && <ReportReposicao data={data} />}
      {tab === "abastecidas" && <ReportAbastecidas data={data} />}
    </div>
  );
}

function ReportPO({ data }) {
  const [poId, setPoId] = useState(data.pos[0]?.id || "");
  const po = data.pos.find((p) => p.id === poId);
  const companyName = (vid) => {
    const v = data.vehicles.find((x) => x.id === vid);
    return v ? data.companies.find((c) => c.id === v.companyId)?.name || "—" : "—";
  };
  const byCompany = useMemo(() => {
    if (!po) return {};
    const m = {};
    (po.allocations || []).forEach((a) => {
      const name = companyName(a.vehicleId);
      m[name] = m[name] || { count: 0, days: 0 };
      m[name].count += 1;
      m[name].days += Number(a.days) || 0;
    });
    return m;
  }, [po]);

  if (data.pos.length === 0) return <Empty text="Nenhuma PO registada ainda." />;

  const totalDays = (po?.allocations || []).reduce((s, a) => s + (Number(a.days) || 0), 0);

  return (
    <div>
      <Field label="Selecionar PO">
        <select className={inputCls} style={{ ...inputStyle, maxWidth: 320 }} value={poId} onChange={(e) => setPoId(e.target.value)}>
          {data.pos.map((p) => <option key={p.id} value={p.id}>PO {p.number} — {fmtDate(p.date)}</option>)}
        </select>
      </Field>
      {po && (
        <div className="mt-5 flex flex-col gap-5">
          <div className="grid sm:grid-cols-4 gap-4">
            <StatCard label="Viaturas na PO" value={(po.allocations || []).length} icon={Car} />
            <StatCard label="Dias-viatura totais" value={totalDays} icon={FileText} tone="accent" />
            <StatCard label="Empresas envolvidas" value={Object.keys(byCompany).length} icon={Building2} />
            <StatCard label="Valor da PO" value={`${Number(po.value || 0).toLocaleString("pt-PT")} MT`} icon={BarChart3} />
          </div>

          <Card className="p-4">
            <div className="font-semibold text-sm mb-3">Por empresa fornecedora</div>
            {Object.keys(byCompany).length === 0 ? (
              <Empty text="Sem alocações nesta PO." />
            ) : (
              <div className="flex flex-col gap-2">
                {Object.entries(byCompany).map(([name, v]) => (
                  <div key={name} className="flex items-center justify-between text-sm py-1.5" style={{ borderBottom: `1px solid ${T.line}` }}>
                    <span>{name}</span>
                    <span style={{ color: T.inkSoft }}>{v.count} viatura(s) · {v.days} dias</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4 overflow-x-auto scrollbar-thin">
            <div className="font-semibold text-sm mb-3">Destinos e detalhe por viatura</div>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: T.surfaceSoft }}>
                  {["Viatura", "Empresa", "Dias", "Destino", "Combustível"].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-medium" style={{ color: T.inkSoft }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(po.allocations || []).map((a) => (
                  <tr key={a.id} style={{ borderTop: `1px solid ${T.line}` }}>
                    <td className="px-3 py-2 mono">{data.vehicles.find((v) => v.id === a.vehicleId)?.plate || "—"}</td>
                    <td className="px-3 py-2">{companyName(a.vehicleId)}</td>
                    <td className="px-3 py-2">{a.days}</td>
                    <td className="px-3 py-2">{a.destination}</td>
                    <td className="px-3 py-2"><Badge tone={a.fuelIncluded ? "success" : "warning"}>{a.fuelIncluded ? "com" : "sem"}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
}

function ReportSemCombustivel({ data }) {
  const rows = useMemo(() => {
    const list = [];
    data.pos.forEach((p) =>
      (p.allocations || []).forEach((a) => {
        if (!a.fuelIncluded) {
          const done = data.fuel.some((f) => f.allocationId === a.id && f.type === "reposicao");
          list.push({ ...a, poNumber: p.number, done });
        }
      })
    );
    return list;
  }, [data.pos, data.fuel]);
  const pending = rows.filter((r) => !r.done);
  const done = rows.filter((r) => r.done);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <StatCard label="Pendentes de reposição" value={pending.length} icon={TriangleAlert} tone="warning" />
        <StatCard label="Já repostas" value={done.length} icon={CircleCheck} tone="primary" />
      </div>
      <Card className="p-4 overflow-x-auto scrollbar-thin">
        {rows.length === 0 ? (
          <Empty text="Nenhuma viatura circulou sem combustível." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: T.surfaceSoft }}>
                {["PO", "Viatura", "Destino", "Dias", "Estado"].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-medium" style={{ color: T.inkSoft }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderTop: `1px solid ${T.line}` }}>
                  <td className="px-3 py-2 mono">{r.poNumber}</td>
                  <td className="px-3 py-2 mono">{data.vehicles.find((v) => v.id === r.vehicleId)?.plate || "—"}</td>
                  <td className="px-3 py-2">{r.destination}</td>
                  <td className="px-3 py-2">{r.days}</td>
                  <td className="px-3 py-2"><Badge tone={r.done ? "success" : "danger"}>{r.done ? "reposta" : "pendente"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function ReportReposicao({ data }) {
  const reposicoes = data.fuel.filter((f) => f.type === "reposicao");
  const totalPendentesGeral = useMemo(() => {
    let n = 0;
    data.pos.forEach((p) => (p.allocations || []).forEach((a) => { if (!a.fuelIncluded) n += 1; }));
    return n;
  }, [data.pos]);
  const feitas = reposicoes.length;
  const faltam = Math.max(totalPendentesGeral - feitas, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Total sem combustível" value={totalPendentesGeral} icon={FileText} />
        <StatCard label="Reposições feitas" value={feitas} icon={CircleCheck} tone="primary" />
        <StatCard label="Ainda faltam" value={faltam} icon={CircleAlert} tone="warning" />
      </div>
      <Card className="p-4 overflow-x-auto scrollbar-thin">
        <div className="font-semibold text-sm mb-3">Histórico de reposições</div>
        {reposicoes.length === 0 ? (
          <Empty text="Nenhuma reposição lançada." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: T.surfaceSoft }}>
                {["Data", "Viatura", "Bomba", "Litros", "Valor"].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-medium" style={{ color: T.inkSoft }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reposicoes.map((r) => (
                <tr key={r.id} style={{ borderTop: `1px solid ${T.line}` }}>
                  <td className="px-3 py-2">{fmtDate(r.date)}</td>
                  <td className="px-3 py-2 mono">{data.vehicles.find((v) => v.id === r.vehicleId)?.plate || "—"}</td>
                  <td className="px-3 py-2">{r.pump}</td>
                  <td className="px-3 py-2">{r.liters} L</td>
                  <td className="px-3 py-2">{Number(r.value || 0).toLocaleString("pt-PT")} MT</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function ReportAbastecidas({ data }) {
  const [pump, setPump] = useState("");
  const rows = data.fuel.filter((f) => !pump || f.pump.toLowerCase().includes(pump.toLowerCase()));
  const totalLiters = rows.reduce((s, r) => s + (Number(r.liters) || 0), 0);
  const totalValue = rows.reduce((s, r) => s + (Number(r.value) || 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <SearchBox value={pump} onChange={setPump} placeholder="Filtrar por bomba…" />
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Viaturas abastecidas" value={new Set(rows.map((r) => r.vehicleId)).size} icon={Car} />
        <StatCard label="Litros totais" value={`${totalLiters.toLocaleString("pt-PT")} L`} icon={Fuel} tone="accent" />
        <StatCard label="Valor total" value={`${totalValue.toLocaleString("pt-PT")} MT`} icon={BarChart3} />
      </div>
      <Card className="p-4 overflow-x-auto scrollbar-thin">
        {rows.length === 0 ? (
          <Empty text="Nenhum registo encontrado." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: T.surfaceSoft }}>
                {["Data", "Viatura", "Bomba", "Litros", "Valor", "Tipo"].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-medium" style={{ color: T.inkSoft }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...rows].sort((a, b) => (b.date > a.date ? 1 : -1)).map((r) => (
                <tr key={r.id} style={{ borderTop: `1px solid ${T.line}` }}>
                  <td className="px-3 py-2">{fmtDate(r.date)}</td>
                  <td className="px-3 py-2 mono">{data.vehicles.find((v) => v.id === r.vehicleId)?.plate || "—"}</td>
                  <td className="px-3 py-2">{r.pump}</td>
                  <td className="px-3 py-2">{r.liters} L</td>
                  <td className="px-3 py-2">{Number(r.value || 0).toLocaleString("pt-PT")} MT</td>
                  <td className="px-3 py-2"><Badge tone={r.type === "reposicao" ? "accent" : "default"}>{r.type === "reposicao" ? "reposição" : "normal"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

/* ================= USERS ================= */
function UsersView({ data, setters, currentUser }) {
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);

  const save = (item) => {
    const exists = data.users.some((u) => u.id === item.id);
    setters.users(exists ? data.users.map((u) => (u.id === item.id ? item : u)) : [...data.users, item]);
    setModal(null);
  };

  return (
    <div>
      <PageHeader
        title="Utilizadores"
        subtitle="Gestão de acessos e perfis de permissão"
        action={<Btn onClick={() => setModal({})}><Plus size={15} /> Novo utilizador</Btn>}
      />
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {Object.entries(ROLE_LABEL).map(([k, label]) => (
          <Card key={k} className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={14} color={T.accent} />
              <div className="font-semibold text-sm">{label}</div>
            </div>
            <div className="text-xs" style={{ color: T.inkSoft }}>{ROLE_DESC[k]}</div>
          </Card>
        ))}
      </div>
      <Card className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: T.surfaceSoft }}>
              {["Nome", "Utilizador", "Perfil", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium text-xs" style={{ color: T.inkSoft }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.users.map((u) => (
              <tr key={u.id} style={{ borderTop: `1px solid ${T.line}` }}>
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 mono text-xs">{u.username}</td>
                <td className="px-4 py-3"><Badge tone="accent">{ROLE_LABEL[u.role]}</Badge></td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => setModal(u)} className="p-1.5" style={{ color: T.inkSoft }}><Pencil size={14} /></button>
                  {u.id !== currentUser.id && (
                    <button onClick={() => setDel(u)} className="p-1.5" style={{ color: T.danger }}><Trash2 size={14} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {modal && <UserModal item={modal} onSave={save} onClose={() => setModal(null)} />}
      {del && (
        <ConfirmDelete
          label={del.name}
          onClose={() => setDel(null)}
          onConfirm={() => {
            setters.users(data.users.filter((u) => u.id !== del.id));
            setDel(null);
          }}
        />
      )}
    </div>
  );
}

function UserModal({ item, onSave, onClose }) {
  const [f, setF] = useState({
    id: item.id || uid(),
    name: item.name || "",
    username: item.username || "",
    password: item.password || "",
    role: item.role || "leitura",
  });
  return (
    <Modal title={item.id ? "Editar utilizador" : "Novo utilizador"} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <Field label="Nome completo"><input className={inputCls} style={inputStyle} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Utilizador (login)"><input className={inputCls} style={inputStyle} value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></Field>
        <Field label="Palavra-passe"><input className={inputCls} style={inputStyle} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        <Field label="Perfil de acesso">
          <select className={inputCls} style={inputStyle} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
            <option value="leitura">Leitura — apenas consulta</option>
            <option value="lancamento">Lançamento — cria e edita</option>
            <option value="admin">Administrador — acesso total</option>
          </select>
        </Field>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={() => f.name.trim() && f.username.trim() && f.password.trim() && onSave(f)}>Guardar</Btn>
      </div>
    </Modal>
  );
}
