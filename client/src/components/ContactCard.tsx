import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Square,
  Activity,
  Smartphone,
  MessageCircle,
  Shield,
  Zap,
  Cpu,
  Globe,
  Apple
} from "lucide-react";
import clsx from "clsx";

type Platform = "whatsapp" | "signal";

interface TrackerData {
  rtt: number;
  avg: number;
  median: number;
  threshold: number;
  state: string;
  timestamp: number;
}

interface DeviceInfo {
  jid: string;
  os: string | { detectedOS: string; confidence?: number; chainCount?: number };
  state: string;
  rtt: number;
  avg: number;
}

interface ContactCardProps {
  jid: string;
  displayNumber: string;
  data: TrackerData[];
  devices: DeviceInfo[];
  deviceCount: number;
  presence: string | null;
  profilePic: string | null;
  onRemove: () => void;
  privacyMode?: boolean;
  platform?: Platform;
}

export function ContactCard({
  jid,
  displayNumber,
  data,
  devices,
  deviceCount,
  presence,
  profilePic,
  onRemove,
  privacyMode = false,
  platform = "whatsapp",
}: ContactCardProps) {
  const lastData = data[data.length - 1];
  const currentStatus =
    devices.length > 0
      ? devices.find((d) => d.state === "OFFLINE")?.state ||
        devices.find((d) => d.state.includes("Online"))?.state ||
        devices[0].state
      : "Unknown";

  const blurredNumber = privacyMode
    ? displayNumber.replace(/\d/g, "•")
    : displayNumber;

  const getOsIcon = (os: string) => {
    if (os.toLowerCase().includes("android")) return <Smartphone size={14} className="text-green-500" />;
    if (os.toLowerCase().includes("ios") || os.toLowerCase().includes("apple") || os.toLowerCase().includes("iphone")) 
      return <Apple size={14} className="text-blue-400" />;
    return <Cpu size={14} className="text-slate-400" />;
  };

  return (
    <div className="bg-[#16161a] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl transition-all hover:border-slate-700 group">
      {/* Header */}
      <div className="bg-[#1a1a20] border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-xl ${platform === "whatsapp" ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"}`}>
            {platform === "whatsapp" ? <MessageCircle size={18} /> : <Shield size={18} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white tracking-tight leading-tight">
                {blurredNumber}
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-800 text-slate-500 uppercase tracking-widest">
                {platform}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
          title="Terminate Trace"
        >
          <Square size={18} fill="currentColor" className="opacity-20" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Visual Status */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-[#0a0a0c] rounded-2xl border border-slate-800/50">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-800 shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                {profilePic ? (
                  <img
                    src={profilePic}
                    alt="Target"
                    className={clsx(
                      "w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-500",
                      privacyMode && "blur-xl"
                    )}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Shield size={32} className="text-slate-800" />
                  </div>
                )}
              </div>
              <div
                className={clsx(
                  "absolute -bottom-2 -right-2 w-6 h-6 rounded-lg border-4 border-[#0a0a0c] shadow-xl",
                  currentStatus === "OFFLINE"
                    ? "bg-red-500"
                    : currentStatus.includes("Online")
                    ? "bg-green-500 animate-pulse"
                    : "bg-amber-500"
                )}
              />
            </div>

            <div className="text-center">
              <div className={`text-xs font-black uppercase tracking-[0.2em] mb-1 ${
                currentStatus.includes("Online") ? "text-green-500" : "text-slate-500"
              }`}>
                {currentStatus}
              </div>
              <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                <Globe size={10} /> {presence || "SIGNAL DEAD"}
              </div>
            </div>
          </div>

          {/* Metrics Column */}
          <div className="lg:col-span-8 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#0a0a0c] p-3 rounded-xl border border-slate-800/50">
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Activity size={10} /> AVG RTT
                </div>
                <div className="text-lg font-black text-white">
                  {lastData?.avg.toFixed(0) || "0"}<span className="text-[10px] ml-1 text-slate-600">ms</span>
                </div>
              </div>
              <div className="bg-[#0a0a0c] p-3 rounded-xl border border-slate-800/50">
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                   MDN
                </div>
                <div className="text-lg font-black text-white">
                  {lastData?.median.toFixed(0) || "0"}<span className="text-[10px] ml-1 text-slate-600">ms</span>
                </div>
              </div>
              <div className="bg-[#0a0a0c] p-3 rounded-xl border border-slate-800/50">
                <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                   THR
                </div>
                <div className="text-lg font-black text-indigo-400">
                  {lastData?.threshold.toFixed(0) || "0"}<span className="text-[10px] ml-1 text-slate-600">ms</span>
                </div>
              </div>
            </div>

            {/* Device Analytics */}
            <div className="bg-[#0a0a0c] p-4 rounded-xl border border-slate-800/50">
              <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Target Devices</h5>
              <div className="space-y-2">
                {devices.length > 0 ? devices.map((device, idx) => {
                  let osType = "Unknown";
                  let confidence: number | undefined;
                  if (typeof device.os === "string") osType = device.os;
                  else if (typeof device.os === "object" && device.os?.detectedOS) {
                    osType = device.os.detectedOS;
                    confidence = device.os.confidence;
                  }

                  return (
                    <div key={device.jid} className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-slate-800/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                          {getOsIcon(osType)}
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-white uppercase tracking-tight">{osType}</p>
                          {confidence !== undefined && (
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500" style={{ width: `${confidence * 100}%` }} />
                              </div>
                              <span className="text-[8px] font-black text-slate-500">{(confidence * 100).toFixed(0)}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded cursor-default ${
                        device.state.includes("Online") ? "bg-green-500/10 text-green-500" : "bg-slate-800 text-slate-500"
                      }`}>
                        {device.state}
                      </span>
                    </div>
                  );
                }) : (
                   <div className="text-center py-2 text-[10px] font-black text-slate-700 uppercase tracking-widest">No Active Nodes</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Neural Network Chart (RTT) */}
        <div className="bg-[#0a0a0c] p-5 rounded-2xl border border-slate-800/50 h-[220px] relative overflow-hidden">
          <div className="absolute top-4 left-5 z-10">
            <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Zap size={10} className="text-indigo-500" /> Signal Integrity Log
            </h5>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" strokeOpacity={0.2} />
              <XAxis dataKey="timestamp" hide />
              <YAxis domain={["auto", "auto"]} hide />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "12px", fontSize: "10px" }}
                itemStyle={{ color: "#94a3b8", fontWeight: "bold" }}
                labelStyle={{ display: "none" }}
              />
              <Line
                type="monotone"
                dataKey="avg"
                stroke="#6366f1"
                strokeWidth={3}
                dot={false}
                animationDuration={1000}
              />
              <Line
                type="monotone"
                dataKey="threshold"
                stroke="#ef4444"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
