import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ConnectionState } from '../App';
import { CheckCircle, Shield, MessageCircle, AlertTriangle } from 'lucide-react';

interface LoginProps {
    connectionState: ConnectionState;
}

export function Login({ connectionState }: LoginProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* WhatsApp Connection */}
            <div className="flex flex-col items-center justify-center bg-[#16161a] p-10 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-green-500 opacity-20" />
                
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
                        <MessageCircle size={28} />
                    </div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Access WA Node</h2>
                </div>

                {connectionState.whatsapp ? (
                    <div className="w-64 h-64 flex flex-col items-center justify-center bg-[#0a0a0c] border border-green-500/30 rounded-2xl animate-in zoom-in-95 duration-500">
                        <CheckCircle size={64} className="text-green-500 mb-4 drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]" />
                        <span className="text-xs font-black text-green-500 uppercase tracking-widest">Connection Stable</span>
                    </div>
                ) : (
                    <>
                        <div className="bg-white p-6 rounded-2xl mb-8 shadow-[0_0_50px_rgba(255,255,255,0.05)] transform transition-transform group-hover:scale-105 duration-500">
                            {connectionState.whatsappQr ? (
                                <QRCodeSVG value={connectionState.whatsappQr} size={220} />
                            ) : (
                                <div className="w-[220px] h-[220px] flex items-center justify-center text-slate-700 bg-slate-900 rounded-xl">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Generating PK...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <p className="text-slate-500 text-[11px] text-center max-w-xs font-bold uppercase tracking-widest leading-relaxed">
                            Open WhatsApp mobile {'>'} Linked Devices {'>'} Scan Secure Access Token
                        </p>
                    </>
                )}
            </div>

            {/* Signal Connection */}
            <div className="flex flex-col items-center justify-center bg-[#16161a] p-10 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 opacity-20" />

                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                        <Shield size={28} />
                    </div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Access Signal Node</h2>
                </div>

                {connectionState.signal ? (
                    <div className="w-64 h-64 flex flex-col items-center justify-center bg-[#0a0a0c] border border-blue-500/30 rounded-2xl animate-in zoom-in-95 duration-500">
                        <CheckCircle size={64} className="text-blue-500 mb-4 drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]" />
                        <span className="text-xs font-black text-blue-500 uppercase tracking-widest">Secure Channel Active</span>
                        <span className="text-[10px] text-slate-500 mt-2 font-mono">ID: {connectionState.signalNumber}</span>
                    </div>
                ) : connectionState.signalApiAvailable ? (
                    <>
                        <div className="bg-white p-6 rounded-2xl mb-8 shadow-[0_0_50px_rgba(255,255,255,0.05)] transform transition-transform group-hover:scale-105 duration-500">
                            {connectionState.signalQrImage ? (
                                <img
                                    src={connectionState.signalQrImage}
                                    alt="Signal QR Code"
                                    width={220}
                                    height={220}
                                    className="rounded-lg"
                                />
                            ) : (
                                <div className="w-[220px] h-[220px] flex items-center justify-center text-slate-700 bg-slate-900 rounded-xl">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Handshake...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <p className="text-slate-500 text-[11px] text-center max-w-xs font-bold uppercase tracking-widest leading-relaxed">
                            Open Signal mobile {'>'} Settings {'>'} Linked Devices {'>'} Initiate Link
                        </p>
                    </>
                ) : (
                    <div className="w-64 h-64 flex flex-col items-center justify-center bg-black/40 border border-red-500/20 rounded-2xl">
                        <AlertTriangle size={48} className="text-red-500/50 mb-4" />
                        <p className="text-center px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Signal API Offline</p>
                        <p className="text-[9px] text-center px-6 mt-2 text-slate-600 font-bold uppercase tracking-tighter">Check REST endpoint status</p>
                    </div>
                )}
            </div>
        </div>
    );
}
