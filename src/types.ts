export interface RepoFile {
  path: string;
  type: string;
}

export interface BugItem {
  severity: "Alta" | "Media" | "Baja";
  description: string;
  recommendation: string;
}

export interface VulnerabilityItem {
  severity: "Crítica" | "Alta" | "Media" | "Baja";
  issue: string;
  solution: string;
}

export interface BottleneckItem {
  bottleneck: string;
  impact: "Alto" | "Medio" | "Bajo";
  remediation: string;
}

export interface FileAuditReport {
  safetyScore: number;
  performanceScore: number;
  scalabilityScore: number;
  bugsFound: BugItem[];
  vulnerabilities: VulnerabilityItem[];
  performanceBottlenecks: BottleneckItem[];
  refactoredCode: string;
  scalingAdvice: string;
  isOfflineFallback?: boolean;
  fallbackReason?: string;
}

export interface GeneralAudit {
  summary: string;
  criticalRisksCount: number;
  performanceLeaksCount: number;
  vulnerabilityPercent: number;
  bottlenecks: Array<{
    area: string;
    status: string;
    desc: string;
  }>;
  advicesList: string[];
  isOfflineFallback?: boolean;
  fallbackReason?: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot" | "system";
  text: string;
  timestamp: string;
  reaction?: string;
}
