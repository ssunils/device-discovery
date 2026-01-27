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
  Shield,
  Zap,
  Globe,
  Play,
  Pause,
} from "lucide-react";
import clsx from "clsx";
import { formatPhoneNumber, maskDigits } from "../utils/phone";

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
  contactLabel?: string;
  data: TrackerData[];
  devices: DeviceInfo[];
  deviceCount: number;
  presence: string | null;
  profilePic: string | null;
  onRemove: () => void;
  onPause: () => void;
  onResume: () => void;
  isPaused?: boolean;
  privacyMode?: boolean;
  platform?: Platform;
}

export function ContactCard({
  jid,
  displayNumber,
  contactLabel,
  data,
  devices,
  deviceCount,
  presence,
  profilePic,
  onRemove,
  onPause,
  onResume,
  isPaused = false,
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

  const phoneMeta = formatPhoneNumber(displayNumber);
  const visibleNumber = privacyMode
    ? maskDigits(phoneMeta.formatted || phoneMeta.raw)
    : phoneMeta.formatted || displayNumber;

  interface OsMeta {
    label: string;
    icon: string | null;
    confidence?: number;
  }

  const normalizeOs = (osValue: DeviceInfo["os"]): OsMeta => {
    let label = "Unknown";
    let confidence: number | undefined;

    if (typeof osValue === "string") {
      label = osValue;
    } else if (osValue && typeof osValue === "object" && osValue.detectedOS) {
      label = osValue.detectedOS;
      confidence = osValue.confidence;
    }

    const lower = label.toLowerCase();
    let key: "android" | "ios" | "unknown" = "unknown";
    if (lower.includes("android")) key = "android";
    if (
      lower.includes("ios") ||
      lower.includes("apple") ||
      lower.includes("iphone")
    )
      key = "ios";

    const icon =
      key === "android"
        ? "/icons/android.svg"
        : key === "ios"
          ? "/icons/apple.svg"
          : null;

    return { label: label || "Unknown", icon, confidence };
  };

  const primaryOs: OsMeta =
    devices.length > 0
      ? normalizeOs(devices[0].os)
      : { label: "Unknown", icon: null };

  return (
    <div className="bg-[#16161a] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl transition-all hover:border-slate-700 group">
      {/* Header */}
      <div className="bg-[#1a1a20] border-b border-slate-800 px-6 py-5 grid gap-4 md:grid-cols-[auto_1fr] items-center">
        <div className="flex items-center gap-4 px-4 py-3 rounded-2xl border border-slate-800 bg-slate-900 shadow-inner">
          <div className={` ${primaryOs.icon ? "" : "bg-slate-700"}`}>
            {primaryOs.icon ? (
              <img
                src={primaryOs.icon}
                alt={primaryOs.label}
                className="w-6 h-6"
              />
            ) : (
              <Shield size={20} className="text-slate-400" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">
              OS Signal
            </span>
            <span className="text-lg font-black text-white tracking-tight">
              {primaryOs.label}
            </span>
            {primaryOs.confidence !== undefined && (
              <span className="text-sm text-blue-400 font-semibold">
                {(primaryOs.confidence * 100).toFixed(0)}% confidence
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl leading-none">{phoneMeta.flag}</span>
              <h3 className="text-xl font-black text-white tracking-tight leading-tight">
                {visibleNumber}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-500">
                {platform}
              </span>
              {contactLabel && contactLabel !== displayNumber && (
                <p className="text-sm text-slate-400 font-semibold">
                  {contactLabel}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:gap-3">
            {isPaused ? (
              <button
                onClick={onResume}
                className="flex items-center gap-2 px-5 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl transition-all font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/10"
              >
                <Play size={12} fill="currentColor" />
                Resume
              </button>
            ) : (
              <button
                onClick={onPause}
                className="flex items-center gap-2 px-5 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white rounded-xl transition-all font-black text-sm uppercase tracking-widest shadow-lg shadow-amber-500/10"
              >
                <Pause size={12} />
                Pause
              </button>
            )}

            <button
              onClick={onRemove}
              className="flex items-center gap-2 px-5 py-2 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all font-black text-sm uppercase tracking-widest shadow-lg shadow-red-500/10"
            >
              <Square size={12} fill="currentColor" />
              Terminate
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Information & Analysis Column */}
          <div className="lg:col-span-5 space-y-6 flex flex-col">
            {/* Visual Status */}
            <div className="grid grid-cols-4 gap-2">
              <div className=" col-span-3 flex flex-col items-center justify-center p-6 bg-[#0a0a0c] rounded-2xl border border-slate-800/50">
                <div className="relative mb-6">
                  <div className="w-50 h-50 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-800 shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                    {profilePic ? (
                      <img
                        src={profilePic}
                        alt="Target"
                        className={clsx(
                          "w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-500",
                          privacyMode && "blur-xl",
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
                          : "bg-amber-500",
                    )}
                  />
                </div>
                <div className="text-center">
                  <div
                    className={`text-sm font-black uppercase tracking-[0.2em] mb-1 ${
                      currentStatus.includes("Online")
                        ? "text-green-500"
                        : "text-slate-500"
                    }`}
                  >
                    {currentStatus}
                  </div>
                  <div className="text-sm text-slate-600 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                    <Globe size={12} /> {presence || "SIGNAL DEAD"}
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-[#0a0a0c] p-3 rounded-xl border border-slate-800/50">
                  <div className="text-sm font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Activity size={10} /> AVG RTT
                  </div>
                  <div className="text-lg font-black text-white">
                    {lastData?.avg.toFixed(0) || "0"}
                    <span className="text-sm ml-1 text-slate-600">ms</span>
                  </div>
                </div>
                <div className="bg-[#0a0a0c] p-3 rounded-xl border border-slate-800/50">
                  <div className="text-sm font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                    MDN
                  </div>
                  <div className="text-lg font-black text-white">
                    {lastData?.median.toFixed(0) || "0"}
                    <span className="text-sm ml-1 text-slate-600">ms</span>
                  </div>
                </div>
                <div className="bg-[#0a0a0c] p-3 rounded-xl border border-slate-800/50">
                  <div className="text-sm font-black text-blue-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                    THR
                  </div>
                  <div className="text-lg font-black text-blue-400">
                    {lastData?.threshold.toFixed(0) || "0"}
                    <span className="text-sm ml-1 text-slate-600">ms</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Device Analytics */}
            <div className="bg-[#0a0a0c] p-4 rounded-xl border border-slate-800/50 flex-grow">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">
                  Target Devices
                </h5>
                <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 uppercase tracking-widest">
                  {devices.length > 0
                    ? `${devices.length} Connected`
                    : "No Devices"}
                </span>
              </div>
              <div className="space-y-2">
                {devices.length > 0 ? (
                  devices.map((device) => {
                    const osMeta = normalizeOs(device.os);

                    return (
                      <div
                        key={device.jid}
                        className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-slate-800/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                            {osMeta.icon ? (
                              <img
                                src={osMeta.icon}
                                alt={osMeta.label}
                                className="w-5 h-5"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded bg-slate-800" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-black text-white uppercase tracking-tight">
                              {osMeta.label}
                            </p>
                            {osMeta.confidence !== undefined && (
                              <div className="flex items-center gap-2 mt-0.5">
                                <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500"
                                    style={{
                                      width: `${osMeta.confidence * 100}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-sm font-black text-slate-500">
                                  {(osMeta.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <span
                          className={`text-sm font-black px-2 py-0.5 rounded cursor-default ${
                            device.state.includes("Online")
                              ? "bg-green-500/10 text-green-500"
                              : "bg-slate-800 text-slate-500"
                          }`}
                        >
                          {device.state}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-2 text-sm font-black text-slate-700 uppercase tracking-widest">
                    No Active Nodes
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Neural Network Chart (RTT) - RIGHT */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-[#0a0a0c] p-5 rounded-2xl border border-slate-800/50 h-full relative overflow-hidden flex flex-col min-h-[500px]">
              <div className="absolute top-4 left-5 z-10">
                <h5 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Zap size={10} className="text-blue-500" /> Signal Integrity
                  Log
                </h5>
              </div>
              <div className="flex-grow pt-8 w-full">
                {data && data.length > 0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minHeight={400}
                  >
                    <LineChart data={data}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#1e293b"
                        strokeOpacity={0.2}
                      />
                      <XAxis dataKey="timestamp" hide />
                      <YAxis domain={["auto", "auto"]} hide />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "1px solid #334155",
                          borderRadius: "12px",
                          fontSize: "14px",
                        }}
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
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold uppercase tracking-widest">
                    Awaiting Signal Data...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
