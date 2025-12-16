"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Copy, Check, Key, Shield, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type APIKey = {
  id: string;
  name: string;
  key: string; // only shown once usually, but here we list the masked version or full if permitted by API (masked usually)
  scope: string;
  lastUsedAt: string | null;
  createdAt: string;
  isActive: boolean;
};

export default function ApiSettingsPage() {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState("");
  const [scope, setScope] = useState("read");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys);
      }
    } catch (error) {
      console.error("Failed to fetch keys", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, scope }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setNewKey(data.key);
        setCreating(false);
        setName("");
        fetchKeys();
      }
    } catch (error) {
      console.error("Failed to create key", error);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/keys?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchKeys();
      }
    } catch (error) {
      console.error("Failed to revoke key", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          API Management
        </h1>
        <p className="text-gray-400 mt-2">
          Manage API keys for accessing Project Aware programmatically.
        </p>
      </div>

      {newKey && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-500/20 p-6 rounded-xl flex flex-col gap-4"
        >
          <div className="flex items-center gap-3 text-green-400">
            <Check className="w-6 h-6" />
            <h3 className="font-semibold text-lg">API Key Created Successfully</h3>
          </div>
          <p className="text-sm text-gray-300">
            Copy this key now. You won't be able to see it again!
          </p>
          <div className="flex items-center gap-2 bg-black/40 p-3 rounded-lg border border-white/5">
            <code className="flex-1 font-mono text-green-300 break-all">{newKey}</code>
            <button 
              onClick={() => copyToClipboard(newKey)}
              className="p-2 hover:bg-white/10 rounded-md transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
          <button 
            onClick={() => setNewKey(null)}
            className="self-end text-sm text-gray-400 hover:text-white"
          >
            Done
          </button>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
                <Key className="w-5 h-5 text-blue-400" />
                <h3 className="font-medium text-gray-200">Active Keys</h3>
            </div>
            <p className="text-3xl font-bold text-white">{keys.filter(k => k.isActive).length}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <h3 className="font-medium text-gray-200">Rate Limit</h3>
            </div>
            <p className="text-3xl font-bold text-white">100 <span className="text-base text-gray-500 font-normal">req/min</span></p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <h3 className="font-medium text-gray-200">Total Usage</h3>
            </div>
            <p className="text-3xl font-bold text-white">--</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your API Keys</h2>
            <button 
                onClick={() => setCreating(!creating)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
            >
                <Plus className="w-4 h-4" />
                Create New Key
            </button>
        </div>

        <AnimatePresence>
            {creating && (
                <motion.form
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    onSubmit={handleCreate}
                    className="p-6 bg-white/[0.02] border-b border-white/10"
                >
                    <div className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-sm text-gray-400">Key Name</label>
                            <input 
                                type="text" 
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. My Production App"
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500/50"
                            />
                        </div>
                        <div className="w-48 space-y-2">
                             <label className="text-sm text-gray-400">Scope</label>
                             <select 
                                value={scope}
                                onChange={(e) => setScope(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500/50"
                             >
                                <option value="read">Read Only</option>
                                <option value="write">Write</option>
                                <option value="admin">Admin</option>
                             </select>
                        </div>
                        <button 
                            type="submit"
                            className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition-colors"
                        >
                            Generate
                        </button>
                    </div>
                </motion.form>
            )}
        </AnimatePresence>

        <div className="p-6">
            {loading ? (
                <div className="flex justify-center py-8"><RefreshCw className="animate-spin w-8 h-8 text-gray-500" /></div>
            ) : keys.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    You haven't created any API keys yet.
                </div>
            ) : (
                <div className="space-y-4">
                    {keys.map((key) => (
                        <div key={key.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                    <Key className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-white">{key.name}</h4>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                        <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/5 uppercase">{key.scope}</span>
                                        <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                                        {key.lastUsedAt && <span>Last active: {new Date(key.lastUsedAt).toLocaleDateString()}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="font-mono text-sm text-gray-500 bg-black/20 px-3 py-1 rounded">
                                    {key.key.substring(0, 8)}...{key.key.substring(key.key.length - 4)}
                                </div>
                                <button 
                                    onClick={() => handleRevoke(key.id)}
                                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                                    title="Revoke Key"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
