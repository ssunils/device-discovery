import React, { useEffect, useState } from "react";
import {
  Plus,
  MessageCircle,
  Settings,
  AlertCircle,
  Shield,
} from "lucide-react";
import { socket, Platform, ConnectionState, ProbeMethod } from "../App";
import { ContactCard } from "./ContactCard";
import { getImageUrl } from "../utils/imageUrl";
import { Login } from "./Login";

interface DashboardProps {
  connectionState: ConnectionState;
  privacyMode: boolean;
  probeMethod: ProbeMethod;
  onProbeMethodChange: (method: ProbeMethod) => void;
}

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

interface ContactInfo {
  jid: string;
  displayNumber: string;
  contactName: string;
  data: TrackerData[];
  devices: DeviceInfo[];
  deviceCount: number;
  presence: string | null;
  profilePic: string | null;
  platform: Platform;
  isPaused?: boolean;
}

export function Dashboard({
  connectionState,
  privacyMode,
  probeMethod,
  onProbeMethodChange,
}: DashboardProps) {
  const [inputNumber, setInputNumber] = useState("");
  const [selectedPlatform, setSelectedPlatform] =
    useState<Platform>("whatsapp");
  const [contacts, setContacts] = useState<Map<string, ContactInfo>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [showConnections, setShowConnections] = useState(false);

  useEffect(() => {
    function onTrackerUpdate(update: any) {
      const { jid, ...data } = update;
      if (!jid) return;

      setContacts((prev) => {
        const next = new Map(prev);
        const contact = next.get(jid);

        if (contact) {
          // Update existing contact
          const updatedContact = { ...contact };

          if (data.presence !== undefined) {
            updatedContact.presence = data.presence;
          }
          if (data.deviceCount !== undefined) {
            updatedContact.deviceCount = data.deviceCount;
          }
          if (data.devices !== undefined) {
            updatedContact.devices = data.devices;
          }

          // Add to chart data
          if (
            data.median !== undefined &&
            data.devices &&
            data.devices.length > 0
          ) {
            const newDataPoint: TrackerData = {
              rtt: data.devices[0].rtt,
              avg: data.devices[0].avg,
              median: data.median,
              threshold: data.threshold,
              state:
                data.devices.find((d: DeviceInfo) => d.state.includes("Online"))
                  ?.state || data.devices[0].state,
              timestamp: Date.now(),
            };
            updatedContact.data = [...updatedContact.data, newDataPoint];
          }

          next.set(jid, updatedContact);
        }

        return next;
      });
    }

    function onProfilePic(data: { jid: string; url: string | null }) {
      setContacts((prev) => {
        const next = new Map(prev);
        const contact = next.get(data.jid);
        if (contact) {
          next.set(data.jid, { ...contact, profilePic: data.url });
        }
        return next;
      });
    }

    function onContactName(data: { jid: string; name: string }) {
      setContacts((prev) => {
        const next = new Map(prev);
        const contact = next.get(data.jid);
        if (contact) {
          next.set(data.jid, { ...contact, contactName: data.name });
        }
        return next;
      });
    }

    function onContactAdded(data: {
      jid: string;
      number: string;
      platform?: Platform;
    }) {
      setContacts((prev) => {
        const next = new Map(prev);
        next.set(data.jid, {
          jid: data.jid,
          displayNumber: data.number,
          contactName: data.number,
          data: [],
          devices: [],
          deviceCount: 0,
          presence: null,
          profilePic: null,
          platform: data.platform || "whatsapp",
          isPaused: false,
        });
        return next;
      });
      setInputNumber("");
    }

    function onContactRemoved(jid: string) {
      setContacts((prev) => {
        const next = new Map(prev);
        next.delete(jid);
        return next;
      });
    }

    function onError(data: { jid?: string; message: string }) {
      setError(data.message);
      setTimeout(() => setError(null), 3000);
    }

    function onProbeMethod(method: ProbeMethod) {
      onProbeMethodChange(method);
    }

    function onContactPaused(jid: string) {
      console.log("[Dashboard] Contact paused:", jid);
      setContacts((prev) => {
        const next = new Map(prev);
        const contact = next.get(jid);
        if (contact) {
          next.set(jid, { ...contact, isPaused: true });
        }
        return next;
      });
    }

    function onContactResumed(jid: string) {
      console.log("[Dashboard] Contact resumed:", jid);
      setContacts((prev) => {
        const next = new Map(prev);
        const contact = next.get(jid);
        if (contact) {
          next.set(jid, { ...contact, isPaused: false });
        }
        return next;
      });
    }

    function onTrackedContacts(contacts: { id: string; platform: Platform }[]) {
      setContacts((prev) => {
        const next = new Map(prev);
        contacts.forEach(({ id, platform }) => {
          if (!next.has(id)) {
            // Extract display number from id
            let displayNumber = id;
            if (platform === "signal") {
              displayNumber = id.replace("signal:", "");
            } else {
              // WhatsApp JID format: number@s.whatsapp.net
              displayNumber = id.split("@")[0];
            }
            next.set(id, {
              jid: id,
              displayNumber,
              contactName: displayNumber,
              data: [],
              devices: [],
              deviceCount: 0,
              presence: null,
              profilePic: null,
              platform,
              isPaused: false,
            });
          }
        });
        return next;
      });
    }

    socket.on("tracker-update", onTrackerUpdate);
    socket.on("profile-pic", onProfilePic);
    socket.on("contact-name", onContactName);
    socket.on("contact-added", onContactAdded);
    socket.on("contact-removed", onContactRemoved);
    socket.on("contact-paused", onContactPaused);
    socket.on("contact-resumed", onContactResumed);
    socket.on("error", onError);
    socket.on("probe-method", onProbeMethod);
    socket.on("tracked-contacts", onTrackedContacts);

    // Request tracked contacts after listeners are set up
    socket.emit("get-tracked-contacts");

    return () => {
      socket.off("tracker-update", onTrackerUpdate);
      socket.off("profile-pic", onProfilePic);
      socket.off("contact-name", onContactName);
      socket.off("contact-added", onContactAdded);
      socket.off("contact-removed", onContactRemoved);
      socket.off("contact-paused", onContactPaused);
      socket.off("contact-resumed", onContactResumed);
      socket.off("error", onError);
      socket.off("probe-method", onProbeMethod);
      socket.off("tracked-contacts", onTrackedContacts);
    };
  }, [onProbeMethodChange]);

  const handleAdd = () => {
    if (!inputNumber) return;
    socket.emit("add-contact", {
      number: inputNumber,
      platform: selectedPlatform,
    });
  };

  const handleRemove = (jid: string) => {
    socket.emit("remove-contact", jid);
  };

  const handlePause = (jid: string) => {
    console.log("[Dashboard] Emitting pause-contact for:", jid);
    socket.emit("pause-contact", jid);
  };

  const handleResume = (jid: string) => {
    console.log("[Dashboard] Emitting resume-contact for:", jid);
    socket.emit("resume-contact", jid);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Error Toast */}
      {error && (
        <div className="fixed top-24 right-8 z-50 animate-in slide-in-from-right duration-300">
          <div className="bg-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-red-400/50">
            <AlertCircle size={20} />
            <span className="font-bold">{error}</span>
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Add Contact Form */}
        <div className="lg:col-span-8 bg-[#16161a] p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Plus className="text-blue-500" size={24} />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              Target Acquisition
            </h2>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex bg-[#0a0a0c] rounded-xl border border-slate-800 p-1 focus-within:border-blue-500/50 transition-all">
              <div className="flex p-1 gap-1">
                <button
                  onClick={() => setSelectedPlatform("whatsapp")}
                  className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${
                    selectedPlatform === "whatsapp"
                      ? "bg-green-500/10 text-green-500 border border-green-500/30"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <MessageCircle size={14} />
                  WA
                </button>
              </div>
              <input
                type="text"
                value={inputNumber}
                onChange={(e) => setInputNumber(e.target.value)}
                placeholder="Target Phone Number (e.g. 9715...)"
                className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-slate-600 px-4 font-bold"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <button
              onClick={handleAdd}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-black transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 uppercase text-sm tracking-widest"
            >
              Start Probe
            </button>
          </div>
        </div>

        {/* System Settings */}
        <div className="lg:col-span-4 bg-[#16161a] p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Settings className="text-blue-500" size={24} />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              Logic
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#0a0a0c] rounded-xl border border-slate-800">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Method
              </span>
              <div className="flex bg-black/40 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => onProbeMethodChange("delete")}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-black transition-all ${
                    probeMethod === "delete"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-600 hover:text-slate-400"
                  }`}
                >
                  DELETE
                </button>
                <button
                  onClick={() => onProbeMethodChange("reaction")}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-black transition-all ${
                    probeMethod === "reaction"
                      ? "bg-yellow-600 text-white shadow-lg"
                      : "text-slate-600 hover:text-slate-400"
                  }`}
                >
                  REACTION
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowConnections(!showConnections)}
              className={`w-full py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${
                showConnections
                  ? "bg-slate-800 border-slate-700 text-white"
                  : "bg-transparent border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"
              }`}
            >
              <Settings size={14} />
              {showConnections ? "Hide Internal" : "Manage Internal"}
            </button>
          </div>
        </div>
      </div>

      {/* Connections Panel */}
      {showConnections && (
        <div className="animate-in zoom-in-95 fade-in duration-300">
          <Login connectionState={connectionState} />
        </div>
      )}

      {/* Contact Cards */}
      {contacts.size === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 opacity-20 filter grayscale">
          <Shield size={80} className="text-slate-400 mb-6" />
          <p className="text-xl font-black text-slate-400 uppercase tracking-widest">
            System Idle
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {Array.from(contacts.values()).map((contact) => (
            <ContactCard
              key={contact.jid}
              jid={contact.jid}
              displayNumber={contact.displayNumber}
              contactLabel={contact.contactName}
              data={contact.data}
              devices={contact.devices}
              deviceCount={contact.deviceCount}
              presence={contact.presence}
              profilePic={getImageUrl(contact.profilePic)}
              onRemove={() => handleRemove(contact.jid)}
              onPause={() => handlePause(contact.jid)}
              onResume={() => handleResume(contact.jid)}
              isPaused={contact.isPaused || false}
              privacyMode={privacyMode}
              platform={contact.platform}
            />
          ))}
        </div>
      )}
    </div>
  );
}
