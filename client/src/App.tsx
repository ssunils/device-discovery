import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { LayoutDashboard, History as HistoryIcon, Shield, ShieldOff, Signal as SignalIcon } from 'lucide-react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { History } from './components/History';

// Create socket with autoConnect disabled so we can add listeners before connecting
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
export const socket: Socket = io(API_URL, { autoConnect: false });

export type Platform = 'whatsapp' | 'signal';
export type ProbeMethod = 'delete' | 'reaction';

export interface ConnectionState {
    whatsapp: boolean;
    signal: boolean;
    signalNumber: string | null;
    signalApiAvailable: boolean;
    signalQrImage: string | null;
    whatsappQr: string | null;
}

function App() {
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [view, setView] = useState<'dashboard' | 'history'>('dashboard');
    const [privacyMode, setPrivacyMode] = useState(false);
    const [probeMethod, setProbeMethod] = useState<ProbeMethod>('reaction');
    const [connectionState, setConnectionState] = useState<ConnectionState>({
        whatsapp: false,
        signal: false,
        signalNumber: null,
        signalApiAvailable: false,
        signalQrImage: null,
        whatsappQr: null
    });

    const isAnyPlatformReady = connectionState.whatsapp || connectionState.signal;

    useEffect(() => {
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
                whatsappQr: null
            });
        }

        function onWhatsAppConnectionOpen() {
            setConnectionState(prev => ({ ...prev, whatsapp: true, whatsappQr: null }));
        }

        function onWhatsAppQr(qr: string) {
            console.log('[WHATSAPP] Received QR code');
            setConnectionState(prev => ({ ...prev, whatsappQr: qr }));
        }

        function onSignalConnectionOpen(data: { number: string }) {
            setConnectionState(prev => ({
                ...prev,
                signal: true,
                signalNumber: data.number
            }));
        }

        function onSignalDisconnected() {
            setConnectionState(prev => ({
                ...prev,
                signal: false,
                signalNumber: null
            }));
        }

        function onSignalApiStatus(data: { available: boolean }) {
            setConnectionState(prev => ({ ...prev, signalApiAvailable: data.available }));
        }

        function onSignalQrImage(url: string) {
            console.log('[SIGNAL] Received QR image URL:', url);
            setConnectionState(prev => ({ ...prev, signalQrImage: url }));
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('qr', onWhatsAppQr);
        socket.on('connection-open', onWhatsAppConnectionOpen);
        socket.on('signal-connection-open', onSignalConnectionOpen);
        socket.on('signal-disconnected', onSignalDisconnected);
        socket.on('signal-api-status', onSignalApiStatus);
        socket.on('signal-qr-image', onSignalQrImage);

        // Now connect after listeners are set up
        if (!socket.connected) {
            socket.connect();
        }

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('qr', onWhatsAppQr);
            socket.off('connection-open', onWhatsAppConnectionOpen);
            socket.off('signal-connection-open', onSignalConnectionOpen);
            socket.off('signal-disconnected', onSignalDisconnected);
            socket.off('signal-api-status', onSignalApiStatus);
            socket.off('signal-qr-image', onSignalQrImage);
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-slate-200">
            <div className="max-w-7xl mx-auto px-4 py-6">
                <header className="mb-10 bg-[#16161a] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-indigo-600/20 rounded-xl">
                            <SignalIcon className="w-8 h-8 text-indigo-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">NexusTracker</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-slate-500">
                                    <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                    {isConnected ? 'System Online' : 'Core Offline'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {isAnyPlatformReady && (
                        <nav className="flex items-center bg-black/40 p-1 rounded-xl border border-slate-800">
                            <button
                                onClick={() => setView('dashboard')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                            >
                                <LayoutDashboard size={18} />
                                Dashboard
                            </button>
                            <button
                                onClick={() => setView('history')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
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
                                className={`p-2.5 rounded-xl border transition-all ${privacyMode ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'}`}
                                title={privacyMode ? "Disable Stealth Mode" : "Enable Stealth Mode"}
                            >
                                {privacyMode ? <ShieldOff size={20} /> : <Shield size={20} />}
                            </button>
                        )}
                        
                        <div className="h-8 w-px bg-slate-800 mx-1 hidden md:block" />
                        
                        <div className="flex bg-[#0a0a0c] p-1 rounded-xl border border-slate-800">
                            <div className="flex items-center px-3 py-1.5 gap-2">
                                <div className={`w-2 h-2 rounded-full ${connectionState.whatsapp ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-700'}`} />
                                <span className={`text-[11px] font-bold uppercase tracking-wider ${connectionState.whatsapp ? 'text-slate-200' : 'text-slate-600'}`}>WA</span>
                            </div>
                            <div className="w-px h-4 bg-slate-800 my-auto" />
                            <div className="flex items-center px-3 py-1.5 gap-2">
                                <div className={`w-2 h-2 rounded-full ${connectionState.signal ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-slate-700'}`} />
                                <span className={`text-[11px] font-bold uppercase tracking-wider ${connectionState.signal ? 'text-slate-200' : 'text-slate-600'}`}>SIG</span>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="animate-in fade-in duration-500">
                    {!isAnyPlatformReady ? (
                        <Login connectionState={connectionState} />
                    ) : view === 'history' ? (
                        <History onBack={() => setView('dashboard')} />
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
