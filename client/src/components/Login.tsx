import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { ConnectionState } from "../App";
import { CheckCircle, MessageCircle } from "lucide-react";

interface LoginProps {
  connectionState: ConnectionState;
}

export function Login({ connectionState }: LoginProps) {
  return (
    <div className="flex justify-center">
      {/* WhatsApp Connection */}
      <div className="w-full max-w-xl flex flex-col items-center justify-center bg-[#16161a] p-10 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-green-500 opacity-20" />

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
            <MessageCircle size={28} />
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">
            Access WA Node
          </h2>
        </div>

        {connectionState.whatsapp ? (
          <div className="w-64 h-64 flex flex-col items-center justify-center bg-[#0a0a0c] border border-green-500/30 rounded-2xl animate-in zoom-in-95 duration-500">
            <CheckCircle
              size={64}
              className="text-green-500 mb-4 drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]"
            />
            <span className="text-xs font-black text-green-500 uppercase tracking-widest">
              Connection Stable
            </span>
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
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Generating PK...
                    </span>
                  </div>
                </div>
              )}
            </div>
            <p className="text-slate-500 text-[11px] text-center max-w-xs font-bold uppercase tracking-widest leading-relaxed">
              Open WhatsApp mobile {">"} Linked Devices {">"} Scan Secure Access
              Token
            </p>
          </>
        )}
      </div>
    </div>
  );
}
