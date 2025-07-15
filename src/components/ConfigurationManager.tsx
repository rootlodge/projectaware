'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Download, 
  Upload, 
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Info,
  User,
  Shield,
  Palette,
  Zap,
  Bell,
  Database,
  Cog
} from 'lucide-react';
import { AppConfig } from '@/lib/config/app-config';

interface ConfigurationManagerProps {
  className?: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  config?: AppConfig;
}

const SECTION_ICONS = {
  onboarding: User,
  auth: Shield,
  ui: Palette,
  performance: Zap,
  notifications: Bell,
  backup: Database,
  security: Shield,
  system: Cog,
  custom: Settings,
};

const SECTION_LABELS = {
  onboarding: 'Onboarding',
  auth: 'Authentication',
  ui: 'User Interface',
  performance: 'Performance',
  notifications: 'Notifications',
  backup: 'Backup',
  security: 'Security',
  system: 'System',
  custom: 'Custom',
};

export default function ConfigurationManager({ className = '' }: ConfigurationManagerProps) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [activeSection, setActiveSection] = useState<keyof AppConfig>('system');
  const [hasChanges, setHasChanges] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [importData, setImportData] = useState('');

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/config');
      const data: ApiResponse = await response.json();
      
      if (data.success && data.config) {
        setConfig(data.config);
      } else {
        showMessage('error', data.error || 'Failed to load configuration');
      }
    } catch (error) {
      showMessage('error', 'Failed to load configuration');
      console.error('Configuration load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setHasChanges(false);
        showMessage('success', 'Configuration saved successfully');
      } else {
        showMessage('error', data.error || 'Failed to save configuration');
      }
    } catch (error) {
      showMessage('error', 'Failed to save configuration');
      console.error('Configuration save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetSection = async (section: keyof AppConfig) => {
    if (!confirm(`Reset ${SECTION_LABELS[section]} section to defaults?`)) return;

    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_section',
          section,
        }),
      });

      const data: ApiResponse = await response.json();
      
      if (data.success) {
        await loadConfiguration();
        showMessage('success', `${SECTION_LABELS[section]} reset to defaults`);
      } else {
        showMessage('error', data.error || 'Failed to reset section');
      }
    } catch (error) {
      showMessage('error', 'Failed to reset section');
      console.error('Reset section error:', error);
    }
  };

  const resetAll = async () => {
    if (!confirm('Reset ALL configuration to defaults? This cannot be undone.')) return;

    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_all' }),
      });

      const data: ApiResponse = await response.json();
      
      if (data.success) {
        await loadConfiguration();
        showMessage('success', 'All configuration reset to defaults');
      } else {
        showMessage('error', data.error || 'Failed to reset configuration');
      }
    } catch (error) {
      showMessage('error', 'Failed to reset configuration');
      console.error('Reset all error:', error);
    }
  };

  const exportConfiguration = async () => {
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export_config' }),
      });

      const data = await response.json();
      
      if (data.success) {
        setShowExport(true);
        setImportData(data.config);
      } else {
        showMessage('error', data.error || 'Failed to export configuration');
      }
    } catch (error) {
      showMessage('error', 'Failed to export configuration');
      console.error('Export error:', error);
    }
  };

  const importConfiguration = async () => {
    if (!importData.trim()) {
      showMessage('error', 'Please enter configuration data to import');
      return;
    }

    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import_config',
          config: importData,
        }),
      });

      const data: ApiResponse = await response.json();
      
      if (data.success) {
        await loadConfiguration();
        setImportData('');
        setShowExport(false);
        showMessage('success', 'Configuration imported successfully');
      } else {
        showMessage('error', data.error || 'Failed to import configuration');
      }
    } catch (error) {
      showMessage('error', 'Failed to import configuration');
      console.error('Import error:', error);
    }
  };

  const updateSectionValue = (section: keyof AppConfig, key: string, value: any) => {
    if (!config) return;

    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [key]: value,
      },
    });
    setHasChanges(true);
  };

  const updateNestedValue = (section: keyof AppConfig, path: string, value: any) => {
    if (!config) return;

    const keys = path.split('.');
    const newSection = { ...config[section] };
    let current: any = newSection;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;

    setConfig({
      ...config,
      [section]: newSection,
    });
    setHasChanges(true);
  };

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const renderSectionContent = () => {
    if (!config) return null;

    const sectionData = config[activeSection];
    
    return (
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">
            {SECTION_LABELS[activeSection]} Configuration
          </h3>
          <button
            onClick={() => resetSection(activeSection)}
            className="px-3 py-1 bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-lg text-sm transition-colors"
          >
            Reset Section
          </button>
        </div>

        {/* Dynamic form based on section */}
        <div className="space-y-4">
          {Object.entries(sectionData).map(([key, value]) => (
            <div key={key}>
              {typeof value === 'boolean' ? (
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => updateSectionValue(activeSection, key, e.target.checked)}
                    className="w-4 h-4 bg-gray-700 border-gray-600 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                </label>
              ) : typeof value === 'number' ? (
                <div>
                  <label className="block text-gray-300 mb-1 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => updateSectionValue(activeSection, key, Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
              ) : typeof value === 'string' ? (
                <div>
                  <label className="block text-gray-300 mb-1 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateSectionValue(activeSection, key, e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
              ) : typeof value === 'object' && value !== null ? (
                <div>
                  <label className="block text-gray-300 mb-2 capitalize font-medium">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </label>
                  <div className="ml-4 space-y-3 border-l-2 border-gray-600 pl-4">
                    {Object.entries(value).map(([nestedKey, nestedValue]) => (
                      <div key={nestedKey}>
                        {typeof nestedValue === 'boolean' ? (
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={nestedValue}
                              onChange={(e) => updateNestedValue(activeSection, `${key}.${nestedKey}`, e.target.checked)}
                              className="w-4 h-4 bg-gray-700 border-gray-600 rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-400 text-sm capitalize">
                              {nestedKey.replace(/([A-Z])/g, ' $1').toLowerCase()}
                            </span>
                          </label>
                        ) : typeof nestedValue === 'number' ? (
                          <div>
                            <label className="block text-gray-400 text-sm mb-1 capitalize">
                              {nestedKey.replace(/([A-Z])/g, ' $1').toLowerCase()}
                            </label>
                            <input
                              type="number"
                              value={nestedValue}
                              onChange={(e) => updateNestedValue(activeSection, `${key}.${nestedKey}`, Number(e.target.value))}
                              className="w-full px-3 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                            />
                          </div>
                        ) : typeof nestedValue === 'string' ? (
                          <div>
                            <label className="block text-gray-400 text-sm mb-1 capitalize">
                              {nestedKey.replace(/([A-Z])/g, ' $1').toLowerCase()}
                            </label>
                            <input
                              type="text"
                              value={nestedValue}
                              onChange={(e) => updateNestedValue(activeSection, `${key}.${nestedKey}`, e.target.value)}
                              className="w-full px-3 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                            />
                          </div>
                        ) : (
                          <div className="text-gray-500 text-sm">
                            {nestedKey}: {JSON.stringify(nestedValue)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6 flex items-center justify-center ${className}`}>
        <div className="text-white">Loading configuration...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <Settings className="w-8 h-8 mr-3" />
            Configuration Manager
          </h1>
          <p className="text-purple-300">
            Manage application settings and preferences
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'success' ? 'bg-green-500/20 border border-green-500/50' :
            message.type === 'error' ? 'bg-red-500/20 border border-red-500/50' :
            'bg-blue-500/20 border border-blue-500/50'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-400" /> :
             message.type === 'error' ? <AlertTriangle className="w-5 h-5 text-red-400" /> :
             <Info className="w-5 h-5 text-blue-400" />}
            <span className={
              message.type === 'success' ? 'text-green-300' :
              message.type === 'error' ? 'text-red-300' :
              'text-blue-300'
            }>
              {message.text}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Section Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 sticky top-6">
              <h2 className="text-lg font-semibold text-white mb-4">Sections</h2>
              <nav className="space-y-2">
                {Object.keys(SECTION_LABELS).map((section) => {
                  const sectionKey = section as keyof AppConfig;
                  const Icon = SECTION_ICONS[sectionKey];
                  const isActive = activeSection === sectionKey;
                  
                  return (
                    <button
                      key={section}
                      onClick={() => setActiveSection(sectionKey)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        isActive 
                          ? 'bg-purple-500/30 text-purple-200 border border-purple-400/50' 
                          : 'text-gray-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{SECTION_LABELS[sectionKey]}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Actions */}
              <div className="mt-6 pt-6 border-t border-gray-600 space-y-2">
                <button
                  onClick={exportConfiguration}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
                
                <button
                  onClick={() => setShowExport(true)}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import</span>
                </button>
                
                <button
                  onClick={resetAll}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-red-300 hover:text-red-200 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset All</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              {renderSectionContent()}
            </div>

            {/* Save Controls */}
            <div className="mt-6 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <button
                  onClick={loadConfiguration}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 rounded-lg text-white transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Reload</span>
                </button>
                
                {hasChanges && (
                  <div className="flex items-center space-x-2 text-orange-300">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">Unsaved changes</span>
                  </div>
                )}
              </div>

              <button
                onClick={saveConfiguration}
                disabled={saving || !hasChanges}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-colors ${
                  hasChanges && !saving
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Export/Import Modal */}
        {showExport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
              <h3 className="text-xl font-semibold text-white mb-4">Export/Import Configuration</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">Configuration Data (JSON)</label>
                  <textarea
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    rows={15}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-sm"
                    placeholder="Paste configuration JSON here to import..."
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowExport(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={importConfiguration}
                    disabled={!importData.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Import Configuration
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
