import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  LayoutDashboard,
  History as HistoryIcon,
  Shield,
  ShieldOff,
  Signal as SignalIcon,
  LogOut,
} from "lucide-react";
import { AuthLogin } from "./components/AuthLogin";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { History } from "./components/History";

// Create socket with autoConnect disabled so we can add listeners before connecting
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function setSocket(s: Socket | null) {
  socket = s;
}

export type Platform = "whatsapp" | "signal";
export type ProbeMethod = "delete" | "reaction";

export interface ConnectionState {
  whatsapp: boolean;
  signal: boolean;
  signalNumber: string | null;
  signalApiAvailable: boolean;
  signalQrImage: string | null;
  whatsappQr: string | null;
}

function App() {
  const [isConnected, setIsConnected] = useState(socket?.connected || false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState<"dashboard" | "history">("dashboard");
  const [privacyMode, setPrivacyMode] = useState(false);
  const [probeMethod, setProbeMethod] = useState<ProbeMethod>("reaction");
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    whatsapp: false,
    signal: false,
    signalNumber: null,
    signalApiAvailable: false,
    signalQrImage: null,
    whatsappQr: null,
  });

  const isAnyPlatformReady = connectionState.whatsapp;

  const handleLogin = (token: string) => {
    setIsAuthenticated(true);
    // Initialize socket after authentication
    const newSocket = io(API_URL, { autoConnect: false, auth: { token } });
    setSocket(newSocket);
    setupSocketListeners(newSocket);
    if (!newSocket.connected) {
      newSocket.connect();
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    setIsConnected(false);
    setConnectionState({
      whatsapp: false,
      signal: false,
      signalNumber: null,
      signalApiAvailable: false,
      signalQrImage: null,
      whatsappQr: null,
    });
  };

  function setupSocketListeners(sock: Socket) {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
      setConnectionState({
        whatsapp: false,
        signal: false,
        signalNumber: null,
        signalApiAvailable: false,
        signalQrImage: null,
        whatsappQr: null,
      });
    }

    function onWhatsAppConnectionOpen() {
      setConnectionState((prev) => ({
        ...prev,
        whatsapp: true,
        whatsappQr: null,
      }));
    }

    function onWhatsAppQr(qr: string) {
      console.log("[WHATSAPP] Received QR code");
      setConnectionState((prev) => ({ ...prev, whatsappQr: qr }));
    }

    function onSignalConnectionOpen(data: { number: string }) {
      setConnectionState((prev) => ({
        ...prev,
        signal: true,
        signalNumber: data.number,
      }));
    }

    function onSignalDisconnected() {
      setConnectionState((prev) => ({
        ...prev,
        signal: false,
        signalNumber: null,
      }));
    }

    function onSignalApiStatus(data: { available: boolean }) {
      setConnectionState((prev) => ({
        ...prev,
        signalApiAvailable: data.available,
      }));
    }

    function onSignalQrImage(url: string) {
      console.log("[SIGNAL] Received QR image URL:", url);
      setConnectionState((prev) => ({ ...prev, signalQrImage: url }));
    }

    function onWhatsAppLoggedOut() {
      console.log("[WHATSAPP] Logged out");
      setConnectionState((prev) => ({
        ...prev,
        whatsapp: false,
        whatsappQr: null,
      }));
    }

    sock.on("connect", onConnect);
    sock.on("disconnect", onDisconnect);
    sock.on("qr", onWhatsAppQr);
    sock.on("connection-open", onWhatsAppConnectionOpen);
    sock.on("signal-connection-open", onSignalConnectionOpen);
    sock.on("signal-disconnected", onSignalDisconnected);
    sock.on("signal-api-status", onSignalApiStatus);
    sock.on("signal-qr-image", onSignalQrImage);
    sock.on("whatsapp-logged-out", onWhatsAppLoggedOut);
  }

  useEffect(() => {
    if (isAuthenticated && socket) {
      setupSocketListeners(socket);
      if (!socket.connected) {
        socket.connect();
      }

      return () => {
        // Cleanup listeners
        if (socket) {
          socket.off("connect");
          socket.off("disconnect");
          socket.off("qr");
          socket.off("connection-open");
          socket.off("signal-connection-open");
          socket.off("signal-disconnected");
          socket.off("signal-api-status");
          socket.off("signal-qr-image");
          socket.off("whatsapp-logged-out");
        }
      };
    }
  }, [isAuthenticated]);

  // Show auth login if not authenticated
  if (!isAuthenticated) {
    return <AuthLogin onLogin={handleLogin} apiUrl={API_URL} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="mb-10 bg-[#16161a] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-blue-600/20 rounded-xl">
              <SignalIcon color="#fff" className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                DeviceTracker
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-slate-500">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                    }`}
                  />
                  {isConnected ? "System Online" : "Core Offline"}
                </span>
              </div>
            </div>
          </div>

          {isAnyPlatformReady && (
            <nav className="flex items-center bg-black/40 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setView("dashboard")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  view === "dashboard"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </button>
              <button
                onClick={() => setView("history")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  view === "history"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <HistoryIcon size={18} />
                History
              </button>
            </nav>
          )}

          <div className="flex items-center gap-3">
            {isAnyPlatformReady && (
              <button
                onClick={() => setPrivacyMode(!privacyMode)}
                className={`p-2.5 rounded-xl border transition-all ${
                  privacyMode
                    ? "bg-red-500/10 border-red-500/50 text-red-500"
                    : "bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200"
                }`}
                title={
                  privacyMode ? "Disable Stealth Mode" : "Enable Stealth Mode"
                }
              >
                {privacyMode ? <ShieldOff size={20} /> : <Shield size={20} />}
              </button>
            )}

            {connectionState.whatsapp && (
              <button
                onClick={() => {
                  const sock = getSocket();
                  if (sock) sock.emit("logout-whatsapp");
                }}
                className="p-2.5 rounded-xl border bg-amber-500/10 border-amber-500/50 text-amber-500 hover:text-amber-400 transition-all"
                title="Logout from WhatsApp"
              >
                <LogOut size={20} />
              </button>
            )}

            <div className="h-8 w-px bg-slate-800 mx-1 hidden md:block" />

            <div className="flex bg-[#0a0a0c] p-1 rounded-xl border border-slate-800">
              <div className="flex items-center px-3 py-1.5 gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connectionState.whatsapp
                      ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                      : "bg-slate-700"
                  }`}
                />
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    connectionState.whatsapp
                      ? "text-slate-200"
                      : "text-slate-600"
                  }`}
                >
                  WA
                </span>
              </div>
              <div className="w-px h-4 bg-slate-800 my-auto" />
              <div className="flex items-center px-3 py-1.5 gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connectionState.signal
                      ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                      : "bg-slate-700"
                  }`}
                />
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    connectionState.signal ? "text-slate-200" : "text-slate-600"
                  }`}
                >
                  SIG
                </span>
              </div>
            </div>
          </div>

          {/* App Logout Button */}
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl border bg-red-500/10 border-red-500/50 text-red-500 hover:text-red-400 transition-all"
            title="Logout from Application"
          >
            <LogOut size={20} />
          </button>
        </header>

        <main className="animate-in fade-in duration-500">
          {!isAnyPlatformReady ? (
            <Login connectionState={connectionState} />
          ) : view === "history" ? (
            <History onBack={() => setView("dashboard")} />
          ) : (
            <Dashboard
              connectionState={connectionState}
              privacyMode={privacyMode}
              probeMethod={probeMethod}
              onProbeMethodChange={setProbeMethod}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
