import React, { useState } from "react";
import { Copy, Check, Sparkles, Code2, Terminal, RefreshCw, HelpCircle, AlertTriangle } from "lucide-react";

interface CommandGeneratorProps {
  onCodeOutput: (code: string, fileName: string) => void;
}

export default function CommandGenerator({ onCodeOutput }: CommandGeneratorProps) {
  const [name, setName] = useState("nuevo_dungeon");
  const [description, setDescription] = useState("Ingresa a una mazmorra aleatoria en busca de tesoros.");
  const [category, setCategory] = useState("utilidades");
  const [aliases, setAliases] = useState("dungeon, mazmorra");
  const [logic, setLogic] = useState(
    "El comando debe calcular una probabilidad del 40% de éxito. Si tiene éxito, devuelve un premio de oro aleatorio de 50 a 200, si falla, reduce la vida del personaje seleccionado en 15."
  );
  const [adminOnly, setAdminOnly] = useState(false);
  const [groupOnly, setGroupOnly] = useState(false);

  const [loading, setLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{
    code: string;
    explanation: string;
    isOfflineFallback?: boolean;
    fallbackReason?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setGeneratedResult(null);

    try {
      const aliasArray = aliases
        .split(",")
        .map((a) => a.trim().toLowerCase())
        .filter((a) => a.length > 0);

      const response = await fetch("/api/generar-comando", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim().toLowerCase(),
          description: description.trim(),
          category,
          aliases: aliasArray,
          adminOnly,
          groupOnly,
          logic: logic.trim(),
        }),
      });

      const data = await response.json();
      if (data.error) {
        alert("Error de la IA: " + data.error);
      } else {
        setGeneratedResult(data);
        onCodeOutput(data.code, `${name.trim().toLowerCase()}.js`);
      }
    } catch (err: any) {
      console.error(err);
      alert("Error de red llamando a la IA.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedResult) return;
    navigator.clipboard.writeText(generatedResult.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 shadow-2xl relative backdrop-blur-md" id="command-generator-root">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
          <Terminal className="w-5 h-5 animate-pulse" id="icon-terminal-gen" />
        </div>
        <div>
          <h3 className="font-display font-black text-lg text-white tracking-tight">Creador Inteligente de Comandos</h3>
          <p className="text-xs text-slate-400 mt-0.5">Genera código JS modular de alta eficiencia compatible con Baileys.</p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider font-mono">Nombre del comando</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl py-2.5 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono transition placeholder-slate-600 focus:border-slate-700"
              value={name}
              onChange={(e) => setName(e.target.value.replace(/\s+/g, ""))}
              placeholder="mazmorra"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider font-mono">Categoría</label>
            <select
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl py-2.5 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition cursor-pointer font-sans"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="personajes">🎰 Personajes (Fichas, PJs)</option>
              <option value="utilidades">⚔ Utilidades (Dados, Ayuda)</option>
              <option value="informacion">📌 Información</option>
              <option value="moderacion">🛡 Moderación de grupo</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider font-mono">Descripción corta</label>
          <input
            type="text"
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl py-2.5 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition placeholder-slate-600"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mazmorra de la Muerte Rápida"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider font-mono">Aliases (separados por coma)</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl py-2.5 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono transition placeholder-slate-600"
              value={aliases}
              onChange={(e) => setAliases(e.target.value)}
              placeholder="dungeon, mazmorra"
            />
          </div>

          <div className="flex gap-5 items-center pt-5 pl-1">
            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none font-sans font-medium">
              <input
                type="checkbox"
                className="rounded text-indigo-600 bg-slate-950 border-slate-800 cursor-pointer w-4 h-4"
                checked={adminOnly}
                onChange={(e) => setAdminOnly(e.target.checked)}
              />
              Solo Admins
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none font-sans font-medium">
              <input
                type="checkbox"
                className="rounded text-indigo-600 bg-slate-950 border-slate-800 cursor-pointer w-4 h-4"
                checked={groupOnly}
                onChange={(e) => setGroupOnly(e.target.checked)}
              />
              Solo Grupos
            </label>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold text-slate-300 block uppercase tracking-wider font-mono">Lógica del comando en lenguaje natural</label>
            <span className="text-[10px] text-indigo-300 bg-indigo-500/10 border border-indigo-500/25 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 animate-spin duration-3000" /> IA de Gemini
            </span>
          </div>
          <textarea
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl py-3 px-4 h-24 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition font-sans leading-relaxed resize-none"
            value={logic}
            onChange={(e) => setLogic(e.target.value)}
            placeholder="Describe qué cálculos lanzar, qué debe responder, qué stats usar..."
          />
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-200 shadow-[0_4px_15px_rgba(99,102,241,0.25)] hover:scale-102 cursor-pointer"
          disabled={loading}
          id="btn-generate-command"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Generando código optimizado...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Construir Comando RPG Modular</span>
            </>
          )}
        </button>
      </form>

      {generatedResult && (
        <div className="mt-6 space-y-5 border-t border-slate-800/80 pt-6 animate-fadeIn">
          {generatedResult.isOfflineFallback && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="font-bold">⚠️ Servidores de IA de Google Saturados (Simulación Activa)</p>
                <p className="text-[10px] text-slate-350 mt-1 leading-relaxed">
                  Se ha generado un comando RPG modular simulado de contingencia. El código conserva toda la especificación, los alias y la estructura optimizada y asíncrona compatible con Baileys.
                </p>
              </div>
            </div>
          )}

          <div className="p-4 bg-indigo-950/10 border border-indigo-500/20 rounded-xl text-xs text-slate-300">
            <h4 className="font-bold text-white mb-1.5 flex items-center gap-2 font-display">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              Explicación del Comando Generado
            </h4>
            <p className="text-[11px] leading-relaxed text-slate-350 font-sans">{generatedResult.explanation}</p>
          </div>

          <div className="rounded-xl border border-slate-800 overflow-hidden bg-[#030712] shadow-inner font-mono">
            <div className="flex justify-between items-center bg-slate-900/40 py-2.5 px-4 border-b border-slate-800/80">
              <span className="text-[10px] font-mono text-indigo-400 flex items-center gap-1.5 font-bold">
                <Code2 className="w-4 h-4" /> src/commands/{category}/{name}.js
              </span>
              <button
                onClick={handleCopy}
                className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
                title="Copiar código al portapapeles"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-xs font-mono text-indigo-300/90 leading-relaxed max-h-96">
              <code>{generatedResult.code}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
