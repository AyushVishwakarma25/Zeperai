import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAdminAuthHeader } from './adminAuthHelper.js';
import { Card } from '../ui/Card.js';
import { Button } from '../ui/Button.js';
import { Spinner } from '../ui/Spinner.js';
import { AdminStateMessage } from './AdminStateMessage.js';
import {
  Key,
  Cpu,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Server,
  Cloud,
  Check,
  Send,
  Zap,
  Globe,
  Sliders,
  Megaphone,
  Lock,
  ArrowRight,
  Upload,
  FileCode,
  FileCheck
} from 'lucide-react';

interface AISettingsData {
  provider: 'vertex' | 'studio';
  useVertexAI: boolean;
  vertexProjectId: string;
  vertexLocation: string;
  hasVertexApiKey: boolean;
  vertexApiKeyMasked: string;
  hasGeminiApiKey: boolean;
  geminiApiKeyMasked: string;
  hasServiceAccountJson: boolean;
  campaignStudioEnabled: boolean;
  campaignStudioAllowedEmails: string;
  activeEngineStatus: {
    mode: string;
    billingModel: string;
    targetRegion: string;
    status: 'configured' | 'needs_configuration';
  };
}

export default function PlatformSettingsManager() {
  const [settings, setSettings] = useState<AISettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    provider?: string;
    model?: string;
    response?: string;
    error?: string;
  } | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [useVertexAI, setUseVertexAI] = useState(true);
  const [vertexProjectId, setVertexProjectId] = useState('');
  const [vertexLocation, setVertexLocation] = useState('us-central1');
  const [newVertexApiKey, setNewVertexApiKey] = useState('');
  const [showVertexKeyInput, setShowVertexKeyInput] = useState(false);
  const [newServiceAccountJson, setNewServiceAccountJson] = useState('');
  const [serviceAccountFileName, setServiceAccountFileName] = useState<string | null>(null);
  const [showServiceAccountInput, setShowServiceAccountInput] = useState(true);
  const [newGeminiApiKey, setNewGeminiApiKey] = useState('');
  const [showGeminiKeyInput, setShowGeminiKeyInput] = useState(false);
  const [campaignStudioEnabled, setCampaignStudioEnabled] = useState(true);
  const [campaignStudioAllowedEmails, setCampaignStudioAllowedEmails] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const getHeaders = async () => {
    const authHeader = await getAdminAuthHeader();
    return { Authorization: `Bearer ${authHeader || ''}` };
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setFeedback(null);
      const res = await axios.get('/api/admin/settings/ai', {
        headers: await getHeaders()
      });
      const data: AISettingsData = res.data.settings;
      setSettings(data);
      setUseVertexAI(data.useVertexAI);
      setVertexProjectId(data.vertexProjectId || '');
      setVertexLocation(data.vertexLocation || 'us-central1');
      setCampaignStudioEnabled(data.campaignStudioEnabled);
      setCampaignStudioAllowedEmails(data.campaignStudioAllowedEmails || '');
    } catch (err: any) {
      console.error('Failed to load AI settings:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || err.message || 'Failed to load AI provider settings.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setFeedback(null);
      const payload: Record<string, any> = {
        useVertexAI,
        vertexProjectId: vertexProjectId.trim(),
        vertexLocation: vertexLocation.trim(),
        campaignStudioEnabled,
        campaignStudioAllowedEmails: campaignStudioAllowedEmails.trim()
      };

      if (newVertexApiKey.trim()) {
        payload.vertexApiKey = newVertexApiKey.trim();
      }
      if (newServiceAccountJson.trim()) {
        payload.serviceAccountJson = newServiceAccountJson.trim();
      }
      if (newGeminiApiKey.trim()) {
        payload.geminiApiKey = newGeminiApiKey.trim();
      }

      const res = await axios.post('/api/admin/settings/ai', payload, {
        headers: await getHeaders()
      });

      setFeedback({
        type: 'success',
        message: res.data.message || 'AI secrets & provider parameters updated successfully.'
      });

      // Clear pending secret input states
      setNewVertexApiKey('');
      setShowVertexKeyInput(false);
      setNewServiceAccountJson('');
      setServiceAccountFileName(null);
      setNewGeminiApiKey('');
      setShowGeminiKeyInput(false);

      // Re-fetch current server state
      await fetchSettings();
    } catch (err: any) {
      console.error('Error saving AI settings:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || err.message || 'Failed to save configuration.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setFeedback({
        type: 'error',
        message: 'Please upload a valid .json credentials file.'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.type || !parsed.project_id) {
          setFeedback({
            type: 'error',
            message: 'Uploaded JSON appears to be missing required service account fields (type, project_id).'
          });
          return;
        }

        setNewServiceAccountJson(text.trim());
        setServiceAccountFileName(file.name);
        // Auto-fill project ID if not already configured
        if (!vertexProjectId || vertexProjectId.trim() === '') {
          setVertexProjectId(parsed.project_id);
        }
        setFeedback({
          type: 'success',
          message: `Loaded "${file.name}" for project "${parsed.project_id}". Click "Save & Apply Settings" to activate.`
        });
      } catch {
        setFeedback({
          type: 'error',
          message: 'Failed to parse file as valid JSON.'
        });
      }
    };
    reader.readAsText(file);
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const res = await axios.post('/api/admin/settings/ai/test', {}, {
        headers: await getHeaders()
      });
      setTestResult({
        success: true,
        latencyMs: res.data.latencyMs,
        provider: res.data.provider,
        model: res.data.model,
        response: res.data.response
      });
    } catch (err: any) {
      console.error('AI connectivity test error:', err);
      setTestResult({
        success: false,
        latencyMs: err.response?.data?.latencyMs,
        error: err.response?.data?.error || err.message || 'Connection test failed. Check key / project setup.'
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading && !settings) {
    return (
      <AdminStateMessage
        type="loading"
        title="Loading Platform Settings"
        message="Retrieving active AI providers, key metadata, and Campaign Studio parameters..."
      />
    );
  }

  return (
    <div className="space-y-6 font-sans max-w-6xl">
      {/* Top Banner: Status & Connectivity */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">AI Engine & Secret Keys</h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                settings?.activeEngineStatus.status === 'configured'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${settings?.activeEngineStatus.status === 'configured' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              {settings?.activeEngineStatus.status === 'configured' ? 'Configured & Active' : 'Setup Required'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Current Engine: <strong className="text-slate-800 font-semibold">{settings?.activeEngineStatus.mode}</strong> • Billing:{' '}
            <span className="text-slate-700 font-medium">{settings?.activeEngineStatus.billingModel}</span> • Region:{' '}
            <code className="text-[11px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold">{settings?.activeEngineStatus.targetRegion}</code>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchSettings}
            disabled={loading || saving}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl transition-all"
            title="Reload settings"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Button
            variant="secondary"
            onClick={handleTestConnection}
            disabled={testing}
            className="bg-[#4452FB]/10 hover:bg-[#4452FB]/20 text-[#4452FB] border border-[#4452FB]/30 font-bold text-xs px-4 h-10 rounded-2xl flex items-center gap-2 shadow-xs"
          >
            {testing ? (
              <>
                <Spinner className="w-3.5 h-3.5 text-[#4452FB]" />
                <span>Pinging AI Provider...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Test AI Connection</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Connectivity Test Result Banner */}
      {testResult && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-start gap-3 transition-all animate-in fade-in ${
            testResult.success
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-rose-50/80 border-rose-200 text-rose-900'
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 space-y-1">
            <div className="font-bold flex items-center gap-2">
              <span>{testResult.success ? 'AI Provider Connection Verified' : 'AI Connection Failed'}</span>
              {testResult.latencyMs !== undefined && (
                <span className="font-mono text-[11px] font-semibold bg-white/70 px-2 py-0.5 rounded-full border border-black/5">
                  {testResult.latencyMs} ms latency
                </span>
              )}
            </div>
            {testResult.success ? (
              <p className="text-emerald-800">
                Successfully routed through <strong>{testResult.provider}</strong> using model <code className="font-mono font-bold">{testResult.model}</code>. Engine returned:{' '}
                <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200">{testResult.response}</span>
              </p>
            ) : (
              <p className="text-rose-800 font-mono text-[11px]">{testResult.error}</p>
            )}
          </div>
          <button
            onClick={() => setTestResult(null)}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span className="font-semibold">{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-bold text-slate-500 hover:text-slate-800">
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Provider Selection */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#4452FB]" />
              Active AI Provider Mode
            </h3>
            <p className="text-xs text-slate-500">
              Select which Google AI infrastructure routes model generation calls for Campaign Studio and other studios.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option A: Vertex AI Postpay */}
            <div
              onClick={() => setUseVertexAI(true)}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                useVertexAI
                  ? 'border-[#4452FB] bg-[#4452FB]/5 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${useVertexAI ? 'bg-[#4452FB] text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Gemini Enterprise Agent Platform</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#4452FB] bg-[#4452FB]/10 px-2 py-0.5 rounded-full">
                      Formerly Vertex AI · Postpay Billing
                    </span>
                  </div>
                </div>
                <input
                  type="radio"
                  checked={useVertexAI}
                  onChange={() => setUseVertexAI(true)}
                  className="w-4 h-4 text-[#4452FB] mt-1"
                />
              </div>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Direct enterprise post-pay billing via Google Cloud (formerly Vertex AI). All user generation scales automatically against your Google Cloud billing account without prepaid credit bottlenecks.
              </p>
            </div>

            {/* Option B: Google AI Studio */}
            <div
              onClick={() => setUseVertexAI(false)}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                !useVertexAI
                  ? 'border-[#4452FB] bg-[#4452FB]/5 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${!useVertexAI ? 'bg-[#4452FB] text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Google AI Studio</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                      API Key Mode
                    </span>
                  </div>
                </div>
                <input
                  type="radio"
                  checked={!useVertexAI}
                  onChange={() => setUseVertexAI(false)}
                  className="w-4 h-4 text-[#4452FB] mt-1"
                />
              </div>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Standard developer API keys generated from Google AI Studio. Uses Gemini API credit balance.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Gemini Enterprise Agent Platform (Vertex AI) Configuration */}
        <div className={`bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5 transition-opacity ${!useVertexAI ? 'opacity-50' : 'opacity-100'}`}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="space-y-0.5">
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Server className="w-4 h-4 text-[#4452FB]" />
                Gemini Enterprise Agent Platform (Vertex AI) Settings
              </h3>
              <p className="text-xs text-slate-500">
                Configure your Google Cloud Project ID, region, Express API Key, or Service Account JSON for postpay agent inference.
              </p>
            </div>
            {settings?.hasServiceAccountJson && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                <Check className="w-3.5 h-3.5" />
                Service Account Attached
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Vertex Project ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Google Cloud Project ID</label>
              <input
                type="text"
                value={vertexProjectId}
                onChange={(e) => setVertexProjectId(e.target.value)}
                placeholder="e.g. your-gcp-project-id"
                disabled={!useVertexAI}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4452FB]/20 focus:border-[#4452FB]"
              />
              <span className="text-[11px] text-slate-400">Used for Vertex AI project authentication.</span>
            </div>

            {/* Vertex Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Vertex AI Region / Location</label>
              <select
                value={vertexLocation}
                onChange={(e) => setVertexLocation(e.target.value)}
                disabled={!useVertexAI}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#4452FB]/20 focus:border-[#4452FB]"
              >
                <option value="us-central1">us-central1 (Iowa - Recommended)</option>
                <option value="us-east4">us-east4 (N. Virginia)</option>
                <option value="us-west1">us-west1 (Oregon)</option>
                <option value="europe-west1">europe-west1 (Belgium)</option>
                <option value="europe-west4">europe-west4 (Netherlands)</option>
                <option value="asia-southeast1">asia-southeast1 (Singapore)</option>
                <option value="asia-south1">asia-south1 (Mumbai)</option>
              </select>
              <span className="text-[11px] text-slate-400">Target GCP region for publisher model calls.</span>
            </div>
          </div>

          {/* Vertex AI API Key / Express Key */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-700">Vertex AI API Key (Express Mode)</label>
                <p className="text-[11px] text-slate-400">
                  Optional. For Vertex AI Express Mode keys that don't require service account JSON.
                </p>
              </div>
              {settings?.hasVertexApiKey && (
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                  Active: {settings.vertexApiKeyMasked}
                </span>
              )}
            </div>

            {!showVertexKeyInput ? (
              <button
                type="button"
                onClick={() => setShowVertexKeyInput(true)}
                disabled={!useVertexAI}
                className="text-xs font-bold text-[#4452FB] hover:text-[#4452FB]/80 flex items-center gap-1.5 py-1"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{settings?.hasVertexApiKey ? 'Rotate / Update Vertex API Key' : '+ Add Vertex API Key'}</span>
              </button>
            ) : (
              <div className="space-y-2 animate-in fade-in">
                <input
                  type="password"
                  value={newVertexApiKey}
                  onChange={(e) => setNewVertexApiKey(e.target.value)}
                  placeholder="Paste new Vertex AI API Key (AIzaSy...)"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4452FB]/20 focus:border-[#4452FB]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowVertexKeyInput(false);
                    setNewVertexApiKey('');
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Cancel key entry
                </button>
              </div>
            )}
          </div>

          {/* Google Cloud Service Account JSON */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#4452FB]" />
                  Service Account Credentials (JSON)
                </label>
                <p className="text-[11px] text-slate-400">
                  Upload your downloaded Google Cloud Service Account <code className="font-mono text-slate-600 bg-slate-100 px-1 py-0.5 rounded">.json</code> key file or paste its contents below.
                </p>
              </div>
              {settings?.hasServiceAccountJson && (
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Key Attached
                </span>
              )}
            </div>

            <div className="space-y-3">
              {/* Option A: Upload JSON file button / dropzone */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#4452FB]/50 bg-slate-50/70 hover:bg-[#4452FB]/5 transition-all text-center">
                <input
                  type="file"
                  id="sa-json-upload"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  disabled={!useVertexAI}
                  className="hidden"
                />
                <label
                  htmlFor="sa-json-upload"
                  className={`cursor-pointer flex flex-col items-center justify-center gap-2 ${
                    !useVertexAI ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                >
                  <div className="p-2.5 bg-white rounded-full border border-slate-200 shadow-xs text-[#4452FB]">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#4452FB] hover:underline">
                      Click to upload your .json key file
                    </span>
                    <span className="text-xs text-slate-500"> or drag and drop</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Auto-fills Project ID and parses your credentials safely
                  </span>
                </label>

                {serviceAccountFileName && (
                  <div className="mt-2 inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>Loaded: {serviceAccountFileName}</span>
                  </div>
                )}
              </div>

              {/* Option B: Or paste raw JSON directly */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    — Or Paste JSON Contents Directly —
                  </span>
                  {newServiceAccountJson && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewServiceAccountJson('');
                        setServiceAccountFileName(null);
                      }}
                      className="text-[11px] text-rose-500 hover:text-rose-700 font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={newServiceAccountJson}
                  onChange={(e) => {
                    setNewServiceAccountJson(e.target.value);
                    try {
                      const p = JSON.parse(e.target.value);
                      if (p.project_id && (!vertexProjectId || vertexProjectId.trim() === '')) {
                        setVertexProjectId(p.project_id);
                      }
                    } catch {
                      // ignore parse errors while typing
                    }
                  }}
                  placeholder='{ "type": "service_account", "project_id": "your-project-id", "private_key_id": "...", "private_key": "-----BEGIN PRIVATE KEY...", "client_email": "..." }'
                  disabled={!useVertexAI}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4452FB]/20 focus:border-[#4452FB]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Google AI Studio Key */}
        <div className={`bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 transition-opacity ${useVertexAI ? 'opacity-50' : 'opacity-100'}`}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="space-y-0.5">
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-600" />
                Google AI Studio Key (Fallback / Studio Mode)
              </h3>
              <p className="text-xs text-slate-500">
                Gemini API key for standard AI Studio usage.
              </p>
            </div>
            {settings?.hasGeminiApiKey && (
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                Active: {settings.geminiApiKeyMasked}
              </span>
            )}
          </div>

          {!showGeminiKeyInput ? (
            <button
              type="button"
              onClick={() => setShowGeminiKeyInput(true)}
              className="text-xs font-bold text-[#4452FB] hover:text-[#4452FB]/80 flex items-center gap-1.5 py-1"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{settings?.hasGeminiApiKey ? 'Rotate Gemini API Key' : '+ Set Gemini API Key'}</span>
            </button>
          ) : (
            <div className="space-y-2 animate-in fade-in">
              <input
                type="password"
                value={newGeminiApiKey}
                onChange={(e) => setNewGeminiApiKey(e.target.value)}
                placeholder="Paste Gemini API Key (AIzaSy...)"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4452FB]/20 focus:border-[#4452FB]"
              />
              <button
                type="button"
                onClick={() => {
                  setShowGeminiKeyInput(false);
                  setNewGeminiApiKey('');
                }}
                className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold"
              >
                Cancel key entry
              </button>
            </div>
          )}
        </div>

        {/* Section 4: Campaign Studio Platform Controls */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div className="space-y-1 border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[#6366F1]" />
              Campaign Studio Master Controls
            </h3>
            <p className="text-xs text-slate-500">
              Manage the autonomous multi-agent Campaign Studio feature and rollout allowlists.
            </p>
          </div>

          <div className="space-y-4">
            {/* Feature Master Switch */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-xs font-bold text-slate-900">Campaign Studio Master Switch</span>
                <p className="text-[11px] text-slate-500">
                  When enabled, registered users can launch autonomous brand & ad campaigns.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={campaignStudioEnabled}
                  onChange={(e) => setCampaignStudioEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4452FB]"></div>
              </label>
            </div>

            {/* Allowed Emails */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Early Access / Allowed Emails (Optional)</label>
              <input
                type="text"
                value={campaignStudioAllowedEmails}
                onChange={(e) => setCampaignStudioAllowedEmails(e.target.value)}
                placeholder="Comma-separated emails, e.g. founder@zeper.ai, test@brand.com (leave empty for all users)"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4452FB]/20 focus:border-[#4452FB]"
              />
              <span className="text-[11px] text-slate-400">
                If provided, only users whose email matches this list (or admins) can access Campaign Studio. Leave empty to allow all registered users.
              </span>
            </div>
          </div>
        </div>

        {/* Security & Runtime Notice Card */}
        <div className="p-4 rounded-2xl bg-[#4452FB]/5 border border-[#4452FB]/20 text-xs text-slate-700 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#4452FB] shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <strong className="text-slate-900 font-bold block">Hot-Reload & Zero-Downtime Guarantee</strong>
            <span>
              Saving these settings immediately updates the server’s active runtime memory and reinitializes AI client singletons without requiring server restarts or causing downtime for active generation pipelines.
            </span>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="bg-[#4452FB] hover:bg-[#3442E8] text-white font-bold text-xs px-6 h-11 rounded-2xl shadow-md shadow-[#4452FB]/20 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Spinner className="w-4 h-4 text-white" />
                <span>Applying Runtime Configuration...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save & Apply Settings</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
