"use client";

import { useEffect, useState } from "react";
import { PluginRegistryItem } from "@/lib/plugins/types";
import { Box, Package, Download, Trash, Settings, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function PluginsPage() {
    // We fetch from an API route we need to create, or for now just mock it since registry is server-side.
    // Ideally we should have an API endpoint /api/plugins to list them.
    // For this implementation, let's create a client-side view that fetches from a new API route.
    
    const [plugins, setPlugins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"browse" | "installed">("browse");

    useEffect(() => {
        // Since we didn't create the API route in the plan, I will create it momentarily.
        // Assuming /api/plugins exists.
        fetchPlugins();
    }, []);

    const fetchPlugins = async () => {
        try {
            const res = await fetch("/api/plugins");
            if (res.ok) {
                const data = await res.json();
                setPlugins(data.plugins);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
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
                <button 
                    onClick={() => setActiveTab("browse")}
                    className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeTab === "browse" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
                >
                    Browse Registry
                    {activeTab === "browse" && <motion.div layoutId="tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500" />}
                </button>
                <button 
                    onClick={() => setActiveTab("installed")}
                    className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeTab === "installed" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
                >
                    Installed
                    {activeTab === "installed" && <motion.div layoutId="tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500" />}
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p className="text-gray-500 col-span-full text-center py-20">Loading registry...</p>
                ) : plugins.length === 0 ? (
                    <p className="text-gray-500 col-span-full text-center py-20">No plugins found.</p>
                ) : (
                    plugins.filter(p => activeTab === 'browse' ? true : p.isInstalled).map((plugin) => (
                        <div key={plugin.manifest.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors group">
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                                        <Box className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-mono text-gray-500 bg-black/20 px-2 py-1 rounded">v{plugin.manifest.version}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-white mb-1">{plugin.manifest.name}</h3>
                                    <p className="text-sm text-gray-400 line-clamp-2">{plugin.manifest.description}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                     <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 px-2 py-1 bg-white/5 rounded-md border border-white/5">
                                        {plugin.manifest.category}
                                     </span>
                                </div>
                            </div>
                            <div className="p-4 bg-black/20 border-t border-white/5 flex gap-2">
                                <button className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                                    <Download className="w-4 h-4" />
                                    Install
                                </button>
                                <button className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors">
                                    <Settings className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

