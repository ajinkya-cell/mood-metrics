"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Broadcast, ChatCenteredText, User, FileText, Compass, Link as LinkIcon, Plus, Minus } from "@phosphor-icons/react";

type GuestMessage = {
  id: string;
  name: string;
  message: string;
  x: number;
  y: number;
  date: string;
  connections: string[];
};

const INITIAL_MESSAGES: GuestMessage[] = [
  {
    id: "1",
    name: "Satoshi_N",
    message: "Ingesting blocks, calculating cryptographic consensus. The genesis of sentiment is here.",
    x: 80,
    y: 70,
    date: "2026-06-25",
    connections: ["6", "3"],
  },
  {
    id: "2",
    name: "Vitalik_B",
    message: "Exploring similarity trajectories between Daily Centroids. Very aligned with Ethereum research.",
    x: 380,
    y: 80,
    date: "2026-06-26",
    connections: ["3", "7"],
  },
  {
    id: "3",
    name: "CryptoWhale",
    message: "Divergence between retail consensus and funding skews detected. Long position opened.",
    x: 230,
    y: 140,
    date: "2026-06-26",
    connections: ["1", "2", "6", "8"],
  },
  {
    id: "4",
    name: "Alpha_Seeker",
    message: "Backtesting strategy models with Pearson Lag. 72% win-rate on 12h interval.",
    x: 120,
    y: 220,
    date: "2026-06-27",
    connections: ["6", "8"],
  },
  {
    id: "5",
    name: "Llama_Oracle",
    message: "Analyzing funding rates from Binance perp index. Classification labels: BULLISH.",
    x: 310,
    y: 260,
    date: "2026-06-27",
    connections: ["8", "7"],
  },
  {
    id: "6",
    name: "Ajinkya",
    message: "Designed the cockpit architecture. Ingesting panic, outputting alpha.",
    x: 110,
    y: 130,
    date: "2026-06-27",
    connections: ["1", "3", "4"],
  },
  {
    id: "7",
    name: "Antigravity Agent",
    message: "Pair programming in the sentiment loop. Ingestion channels normal.",
    x: 420,
    y: 180,
    date: "2026-06-27",
    connections: ["2", "5", "8"],
  },
  {
    id: "8",
    name: "Quant Alpha",
    message: "Backtesting contrarian flips. Funding rate normalization is clean.",
    x: 280,
    y: 200,
    date: "2026-06-27",
    connections: ["3", "4", "5", "7"],
  },
];

export default function ObsidianDotGrid() {
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>("1");
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1.0);

  const loadNotes = async () => {
    try {
      const res = await fetch("/api/guestbook", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const formatted = data.map((n: any) => ({
            id: n.id,
            name: n.name,
            message: n.message,
            x: n.x,
            y: n.y,
            date: n.createdAt ? n.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
            connections: Array.isArray(n.connections) ? n.connections : [],
          }));
          setMessages(formatted);
          if (formatted.length > 0) {
            setSelectedId(formatted[formatted.length - 1].id);
          }
          return;
        }
      }
    } catch (error) {
      console.error("Failed to fetch guestbook notes from DB:", error);
    }
    setMessages(INITIAL_MESSAGES);
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    // Generate random coordinates inside padding-safe grid limits
    const x = Math.floor(Math.random() * 380) + 60; // 60 to 440
    const y = Math.floor(Math.random() * 230) + 60; // 60 to 290

    // Find 2 nearest nodes to create connections
    const currentNodes = [...messages];
    currentNodes.sort((a, b) => {
      const distA = Math.pow(a.x - x, 2) + Math.pow(a.y - y, 2);
      const distB = Math.pow(b.x - x, 2) + Math.pow(b.y - y, 2);
      return distA - distB;
    });

    const nearestIds = currentNodes.slice(0, 2).map((n) => n.id);

    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          message: message.trim(),
          x,
          y,
          connections: nearestIds,
        }),
      });

      if (res.ok) {
        const savedNote = await res.json();
        const newId = savedNote.id;
        const dateStr = savedNote.createdAt ? savedNote.createdAt.split("T")[0] : new Date().toISOString().split("T")[0];

        const newMessage: GuestMessage = {
          id: newId,
          name: savedNote.name,
          message: savedNote.message,
          x: savedNote.x,
          y: savedNote.y,
          date: dateStr,
          connections: nearestIds,
        };

        // Update connections on nearest nodes as well (bilateral link)
        const updatedMessages = messages.map((m) => {
          if (nearestIds.includes(m.id)) {
            return {
              ...m,
              connections: [...new Set([...m.connections, newId])],
            };
          }
          return m;
        });

        const nextMessages = [...updatedMessages, newMessage];
        setMessages(nextMessages);
        setSelectedId(newId);
        setJustAddedId(newId);

        setName("");
        setMessage("");

        // Reset justAddedId trigger
        setTimeout(() => {
          setJustAddedId(null);
        }, 1500);
      } else {
        console.error("Failed to save guestbook note to DB");
      }
    } catch (error) {
      console.error("Error submitting guestbook note:", error);
    }
  };

  const selectedNode = messages.find((m) => m.id === selectedId);

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mt-12">
      {/* Left Column: Form Section */}
      <div className="lg:col-span-5 flex flex-col justify-between bg-[#0C0C0E]/50 border border-white/5 rounded-2xl p-6 md:p-8 backdrop-blur-md">
        <div>
          <h3 className="text-lg font-bold text-white font-sans mb-1">
            Leave a Note
          </h3>
          <p className="text-xs text-zinc-500 font-sans leading-relaxed mb-6">
            Type your message below. It will anchor onto the network grid.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name..."
              className="bg-transparent border-b border-white/10 focus:border-zinc-500 py-2.5 text-xs font-mono w-full transition-all outline-none text-zinc-200 placeholder-zinc-700"
            />
            <textarea
              required
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a message..."
              className="bg-transparent border-b border-white/10 focus:border-zinc-500 py-2.5 text-xs font-mono w-full transition-all outline-none text-zinc-200 placeholder-zinc-700 resize-none"
            />
            <button
              type="submit"
              className="w-full py-3 bg-zinc-900 hover:bg-zinc-850 border-t border-white/10 border-x border-zinc-800 border-b-[3px] border-zinc-950 active:border-b-[1px] active:translate-y-[2px] text-zinc-200 hover:text-white text-xs font-mono font-bold tracking-wider rounded-xl transition-all duration-150 cursor-pointer shadow-[0_2px_4px_rgba(0,0,0,0.4)] active:shadow-none"
            >
              Post to Grid
            </button>
          </form>
        </div>

        {/* Selected Details area */}
        <div className="mt-8 pt-6 border-t border-white/5 min-h-[90px]">
          <AnimatePresence mode="wait">
            {selectedNode ? (
              <motion.div
                key={selectedNode.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2 text-xs font-mono"
              >
                <div className="flex items-center justify-between text-zinc-600 text-[9px]">
                  <span>NOTE ID: #{selectedNode.id}</span>
                  <span>{selectedNode.date}</span>
                </div>
                <p className="text-zinc-300 leading-relaxed text-xs pl-2 border-l border-zinc-700 py-1">
                  "{selectedNode.message}"
                </p>
                <div className="text-zinc-300 text-[10px] font-bold pl-2">
                  — {selectedNode.name}
                </div>
              </motion.div>
            ) : (
              <div className="text-xs text-zinc-600 font-mono italic">
                Select a node on the grid to view note...
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Column: Obsidian Dot Grid Visual Graph */}
      <div className="lg:col-span-7 relative bg-[#0C0C0E]/50 border border-white/5 rounded-2xl overflow-hidden min-h-[350px] flex items-center justify-center p-4">
        {/* Prominent grid pattern background */}
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="obsidianDotPattern" width="18" height="18" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="0.7" fill="rgba(255,255,255,0.09)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#obsidianDotPattern)" />
          </svg>
        </div>

        {/* Visual Graph Area */}
        <div className="w-full max-w-lg aspect-[500/350] relative z-10">
          <svg
            viewBox="0 0 500 350"
            className="w-full h-full overflow-visible select-none pointer-events-auto"
          >
            <motion.g
              animate={{ scale: zoom }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              style={{ transformOrigin: "250px 175px" }}
            >
              {/* Draw connections */}
              {messages.map((node) => {
                return node.connections.map((connId) => {
                  const target = messages.find((m) => m.id === connId);
                  if (!target || node.id >= target.id) return null; // Avoid duplicate lines

                  return (
                    <motion.line
                      key={`${node.id}-${target.id}`}
                      x1={node.x}
                      y1={node.y}
                      x2={target.x}
                      y2={target.y}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.35 }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      stroke="#3f3f46"
                      strokeWidth={1}
                    />
                  );
                });
              })}

              {/* Draw nodes */}
              {messages.map((node) => {
                const isSelected = selectedId === node.id;
                const isJustAdded = justAddedId === node.id;

                return (
                  <g key={node.id} className="cursor-pointer" onClick={() => setSelectedId(node.id)}>
                    {/* Selected Outer Pulse Ring */}
                    {isSelected && (
                      <motion.circle
                        cx={node.x}
                        cy={node.y}
                        r={10}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="1"
                      />
                    )}

                    {/* Just Added Ripple Effect */}
                    {isJustAdded && (
                      <motion.circle
                        cx={node.x}
                        cy={node.y}
                        r={24}
                        initial={{ scale: 0.2, opacity: 0.8 }}
                        animate={{ scale: 1.8, opacity: 0 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    )}

                    {/* Intersecting line highlight halo */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isSelected ? 5.5 : 3.5}
                      fill={isSelected ? "#ffffff" : "rgba(255,255,255,0.32)"}
                      className="transition-all duration-300 hover:fill-white"
                      style={{
                        filter: isSelected ? "drop-shadow(0 0 6px rgba(255,255,255,0.5))" : "none",
                      }}
                    />

                    {/* Hitbox for easier clicking */}
                    <circle cx={node.x} cy={node.y} r={16} fill="transparent" />

                    {/* Label name */}
                    <text
                      x={node.x}
                      y={node.y - 10}
                      textAnchor="middle"
                      className="font-mono select-none fill-zinc-500 hover:fill-zinc-300 transition-colors pointer-events-none"
                      style={{ fontSize: "8.5px", letterSpacing: "0.05em" }}
                    >
                      {node.name.slice(0, 15)}
                    </text>
                  </g>
                );
              })}
            </motion.g>
          </svg>
        </div>

        {/* Float Zoom Controls Panel */}
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 bg-[#0C0C0E]/90 border border-white/10 rounded-lg p-1 shadow-[0_4px_12px_rgba(0,0,0,0.6)] backdrop-blur-md select-none">
          <button
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
            className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 active:scale-90 transition-all cursor-pointer"
            title="Zoom Out"
          >
            <Minus size={12} weight="bold" />
          </button>
          
          <button
            onClick={() => setZoom(1.0)}
            className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 w-12 text-center select-none cursor-pointer transition-colors"
            title="Reset Zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          
          <button
            onClick={() => setZoom((z) => Math.min(2.0, z + 0.15))}
            className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 active:scale-90 transition-all cursor-pointer"
            title="Zoom In"
          >
            <Plus size={12} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}
