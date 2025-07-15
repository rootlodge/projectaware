'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Download,
  Upload,
  FileText,
  Shield,
  Zap
} from 'lucide-react';

interface MigrationStatus {
  valid: boolean;
  issues: string[];
  suggestions: string[];
  issueCount: number;
  suggestionCount: number;
}

interface MigrationResult {
  success: boolean;
  migration?: {
    migratedFiles: string[];
    migratedEnvVars: string[];
    errors: string[];
    warnings: string[];
    fileCount: number;
    envVarCount: number;
    errorCount: number;
    warningCount: number;
  };
  backupPath?: string;
  report?: string;
  timestamp?: string;
}

export default function MigrationWizard() {
  const [step, setStep] = useState<'check' | 'backup' | 'migrate' | 'complete'>('check');
  const [loading, setLoading] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (step === 'check') {
      validateConfiguration();
    }
  }, [step]);

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const validateConfiguration = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/config/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate' }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMigrationStatus(data.validation);
      } else {
        showMessage('error', data.error || 'Failed to validate configuration');
      }
    } catch (error) {
      showMessage('error', 'Failed to validate configuration');
      console.error('Validation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/config/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'backup' }),
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', `Backup created: ${data.backupPath}`);
        setStep('migrate');
      } else {
        showMessage('error', data.error || 'Failed to create backup');
      }
    } catch (error) {
      showMessage('error', 'Failed to create backup');
      console.error('Backup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/config/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'migrate' }),
      });

      const data = await response.json();
      setMigrationResult(data);
      
      if (data.success) {
        showMessage('success', 'Migration completed successfully!');
        setStep('complete');
      } else {
        showMessage('error', data.error || 'Migration failed');
      }
    } catch (error) {
      showMessage('error', 'Migration failed');
      console.error('Migration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!migrationResult?.report) return;
    
    const blob = new Blob([migrationResult.report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `migration-report-${migrationResult.timestamp?.replace(/[:.]/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderStep = () => {
    switch (step) {
      case 'check':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Settings className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Configuration Migration</h2>
              <p className="text-gray-300">
                Migrate from environment variables to TypeScript configuration system
              </p>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-300">Validating current configuration...</p>
              </div>
            ) : migrationStatus ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border ${
                  migrationStatus.valid 
                    ? 'bg-green-500/20 border-green-500/50' 
                    : 'bg-yellow-500/20 border-yellow-500/50'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {migrationStatus.valid ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    )}
                    <span className={`font-semibold ${
                      migrationStatus.valid ? 'text-green-300' : 'text-yellow-300'
                    }`}>
                      {migrationStatus.valid ? 'Configuration Valid' : 'Issues Found'}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    {migrationStatus.issueCount} issues, {migrationStatus.suggestionCount} suggestions
                  </p>
                </div>

                {migrationStatus.issues.length > 0 && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                    <h4 className="font-semibold text-red-300 mb-2">Issues:</h4>
                    <ul className="text-red-200 text-sm space-y-1">
                      {migrationStatus.issues.map((issue, index) => (
                        <li key={index}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {migrationStatus.suggestions.length > 0 && (
                  <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-300 mb-2">Suggestions:</h4>
                    <ul className="text-blue-200 text-sm space-y-1">
                      {migrationStatus.suggestions.map((suggestion, index) => (
                        <li key={index}>• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-between">
                  <button
                    onClick={validateConfiguration}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Re-validate
                  </button>
                  
                  <button
                    onClick={() => setStep('backup')}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    Continue Migration
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        );

      case 'backup':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Database className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Create Backup</h2>
              <p className="text-gray-300">
                Before migrating, we'll create a backup of your current configuration
              </p>
            </div>

            <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-300 mb-2">What will be backed up:</h4>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• All JSON configuration files</li>
                <li>• Environment variable files (.env, .env.local, etc.)</li>
                <li>• Current database configuration</li>
              </ul>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('check')}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Back
              </button>
              
              <button
                onClick={createBackup}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Backup...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Create Backup & Continue</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case 'migrate':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Zap className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Run Migration</h2>
              <p className="text-gray-300">
                Ready to migrate to the new TypeScript configuration system
              </p>
            </div>

            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-300 mb-2">Migration will:</h4>
              <ul className="text-yellow-200 text-sm space-y-1">
                <li>• Convert environment variables to configuration settings</li>
                <li>• Migrate JSON configuration files to the database</li>
                <li>• Preserve all existing settings and preferences</li>
                <li>• Create a detailed migration report</li>
              </ul>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('backup')}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Back
              </button>
              
              <button
                onClick={runMigration}
                disabled={loading}
                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Migrating...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Start Migration</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Migration Complete!</h2>
              <p className="text-gray-300">
                Your configuration has been successfully migrated
              </p>
            </div>

            {migrationResult && (
              <div className="space-y-4">
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-300 mb-2">Migration Summary:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-300">Files migrated:</span>
                      <span className="text-white ml-2">{migrationResult.migration?.fileCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-300">Env vars migrated:</span>
                      <span className="text-white ml-2">{migrationResult.migration?.envVarCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-300">Errors:</span>
                      <span className="text-white ml-2">{migrationResult.migration?.errorCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-300">Warnings:</span>
                      <span className="text-white ml-2">{migrationResult.migration?.warningCount || 0}</span>
                    </div>
                  </div>
                </div>

                {migrationResult.backupPath && (
                  <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-300 mb-2">Backup Location:</h4>
                    <p className="text-blue-200 text-sm font-mono">{migrationResult.backupPath}</p>
                  </div>
                )}

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={downloadReport}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Download Report</span>
                  </button>
                  
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Refresh Application
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6 flex items-center justify-center">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
              message.type === 'success' ? 'bg-green-500/20 border border-green-500/50' :
              message.type === 'error' ? 'bg-red-500/20 border border-red-500/50' :
              'bg-blue-500/20 border border-blue-500/50'
            }`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-400" /> :
               message.type === 'error' ? <AlertTriangle className="w-5 h-5 text-red-400" /> :
               <Shield className="w-5 h-5 text-blue-400" />}
              <span className={
                message.type === 'success' ? 'text-green-300' :
                message.type === 'error' ? 'text-red-300' :
                'text-blue-300'
              }>
                {message.text}
              </span>
            </div>
          )}

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {['check', 'backup', 'migrate', 'complete'].map((stepName, index) => {
                const isActive = step === stepName;
                const isCompleted = ['check', 'backup', 'migrate', 'complete'].indexOf(step) > index;
                
                return (
                  <div
                    key={stepName}
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      isActive 
                        ? 'border-purple-400 bg-purple-500/30 text-purple-200' 
                        : isCompleted
                        ? 'border-green-400 bg-green-500/30 text-green-200'
                        : 'border-gray-600 bg-gray-800 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${((['check', 'backup', 'migrate', 'complete'].indexOf(step) + 1) / 4) * 100}%` 
                }}
              />
            </div>
          </div>

          {/* Step Content */}
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
