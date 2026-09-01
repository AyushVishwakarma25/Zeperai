import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Building2, 
  Phone, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Sparkles, 
  FileText, 
  Download, 
  Calendar, 
  Layers, 
  Camera, 
  Globe, 
  ExternalLink,
  RefreshCw,
  Zap,
  ListTodo
} from 'lucide-react';
import { runLocalSeoAudit, LocalSeoAuditResult, LocalSeoAuditInput } from '../../services/localSeoAuditService.js';

interface Props {
  user?: any;
}

const PRESET_EXAMPLES: Array<{
  label: string;
  location: string;
  description: string;
}> = [
  {
    label: "Austin 24/7 HVAC Solutions",
    location: "Austin, Texas",
    description: "Apex 24/7 HVAC Solutions is a licensed heating and air conditioning repair business serving Austin, Round Rock, and Cedar Park. We specialize in same-day AC repairs, heat pump installations, commercial HVAC maintenance, and emergency cooling services. Phone: (512) 555-0199. Address: 4802 South Congress Ave, Austin, TX 78745."
  },
  {
    label: "Bangalore Aesthetic Dental Care",
    location: "Koramangala, Bangalore, India",
    description: "Dr. Mehta Aesthetic Dental & Orthodontic Clinic provides invisible aligners, dental implants, root canal treatments, and smile design in Koramangala and HSR Layout, Bangalore. Open Monday to Saturday with digital 3D scans. Call +91 80 4912 8800. Location: 80 Feet Road, 4th Block, Koramangala, Bengaluru, Karnataka 560034."
  },
  {
    label: "Mumbai Artisan Sourdough Bakery",
    location: "Bandra West, Mumbai, India",
    description: "Crust & Crumb is an artisan wood-fired sourdough bakery and specialty espresso bar in Bandra West, Mumbai. We bake naturally fermented country loaves, almond croissants, babkas, and cater bespoke brunch events across Khar and Bandra. Contact: +91 98200 11223. Pali Hill, Bandra West, Mumbai 400050."
  },
  {
    label: "London Boutique Pilates Studio",
    location: "Shoreditch, London, UK",
    description: "Form & Flow is a boutique reformer Pilates studio located in Shoreditch, East London. Offering dynamic reformer classes, private posture rehabilitation, pre/post-natal conditioning, and instructor certifications. Located at 14 Redchurch St, London E2 7DD."
  }
];

export const LocalSeoAuditTool: React.FC<Props> = () => {
  const [businessDescription, setBusinessDescription] = useState('');
  const [location, setLocation] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [showAdvancedInputs, setShowAdvancedInputs] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'interactive' | 'markdown' | 'schema'>('interactive');
  const [result, setResult] = useState<LocalSeoAuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Copy tracking states
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [checkedActions, setCheckedActions] = useState<Record<number, boolean>>({});

  const handleCopy = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => {
      setCopiedSection(null);
    }, 2000);
  };

  const handleApplyPreset = (preset: typeof PRESET_EXAMPLES[0]) => {
    setBusinessDescription(preset.description);
    setLocation(preset.location);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessDescription.trim()) {
      setError('Please enter a business description.');
      return;
    }
    if (!location.trim()) {
      setError('Please enter a target city or locality.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const payload: LocalSeoAuditInput = {
        businessDescription: businessDescription.trim(),
        location: location.trim(),
        ...(businessName.trim() ? { businessName: businessName.trim() } : {}),
        ...(address.trim() ? { address: address.trim() } : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      };

      const auditData = await runLocalSeoAudit(payload);
      setResult(auditData);
      setCheckedActions({});
      // Scroll to results smoothly
      setTimeout(() => {
        const resultsEl = document.getElementById('audit-results-container');
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err: any) {
      console.error('Audit execution error:', err);
      setError(err.message || 'Failed to complete Local SEO Audit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!result) return;
    const blob = new Blob([result.rawMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `local-seo-audit-${(result.entities?.businessName || 'business').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSchema = () => {
    if (!result) return;
    const schemaStr = result.technical?.schemaJsonLdRaw || 
      (typeof result.technical?.schemaJsonLd === 'string' ? result.technical.schemaJsonLd : JSON.stringify(result.technical?.schemaJsonLd, null, 2));
    const blob = new Blob([schemaStr], { type: 'application/ld+json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `localbusiness-schema-${(result.entities?.businessName || 'business').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleActionItem = (idx: number) => {
    setCheckedActions(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="w-full space-y-8" id="local-seo-audit-app">
      {/* Input Configuration Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xl shadow-slate-200/60 max-w-4xl mx-auto text-left relative overflow-hidden">
        {/* Decorative subtle accent */}
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-gradient-to-br from-[#4452FB]/10 to-indigo-100 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-[#4452FB] text-xs font-bold uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Micro-SaaS Intelligence Engine
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Audit Raw Business Information
            </h2>
            <p className="text-sm text-slate-500 font-normal">
              Paste your raw business description or unstructured notes to extract local entities, generate GBP tactics, and build valid JSON-LD.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200/70">
              Phase 1 • 2 • 3 Complete
            </span>
          </div>
        </div>

        {/* Preset Quick Fill Buttons */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Quick Try Presets:
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_EXAMPLES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100/90 hover:bg-indigo-50 text-slate-700 hover:text-[#4452FB] border border-slate-200/80 hover:border-indigo-200 transition-all text-left flex items-center gap-1.5"
              >
                <Building2 className="w-3 h-3 text-slate-400" />
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="business-description-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Business Description & Raw Details <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {businessDescription.length} characters
              </span>
            </div>
            <textarea
              id="business-description-input"
              rows={4}
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="Paste raw business details: services provided, core offerings, working hours, phone number, address, customer pain points, target neighborhoods..."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#4452FB] focus:outline-none focus:ring-4 focus:ring-[#4452FB]/10 transition-all font-sans"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="location-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                2. Target Location / City / Locality <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="location-input"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Austin, TX or Koramangala, Bangalore"
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#4452FB] focus:outline-none focus:ring-4 focus:ring-[#4452FB]/10 transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={() => setShowAdvancedInputs(!showAdvancedInputs)}
                className="text-xs text-[#4452FB] hover:text-[#3641C9] font-bold py-2.5 px-3 rounded-xl hover:bg-indigo-50/70 transition-colors flex items-center justify-between border border-dashed border-indigo-200"
              >
                <span>{showAdvancedInputs ? 'Hide Optional NAP Fields' : '+ Provide Explicit NAP Overrides'}</span>
                <span className="text-[10px] uppercase font-extrabold bg-indigo-100/70 px-2 py-0.5 rounded text-indigo-700">Optional</span>
              </button>
            </div>
          </div>

          {/* Optional Explicit NAP Overrides */}
          {showAdvancedInputs && (
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Official registered name"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. (512) 555-0199"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Full Street Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, State, Postal"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 bg-white"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              id="run-local-seo-audit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto flex-1 bg-[#4452FB] hover:bg-[#3641C9] disabled:bg-slate-300 text-white py-3.5 px-8 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Processing 3-Phase Local SEO Engine...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-200 group-hover:rotate-12 transition-transform" />
                  <span>Execute Local SEO Audit & Strategy</span>
                </>
              )}
            </button>

            {result && (
              <button
                type="button"
                onClick={() => {
                  setBusinessDescription('');
                  setLocation('');
                  setBusinessName('');
                  setAddress('');
                  setPhone('');
                  setResult(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shrink-0"
              >
                Clear Results
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Results Container */}
      {result && (
        <div id="audit-results-container" className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/60 max-w-4xl mx-auto overflow-hidden text-left animate-fade-in">
          {/* Results Header with View Switcher */}
          <div className="bg-slate-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                  Audit Generated Successfully
                </span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                {result.entities?.businessName || 'Local Business'} SEO Action Plan
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Targeting <span className="text-slate-200 font-medium">{location}</span> • Category: <span className="text-slate-200 font-medium">{result.entities?.primaryCategory || 'Local Business'}</span>
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              {/* Tab Selector */}
              <div className="bg-slate-800 p-1 rounded-xl border border-slate-700/80 flex items-center text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('interactive')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    activeTab === 'interactive'
                      ? 'bg-[#4452FB] text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Interactive UI
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('markdown')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    activeTab === 'markdown'
                      ? 'bg-[#4452FB] text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Strict Markdown
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('schema')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    activeTab === 'schema'
                      ? 'bg-[#4452FB] text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  JSON-LD
                </button>
              </div>

              {/* Action Buttons */}
              <button
                type="button"
                onClick={handleDownloadMarkdown}
                title="Download full Markdown report"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* TAB 1: INTERACTIVE DASHBOARD VIEW */}
          {activeTab === 'interactive' && (
            <div className="p-6 sm:p-8 space-y-10 divide-y divide-slate-100">
              
              {/* --- PHASE 1: ENTITIES & KEYWORDS --- */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-[#4452FB] font-black text-xs flex items-center justify-center border border-indigo-100">
                      1
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        Phase 1: Extracted Local Entities & Keywords
                      </h4>
                      <p className="text-xs text-slate-500 font-normal">
                        Entity validation, NAP health diagnostics, and geo-modified search terms.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(JSON.stringify(result.entities, null, 2), 'entities-json')}
                    className="text-xs text-slate-600 hover:text-[#4452FB] font-semibold flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
                  >
                    {copiedSection === 'entities-json' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'entities-json' ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Primary Category & Business Name */}
                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Primary GBP Category
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#4452FB] text-white text-xs font-bold shadow-sm">
                        <Building2 className="w-3.5 h-3.5" />
                        {result.entities?.primaryCategory || 'Local Business'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Identified Name
                      </span>
                      <p className="text-sm font-bold text-slate-800">
                        {result.entities?.businessName || 'Not explicitly named'}
                      </p>
                    </div>
                  </div>

                  {/* NAP Data Health */}
                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      NAP Consistency Status
                    </span>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 font-medium">Name:</span>
                        <span className={result.entities?.napData?.name && result.entities.napData.name !== 'MISSING' ? 'text-emerald-700 font-bold' : 'text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded'}>
                          {result.entities?.napData?.name || 'MISSING'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 font-medium">Address:</span>
                        <span className={result.entities?.napData?.address && result.entities.napData.address !== 'MISSING' ? 'text-emerald-700 font-bold truncate max-w-[160px]' : 'text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded'}>
                          {result.entities?.napData?.address || 'MISSING'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 font-medium">Phone:</span>
                        <span className={result.entities?.napData?.phone && result.entities.napData.phone !== 'MISSING' ? 'text-emerald-700 font-bold' : 'text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded'}>
                          {result.entities?.napData?.phone || 'MISSING'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Missing Data Flags */}
                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Missing NAP Elements
                    </span>
                    {result.entities?.missingData && result.entities.missingData.length > 0 ? (
                      <ul className="space-y-1.5">
                        {result.entities.missingData.map((item, idx) => (
                          <li key={idx} className="text-xs text-amber-700 bg-amber-50/80 px-2.5 py-1 rounded-md border border-amber-200/60 flex items-center gap-1.5 font-medium">
                            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-2 rounded-md border border-emerald-200 flex items-center gap-1.5 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>All core NAP elements present!</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5 Geo-Modified Long-Tail Keywords */}
                <div className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100/80">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-[#4452FB]" />
                      5 High-Intent Geo Keywords
                    </span>
                    <span className="text-[11px] text-indigo-600 font-medium">Click any keyword to copy</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {result.entities?.targetKeywords?.map((kw, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleCopy(kw, `kw-${idx}`)}
                        className="group text-xs font-semibold px-3 py-1.5 rounded-lg bg-white hover:bg-[#4452FB] text-slate-800 hover:text-white border border-indigo-200/70 hover:border-[#4452FB] transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <span>{kw}</span>
                        {copiedSection === `kw-${idx}` ? (
                          <Check className="w-3 h-3 text-emerald-500 group-hover:text-white" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400 group-hover:text-indigo-200" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* --- PHASE 2: TACTICAL LOCAL AUDIT ENGINE --- */}
              <div className="pt-8 space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-[#4452FB] font-black text-xs flex items-center justify-center border border-indigo-100">
                    2
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      Phase 2: Tactical Local Audit Strategy
                    </h4>
                    <p className="text-xs text-slate-500 font-normal">
                      GBP profile optimization, high-converting photo blueprint, citations, and neighborhood relevance.
                    </p>
                  </div>
                </div>

                {/* 750-Char GBP Description */}
                <div className="bg-slate-50/90 rounded-xl p-5 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#4452FB]" />
                      Google Business Profile (GBP) Description Template
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                        {result.tactical?.gbpDescription?.length || 0} / 750 chars
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(result.tactical?.gbpDescription || '', 'gbp-desc')}
                        className="text-xs text-[#4452FB] hover:text-[#3641C9] font-bold flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 hover:border-indigo-200 transition-colors shadow-2xs"
                      >
                        {copiedSection === 'gbp-desc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSection === 'gbp-desc' ? 'Copied' : 'Copy GBP Text'}</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans bg-white p-3.5 rounded-lg border border-slate-200/60 select-all whitespace-pre-wrap">
                    {result.tactical?.gbpDescription}
                  </p>
                </div>

                {/* 3 Photo Recommendations */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#4452FB]" />
                    3 Mandatory Photo Upload Recommendations
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {result.tactical?.photoRecommendations?.map((photoRec, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-50 text-[#4452FB] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="text-xs text-slate-700 font-medium leading-normal">
                          {photoRec}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Citations & Local Relevance Topics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Industry Citations */}
                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#4452FB]" />
                      Top 3 Industry-Specific Citations
                    </span>
                    <ul className="space-y-2">
                      {result.tactical?.industryCitations?.map((cit, idx) => (
                        <li key={idx} className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/60 font-medium flex items-center justify-between">
                          <span>{cit}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Tier 1 Directory</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Hyper-Local Topics */}
                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#4452FB]" />
                      3 Hyper-Local Authority Content Topics
                    </span>
                    <ul className="space-y-2">
                      {result.tactical?.localRelevanceTopics?.map((topic, idx) => (
                        <li key={idx} className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/60 font-medium flex items-start gap-2">
                          <span className="text-[#4452FB] font-bold">•</span>
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* --- PHASE 3: TECHNICAL DELIVERABLES --- */}
              <div className="pt-8 space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-[#4452FB] font-black text-xs flex items-center justify-center border border-indigo-100">
                    3
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      Phase 3: Technical Deliverables & Schema
                    </h4>
                    <p className="text-xs text-slate-500 font-normal">
                      Valid LocalBusiness JSON-LD schema, 4-week execution calendar, and critical action plan.
                    </p>
                  </div>
                </div>

                {/* 4-Week Content Calendar Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#4452FB]" />
                      4-Week Local Content Calendar
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="p-3">Week</th>
                          <th className="p-3">Topic / Headline</th>
                          <th className="p-3">Target Keyword</th>
                          <th className="p-3">Format</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {result.technical?.contentCalendar?.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                              {item.week}
                            </td>
                            <td className="p-3 font-medium text-slate-800">
                              {item.topic}
                            </td>
                            <td className="p-3">
                              <span className="bg-indigo-50 text-[#4452FB] px-2 py-0.5 rounded font-mono text-[11px] font-semibold">
                                {item.targetKeyword}
                              </span>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold text-[11px]">
                                {item.format}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Critical Immediate Action Plan Checklist */}
                <div className="bg-amber-50/60 rounded-xl p-5 border border-amber-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <ListTodo className="w-3.5 h-3.5 text-amber-600" />
                      Critical Immediate Action Plan (Top 3 Glaring Gaps)
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {result.technical?.criticalActionPlan?.map((action, idx) => (
                      <div
                        key={idx}
                        onClick={() => toggleActionItem(idx)}
                        className={`p-3 rounded-lg border text-xs flex items-start gap-3 cursor-pointer transition-all ${
                          checkedActions[idx]
                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 line-through opacity-80'
                            : 'bg-white border-amber-200 text-slate-800 shadow-2xs hover:border-amber-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                          checkedActions[idx] ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                        }`}>
                          {checkedActions[idx] && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className="font-medium leading-relaxed">
                          {action}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* LocalBusiness JSON-LD Schema Snippet */}
                <div className="bg-slate-900 rounded-xl p-5 text-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                        &lt;script type="application/ld+json"&gt;
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        Schema.org / LocalBusiness
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadSchema}
                        className="text-xs text-slate-300 hover:text-white flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>.json</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(
                          result.technical?.schemaJsonLdRaw || 
                          (typeof result.technical?.schemaJsonLd === 'string' ? result.technical.schemaJsonLd : JSON.stringify(result.technical?.schemaJsonLd, null, 2)),
                          'schema-jsonld'
                        )}
                        className="text-xs text-white bg-[#4452FB] hover:bg-[#3641C9] font-bold flex items-center gap-1 px-3 py-1 rounded-lg transition-colors shadow-sm"
                      >
                        {copiedSection === 'schema-jsonld' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSection === 'schema-jsonld' ? 'Copied' : 'Copy Schema'}</span>
                      </button>
                    </div>
                  </div>

                  <pre className="bg-slate-950 p-4 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto max-h-64 border border-slate-800">
                    {result.technical?.schemaJsonLdRaw || 
                     (typeof result.technical?.schemaJsonLd === 'string' ? result.technical.schemaJsonLd : JSON.stringify(result.technical?.schemaJsonLd, null, 2))}
                  </pre>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: STRICT MARKDOWN VIEW */}
          {activeTab === 'markdown' && (
            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Strict Micro-SaaS Markdown Output Format
                  </h4>
                  <p className="text-xs text-slate-500">
                    Exact headings matching the required 3-phase schema structure.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadMarkdown}
                    className="text-xs text-slate-700 hover:text-slate-900 font-semibold flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .md</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(result.rawMarkdown, 'raw-markdown')}
                    className="text-xs text-white bg-[#4452FB] hover:bg-[#3641C9] font-bold flex items-center gap-1 px-3.5 py-1.5 rounded-lg transition-colors shadow-sm"
                  >
                    {copiedSection === 'raw-markdown' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'raw-markdown' ? 'Copied Full Report' : 'Copy Markdown'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 text-slate-200 p-5 rounded-xl text-xs font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed max-h-[600px] border border-slate-800 select-all">
                {result.rawMarkdown}
              </div>
            </div>
          )}

          {/* TAB 3: DEDICATED JSON-LD SCHEMA VALIDATOR VIEW */}
          {activeTab === 'schema' && (
            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    LocalBusiness JSON-LD Structured Data
                  </h4>
                  <p className="text-xs text-slate-500">
                    Paste this directly into the <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">&lt;head&gt;</code> of your website or via Google Tag Manager.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="https://search.google.com/test/rich-results"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#4452FB] hover:text-[#3641C9] font-bold flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors"
                  >
                    <span>Google Rich Results Test</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(
                      result.technical?.schemaJsonLdRaw || 
                      (typeof result.technical?.schemaJsonLd === 'string' ? result.technical.schemaJsonLd : JSON.stringify(result.technical?.schemaJsonLd, null, 2)),
                      'tab-schema-jsonld'
                    )}
                    className="text-xs text-white bg-[#4452FB] hover:bg-[#3641C9] font-bold flex items-center gap-1 px-3.5 py-1.5 rounded-lg transition-colors shadow-sm"
                  >
                    {copiedSection === 'tab-schema-jsonld' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'tab-schema-jsonld' ? 'Copied' : 'Copy JSON-LD'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 text-emerald-300 p-5 rounded-xl text-xs font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed border border-slate-800 select-all">
                {`<script type="application/ld+json">\n${
                  result.technical?.schemaJsonLdRaw || 
                  (typeof result.technical?.schemaJsonLd === 'string' ? result.technical.schemaJsonLd : JSON.stringify(result.technical?.schemaJsonLd, null, 2))
                }\n</script>`}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
