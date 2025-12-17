"use client";

import { useEffect, useState } from "react";
import { PluginWrapper } from "@/lib/plugins/types"; // Assuming this type or similar
import { Box, Package, Download, Trash, Settings, CheckCircle2, Star } from "lucide-react";
import { motion } from "framer-motion";

// Helper for stars
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star 
            key={i} 
            className={`w-3 h-3 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-600"}`} 
        />
      ))}
    </div>
  );
}

export default function PluginsPage() {
    const [plugins, setPlugins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"browse" | "installed" | "reviews">("browse");

    useEffect(() => {
        fetchPlugins();
    }, []);

    const fetchPlugins = async () => {
        try {
            // Using admin route for full listing for now
            const res = await fetch("/api/admin/plugins");
            if (res.ok) {
                const data = await res.json();
                setPlugins(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleInstall = async (pluginId: string) => {
        // Implement install logic (likely POST to /api/admin/plugins/install)
        alert(`Install ${pluginId} clicked - logic to be implemented in Phase 3.5`);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <div>
                     <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                        Plugin Marketplace
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Extend Project Aware with powerful plugins and integrations.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10">
                {(["browse", "installed", "reviews"] as const).map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-4 px-2 text-sm font-medium transition-colors relative capitalize ${activeTab === tab ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
                    >
                        {tab}
                        {activeTab === tab && <motion.div layoutId="tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500" />}
                    </button>
                ))}
            </div>

            {/* Content Switch */}
            {activeTab === "reviews" ? (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                    <Star className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white">Reviews Center</h3>
                    <p className="text-gray-400 max-w-md mx-auto mt-2">
                        No reviews are currently pending moderation.
                    </p>
                </div>
            ) : (
                /* Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <p className="text-gray-500 col-span-full text-center py-20">Loading registry...</p>
                    ) : plugins.length === 0 ? (
                        <p className="text-gray-500 col-span-full text-center py-20">No plugins found.</p>
                    ) : (
                        plugins.filter(p => activeTab === 'browse' ? true : p.status === 'active').map((plugin) => (
                            <div key={plugin.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors group">
                                <div className="p-6 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                                            <Box className="w-6 h-6" />
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-xs font-mono text-gray-500 bg-black/20 px-2 py-1 rounded">v{plugin.version}</span>
                                            {/* Mock rating for display until real data is joined */}
                                            <StarRating rating={4} /> 
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-white mb-1">{plugin.name}</h3>
                                        <p className="text-sm text-gray-400 line-clamp-2">{plugin.description}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                         <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 px-2 py-1 bg-white/5 rounded-md border border-white/5">
                                            {plugin.category || 'Utility'}
                                         </span>
                                    </div>
                                </div>
                                <div className="p-4 bg-black/20 border-t border-white/5 flex gap-2">
                                    <button 
                                        onClick={() => handleInstall(plugin.id)}
                                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        {activeTab === 'installed' ? 'Manage' : 'Install'}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

