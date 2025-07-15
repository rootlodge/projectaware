'use client';

import React, { useState, useEffect } from 'react';
import { Database, Save, RefreshCw, Trash2, Plus, Edit3, Check, X, AlertCircle } from 'lucide-react';

interface DatabaseConfig {
  id: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  category: string;
  lastModified: string;
  isEditing?: boolean;
}

interface DatabaseStats {
  totalEntries: number;
  categories: string[];
  lastBackup: string;
  databaseSize: string;
}

export default function DatabaseManagement() {
  const [configs, setConfigs] = useState<DatabaseConfig[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newConfig, setNewConfig] = useState({
    key: '',
    value: '',
    type: 'string' as 'string' | 'number' | 'boolean' | 'object' | 'array',
    description: '',
    category: 'general'
  });

  useEffect(() => {
    loadDatabaseConfigs();
    loadDatabaseStats();
  }, []);

  const loadDatabaseConfigs = async () => {
    try {
      const response = await fetch('/api/database/configs');
      const data = await response.json();
      setConfigs(data.configs || []);
    } catch (error) {
      console.error('Error loading database configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDatabaseStats = async () => {
    try {
      const response = await fetch('/api/database/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading database stats:', error);
    }
  };

  const saveConfig = async (config: DatabaseConfig) => {
    try {
      const response = await fetch('/api/database/configs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        await loadDatabaseConfigs();
        await loadDatabaseStats();
      }
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

  const deleteConfig = async (configId: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;
    
    try {
      const response = await fetch(`/api/database/configs/${configId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadDatabaseConfigs();
        await loadDatabaseStats();
      }
    } catch (error) {
      console.error('Error deleting config:', error);
    }
  };

  const addNewConfig = async () => {
    try {
      let parsedValue: any = newConfig.value;
      
      // Parse value based on type
      if (newConfig.type === 'number') {
        parsedValue = parseFloat(newConfig.value);
      } else if (newConfig.type === 'boolean') {
        parsedValue = newConfig.value.toLowerCase() === 'true';
      } else if (newConfig.type === 'object' || newConfig.type === 'array') {
        parsedValue = JSON.parse(newConfig.value);
      }

      const response = await fetch('/api/database/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newConfig,
          value: parsedValue
        })
      });
      
      if (response.ok) {
        setShowAddModal(false);
        setNewConfig({ key: '', value: '', type: 'string', description: '', category: 'general' });
        await loadDatabaseConfigs();
        await loadDatabaseStats();
      }
    } catch (error) {
      console.error('Error adding config:', error);
    }
  };

  const migrateFromJSON = async () => {
    if (!confirm('This will migrate JSON configurations to the database. Continue?')) return;
    
    try {
      const response = await fetch('/api/database/migrate', {
        method: 'POST'
      });
      
      if (response.ok) {
        await loadDatabaseConfigs();
        await loadDatabaseStats();
        alert('Migration completed successfully!');
      }
    } catch (error) {
      console.error('Error during migration:', error);
      alert('Migration failed. Check console for details.');
    }
  };

  const backupDatabase = async () => {
    try {
      const response = await fetch('/api/database/backup', {
        method: 'POST'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `database-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error creating backup:', error);
    }
  };

  const filteredConfigs = configs.filter(config => {
    const matchesCategory = selectedCategory === 'all' || config.category === selectedCategory;
    const matchesSearch = config.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         config.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ['all', ...Array.from(new Set(configs.map(c => c.category)))];

  const handleEdit = (configId: string) => {
    setConfigs(configs.map(c => 
      c.id === configId ? { ...c, isEditing: true } : c
    ));
  };

  const handleSave = async (config: DatabaseConfig) => {
    await saveConfig(config);
    setConfigs(configs.map(c => 
      c.id === config.id ? { ...c, isEditing: false } : c
    ));
  };

  const handleCancel = (configId: string) => {
    setConfigs(configs.map(c => 
      c.id === configId ? { ...c, isEditing: false } : c
    ));
  };

  const formatValue = (value: any, type: string) => {
    if (type === 'object' || type === 'array') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
        <span className="ml-2 text-purple-300">Loading database configurations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800 rounded-lg p-6 border border-cyan-500/30">
        <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
          <Database className="w-6 h-6" />
          🗄️ Database Management
        </h3>
        
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{stats.totalEntries}</div>
              <div className="text-sm text-slate-400">Total Entries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{stats.categories.length}</div>
              <div className="text-sm text-slate-400">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.databaseSize}</div>
              <div className="text-sm text-slate-400">Database Size</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-orange-400">{stats.lastBackup}</div>
              <div className="text-sm text-slate-400">Last Backup</div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Config
          </button>
          <button
            onClick={migrateFromJSON}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            Migrate from JSON
          </button>
          <button
            onClick={backupDatabase}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Backup Database
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search configurations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-purple-500"
            />
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-purple-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Configurations List */}
      <div className="space-y-4">
        {filteredConfigs.map((config) => (
          <div key={config.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-white">{config.key}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    config.type === 'string' ? 'bg-blue-600' :
                    config.type === 'number' ? 'bg-green-600' :
                    config.type === 'boolean' ? 'bg-yellow-600' :
                    'bg-purple-600'
                  } text-white`}>
                    {config.type}
                  </span>
                  <span className="px-2 py-1 rounded text-xs bg-slate-600 text-slate-200">
                    {config.category}
                  </span>
                </div>
                
                {config.description && (
                  <p className="text-slate-400 text-sm mb-2">{config.description}</p>
                )}
                
                {config.isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={formatValue(config.value, config.type)}
                      onChange={(e) => {
                        let newValue: any = e.target.value;
                        try {
                          if (config.type === 'number') {
                            newValue = parseFloat(e.target.value);
                          } else if (config.type === 'boolean') {
                            newValue = e.target.value.toLowerCase() === 'true';
                          } else if (config.type === 'object' || config.type === 'array') {
                            newValue = JSON.parse(e.target.value);
                          }
                        } catch (error) {
                          // Keep as string if parsing fails
                        }
                        
                        setConfigs(configs.map(c => 
                          c.id === config.id ? { ...c, value: newValue } : c
                        ));
                      }}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-purple-500 font-mono text-sm"
                      rows={config.type === 'object' || config.type === 'array' ? 4 : 1}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(config)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-1"
                      >
                        <Check className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={() => handleCancel(config.id)}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-700 p-3 rounded font-mono text-sm text-slate-200">
                    {formatValue(config.value, config.type)}
                  </div>
                )}
                
                <p className="text-xs text-slate-500 mt-2">
                  Last modified: {new Date(config.lastModified).toLocaleString()}
                </p>
              </div>
              
              <div className="flex gap-2 ml-4">
                {!config.isEditing ? (
                  <>
                    <button
                      onClick={() => handleEdit(config.id)}
                      className="p-2 text-blue-400 hover:text-blue-300"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteConfig(config.id)}
                      className="p-2 text-red-400 hover:text-red-300"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Config Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">Add New Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Key</label>
                <input
                  type="text"
                  value={newConfig.key}
                  onChange={(e) => setNewConfig({ ...newConfig, key: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-purple-500"
                  placeholder="configuration.key"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
                <select
                  value={newConfig.type}
                  onChange={(e) => setNewConfig({ ...newConfig, type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-purple-500"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="object">Object</option>
                  <option value="array">Array</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Value</label>
                <textarea
                  value={newConfig.value}
                  onChange={(e) => setNewConfig({ ...newConfig, value: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-purple-500 font-mono text-sm"
                  rows={newConfig.type === 'object' || newConfig.type === 'array' ? 4 : 1}
                  placeholder={newConfig.type === 'object' ? '{"key": "value"}' : 
                              newConfig.type === 'array' ? '["item1", "item2"]' :
                              newConfig.type === 'boolean' ? 'true or false' :
                              newConfig.type === 'number' ? '123' : 'text value'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                <input
                  type="text"
                  value={newConfig.category}
                  onChange={(e) => setNewConfig({ ...newConfig, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-purple-500"
                  placeholder="general"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={newConfig.description}
                  onChange={(e) => setNewConfig({ ...newConfig, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-purple-500"
                  placeholder="Description of this configuration"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={addNewConfig}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
              >
                Add Configuration
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredConfigs.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400">
            {configs.length === 0 ? 'No configurations found. Add some or migrate from JSON files.' :
             'No configurations match your current filters.'}
          </p>
        </div>
      )}
    </div>
  );
}
