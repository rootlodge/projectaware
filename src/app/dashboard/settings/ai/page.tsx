"use client";

import { useState, useEffect } from "react";
import { Save, Key, Globe, Loader2, CheckCircle2 } from "lucide-react";

interface ModelConfig {
    id: string;
    modelId: string;
    isEnabled: boolean;
    encryptedApiKey?: string;
    customEndpoint?: string;
    model: {
        name: string;
        provider: string;
    }
}

export default function AISettingsPage() {
    const [configs, setConfigs] = useState<ModelConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            const res = await fetch("/api/ai/config");
            if (res.ok) {
                const data = await res.json();
                setConfigs(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (config: ModelConfig, apiKey: string) => {
        setSaving(config.modelId);
        try {
            await fetch("/api/ai/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    modelId: config.modelId,
                    apiKey,
                    isEnabled: config.isEnabled,
                    customEndpoint: config.customEndpoint
                })
            });
            // Refresh to show saved state
            await fetchConfigs();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">AI Configuration</h1>
                <p className="text-gray-400 mt-2">Manage your AI models and API connections.</p>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Placeholder for when no configs exist yet - usually we'd seed or show discover list */}
                    {configs.length === 0 && (
                        <div className="p-6 bg-white/5 rounded-xl border border-white/10 text-center">
                            <p className="text-gray-400">No models configured yet. Discovery not implemented in UI.</p>
                        </div>
                    )}

                    {configs.map(config => (
                        <div key={config.id} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-white">{config.model.name}</h3>
                                    <span className="text-xs font-mono text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded uppercase">{config.model.provider}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={config.isEnabled} 
                                            onChange={(e) => {
                                                const newConfig = { ...config, isEnabled: e.target.checked };
                                                setConfigs(configs.map(c => c.id === config.id ? newConfig : c));
                                                // Auto save toggle? Or require button? Let's require button for keys.
                                            }}
                                            className="rounded border-gray-600 bg-black/40 text-emerald-500 focus:ring-emerald-500"
                                        />
                                        Enabled
                                    </label>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-400 flex items-center gap-1">
                                        <Key className="w-3 h-3" /> API Key
                                    </label>
                                    <input 
                                        type="password" 
                                        placeholder={config.encryptedApiKey ? "•••••••••••••" : "Enter API Key"}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none transition-colors"
                                        onChange={(e) => {
                                             // State mgmt for local edit
                                        }}
                                        // Need separate state for input value vs config value
                                    />
                                </div>
                                
                                {config.model.provider === 'custom' && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-gray-400 flex items-center gap-1">
                                            <Globe className="w-3 h-3" /> Endpoint URL
                                        </label>
                                        <input 
                                            type="text" 
                                            value={config.customEndpoint || ""}
                                            placeholder="https://api.example.com/v1"
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none transition-colors"
                                            onChange={(e) => {
                                                const newConfig = { ...config, customEndpoint: e.target.value };
                                                setConfigs(configs.map(c => c.id === config.id ? newConfig : c));
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end pt-2">
                                <button 
                                    onClick={() => handleSave(config, "demo-key")} // Need real key state interaction
                                    disabled={saving === config.modelId}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving === config.modelId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Configuration
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
