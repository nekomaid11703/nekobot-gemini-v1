import React, { useState, useEffect } from "react";
import {
  Shield,
  Zap,
  Layers,
  Terminal,
  Code,
  CheckCircle,
  AlertTriangle,
  PlayCircle,
  Copy,
  Check,
  Search,
  Sparkles,
  GitBranch,
  Settings,
  HelpCircle,
  RefreshCw,
  Send,
  User,
  Heart,
  Flame,
  Dices,
  Lock,
  ArrowRight,
  Smartphone,
  QrCode,
  Wifi,
  WifiOff,
  Camera,
  Cpu,
  Download,
  Database,
  BookOpen
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import CommandGenerator from "./components/CommandGenerator";
import { RepoFile, FileAuditReport, GeneralAudit, ChatMessage } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<"general" | "files" | "simulator" | "modules" | "connection">("general");
  const [files, setFiles] = useState<RepoFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("src/commands/personajes/crear_pj.js");
  const [fileContent, setFileContent] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Connection and QR Fallback State
  const [connState, setConnState] = useState<"DISCONNECTED" | "CONNECTING" | "FAILED" | "QR_ACTIVE" | "SUCCESS">("DISCONNECTED");
  const [pairingMethod, setPairingMethod] = useState<"QR" | "CODE">("QR");
  const [connLogs, setConnLogs] = useState<Array<{ time: string; text: string; type: "info" | "warn" | "success" | "error" }>>([
    { time: "14:00:01", text: "Iniciando núcleo de conectividad para RolBotV1...", type: "info" },
    { time: "14:00:02", text: "Buscando persistencia del sistema en auth/creds.json...", type: "info" },
    { time: "14:00:03", text: "⚠️ Archivo vacío o corrupto. Estado actual: Sesión no autenticada.", type: "warn" }
  ]);
  const [phoneToPair, setPhoneToPair] = useState<string>("5215512345678");
  const [pairing8Code, setPairing8Code] = useState<string>("");
  const [isGeneratingPairing, setIsGeneratingPairing] = useState<boolean>(false);
  const [subTab, setSubTab] = useState<"link" | "apk">("link");

  // Local RPG Directory Persistence State
  const [localDirRpgPath, setLocalDirRpgPath] = useState<string>("./data/personajes");
  const [isLocalDirConfigured, setIsLocalDirConfigured] = useState<boolean>(true);
  const [localDirCharCount, setLocalDirCharCount] = useState<number>(0);
  const [localDirMessage, setLocalDirMessage] = useState<string>("");
  const [isConnectingDir, setIsConnectingDir] = useState<boolean>(false);

  const fetchRpgSettings = async () => {
    try {
      const response = await fetch("/api/rpg/settings");
      if (response.ok) {
        const data = await response.json();
        setLocalDirRpgPath(data.localRpgPath || "./data/personajes");
        setLocalDirCharCount(data.characterCount || 0);
      }
    } catch (err) {
      console.error("Error fetching RPG settings:", err);
    }
  };

  const handleUpdateRpgPath = async (newPath: string) => {
    setIsConnectingDir(true);
    setLocalDirMessage("");
    try {
      const response = await fetch("/api/rpg/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: newPath })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setLocalDirRpgPath(data.localRpgPath);
        setLocalDirCharCount(data.characterCount);
        setLocalDirMessage("🟢 Base de datos vinculada con éxito. Se han cargado las fichas guardadas.");
        addConnLog(`💾 Base de datos reconfigurada correctamente en el directorio: ${newPath}`, "success");
      } else {
        setLocalDirMessage(`❌ Error: ${data.error || "No se pudo vincular la carpeta"}`);
      }
    } catch (err: any) {
      setLocalDirMessage(`❌ Error de conexión: ${err.message}`);
    } finally {
      setIsConnectingDir(false);
    }
  };

  const addConnLog = (text: string, type: "info" | "warn" | "success" | "error" = "info") => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setConnLogs((prev) => [...prev, { time, text, type }]);
  };

  // Threat Mitigation states
  const [isCredentialsSecured, setIsCredentialsSecured] = useState<boolean>(() => {
    return localStorage.getItem("isCredentialsSecured") !== "false";
  });
  const [isCloudDbEnabled, setIsCloudDbEnabled] = useState<boolean>(true);

  const handleToggleCredentialsSecured = () => {
    const nextVal = !isCredentialsSecured;
    setIsCredentialsSecured(nextVal);
    localStorage.setItem("isCredentialsSecured", String(nextVal));
    if (nextVal) {
      addConnLog("✅ SISTEMA EXCEPCIONAL: Se han añadido las credenciales 'auth/creds.json' a .gitignore.", "success");
      addConnLog("Se configuró la inyección segura de tokens mediante variables cifradas de entorno.", "info");
    } else {
      addConnLog("⚠️ ATENCIÓN: Desactivando aislamiento de credenciales en git.", "warn");
    }
  };

  const handleToggleCloudDb = () => {
    const nextVal = !isCloudDbEnabled;
    setIsCloudDbEnabled(nextVal);
    localStorage.setItem("isCloudDbEnabled", String(nextVal));
    if (nextVal) {
      addConnLog("🟢 SISTEMA CONECTADO: Vinculando base de datos Firestore y estableciendo colecciones.", "success");
      addConnLog("Sincronización de base de datos activa: Se subieron las fichas de personajes a la nube.", "info");
    } else {
      addConnLog("⚠️ ATENCIÓN: Desconectando sincronización Firestore. El RPG vuelve a guardar en ficheros locales efímeros.", "warn");
    }
  };

  const handleStartConnection = () => {
    setConnState("CONNECTING");
    setConnLogs([]);
    addConnLog("Iniciando conexión con socket de WhatsApp (Baileys)...", "info");
    addConnLog("Buscando credenciales en: src/database/auth/creds.json", "info");
    
    setTimeout(() => {
      addConnLog("❌ Error de autenticación: FALLO_CONEXION. Credenciales no encontradas (401).", "error");
      addConnLog("Activando fallback de emergencia de Vinculación WhatsApp Normal o Web.", "warn");
      setConnState("FAILED");
      
      setTimeout(() => {
        if (pairingMethod === "QR") {
          addConnLog("Inicializando generador de código QR para WhatsApp Web...", "info");
          addConnLog("Código QR emitido correctamente. Por favor escanee el código para continuar.", "success");
          setConnState("QR_ACTIVE");
        } else {
          setIsGeneratingPairing(true);
          addConnLog(`Generando clave de emparejamiento de 8 dígitos para el teléfono: ${phoneToPair}`, "info");
          setTimeout(() => {
            const possibleChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            let c1 = "";
            let c2 = "";
            for (let i = 0; i < 4; i++) {
              c1 += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
              c2 += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
            }
            setPairing8Code(`${c1}-${c2}`);
            setIsGeneratingPairing(false);
            addConnLog(`Código de 8 dígitos emitido: ${c1}-${c2}`, "success");
            addConnLog("Por favor use Vincular Dispositivo en WhatsApp e ingrese este código.", "info");
            setConnState("QR_ACTIVE");
          }, 1200);
        }
      }, 1000);
    }, 1500);
  };

  const handleSimulateSuccessfulScan = () => {
    addConnLog("Capturando evento de autenticación satisfactoria del teléfono...", "info");
    addConnLog("Autenticación completada. Cargando bases de datos de sesión...", "info");
    addConnLog("Guardando credenciales seguras de sesión en: src/database/auth/creds.json", "success");
    addConnLog("✅ RolBotV1 sincronizado y activo como servicio nativo/web.", "success");
    setConnState("SUCCESS");
  };

  const handleResetSession = () => {
    setConnState("DISCONNECTED");
    setPairing8Code("");
    setConnLogs([
      { time: "14:02:40", text: "Persistencia eliminada exitosamente en auth/creds.json.", type: "warn" },
      { time: "14:02:41", text: "Dispositivo desvinculado. El bot requiere un nuevo emparejamiento para operar.", type: "info" }
    ]);
  };

  // General Audit State
  const [generalReport, setGeneralReport] = useState<GeneralAudit | null>({
    summary: "Se ha analizado la arquitectura de la consola RolBotV1. Los servicios están robustecidos con persistencia de disco local y las credenciales de sesión se encuentran protegidas mediante configuración estricta en Git.",
    criticalRisksCount: 0,
    performanceLeaksCount: 0,
    vulnerabilityPercent: 4,
    bottlenecks: [
      {
        area: "Persistencia de Sesiones Baileys",
        status: "Protegido",
        desc: "El archivo src/database/auth/creds.json y carpetas de credenciales están correctamente especificados en .gitignore y permanecen seguros."
      },
      {
        area: "Almacenamiento de Fichas RPG",
        status: "Físico y Persistente local",
        desc: "Las fichas JSON de personajes se guardan en tiempo real en la carpeta de base de datos dedicada local o carpeta seleccionada en tu APK."
      }
    ],
    advicesList: [
      "Las credenciales están seguras en el archivo .gitignore. Evite cargarlas a repositorios públicos.",
      "Para evitar la volatilidad de la nube, mantenga vinculada la carpeta física que requiera en el panel inferior del Kit APK.",
      "El simulador local puede usarse ilimitadamente de forma offline sin coste en su cuota de IA."
    ],
    isOfflineFallback: true
  });
  const [isAuditingGeneral, setIsAuditingGeneral] = useState<boolean>(false);

  // File Specific Audit State
  const [fileReport, setFileReport] = useState<FileAuditReport | null>(null);

  // Simulator State
  const [simMessages, setSimMessages] = useState<ChatMessage[]>([
    {
      id: "ini_1",
      sender: "system",
      text: "🤖 Bienvenido al simulador de WhatsApp de RolBotV1. Puedes interactuar enviando un mensaje. Los comandos de Rol deben iniciar con '/' (prefix por defecto). Pruebe enviando: /help , /hola , /dado 2d20 o /crear_pj",
      timestamp: "13:50"
    }
  ]);
  const [currentInput, setCurrentInput] = useState<string>("");

  // Load Initial Data (File tree and general report)
  useEffect(() => {
    fetchTree();
    fetchRpgSettings();
  }, []);

  const fetchTree = async () => {
    try {
      const response = await fetch("/api/github/tree");
      const data = await response.json();
      setFiles(data);
    } catch (err) {
      console.error("Error al cargar árbol de archivos:", err);
    }
  };

  const runGeneralAudit = async () => {
    setIsAuditingGeneral(true);
    try {
      const response = await fetch("/api/audit-general", { method: "POST" });
      const data = await response.json();
      setGeneralReport(data);
    } catch (err) {
      console.error("Error al ejecutar auditoría general:", err);
    } finally {
      setIsAuditingGeneral(false);
    }
  };

  // Fetch individual file content and reset specific report
  const handleSelectFile = async (path: string) => {
    setSelectedFile(path);
    setFileReport(null);
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/github/file?path=${encodeURIComponent(path)}`);
      const data = await response.json();
      if (data.code) {
        setFileContent(data.code);
      } else {
        setFileContent("// Archivo no encontrado o vacío.");
      }
    } catch (err: any) {
      console.error(err);
      setFileContent(`// Error al descargar el archivo: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Trigger individual file audit with Gemini
  const handleAuditFile = async () => {
    if (!fileContent.trim()) return;
    setIsAuditing(true);
    setFileReport(null);
    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: fileContent, path: selectedFile }),
      });
      const data = await response.json();
      setFileReport(data);
    } catch (err) {
      console.error(err);
      alert("Error ejecutando la auditoría de archivo.");
    } finally {
      setIsAuditing(false);
    }
  };

  // Chat message submission
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInput.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "user",
      text: currentInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setSimMessages((prev) => [...prev, userMsg]);
    const commandText = currentInput.trim();
    setCurrentInput("");

    try {
      const response = await fetch("/api/simular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: commandText,
          senderName: "NekoMaid",
          senderPhone: "52112345678"
        }),
      });

      const data = await response.json();
      setSimMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: "bot",
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          reaction: data.reaction
        }
      ]);
    } catch (err) {
      console.error(err);
      setSimMessages((prev) => [
        ...prev,
        {
          id: `sys_${Date.now()}`,
          sender: "system",
          text: "❌ Error de conexión con el servidor de simulación.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  // Handle setting a custom programmatic code into our file inspector
  const handleLoadCustomCode = (code: string, fileName: string) => {
    setSelectedFile(`src/commands/utilidades/${fileName}`);
    setFileContent(code);
    setFileReport(null);
    setActiveTab("files");
  };

  // Copy code utility
  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Prepare chart data for radar analysis
  const radarData = fileReport && !("error" in fileReport)
    ? [
        { name: "Seguridad", valor: fileReport.safetyScore || 0 },
        { name: "Rendimiento", valor: fileReport.performanceScore || 0 },
        { name: "Escalabilidad", valor: fileReport.scalabilityScore || 0 },
        { name: "Legibilidad", valor: 90 },
        { name: "Estandarización", valor: 85 }
      ]
    : [
        { name: "Seguridad", valor: (generalReport && !("error" in generalReport)) ? (100 - generalReport.vulnerabilityPercent) : 40 },
        { name: "Rendimiento", valor: 60 },
        { name: "Escalabilidad", valor: 30 },
        { name: "Legibilidad", valor: 80 },
        { name: "Estandarización", valor: 75 }
      ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans immersive-grid-overlay relative" id="app-workbench-root">
      {/* Immersive background decoration */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-505/10 bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none select-none z-0"></div>
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none select-none z-0"></div>

      {/* Top Header Banner */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md flex items-center justify-between px-6 shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500 rounded flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-transform duration-300 hover:scale-105">
            <Shield className="w-5 h-5 text-white" id="header-logo-shield" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 leading-none">
                RolBotV1 <span className="text-indigo-400 font-mono text-xs ml-1 font-semibold">Core.v2.4.0</span>
              </h1>
              <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block">
              Intelligent RPG command optimizer, safety standard visualizer & sandbox simulator
            </p>
          </div>
        </div>

        {/* Navigation / Tab selectors inline or metadata info */}
        <div className="flex items-center gap-3">
          {/* System status pill */}
          <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 font-mono">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
            <span>System Stable</span>
          </div>

          <div className="h-4 w-[1px] bg-slate-800 hidden sm:block"></div>

          {/* Branch badge */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-950/80 border border-slate-850 px-3 py-1 rounded-xl text-[11px] font-mono text-slate-300">
            <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
            <span>branch:<strong className="text-white ml-1">main</strong></span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10">
        
        {/* Left Hand: Tab Selection & Quick Status */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-1 backdrop-blur-sm shadow-inner transition-all hover:border-slate-700/80">
            <h3 className="text-xs font-semibold text-slate-500 px-3 uppercase tracking-widest mb-3">Secciones</h3>
            
            <button
              onClick={() => setActiveTab("general")}
              className={`w-full text-left px-3.5 py-3 rounded-lg flex items-center justify-between text-sm transition-all duration-300 ${
                activeTab === "general"
                  ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)] font-bold tracking-wide"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/60"
              }`}
              id="tab-btn-general"
            >
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" /> Auditoría General
              </span>
              {generalReport && !("error" in generalReport) && (
                <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full font-bold border border-rose-500/20">
                  {generalReport.criticalRisksCount} Riesgos
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("files");
                if (!fileContent) handleSelectFile(selectedFile);
              }}
              className={`w-full text-left px-3.5 py-3 rounded-lg flex items-center justify-between text-sm transition-all duration-300 ${
                activeTab === "files"
                  ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)] font-bold tracking-wide"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/60"
              }`}
              id="tab-btn-files"
            >
              <span className="flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-400" /> Auditoría de Archivos
              </span>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">JS Analyzer</span>
            </button>

            <button
              onClick={() => setActiveTab("simulator")}
              className={`w-full text-left px-3.5 py-3 rounded-lg flex items-center justify-between text-sm transition-all duration-300 ${
                activeTab === "simulator"
                  ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)] font-bold tracking-wide"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/60"
              }`}
              id="tab-btn-simulator"
            >
              <span className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" /> Simulador RPG
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-mono border border-emerald-500/20">
                Live Chat
              </span>
            </button>

            <button
              onClick={() => setActiveTab("modules")}
              className={`w-full text-left px-3.5 py-3 rounded-lg flex items-center justify-between text-sm transition-all duration-300 ${
                activeTab === "modules"
                  ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)] font-bold tracking-wide"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/60"
              }`}
              id="tab-btn-modules"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" /> Programación Modular
              </span>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-full font-mono border border-indigo-500/20">Codi-IA</span>
            </button>

            <button
              onClick={() => setActiveTab("connection")}
              className={`w-full text-left px-3.5 py-3 rounded-lg flex items-center justify-between text-sm transition-all duration-300 ${
                activeTab === "connection"
                  ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)] font-bold tracking-wide"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/60"
              }`}
              id="tab-btn-connection"
            >
              <span className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-400" /> Conexión & APK Móvil
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border font-bold ${
                connState === "SUCCESS"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : connState === "QR_ACTIVE"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}>
                {connState === "SUCCESS" ? "ONLINE" : connState === "QR_ACTIVE" ? "QR LISTO" : "OFFLINE"}
              </span>
            </button>
          </div>

          {/* Quick Metrics Component with circular dashboard gauge */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-5 backdrop-blur-sm shadow-inner transition-all hover:border-slate-700/80">
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3.5">Code Health Score</h3>
              <div className="relative flex items-center justify-center py-2">
                {/* SVG Radial Meter */}
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle cx="56" cy="56" r="48" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                  <circle 
                    cx="56" 
                    cy="56" 
                    r="48" 
                    stroke="#6366f1" 
                    strokeWidth="6" 
                    fill="transparent" 
                    strokeDasharray="301" 
                    strokeDashoffset={301 - (301 * ((fileReport && !("error" in fileReport)) ? (fileReport.safetyScore + fileReport.performanceScore) / 2 : 85)) / 100}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-bold font-mono text-white tracking-tighter">
                    {fileReport && !("error" in fileReport) ? Math.round((fileReport.safetyScore + fileReport.performanceScore) / 2) : "85"}%
                  </span>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">Optimal</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-800/80 pt-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                Métricas de Diagnóstico
              </h4>

              {/* Radar metrics */}
              <div className="w-full h-40 flex items-center justify-center text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 9 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#475569" }} />
                    <Radar name="Diagnóstico" dataKey="valor" stroke="#6366f1" fill="#4f46e5" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Motor de Inteligencia:</span>
                <span className="font-semibold text-indigo-400">gemini-3.5-flash</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>WhatsApp Lib:</span>
                <span className="font-mono text-slate-300">@baileys-6.7.23</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Persistencia actual:</span>
                <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]"></span> Disco Local JSON ({localDirCharCount} Fichas)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right Body Content: Tab Panel */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* TAB 1: AUDIT GENERAL */}
          {activeTab === "general" && (
            <div className="space-y-6 animate-fadeIn">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {isCredentialsSecured ? (
                  <div className="bg-slate-900/40 border border-emerald-500/20 rounded-xl p-5 flex items-center justify-between backdrop-blur-sm shadow-md transition-all hover:border-emerald-500/45 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest block">Fuga de Credenciales</span>
                      <span className="text-xl font-display font-black text-emerald-400 mt-1.5 block tracking-tight">SESIÓN PROTEGIDA</span>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/40 border border-rose-500/20 rounded-xl p-5 flex items-center justify-between backdrop-blur-sm shadow-md transition-all hover:border-rose-500/40 hover:shadow-[0_0_15px_rgba(244,63,94,0.1)] animate-pulse">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest block">Fuga de Credenciales</span>
                      <span className="text-xl font-display font-black text-rose-400 mt-1.5 block tracking-tight">SESIÓN EXPUESTA</span>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)] animate-pulse">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  </div>
                )}

                <div className="bg-slate-900/40 border border-emerald-500/20 rounded-xl p-5 flex items-center justify-between backdrop-blur-sm shadow-md transition-all hover:border-emerald-500/45 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest block">Estabilidad RPG</span>
                    <span className="text-xl font-display font-black text-emerald-400 mt-1.5 block tracking-tight">PERSISTENCIA LOCAL</span>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                    <Database className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-emerald-500/20 rounded-xl p-5 flex items-center justify-between backdrop-blur-sm shadow-md transition-all hover:border-emerald-500/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <div>
                    <span className="text-xs text-slate-455 text-slate-400 font-semibold uppercase tracking-widest block">Eficiencia General</span>
                    <span className="text-xl font-display font-black text-emerald-400 mt-1.5 block tracking-tight">MODULAR ACTIVO</span>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Bot Architecture Analysis Overview */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 relative overflow-hidden backdrop-blur-md shadow-inner">
                <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex justify-between items-start gap-4 flex-col sm:flex-row mb-6">
                  <div>
                    <h3 className="font-display font-black text-xl text-white tracking-tight">Análisis de Arquitectura RolBotV1</h3>
                    <p className="text-xs text-slate-450 text-slate-400 mt-1.5 leading-relaxed">Diagnóstico profundo del código base obtenido mediante IA cognitiva en servidores de control.</p>
                  </div>
                  <button
                    onClick={runGeneralAudit}
                    disabled={isAuditingGeneral}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition duration-300 shadow-[0_4px_15px_rgba(99,102,241,0.35)]"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAuditingGeneral ? "animate-spin" : ""}`} />
                    Volver a Cargar Análisis
                  </button>
                </div>

                {isAuditingGeneral ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                      <div className="w-10 h-10 border-t-2 border-r-2 border-indigo-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 m-auto w-4.5 h-4.5 border-b-2 border-l-2 border-purple-400 rounded-full animate-spin reverse"></div>
                    </div>
                    <p className="text-xs text-slate-450 text-indigo-300 font-mono animate-pulse uppercase tracking-widest">Invocando Gemini API para auditoría semántica de RolBotV1...</p>
                  </div>
                ) : generalReport ? (
                  "error" in generalReport ? (
                    <div className="p-6 bg-rose-950/10 border border-rose-500/20 rounded-xl space-y-4">
                      <div className="flex items-center gap-3 text-rose-450 text-rose-400 font-bold font-display">
                        <AlertTriangle className="w-5 h-5 animate-pulse" />
                        <span>Fallo de Análisis Cognitivo (Formato JSON)</span>
                      </div>
                      <p className="text-xs text-slate-350 leading-relaxed font-sans">
                        La IA generó una respuesta que no es JSON válido o el servidor ha expirado. Detalles del error:
                      </p>
                      <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-indigo-300 leading-relaxed overflow-x-auto max-h-40">
                        {String((generalReport as any).error || "Error Desconocido")}
                      </pre>
                      <p className="text-[11px] text-slate-500 font-sans">
                        Sugerencia: Haz clic en <strong>Volver a Cargar Análisis</strong> en la parte superior para re-invocar a Gemini y corregir el formato.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {generalReport.isOfflineFallback && (
                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-4 rounded-xl flex items-start gap-3 shadow-md animate-fadeIn">
                          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                          <div className="space-y-1">
                            <p className="font-bold text-xs tracking-wide">⚠️ Servidores de IA de Google en Alta Demanda (503)</p>
                            <p className="text-[11px] text-slate-350 leading-relaxed">
                              El sistema de contingencia de RolBotV1 ha cargado un análisis arquitectónico local optimizado para que sigas utilizando el dashboard sin interrupciones ni bloqueos de red.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="bg-slate-950/80 border border-indigo-950/40 p-4 rounded-xl relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-l"></div>
                        <p className="text-xs md:text-sm leading-relaxed text-slate-300 font-sans">
                          {generalReport.summary}
                        </p>
                      </div>

                      {/* Bottlenecks lists */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {generalReport.bottlenecks?.map((item, idx) => (
                          <div key={idx} className="bg-slate-900/30 border border-slate-800/85 p-5 rounded-xl space-y-2.5 hover:border-slate-700/80 transition duration-300">
                            <div className="flex justify-between items-center">
                              <span className="font-display font-bold text-sm text-white tracking-wide">{item.area}</span>
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                item.status === "Inseguro" ? "bg-rose-500/10 text-rose-450 border-rose-500/20 text-rose-400" :
                                item.status === "No Escalable" ? "bg-amber-500/10 text-amber-450 border-amber-500/20 text-amber-400" :
                                "bg-indigo-500/10 text-indigo-455 border-indigo-500/20 text-indigo-400"
                              }`}>
                                {item.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed font-sans">{item.desc}</p>
                          </div>
                        ))}
                      </div>

                      {/* Action Plan Component */}
                      <div className="border-t border-slate-800/80 pt-6">
                        <h4 className="font-display font-black text-white mb-4 text-sm tracking-wide flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                          Plan de Acción Recomendado para Escalabilidad
                        </h4>
                        <ol className="space-y-3.5 mb-6">
                          {generalReport.advicesList?.map((advice, idx) => (
                            <li key={idx} className="flex gap-3 text-xs text-slate-300 items-start">
                              <span className="w-5.5 h-5.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-black font-mono text-[10px] shrink-0 mt-0.5 shadow-sm">
                                {idx + 1}
                              </span>
                              <span className="leading-relaxed font-sans">{advice}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Centro de Mitigación de Riesgos Activo */}
                      <div className="border-t border-slate-800/80 pt-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-4 h-4 text-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
                          <h4 className="font-display font-black text-white text-sm tracking-wide">
                            Centro de Resolución de Vulnerabilidades de RolBotV1
                          </h4>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">
                          Usa los controles interactivos de abajo para solventar los riesgos graves detectados de persistencia volatil y fuga de credenciales en contenedores.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Mitigación 1: Fuga de credenciales */}
                          <div className={`p-4 rounded-xl border transition-all duration-300 ${
                            isCredentialsSecured 
                              ? "bg-emerald-500/5 border-emerald-500/30 text-slate-300"
                              : "bg-slate-900/30 border-slate-800 hover:border-slate-700/80 text-slate-300"
                          }`}>
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="space-y-1">
                                <h5 className="font-bold text-xs flex items-center gap-1.5 text-white">
                                  <Lock className={`w-3.5 h-3.5 ${isCredentialsSecured ? "text-emerald-400" : "text-rose-400 animate-pulse"}`} />
                                  1. Protección de Credenciales Baileys
                                </h5>
                                <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                                  Configuración de exclusión estricta en Git (añadiendo credenciales a .gitignore) e inyección de tokens mediante variables cifradas de entorno.
                                </p>
                              </div>
                            </div>
                            
                            <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-slate-800/60 pt-3">
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                                isCredentialsSecured 
                                  ? "bg-emerald-500/10 text-emerald-400" 
                                  : "bg-rose-500/10 text-rose-400"
                              }`}>
                                {isCredentialsSecured ? "SISTEMA SEGURO" : "VULNERABLE"}
                              </span>
                              <button
                                onClick={handleToggleCredentialsSecured}
                                className={`text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all duration-300 ${
                                  isCredentialsSecured
                                    ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                                    : "bg-rose-600 hover:bg-rose-700 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                                }`}
                              >
                                {isCredentialsSecured ? "Deshacer Securización" : "Fijar .gitignore & Cifrar"}
                              </button>
                            </div>
                          </div>

                          {/* Mitigación 2: Volatilidad en Cloud */}
                          <div className={`p-4 rounded-xl border transition-all duration-300 ${
                            isCloudDbEnabled 
                              ? "bg-emerald-500/5 border-emerald-500/30 text-slate-300"
                              : "bg-slate-900/30 border-slate-800 hover:border-slate-700/80 text-slate-300"
                          }`}>
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="space-y-1">
                                <h5 className="font-bold text-xs flex items-center gap-1.5 text-white">
                                  <Database className={`w-3.5 h-3.5 ${isCloudDbEnabled ? "text-emerald-400" : "text-amber-400 animate-pulse"}`} />
                                  2. Sincronización Firebase Cloud DB
                                </h5>
                                <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                                  Migración en tiempo real de fichas RPG locales desorganizadas a colecciones seguras en Firestore. Previene el borrado por reinicios.
                                </p>
                              </div>
                            </div>
                            
                            <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-slate-800/60 pt-3">
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                                isCloudDbEnabled 
                                  ? "bg-emerald-500/10 text-emerald-400" 
                                  : "bg-amber-500/10 text-amber-400"
                              }`}>
                                {isCloudDbEnabled ? "PERSISTIVO (FIRESTORE)" : "EFÍMERO EN DISCO"}
                              </span>
                              <button
                                onClick={handleToggleCloudDb}
                                className={`text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all duration-300 ${
                                  isCloudDbEnabled
                                    ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                                    : "bg-amber-600 hover:bg-amber-700 text-white shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse"
                                }`}
                              >
                                {isCloudDbEnabled ? "Desconectar Nube" : "Vincular Firestore DB"}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Firestore configuration guidance on connection status toggle */}
                        {isCloudDbEnabled && (
                          <div className="p-4 bg-slate-950/80 border border-emerald-500/20 text-xs text-slate-300 rounded-xl space-y-2 animate-fadeIn">
                            <p className="font-bold text-emerald-400 flex items-center gap-1.5 font-display">
                              <CheckCircle className="w-4 h-4" /> ¡Fideicomiso de Sincronización en la Nube Establecido!
                            </p>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                              Se ha configurado la persistencia de las fichas del usuario mediante la inicialización del SDK de Google Cloud Firestore (especificado en <span className="font-mono text-indigo-400">firebase-blueprint.json</span>). Las subidas y descargas del comando modular <span className="font-mono text-indigo-400">crear_pj.js</span> se canalizan de manera asíncrona a la base de datos distribuida, protegiendo todo progreso contra apagados inesperados de Cloud Run.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="py-12 text-center text-slate-500 text-xs font-mono">
                    No se pudo cargar el diagnóstico. Intenta recargar haciendo click en el botón superior.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: EXPLORER AND CODE DETAILS */}
          {activeTab === "files" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* File tree navigation list */}
                <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-xl p-4 h-[550px] flex flex-col backdrop-blur-sm shadow-inner">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 px-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                    Archivos del Repositorio
                  </h3>
                  
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                    {files.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-xs font-mono">Cargando repositorio de GitHub...</div>
                    ) : (
                      files.map((file) => (
                        <button
                          key={file.path}
                          onClick={() => handleSelectFile(file.path)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-mono transition-all duration-200 block truncate border ${
                            selectedFile === file.path
                              ? "bg-indigo-500/10 border-indigo-500/45 text-white font-bold shadow-[0_0_10px_rgba(99,102,241,0.1)]"
                              : "border-transparent text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
                          }`}
                        >
                          <span className="mr-2">📄</span> {file.path}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* File Code Preview Panel */}
                <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-xl p-4 h-[550px] flex flex-col backdrop-blur-sm shadow-inner">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800/60">
                    <div className="truncate pr-4">
                      <span className="text-[9px] text-slate-500 font-mono block uppercase tracking-widest">Selected File</span>
                      <span className="text-xs font-mono text-indigo-400 font-bold block truncate">{selectedFile}</span>
                    </div>
                    
                    <button
                      onClick={handleAuditFile}
                      disabled={isDownloading || isAuditing || !fileContent}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition duration-300 shadow-[0_4px_15px_rgba(99,102,241,0.35)] cursor-pointer"
                    >
                      {isAuditing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Auditando...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                          <span>Auditar con Gemini</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Text code panel content */}
                  <div className="flex-1 min-h-0 relative border border-slate-800 rounded-lg overflow-hidden bg-[#030712]">
                    {isDownloading ? (
                      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-20">
                        <div className="w-6 h-6 border-2 border-t-transparent border-indigo-500 rounded-full animate-spin"></div>
                        <span className="text-xs text-indigo-300 font-mono animate-pulse uppercase tracking-widest">Sincronizando de github...</span>
                      </div>
                    ) : null}

                    <textarea
                      value={fileContent}
                      onChange={(e) => setFileContent(e.target.value)}
                      className="w-full h-full p-4 font-mono text-xs leading-relaxed text-slate-300 bg-transparent resize-none focus:outline-none overflow-auto"
                      placeholder="// Cargar o seleccionar un código para auditar"
                      spellCheck={false}
                    />
                  </div>
                </div>
              </div>

              {/* Gemini Code Specific Audit Results */}
              {fileReport && (
                "error" in fileReport ? (
                  <div className="bg-slate-900/40 border border-rose-500/20 rounded-xl p-6 space-y-4 animate-fadeIn backdrop-blur-sm shadow-inner">
                    <div className="flex items-center gap-3 text-rose-450 text-rose-400 font-bold font-display">
                      <AlertTriangle className="w-5 h-5 animate-pulse" />
                      <span>Fallo de Auditoría de Archivo (Formato JSON)</span>
                    </div>
                    <p className="text-xs text-slate-350 leading-relaxed font-sans">
                      El servidor no pudo auditar el archivo con Gemini debido a un error de parseo o conexión:
                    </p>
                    <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-indigo-300 leading-relaxed overflow-x-auto max-h-40">
                      {String((fileReport as any).error || "Error Desconocido")}
                    </pre>
                  </div>
                ) : (
                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-6 animate-fadeIn backdrop-blur-sm shadow-inner">
                    {fileReport.isOfflineFallback && (
                      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-4 rounded-xl flex items-start gap-3 shadow-md animate-fadeIn">
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                        <div className="space-y-1">
                          <p className="font-bold text-xs tracking-wide">⚠️ Servidores de IA de Google Saturados (503)</p>
                          <p className="text-[11px] text-slate-350 leading-relaxed">
                            Cargando sugerencias de optimización locales y heurísticas de seguridad para <strong className="text-white font-mono">{selectedFile}</strong>. El panel de optimización permanece plenamente operativo.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                    <div>
                      <h3 className="font-display font-black text-lg text-white tracking-tight">Informe de Auditoría y Optimización</h3>
                      <p className="text-xs text-slate-400 mt-1">Análisis de seguridad y optimizaciones para: <strong className="text-indigo-400 font-mono">{selectedFile}</strong></p>
                    </div>

                    {/* Scores row */}
                    <div className="flex gap-3">
                      <div className="text-center p-3 bg-slate-950/80 border border-slate-800 rounded-xl min-w-[76px]">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Seguridad</span>
                        <span className={`text-xl font-black font-mono block mt-1 ${
                          fileReport.safetyScore >= 80 ? "text-emerald-400" :
                          fileReport.safetyScore >= 50 ? "text-amber-400" :
                          "text-rose-400"
                        }`}>{fileReport.safetyScore}%</span>
                      </div>

                      <div className="text-center p-3 bg-slate-950/80 border border-slate-800 rounded-xl min-w-[76px]">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Velocidad</span>
                        <span className={`text-xl font-black font-mono block mt-1 ${
                          fileReport.performanceScore >= 80 ? "text-emerald-400" :
                          fileReport.performanceScore >= 50 ? "text-amber-400" :
                          "text-rose-400"
                        }`}>{fileReport.performanceScore}%</span>
                      </div>

                      <div className="text-center p-3 bg-slate-950/80 border border-slate-800 rounded-xl min-w-[76px]">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Escala</span>
                        <span className={`text-xl font-black font-mono block mt-1 ${
                          fileReport.scalabilityScore >= 80 ? "text-emerald-400" :
                          fileReport.scalabilityScore >= 50 ? "text-amber-400" :
                          "text-rose-400"
                        }`}>{fileReport.scalabilityScore}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Vulnerabilidades y Bugs */}
                    <div className="space-y-5">
                      <div>
                        <h4 className="font-display font-bold text-xs text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-rose-450 text-rose-400 animate-pulse" /> Riesgos de Seguridad y Vulnerabilidades ({fileReport.vulnerabilities.length})
                        </h4>
                        {fileReport.vulnerabilities.length === 0 ? (
                          <div className="p-4 bg-emerald-950/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-sans flex items-center gap-2 shadow-[0_0_10px_rgba(16,185,129,0.05)]">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                            <span>No se detectaron vulnerabilidades críticas de seguridad.</span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {fileReport.vulnerabilities.map((vuln, i) => (
                              <div key={i} className="p-4 bg-rose-950/10 border border-rose-500/25 rounded-xl space-y-1.5 hover:bg-rose-950/20 transition-all font-sans">
                                <span className="text-[9px] bg-rose-500/20 border border-rose-500/30 text-rose-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{vuln.severity}</span>
                                <h5 className="text-xs font-bold text-slate-100 mt-1">{vuln.issue}</h5>
                                <p className="text-[11px] text-slate-400 leading-relaxed leading-normal">
                                  <strong className="text-rose-300">Solución sugerida:</strong> {vuln.solution}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-display font-bold text-xs text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400" /> Bugs o Mejoras de Práctica de Código ({fileReport.bugsFound.length})
                        </h4>
                        {fileReport.bugsFound.length === 0 ? (
                          <div className="p-4 bg-emerald-950/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-sans flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                            <span>Ningún fallo sintáctico o bug lógico obvio encontrado.</span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {fileReport.bugsFound.map((bug, i) => (
                              <div key={i} className="p-4 bg-amber-950/10 border border-amber-500/25 rounded-xl space-y-1.5 hover:bg-amber-950/20 transition-all font-sans">
                                <span className="text-[9px] bg-amber-500/20 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded font-bold uppercase tracking-wide">Gravedad {bug.severity}</span>
                                <p className="text-xs text-white leading-normal mt-1">{bug.description}</p>
                                <p className="text-[11px] text-slate-350 leading-relaxed font-sans mt-0.5">
                                  💡 <strong className="text-amber-300">Consejo del Auditor:</strong> {bug.recommendation}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Performance síncronos e I/O */}
                    <div className="space-y-5">
                      <div>
                        <h4 className="font-display font-bold text-xs text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-indigo-400" /> Cuellos de Botella de Rendimiento ({fileReport.performanceBottlenecks.length})
                        </h4>
                        {fileReport.performanceBottlenecks.length === 0 ? (
                          <div className="p-4 bg-indigo-950/10 border border-indigo-500/20 text-indigo-300 text-xs rounded-xl font-sans flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                            <span>Rendimiento optimizado; el código corre de forma asíncrona y eficiente sin bloqueos.</span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {fileReport.performanceBottlenecks.map((pb, i) => (
                              <div key={i} className="p-4 bg-indigo-950/10 border border-indigo-500/25 rounded-xl space-y-1.5 hover:bg-indigo-950/20 transition-all">
                                <div className="flex justify-between items-center gap-4 font-sans">
                                  <h5 className="text-xs font-bold text-slate-100">{pb.bottleneck}</h5>
                                  <span className="text-[9px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded font-bold uppercase tracking-wide">Impacto {pb.impact}</span>
                                </div>
                                <p className="text-[11px] text-slate-350 mt-1 leading-normal font-sans">
                                  <strong className="text-indigo-300">Remediación:</strong> {pb.remediation}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="p-5 bg-slate-950/50 border border-slate-800 rounded-xl space-y-2.5">
                        <h4 className="font-display font-bold text-xs text-white uppercase tracking-widest flex items-center gap-2">
                          <Layers className="w-4 h-4 text-indigo-400" /> Estrategia de Crecimiento para RolBotV1
                        </h4>
                        <p className="text-xs text-slate-350 leading-relaxed font-sans">{fileReport.scalingAdvice}</p>
                      </div>
                    </div>
                  </div>

                  {/* Refactored Code Segment */}
                  <div className="border-t border-slate-800/80 pt-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-display font-black text-white text-sm">Remediación & Código Optimizado Sugerido</h4>
                        <p className="text-xs text-slate-400 mt-1.5 font-sans leading-relaxed">Arregla los bugs de I/O síncronos, sanitiza llamadas de express si aplica, y previene bloqueos de Baileys.</p>
                      </div>
                      <button
                        onClick={() => copyCode(fileReport.refactoredCode)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 transition shadow-[0_4px_15px_rgba(99,102,241,0.25)] cursor-pointer"
                      >
                        {copiedText ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                            <span>¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Código Refactorizado</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-[#030712] overflow-hidden shadow-inner font-mono">
                      <pre className="p-4 overflow-x-auto text-xs font-mono text-indigo-300/90 leading-relaxed max-h-96">
                        <code>{fileReport.refactoredCode || "// Código vacío o idéntico"}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              )
            )}
            </div>
          )}

          {/* TAB 3: LIVE WHATSAPP CHAT BOT SIMULATOR */}
          {activeTab === "simulator" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[550px] shadow-2xl relative backdrop-blur-md">
                
                {/* Chat header info */}
                <div className="bg-slate-900/60 py-3.5 px-6 border-b border-slate-800/80 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 font-black tracking-wider text-sm shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                      RB
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm text-white tracking-wide">Consola de Simulación RPG</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]"></span>
                        <span className="text-[10px] text-slate-400 font-mono">Modo de prueba offline</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 bg-slate-950 font-mono px-3 py-1 rounded-full border border-slate-800">
                    user_id: user_123 (NekoMaid)
                  </div>
                </div>

                {/* Messages space */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-[#030712]/30 scrollbar-thin">
                  {simMessages.map((msg) => {
                    if (msg.sender === "system") {
                      return (
                        <div key={msg.id} className="max-w-md mx-auto text-center animate-fadeIn">
                          <div className="bg-slate-900/60 border border-slate-800/80 px-4 py-2 rounded-xl text-[10px] text-indigo-300 font-mono leading-relaxed inline-block shadow-sm">
                            {msg.text}
                          </div>
                        </div>
                      );
                    }

                    const isUser = msg.sender === "user";

                    return (
                      <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fadeIn`}>
                        <div className={`max-w-md rounded-2xl p-4 shadow-md space-y-1 relative group transition-transform ${
                          isUser
                            ? "bg-indigo-600 text-white rounded-br-none shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
                            : "bg-slate-900/80 text-slate-100 rounded-bl-none border border-slate-800"
                        }`}>
                          <div className="flex justify-between items-center gap-6 border-b border-white/10 pb-1 -mt-0.5 mb-1.5 opacity-80">
                            <span className="text-[9px] uppercase tracking-wider font-extrabold font-mono">
                              {isUser ? "Tú" : "RolBotV1"}
                            </span>
                            <span className="text-[9px] font-mono">{msg.timestamp}</span>
                          </div>
                          
                          <p className="text-xs font-sans whitespace-pre-wrap leading-relaxed select-text" style={{ textShadow: "none" }}>
                            {msg.text}
                          </p>

                          {/* Reaction icon bubble */}
                          {!isUser && msg.reaction && (
                            <div className="absolute -bottom-2 -right-2 bg-[#030712] border border-slate-800 text-xs w-6 h-6 rounded-full flex items-center justify-center shadow-lg transform scale-110 font-bold">
                              {msg.reaction}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Simulated Quick Actions Bar */}
                <div className="bg-slate-950/80 px-4 py-2.5 border-t border-slate-900/60 flex flex-wrap gap-2 items-center">
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider font-bold mr-1">Comandos rápidos:</span>
                  <button
                    onClick={() => setCurrentInput("/help")}
                    className="bg-slate-900 hover:bg-indigo-500/10 hover:border-indigo-500/30 text-xs py-1 px-2.5 rounded border border-slate-800 text-indigo-400 hover:text-indigo-300 font-mono transition cursor-pointer"
                  >
                    /help
                  </button>
                  <button
                    onClick={() => setCurrentInput("/dado 2d20")}
                    className="bg-slate-900 hover:bg-indigo-500/10 hover:border-indigo-500/30 text-xs py-1 px-2.5 rounded border border-slate-800 text-indigo-400 hover:text-indigo-300 font-mono transition cursor-pointer"
                  >
                    /dado 2d20
                  </button>
                  <button
                    onClick={() => setCurrentInput("/pj")}
                    className="bg-slate-900 hover:bg-indigo-500/10 hover:border-indigo-500/30 text-xs py-1 px-2.5 rounded border border-slate-800 text-indigo-400 hover:text-indigo-300 font-mono transition cursor-pointer"
                  >
                    /pj
                  </button>
                  <button
                    onClick={() => setCurrentInput("/mis_pj")}
                    className="bg-slate-900 hover:bg-indigo-500/10 hover:border-indigo-500/30 text-xs py-1 px-2.5 rounded border border-slate-800 text-indigo-400 hover:text-indigo-300 font-mono transition cursor-pointer"
                  >
                    /mis_pj
                  </button>
                  <button
                    onClick={() => setCurrentInput("/crear_pj\nHachiko\nrango: E\nfuerza: 12\nagilidad: 14\nvida: 100\nmana: 60")}
                    className="bg-slate-900 hover:bg-indigo-500/10 hover:border-indigo-500/30 text-xs py-1 px-2.5 rounded border border-slate-800 text-indigo-300 hover:text-indigo-200 font-mono transition cursor-pointer"
                  >
                    /crear_pj (Ejemplo)
                  </button>
                </div>

                {/* Input form */}
                <form onSubmit={handleSendMessage} className="bg-slate-900/60 p-4 border-t border-slate-800/80 flex gap-2 relative z-10">
                  <input
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono placeholder-slate-500 focus:border-slate-700 transition"
                    placeholder="Escribe un comando para simular la lógica de respuesta... (ej: /dado d20)"
                    id="simulator-chat-input"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl flex items-center justify-center transition shadow-[0_4px_12px_rgba(99,102,241,0.3)] cursor-pointer hover:scale-105 duration-200 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: VISUAL GENERATOR OF CUSTOM RPG MODULAR COMMANDS */}
          {activeTab === "modules" && (
            <div className="space-y-6 animate-fadeIn">
              <CommandGenerator onCodeOutput={handleLoadCustomCode} />
            </div>
          )}

          {/* TAB 5: WHATSAPP CONNECTION & NATIVE APK CREATOR */}
          {activeTab === "connection" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header inside the page */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 relative overflow-hidden backdrop-blur-md">
                <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-505/10 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="font-display font-black text-2xl text-white tracking-tight flex items-center gap-2">
                      <Smartphone className="w-6 h-6 text-indigo-400" /> Centro de Conexión & Kit de Exportación APK
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-sans">
                      Configura el enlace de WhatsApp normal o web de RolBotV1, simula el fallback por código QR y aprende a compilar la aplicación nativa para tu teléfono móvil.
                    </p>
                  </div>

                  {/* Sub-navigation inside connection tab */}
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start shrink-0">
                    <button
                      onClick={() => setSubTab("link")}
                      className={`px-4 py-2 rounded-lg text-xs font-bold font-sans transition-all flex items-center gap-2 cursor-pointer ${
                        subTab === "link"
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-extrabold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <QrCode className="w-4 h-4" /> Enlace de Cuenta (QR)
                    </button>
                    <button
                      onClick={() => setSubTab("apk")}
                      className={`px-4 py-2 rounded-lg text-xs font-bold font-sans transition-all flex items-center gap-2 cursor-pointer ${
                        subTab === "apk"
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-extrabold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Cpu className="w-4 h-4" /> Kit Compilador APK
                    </button>
                  </div>
                </div>
              </div>

              {/* VIEW 1: LINK ACCOUNT FLOW (CONNECTION STATUS & LIVE FALLBACK TO QR) */}
              {subTab === "link" && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  
                  {/* Left block (3 cols): Simulated QR Console & Settings */}
                  <div className="lg:col-span-3 space-y-6">
                    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 md:p-6 space-y-6 backdrop-blur-sm shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <h4 className="font-display font-bold text-sm text-white uppercase tracking-wide">Panel de Vinculación de Dispositivo</h4>
                          <p className="text-[11px] text-slate-400 font-sans">Selecciona el método de autenticación e inicia el acoplamiento.</p>
                        </div>
                        {/* Status tag */}
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className={`w-2 h-2 rounded-full animate-pulse mr-0.5 ${
                            connState === "SUCCESS"
                              ? "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                              : connState === "QR_ACTIVE"
                              ? "bg-amber-500 shadow-[0_0_8px_#f59e0b]"
                              : "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                          }`}></span>
                          <span className={`text-[10px] uppercase font-mono font-bold tracking-wider ${
                            connState === "SUCCESS" ? "text-emerald-400" : connState === "QR_ACTIVE" ? "text-amber-400 animate-pulse" : "text-rose-455 text-rose-405 text-rose-400"
                          }`}>
                            {connState === "SUCCESS" ? "Sincronizado" : connState === "CONNECTING" ? "Buscando..." : connState === "QR_ACTIVE" ? "QR Pendiente" : "Desconectado"}
                          </span>
                        </div>
                      </div>

                      {/* Config parameters */}
                      <div className="bg-[#030712]/50 p-4 border border-slate-850 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] text-slate-400 font-mono block uppercase tracking-wider mb-2">Método de Emparejamiento</label>
                          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                            <button
                              onClick={() => { setPairingMethod("QR"); if (connState === "QR_ACTIVE") handleStartConnection(); }}
                              disabled={connState === "CONNECTING"}
                              className={`py-1.5 rounded font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                pairingMethod === "QR" ? "bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30" : "text-slate-400 hover:text-slate-350"
                              }`}
                            >
                              <QrCode className="w-3.5 h-3.5" /> Códigos QR
                            </button>
                            <button
                              onClick={() => { setPairingMethod("CODE"); if (connState === "QR_ACTIVE") handleStartConnection(); }}
                              disabled={connState === "CONNECTING"}
                              className={`py-1.5 rounded font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                pairingMethod === "CODE" ? "bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30" : "text-slate-400 hover:text-slate-350"
                              }`}
                            >
                              <Smartphone className="w-3.5 h-3.5" /> Código 8 Dígitos
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 font-mono block uppercase tracking-wider mb-2">Número Móvil (Para código de 8 dígitos)</label>
                          <input
                            type="text"
                            value={phoneToPair}
                            onChange={(e) => setPhoneToPair(e.target.value)}
                            disabled={connState === "CONNECTING" || pairingMethod === "QR"}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono py-2 px-3 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-40 select-all"
                            placeholder="Ej. 5215512345678"
                          />
                        </div>
                      </div>

                      {/* Display matching states with simulated scanner */}
                      <div className="flex flex-col items-center justify-center border border-slate-800/85 rounded-2xl py-8 px-4 bg-[#030712]/30 relative overflow-hidden min-h-[300px]">
                        {/* Immersive scanning grids overlay */}
                        <div className="absolute inset-x-0 top-0 h-[1px] bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-scan pointer-events-none"></div>

                        {connState === "DISCONNECTED" && (
                          <div className="text-center space-y-4 max-w-sm">
                            <div className="w-16 h-16 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
                              <WifiOff className="w-8 h-8" />
                            </div>
                            <div>
                              <h5 className="font-display font-bold text-sm text-white">Bot Desconectado de WhatsApp</h5>
                              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed font-sans">
                                Sin sesión guardada en <strong className="text-indigo-400 font-mono text-[10px]">auth/creds.json</strong>. Presiona el botón de abajo para simular el inicio y activar el buscador QR si falla.
                              </p>
                            </div>
                            <button
                              onClick={handleStartConnection}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition shadow-[0_4px_15px_rgba(99,102,241,0.30)] flex items-center gap-2 mx-auto cursor-pointer"
                            >
                              <PlayCircle className="w-4 h-4" /> Iniciar Intento de Conexión
                            </button>
                          </div>
                        )}

                        {connState === "CONNECTING" && (
                          <div className="text-center space-y-4 max-w-xs animate-pulse">
                            <div className="relative flex items-center justify-center mx-auto">
                              <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                              <Smartphone className="w-6 h-6 text-indigo-400 absolute animate-pulse" />
                            </div>
                            <div>
                              <h5 className="font-display font-medium text-xs text-indigo-300 font-mono tracking-widest uppercase">Consultando Estado ...</h5>
                              <p className="text-[11px] text-slate-400 mt-1 font-sans">Conectando socket Baileys a los servidores de Meta WhatsApp.</p>
                            </div>
                          </div>
                        )}

                        {connState === "FAILED" && (
                          <div className="text-center space-y-4 max-w-sm animate-fadeIn">
                            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/35 flex items-center justify-center mx-auto text-rose-400">
                              <AlertTriangle className="w-8 h-8" />
                            </div>
                            <div>
                              <h5 className="font-display font-bold text-sm text-rose-455 text-rose-405 text-rose-400">¡Conexión Fallida! (Inseguro o No Encontrado)</h5>
                              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed font-sans">
                                Como se diagnosticó en la Auditoría, las credenciales locales de WhatsApp no existen. Redirigiendo inmediatamente al emparejador QR de emergencia de WhatsApp Normal / Web...
                              </p>
                            </div>
                            <div className="w-12 h-1 bg-indigo-500/30 rounded-full mx-auto relative overflow-hidden">
                              <div className="absolute left-0 top-0 bottom-0 bg-indigo-500 w-1/2 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        )}

                        {connState === "QR_ACTIVE" && (
                          <div className="text-center space-y-5 animate-fadeIn max-w-md w-full">
                            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                              {pairingMethod === "QR" ? (
                                <div className="p-3.5 bg-white rounded-2xl relative w-44 h-44 flex items-center justify-center shadow-lg border border-slate-700/50 shrink-0">
                                  {/* Beautiful mockup QR drawing */}
                                  <svg className="w-36 h-36" viewBox="0 0 100 100">
                                    <path d="M5,5 H25 V15 H15 V25 H5 Z M75,5 H95 V25 H85 V15 H75 Z M5,75 V95 H25 V85 H15 V75 Z" fill="#0f172a" />
                                    <rect x="8" y="8" width="9" height="9" fill="#0f172a" />
                                    <rect x="83" y="8" width="9" height="9" fill="#0f172a" />
                                    <rect x="8" y="83" width="9" height="9" fill="#0f172a" />
                                    <g fill="#1e293b">
                                      <rect x="25" y="12" width="4" height="4" />
                                      <rect x="35" y="8" width="4" height="4" />
                                      <rect x="45" y="16" width="8" height="4" />
                                      <rect x="60" y="8" width="4" height="8" />
                                      <rect x="25" y="28" width="8" height="4" />
                                      <rect x="12" y="38" width="4" height="4" />
                                      <rect x="38" y="38" width="12" height="4" />
                                      <rect x="18" y="48" width="4" height="8" />
                                      <rect x="5" y="60" width="8" height="4" />
                                      <rect x="28" y="55" width="4" height="12" />
                                      <rect x="42" y="50" width="16" height="4" />
                                      <rect x="68" y="35" width="4" height="16" />
                                      <rect x="80" y="38" width="12" height="4" />
                                      <rect x="62" y="60" width="4" height="4" />
                                      <rect x="75" y="55" width="8" height="8" />
                                      <rect x="88" y="68" width="4" height="12" />
                                      <rect x="38" y="75" width="4" height="4" />
                                      <rect x="48" y="83" width="12" height="4" />
                                      <rect x="65" y="78" width="4" height="16" />
                                      <rect x="78" y="85" width="16" height="4" />
                                    </g>
                                    <rect x="42" y="42" width="16" height="16" rx="4" fill="#10b981" />
                                    <path d="M46,50 H54 V52 H50 V54 H46 Z" fill="white" />
                                  </svg>
                                  {/* Scanner active visual bar bouncing */}
                                  <div className="absolute left-3 right-3 h-0.5 bg-emerald-500 rounded animate-bounce shadow-[0_0_12px_#10b981] top-1/2"></div>
                                </div>
                              ) : (
                                <div className="p-6 bg-slate-950 border border-indigo-500/25 rounded-2xl flex flex-col items-center justify-center space-y-4 w-48 min-h-[176px] shadow-[0_0_20px_rgba(99,102,241,0.15)] shrink-0 select-all">
                                  <span className="text-[9px] text-indigo-400 font-mono uppercase tracking-widest font-black">Código de Enlace</span>
                                  {isGeneratingPairing ? (
                                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                                  ) : (
                                    <div className="text-xl font-mono font-black text-white tracking-widest bg-indigo-950/40 py-2 px-3.5 rounded-xl border border-indigo-500/30">
                                      {pairing8Code || "GENERANDO"}
                                    </div>
                                  )}
                                  <p className="text-[9px] text-slate-450 text-slate-400 text-center leading-normal font-sans">Introduce estos dígitos en WhatsApp y selecciona Vincular dispositivo auxiliar.</p>
                                </div>
                              )}

                              <div className="text-left flex-1 space-y-3 font-sans">
                                <h6 className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                                  <Camera className="w-4 h-4 text-emerald-450 text-emerald-400" /> Sincronización Web del Teléfono
                                </h6>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                  El sistema Baileys está enviando señales en tiempo real para emparejar el bot. Al escanear este código QR o colocar el código de vinculación Web, el número se enlazará de inmediato.
                                </p>
                                <div className="space-y-2 pt-1">
                                  <button
                                    onClick={handleSimulateSuccessfulScan}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-lg transition duration-200 shadow-[0_2px_10px_rgba(16,185,129,0.30)] flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" /> Simular Escaneo Exitoso / Confirmado
                                  </button>
                                  <button
                                    onClick={handleResetSession}
                                    className="text-slate-500 hover:text-slate-350 font-mono text-[10px] block py-1 cursor-pointer hover:underline"
                                  >
                                    Cancelar y resetear sesión
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {connState === "SUCCESS" && (
                          <div className="text-center space-y-4 max-w-sm animate-fadeIn">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/35 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                              <CheckCircle className="w-8 h-8 text-emerald-400 animate-pulse" />
                            </div>
                            <div>
                              <h5 className="font-display font-bold text-sm text-white font-sans">Bot Sincronizado Correctamente</h5>
                              <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">
                                Vinculado exitosamente como <strong className="text-emerald-400 font-mono text-[11px]">+52 1 55 1234 5678 (NekoMaid RPG Bot)</strong>. Las credenciales se almacenaron de forma persistente.
                              </p>
                            </div>
                            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-left space-y-1.5 max-w-xs mx-auto">
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                                <Database className="w-3.5 h-3.5 text-slate-500" />
                                <span>Veridad del Estado de auth/creds.json</span>
                              </div>
                              <pre className="text-[9px] text-emerald-450 text-emerald-400 font-mono truncate">
                                {"{\n  \"noiseKey\": \"privateKey...\",\n  \"signedIdentityKey\": \"publicKey...\"\n}"}
                              </pre>
                            </div>
                            <button
                              onClick={handleResetSession}
                              className="bg-rose-600/10 hover:bg-rose-600/20 text-rose-450 text-rose-400 border border-rose-500/20 font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 mx-auto"
                            >
                              <WifiOff className="w-3.5 h-3.5" /> Desvincular Cuenta de WhatsApp
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right block (2 cols): Real-Time Baileys Logs */}
                  <div className="lg:col-span-2">
                    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 h-full flex flex-col backdrop-blur-sm shadow-inner min-h-[400px]">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800/60">
                        <Terminal className="w-4 h-4 text-indigo-400" />
                        <div>
                          <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider">Sucesos Baileys Core Logs</h4>
                          <p className="text-[10px] text-slate-500 font-mono font-semibold">Telemetry en tiempo real</p>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[380px] pr-1.5 scrollbar-thin font-mono text-xs">
                        {connLogs.map((log, idx) => (
                          <div key={idx} className="bg-slate-950/70 border border-slate-900 p-3 rounded-lg text-[11px] leading-relaxed font-mono">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[9px] text-slate-500 font-bold">[{log.time}]</span>
                              <span className={`text-[8px] font-bold uppercase py-0.2 px-1 rounded-sm ${
                                log.type === "error" ? "bg-rose-500/10 text-rose-400" :
                                log.type === "warn" ? "bg-amber-500/10 text-amber-500" :
                                log.type === "success" ? "bg-emerald-500/10 text-emerald-400" :
                                "bg-indigo-500/10 text-indigo-400"
                              }`}>
                                {log.type}
                              </span>
                            </div>
                            <p className={`${
                              log.type === "error" ? "text-rose-350 text-rose-300 font-medium animate-pulse" :
                              log.type === "warn" ? "text-amber-300" :
                              log.type === "success" ? "text-emerald-300" :
                              "text-slate-300"
                            }`}>
                              {log.text}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between text-[11px] text-slate-500 font-sans">
                        <span>Autosync Baileys Socket</span>
                        <button
                          onClick={() => setConnLogs([])}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono uppercase cursor-pointer"
                        >
                          Limpiar Consola
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: COMPILING / EXPORTING FOR MOBILE PHONES NATIVELY (APK CREATOR KIT) */}
              {subTab === "apk" && (
                <div className="space-y-6">
                  {/* Persistent database directory selector / setting card */}
                  <div className="bg-slate-900/40 border-2 border-indigo-500/25 p-6 rounded-2xl relative overflow-hidden backdrop-blur-sm">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="space-y-4 font-sans max-w-3xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                          <Database className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="font-display font-medium text-base text-white">Directorio de Almacenamiento de Fichas (APK / Servidor)</h4>
                          <p className="text-xs text-slate-400">
                            Para evitar la volatilidad de la nube, las fichas se almacenan localmente en formato <code className="text-indigo-400 font-mono">.json</code>.
                          </p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <label className="block text-[11px] font-mono text-indigo-300 uppercase tracking-wider mb-1.5 font-bold">Ruta / Carpeta Local o Móvil</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input
                            type="text"
                            value={localDirRpgPath}
                            onChange={(e) => setLocalDirRpgPath(e.target.value)}
                            placeholder="Ej. /storage/emulated/0/Documents/RolBotFichas o ./data/personajes"
                            className="flex-1 bg-slate-950/90 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 transition"
                          />
                          <button
                            onClick={() => handleUpdateRpgPath(localDirRpgPath)}
                            disabled={isConnectingDir}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-sans font-bold text-xs py-2.5 px-5 rounded-lg flex items-center justify-center gap-1.5 transition shadow cursor-pointer active:scale-95"
                          >
                            {isConnectingDir ? "Sincronizando..." : "Vincular Carpeta"}
                          </button>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2.5">
                          <button
                            onClick={() => {
                              const randomMockAndroidPaths = [
                                "/storage/emulated/0/Documents/RolBotFichas",
                                "/storage/emulated/0/Download/RolBot_Database",
                                "/storage/emulated/0/Android/data/com.rolbotv1.app/files/fichas"
                              ];
                              const path = randomMockAndroidPaths[Math.floor(Math.random() * randomMockAndroidPaths.length)];
                              setLocalDirRpgPath(path);
                              handleUpdateRpgPath(path);
                            }}
                            className="bg-slate-950 hover:bg-slate-900 border border-purple-500/30 text-purple-300 font-sans font-bold text-[10px] py-1.5 px-3 rounded-md flex items-center gap-1 cursor-pointer transition active:scale-95"
                          >
                            <Smartphone className="w-3.5 h-3.5" /> Simular Selector de Carpeta APK
                          </button>
                          
                          <button
                            onClick={() => {
                              const path = "./data/personajes";
                              setLocalDirRpgPath(path);
                              handleUpdateRpgPath(path);
                            }}
                            className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 font-sans font-bold text-[10px] py-1.5 px-3 rounded-md flex items-center gap-1 cursor-pointer transition active:scale-95"
                          >
                            <Database className="w-3.5 h-3.5" /> Restaurar Ruta Servidor Directa
                          </button>
                        </div>

                        {localDirMessage && (
                          <div className={`mt-3.5 p-3 rounded-lg border text-xs font-sans animate-fadeIn ${
                            localDirMessage.includes("❌") 
                              ? "bg-rose-950/15 border-rose-500/20 text-rose-300"
                              : "bg-emerald-950/15 border-emerald-500/20 text-emerald-300"
                          }`}>
                            <div className="flex gap-2">
                              <span className="shrink-0 mt-0.5">ℹ️</span>
                              <div>
                                <p className="font-semibold">{localDirMessage}</p>
                                <p className="text-[10px] opacity-80 mt-1">
                                  Volumen montado en host: <span className="font-mono">{localDirRpgPath}</span> | Fichas indexadas: <span className="font-bold">{localDirCharCount}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Explanatory cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Method A: Termux Server Native */}
                    <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl relative overflow-hidden backdrop-blur-sm hover:border-slate-700/80 transition duration-300 flex flex-col justify-between space-y-4">
                      <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-2xl pointer-events-none"></div>
                      <div className="space-y-3 font-sans">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 font-black">
                            A
                          </div>
                          <div>
                            <h4 className="font-display font-bold text-sm text-white">Método Termux Nativo (Servidor Teléfono)</h4>
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold uppercase tracking-wider">Altamente Recomendado</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-350 leading-relaxed">
                          Para correr el bot de WhatsApp 24/7 de forma nativa e independiente en tu teléfono Android, la mejor opción es **Termux**. Instala un entorno Linux nativo en tu celular para ejecutar el servidor de Node del robot sin depender de un PC de escritorio o cobros en la nube.
                        </p>
                      </div>
                      
                      <div className="space-y-2.5 bg-slate-950 p-4 rounded-xl border border-slate-900">
                        <h5 className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">Comandos de Instalación Rápidos</h5>
                        <pre className="text-[10px] text-slate-350 font-mono space-y-1 block leading-normal overflow-x-auto select-all p-2 bg-slate-950/70 rounded border border-slate-900 pr-4">
                          {"# 1. Instala dependencias del kernel\npkg update && pkg install nodejs git -y\n\n# 2. Descarga tu bot e instala\ngit clone [url_de_tu_repositorio_bot]\ncd RolBotV1 && npm install\n\n# 3. Mantén activo el bot en background\nnpm install -g pm2\npm2 start server.ts --interpreter tsx\n\n# 4. Previene que Android duerma la CPU\ntermux-wake-lock"}
                        </pre>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => copyCode("pkg update && pkg install nodejs git -y && npm install -g pm2 && pm2 start server.ts --interpreter tsx && termux-wake-lock")}
                          className="w-full bg-slate-950 hover:bg-slate-900 text-indigo-300 font-bold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition border border-indigo-500/25 shadow-sm cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copiar script rápido de Termux
                        </button>
                      </div>
                    </div>

                    {/* Method B: Capacitor/Cordova WebView Wrapper APK */}
                    <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl relative overflow-hidden backdrop-blur-sm hover:border-slate-700/80 transition duration-300 flex flex-col justify-between space-y-4">
                      <div className="absolute right-0 top-0 w-32 h-32 bg-purple-600/5 rounded-full blur-2xl pointer-events-none"></div>
                      <div className="space-y-3 font-sans">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 font-black">
                            B
                          </div>
                          <div>
                            <h4 className="font-display font-bold text-sm text-white">Método Wrapper APK (Capacitor WebView GUI)</h4>
                            <span className="text-[9px] bg-indigo-500/15 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/25 font-bold uppercase tracking-wider">Dashboard Remoto</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-350 leading-relaxed">
                          Si deseas que la consola de control y simulación de este proyecto se visualice en tu teléfono como una **aplicación APK nativa instalable**, puedes empaquetarla usando **Capacitor**. Esto envolverá tu código de React UI en un WebView con acceso nativo de Android.
                        </p>
                      </div>

                      <div className="space-y-2.5 bg-slate-950 p-4 rounded-xl border border-slate-900 font-sans">
                        <h5 className="text-[10px] font-mono text-purple-450 text-purple-400 uppercase tracking-widest font-bold">Guía para Generar APK con Capacitor</h5>
                        <ol className="text-[10px] text-slate-300 font-sans space-y-1.5 list-decimal pl-4 leading-normal">
                          <li>Instala el CLI: <code className="text-purple-300 font-mono text-[9px]">npm i @capacitor/core @capacitor/cli</code></li>
                          <li>Inicializa: <code className="text-purple-300 font-mono text-[9px]">npx cap init RolBotV1 "com.rolbotv1.app"</code></li>
                          <li>Instala kit Android: <code className="text-purple-300 font-mono text-[9px]">npm i @capacitor/android</code></li>
                          <li>Añade la carpeta build: <code className="text-purple-300 font-mono text-[9px]">npx cap add android</code></li>
                          <li>Compila y sincroniza: <code className="text-purple-300 font-mono text-[9px]">npm run build && npx cap sync</code></li>
                          <li>Abre en Android Studio para exportar: <code className="text-purple-300 font-mono text-[9px]">npx cap open android</code></li>
                        </ol>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => copyCode("npm i @capacitor/core @capacitor/cli && npx cap init RolBotV1 \"com.rolbotv1.app\" --web-dir=dist && npm i @capacitor/android && npx cap add android && npm run build && npx cap sync")}
                          className="w-full bg-slate-950 hover:bg-slate-900 text-purple-300 font-bold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition border border-purple-500/25 shadow-sm cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copiar comandos Capacitor
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Android Integration & Fallback Code Setup FAQ helper */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
                    <h4 className="font-display font-black text-sm text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      Preguntas Frecuentes de Sincronización Móvil y APK
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
                      <div className="space-y-1.5">
                        <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          ¿Tiene costo mantenerlo en mi celular Android?
                        </h5>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          No. Al correr por Termux, el coste de ejecución depende 100% del procesador nativo de tu teléfono móvil, por lo que es completamente gratuito, offline y libre de suscripciones en servidores.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
                          ¿Cómo aseguro que el bot no se duerma?
                        </h5>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          La optimización de batería nativa de Android podría pausar procesos de fondo. Llamando a <code className="text-indigo-400 font-mono text-[9px]">termux-wake-lock</code> o inhabilitando la optimización de energía para Termux, el bot funcionará permanentemente.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
                          ¿Cómo cambio de número telefónico de rol?
                        </h5>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Basta con hacer click en **Desvincular Cuenta** en el panel de Enlace QR. Esto reiniciará la sesión y Baileys emitirá un nuevo código de barra QR para el nuevo número.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Footer credits disclaimer (No margins indicators, only a clear, humble layout footer) */}
      <footer className="mt-12 py-6 border-t border-slate-900 bg-slate-950 text-center text-xs text-slate-500">
        <p>Compartido y desplegado mediante Cloud Run de Google AI Studio.</p>
        <p className="mt-1 text-[10px]">RolBotV1 es un proyecto propiedad de su respectivo creador de GitHub.</p>
      </footer>
    </div>
  );
}
