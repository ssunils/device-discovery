import React, { useEffect, useState } from "react";
import { socket } from "../App";
import {
  Search,
  History as HistoryIcon,
  User,
  Clock,
  Smartphone,
  Globe,
  Trash2,
  ArrowLeft,
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
    (e) => filter === "all" || e.type === filter
  );

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 flex flex-col h-[calc(100vh-200px)]">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <HistoryIcon className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-800">
              Tracking History
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setFilter("all")}
              className={clsx(
                "px-3 py-1.5 rounded-md text-sm transition-all",
                filter === "all"
                  ? "bg-white shadow-sm text-indigo-600 font-medium"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter("search")}
              className={clsx(
                "px-3 py-1.5 rounded-md text-sm transition-all",
                filter === "search"
                  ? "bg-white shadow-sm text-indigo-600 font-medium"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Searches
            </button>
            <button
              onClick={() => setFilter("status_change")}
              className={clsx(
                "px-3 py-1.5 rounded-md text-sm transition-all",
                filter === "status_change"
                  ? "bg-white shadow-sm text-indigo-600 font-medium"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Activities
            </button>
          </div>
          <button
            onClick={clearHistory}
            className="ml-2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Clear History"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <HistoryIcon className="w-16 h-16 mb-4 opacity-20" />
            <p>No history records found</p>
          </div>
        ) : (
          filteredEvents.map((event, i) => (
            <div
              key={i}
              className="flex gap-4 p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors bg-white shadow-sm"
            >
              <div
                className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  event.type === "search"
                    ? "bg-blue-50 text-blue-600"
                    : event.data.state === "Online"
                    ? "bg-green-50 text-green-600"
                    : event.data.state === "Standby"
                    ? "bg-yellow-50 text-yellow-600"
                    : "bg-gray-50 text-gray-600"
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
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-gray-800 truncate">
                    {event.jid.split("@")[0]}
                  </h3>
                  <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1">
                    {event.platform === "whatsapp" ? (
                      <Globe className="w-3 h-3" />
                    ) : (
                      <Smartphone className="w-3 h-3" />
                    )}
                    {event.platform.toUpperCase()}
                  </span>
                  {event.type === "search" && (
                    <span className="text-blue-600 font-medium">
                      Requested target tracking
                    </span>
                  )}
                  {event.type === "status_change" && (
                    <>
                      <span
                        className={clsx(
                          "font-bold uppercase",
                          event.data.state === "Online"
                            ? "text-green-600"
                            : event.data.state === "Standby"
                            ? "text-yellow-600"
                            : "text-red-600"
                        )}
                      >
                        {event.data.state}
                      </span>
                      {event.data.rtt && (
                        <span className="text-gray-400">
                          RTT: {event.data.rtt}ms
                        </span>
                      )}
                    </>
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
