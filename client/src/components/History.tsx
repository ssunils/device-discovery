import React, { useEffect, useState } from "react";
import { socket } from "../App";
import {
  Search,
  History as HistoryIcon,
  User,
  Clock,
  Smartphone,
  Trash2,
  ArrowLeft,
  Zap,
} from "lucide-react";
import clsx from "clsx";

interface HistoryEvent {
  type: "search" | "status_change" | "rtt_sample";
  timestamp: string;
  jid: string;
  platform: "whatsapp" | "signal";
  data: any;
}

interface HistoryProps {
  onBack: () => void;
}

export function History({ onBack }: HistoryProps) {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [filter, setFilter] = useState<"all" | "search" | "status_change">(
    "all"
  );

  useEffect(() => {
    socket.emit("get-history");

    socket.on("history-data", (data: HistoryEvent[]) => {
      setEvents([...data].reverse()); // Show newest first
    });

    socket.on("history-cleared", () => {
      setEvents([]);
    });

    return () => {
      socket.off("history-data");
      socket.off("history-cleared");
    };
  }, []);

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear all history?")) {
      socket.emit("clear-history");
    }
  };

  const filteredEvents = events.filter(
    (e) => (filter === "all" || e.type === filter) && e.platform === "whatsapp"
  );

  return (
    <div className="bg-[#16161a] rounded-2xl shadow-2xl overflow-hidden border border-slate-800 flex flex-col h-[calc(100vh-220px)] animate-in fade-in zoom-in-95 duration-500">
      <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center bg-[#1a1a20] gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 rounded-xl transition-all shadow-lg"
            title="Return to Interface"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <HistoryIcon className="w-5 h-5 text-indigo-500" />
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                Intercept Logs
              </h2>
            </div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] ml-7">
              System History Persistence
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-[#0a0a0c] p-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setFilter("all")}
              className={clsx(
                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                filter === "all"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-slate-600 hover:text-slate-400"
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter("search")}
              className={clsx(
                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                filter === "search"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-slate-600 hover:text-slate-400"
              )}
            >
              Searches
            </button>
            <button
              onClick={() => setFilter("status_change")}
              className={clsx(
                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                filter === "status_change"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-slate-600 hover:text-slate-400"
              )}
            >
              Activities
            </button>
          </div>
          <button
            onClick={clearHistory}
            className="w-10 h-10 flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-lg"
            title="Purge Archives"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#0a0a0c]/50">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-800">
            <HistoryIcon className="w-20 h-20 mb-6 opacity-10" />
            <p className="font-black uppercase tracking-[0.3em] text-sm">
              No Logs Recovered
            </p>
          </div>
        ) : (
          filteredEvents.map((event, i) => (
            <div
              key={i}
              className="group flex gap-5 p-5 rounded-2xl border border-slate-800/50 hover:border-indigo-500/30 transition-all bg-[#0a0a0c] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-500" />

              <div
                className={clsx(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border shadow-2xl",
                  event.type === "search"
                    ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                    : event.data.state === "Online"
                    ? "bg-green-500/10 text-green-500 border-green-500/20 animate-pulse"
                    : event.data.state === "Standby"
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    : "bg-slate-800/50 text-slate-500 border-slate-700/50"
                )}
              >
                {event.type === "search" ? (
                  <Search className="w-5 h-5" />
                ) : event.type === "status_change" ? (
                  <User className="w-5 h-5" />
                ) : (
                  <Smartphone className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <h3 className="text-sm font-black text-white tracking-widest uppercase">
                      {event.jid.split("@")[0]}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500 uppercase tracking-widest">
                        {event.platform}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5 whitespace-nowrap">
                      <Clock className="w-3 h-3" />
                      {new Date(event.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                    <span className="text-[8px] font-medium text-slate-800 tracking-tighter mt-0.5">
                      {new Date(event.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-2">
                  {event.type === "search" && (
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="font-bold uppercase tracking-tighter text-[10px]">
                        Target Lookup Initiated
                      </span>
                    </div>
                  )}
                  {event.type === "status_change" && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={clsx(
                            "w-1.5 h-1.5 rounded-full",
                            event.data.state === "Online"
                              ? "bg-green-500"
                              : event.data.state === "Standby"
                              ? "bg-amber-500"
                              : "bg-red-500"
                          )}
                        />
                        <span
                          className={clsx(
                            "font-black uppercase tracking-widest text-[10px]",
                            event.data.state === "Online"
                              ? "text-green-500"
                              : event.data.state === "Standby"
                              ? "text-amber-500"
                              : "text-red-500"
                          )}
                        >
                          {event.data.state}
                        </span>
                      </div>
                      {event.data.rtt && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
                          <Zap className="w-3 h-3 text-indigo-400" />
                          <span className="text-slate-500 font-mono text-[10px]">
                            {event.data.rtt}ms
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
