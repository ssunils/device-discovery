import React, { useEffect, useState } from "react";
import { socket } from "../App";
import { History as HistoryIcon, Clock, Trash2, ArrowLeft } from "lucide-react";
import clsx from "clsx";
import { formatPhoneNumber } from "../utils/phone";

interface HistoryEvent {
  type: "search" | "status_change" | "rtt_sample";
  timestamp: string;
  jid: string;
  platform: "whatsapp" | "signal";
  data: any;
}

// Helper functions
const normalizeOs = (event: HistoryEvent) => {
  const osValue = event.data?.os;
  let label = "Unknown";
  let confidence: number | undefined;

  if (typeof osValue === "string") label = osValue;
  else if (osValue && typeof osValue === "object" && osValue.detectedOS) {
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

interface GroupedHistoryEntry {
  phoneNumber: string;
  formattedNumber: string;
  platform: "whatsapp" | "signal";
  events: HistoryEvent[];
  latestEvent: HistoryEvent;
  osMeta: ReturnType<typeof normalizeOs>;
}

interface HistoryProps {
  onBack: () => void;
}

export function History({ onBack }: HistoryProps) {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [filter, setFilter] = useState<"all" | "search" | "status_change">(
    "all"
  );
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);

  // Build a map from LID/JID to original phone number from search events
  const lidToPhoneNumber = new Map<string, string>();
  events.forEach((event) => {
    if (event.type === "search" && event.data?.number) {
      // For a search event, both the jid and any related LIDs should map to this number
      lidToPhoneNumber.set(event.data.number, event.data.number); // Direct mapping
    }
  });

  // Enhanced extractNumber that uses the LID mapping
  const getPhoneNumber = (event: HistoryEvent) => {
    // First, try to get from search event data
    if (event.type === "search" && event.data?.number) {
      return String(event.data.number);
    }

    // Check if the JID itself indicates it's a LID (WhatsApp internal identifier)
    const isLid = event.jid.includes("@lid");

    // For status/rtt events, extract from jid
    let extracted = "";
    if (event.platform === "signal") {
      extracted = event.jid.replace(/^signal:/, "");
    } else {
      extracted = event.jid.split("@")[0];
    }

    // If it's a LID (indicated by @lid suffix), try to find the original phone number
    // by looking for a recent search event that would have triggered this LID
    if (isLid) {
      // Search backwards in events to find the most recent search
      for (let i = 0; i < events.length; i++) {
        if (events[i].type === "search" && events[i].data?.number) {
          const searchNumber = String(events[i].data.number);
          // Check if this search event is recent and could be related
          const searchTime = new Date(events[i].timestamp).getTime();
          const currentTime = new Date(event.timestamp).getTime();
          const timeDiff = currentTime - searchTime;
          // If search happened within 5 minutes before this event, it's likely related
          if (timeDiff >= 0 && timeDiff <= 5 * 60 * 1000) {
            return searchNumber;
          }
        }
      }
    }

    return extracted;
  };

  useEffect(() => {
    socket.emit("get-history");

    socket.on("history-data", (data: HistoryEvent[]) => {
      const ordered = [...data].reverse();
      setEvents(ordered);
    });

    socket.on("history-cleared", () => {
      setEvents([]);
      setSelectedNumber(null);
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
    (e) => filter === "all" || e.type === filter
  );

  // Group events by phone number
  const groupedByNumber = new Map<string, GroupedHistoryEntry>();
  filteredEvents.forEach((event) => {
    const phoneNumber = getPhoneNumber(event);
    const numberMeta = formatPhoneNumber(phoneNumber);
    const formattedNumber = numberMeta.formatted || numberMeta.raw || "Unknown";

    if (!groupedByNumber.has(phoneNumber)) {
      groupedByNumber.set(phoneNumber, {
        phoneNumber,
        formattedNumber,
        platform: event.platform,
        events: [],
        latestEvent: event,
        osMeta: normalizeOs(event),
      });
    }

    const group = groupedByNumber.get(phoneNumber)!;
    group.events.push(event);
    // Keep the event with OS info or the latest event
    if (normalizeOs(event).label !== "Unknown" || group.latestEvent === event) {
      group.latestEvent = event;
      group.osMeta = normalizeOs(event);
    }
  });

  const groupedEntries = Array.from(groupedByNumber.values());

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (groupedEntries.length === 0) {
      setSelectedNumber(null);
    } else if (!selectedNumber || !groupedByNumber.has(selectedNumber)) {
      // If the selected number is not in the filtered data, select the first one
      setSelectedNumber(groupedEntries[0].phoneNumber);
    }
  }, [groupedEntries]);

  const selectedEntry = selectedNumber
    ? groupedByNumber.get(selectedNumber)
    : null;

  const statusLabelForEvent = (event: HistoryEvent | null) => {
    if (!event) return "Unknown";
    if (event.data?.state) return event.data.state;
    if (event.type === "search") return "Lookup";
    if (event.type === "rtt_sample") return "RTT Sample";
    return "Status Change";
  };

  const statusBadgeClasses = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes("online"))
      return "bg-green-500/10 text-green-400 border border-green-500/30";
    if (lower.includes("standby"))
      return "bg-amber-500/10 text-amber-400 border border-amber-500/30";
    if (lower.includes("offline") || lower.includes("calibrating"))
      return "bg-red-500/10 text-red-400 border border-red-500/30";
    return "bg-slate-800 text-slate-400 border border-slate-700/60";
  };

  const selectedNumberMeta = selectedNumber
    ? formatPhoneNumber(selectedNumber)
    : null;
  const selectedStatus = selectedEntry
    ? statusLabelForEvent(selectedEntry.latestEvent)
    : "Unknown";
  const selectedTimestamp = selectedEntry
    ? new Date(selectedEntry.latestEvent.timestamp)
    : null;
  const selectedOsMeta = selectedEntry ? selectedEntry.osMeta : null;

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

      <div className="flex-1 overflow-hidden p-6 bg-[#0a0a0c]/50">
        {groupedEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-800">
            <HistoryIcon className="w-20 h-20 mb-6 opacity-10" />
            <p className="font-black uppercase tracking-[0.3em] text-sm">
              No Logs Recovered
            </p>
          </div>
        ) : (
          <div className="flex h-full flex-col gap-6 lg:flex-row">
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {groupedEntries.map((entry) => {
                const isActive = selectedNumber === entry.phoneNumber;

                return (
                  <button
                    key={entry.phoneNumber}
                    type="button"
                    onClick={() => setSelectedNumber(entry.phoneNumber)}
                    className={clsx(
                      "w-full rounded-2xl border px-4 py-5 text-left transition",
                      isActive
                        ? "border-indigo-500/70 bg-indigo-500/10 shadow-lg"
                        : "border-slate-800 bg-[#0a0a0c] hover:border-indigo-500/40"
                    )}
                  >
                    <div className="flex items-center gap-3 justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl leading-none">
                          {formatPhoneNumber(entry.phoneNumber).flag}
                        </span>
                        <div>
                          <p className="text-sm font-black text-white tracking-widest uppercase">
                            {entry.formattedNumber}
                          </p>
                          <p className="text-[9px] uppercase tracking-[0.3em] text-slate-500">
                            {entry.platform} · {entry.events.length} event
                            {entry.events.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      {entry.osMeta.icon && (
                        <img
                          src={entry.osMeta.icon}
                          alt={entry.osMeta.label}
                          className="h-5 w-5 opacity-70"
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedEntry && (
              <aside className="lg:w-80 w-full rounded-2xl border border-slate-800 bg-[#0a0a0c] p-6 shadow-2xl flex flex-col gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                    Detail View
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-3xl leading-none">
                      {selectedNumberMeta?.flag || "🏳️"}
                    </span>
                    <div className="flex flex-col">
                      <p className="text-lg font-black text-white uppercase tracking-tight">
                        {selectedNumberMeta?.formatted ||
                          selectedNumberMeta?.raw ||
                          selectedEntry.phoneNumber}
                      </p>
                      <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                        {selectedEntry.platform} · {selectedEntry.events.length}{" "}
                        session{selectedEntry.events.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                    Status
                  </p>
                  <span
                    className={clsx(
                      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.3em]",
                      statusBadgeClasses(selectedStatus)
                    )}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {selectedStatus}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                    Operating System
                  </p>
                  <div className="flex items-center gap-3">
                    {selectedOsMeta?.icon ? (
                      <img
                        src={selectedOsMeta.icon}
                        alt={selectedOsMeta.label}
                        className="h-6 w-6"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded bg-slate-900" />
                    )}
                    <div className="flex flex-col">
                      <p className="text-sm font-black text-white uppercase tracking-tight">
                        {selectedOsMeta?.label}
                      </p>
                      {selectedOsMeta?.confidence !== undefined && (
                        <span className="text-[9px] text-indigo-400 font-bold">
                          {(selectedOsMeta.confidence * 100).toFixed(0)}%
                          confidence
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                    Time of Event
                  </p>
                  <div className="flex items-center gap-2 text-sm font-black text-white">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>
                      {selectedTimestamp
                        ? selectedTimestamp.toLocaleString()
                        : "-"}
                    </span>
                  </div>
                </div>
                {selectedEntry.latestEvent.data?.rtt && (
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                      RTT
                    </p>
                    <p className="text-lg font-black text-indigo-400">
                      {selectedEntry.latestEvent.data.rtt}ms
                    </p>
                  </div>
                )}
              </aside>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
