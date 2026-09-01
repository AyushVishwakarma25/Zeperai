import React, { useState, useEffect } from 'react';
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
  Camera, 
  Globe, 
  ExternalLink,
  RefreshCw,
  Zap,
  ListTodo,
  Lock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  X
} from 'lucide-react';
import { 
  runLocalSeoAudit, 
  getLocalSeoQuota, 
  LocalSeoAuditResult, 
  LocalSeoAuditInput,
  LocalSeoQuotaInfo,
  LocalSeoAuditError
} from '../../services/localSeoAuditService.js';
import { openCheckout, loadRazorpayScript } from '../../services/razorpayService.js';
import { supabase } from '../../services/supabaseClient.js';

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

export const LocalSeoAuditTool: React.FC<Props> = ({ user }) => {
  const [businessDescription, setBusinessDescription] = useState('');
  const [location, setLocation] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [showAdvancedInputs, setShowAdvancedInputs] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'gbp' | 'keywords' | 'schema' | 'calendar' | 'markdown'>('overview');
  const [result, setResult] = useState<LocalSeoAuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Quota & Purchase states
  const [quota, setQuota] = useState<LocalSeoQuotaInfo | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccessMessage, setPurchaseSuccessMessage] = useState<string | null>(null);

  // Copy tracking states
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [checkedActions, setCheckedActions] = useState<Record<number, boolean>>({});

  // Fetch user quota on mount
  const refreshQuota = async () => {
    try {
      const q = await getLocalSeoQuota();
      setQuota(q);
    } catch (err) {
      console.warn('Quota fetch error:', err);
    }
  };

  useEffect(() => {
    refreshQuota();
    loadRazorpayScript().catch(console.warn);
  }, [user]);

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

  const handleBuyPlan = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      // Save current input to session storage before redirecting to login
      try {
        sessionStorage.setItem('zeperai_local_seo_draft', JSON.stringify({
          businessDescription,
          location,
          businessName,
          phone,
          address
        }));
      } catch (_) {}
      window.location.href = '/login?returnTo=%2Ftools%2Flocal-seo-audit';
      return;
    }

    setIsPurchasing(true);
    setError(null);

    try {
      await openCheckout({
        planId: 'local-seo-10',
        planName: 'Local SEO Audit Pack',
        amount: 50,
        creditsText: '10 Full Reports',
        userName: user?.name || user?.email || '',
        userEmail: user?.email || '',
        onSuccess: async () => {
          setIsPurchasing(false);
          setShowPurchaseModal(false);
          setPurchaseSuccessMessage('Payment successful! 10 Local SEO audit reports added to your account.');
          await refreshQuota();
          setTimeout(() => setPurchaseSuccessMessage(null), 6000);
        },
        onError: (err) => {
          setIsPurchasing(false);
          setError(err.message || 'Payment failed or was cancelled. Please try again.');
        },
        onDismiss: () => {
          setIsPurchasing(false);
        }
      });
    } catch (err: any) {
      setIsPurchasing(false);
      setError(err.message || 'Unable to open checkout. Please try again.');
    }
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

    // Check if quota allows generating
    if (quota && !quota.canAudit && quota.remainingAudits <= 0) {
      setShowPurchaseModal(true);
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
      await refreshQuota();

      // Scroll to results smoothly
      setTimeout(() => {
        const resultsEl = document.getElementById('audit-results-container');
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err: any) {
      console.error('Audit execution error:', err);
      if (err instanceof LocalSeoAuditError && err.requiresPurchase) {
        setShowPurchaseModal(true);
        setError(err.message || 'You have used your free audit. Unlock 10 full reports for ₹50.');
      } else {
        setError(err.message || 'Failed to complete Local SEO Audit. Please try again.');
      }
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
      {/* Success Notification Banner */}
      {purchaseSuccessMessage && (
        <div className="max-w-4xl mx-auto p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{purchaseSuccessMessage}</span>
          </div>
          <button 
            onClick={() => setPurchaseSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Input Configuration Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xl shadow-slate-200/60 max-w-4xl mx-auto text-left relative overflow-hidden">
        {/* Decorative subtle accent */}
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-gradient-to-br from-[#4452FB]/10 to-indigo-100 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-[#4452FB] text-xs font-bold uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Instant Local Growth Engine
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Audit & Rank Your Local Business
            </h2>
            <p className="text-sm text-slate-500 font-normal mt-0.5">
              Paste your business details to get your Google Profile bio, top local keywords, website code, and a 4-week growth roadmap.
            </p>
          </div>

          {/* Credits Badge / Buy CTA */}
          <div className="flex items-center gap-2.5 shrink-0">
            {quota ? (
              quota.remainingAudits > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-2xs">
                    <Zap className="w-3.5 h-3.5 fill-emerald-500 text-emerald-600" />
                    <span>{quota.freeAuditAvailable ? '1 Free Audit Available' : `${quota.remainingAudits} Audits Available`}</span>
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all shadow-2xs"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>0 Left • Get 10 for ₹50</span>
                </button>
              )
            ) : null}

            <button
              type="button"
              onClick={() => setShowPurchaseModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#4452FB] hover:bg-[#3641C9] text-white text-xs font-bold transition-all shadow-xs"
            >
              <Zap className="w-3 h-3" />
              <span>Get 10 for ₹50</span>
            </button>
          </div>
        </div>

        {/* Quick Example Presets */}
        <div className="mb-6">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Try with an example business:
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_EXAMPLES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-[#4452FB] border border-slate-200 hover:border-indigo-200 text-slate-700 transition-all text-left"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Main Business Description Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Business Details & Services Offered *</span>
              </label>
              <span className="text-2xs text-slate-400 font-normal">
                Include services, specialty, phone, or address if available
              </span>
            </div>
            <textarea
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="e.g., Apex 24/7 HVAC Solutions is a licensed repair service in Austin, TX. We offer same-day AC maintenance, emergency heating repairs, and commercial duct cleaning. Call (512) 555-0199. Located on South Congress Ave."
              rows={4}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#4452FB] focus:ring-2 focus:ring-[#4452FB]/10 text-sm text-slate-900 placeholder:text-slate-400 transition-all font-sans resize-y"
            />
          </div>

          {/* Location / City Input */}
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              <span>Target City or Locality *</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Austin, Texas or Bandra West, Mumbai or Central London"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#4452FB] focus:ring-2 focus:ring-[#4452FB]/10 text-sm text-slate-900 placeholder:text-slate-400 transition-all font-sans"
            />
          </div>

          {/* Optional Direct Overrides Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvancedInputs(!showAdvancedInputs)}
              className="text-xs font-bold text-[#4452FB] hover:text-[#3641C9] flex items-center gap-1 transition-colors"
            >
              <span>{showAdvancedInputs ? '− Hide specific contact details' : '+ Add specific name, address, or phone (optional)'}</span>
            </button>

            {showAdvancedInputs && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200">
                <div>
                  <label className="text-2xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Apex 24/7 HVAC"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="text-2xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. (512) 555-0199"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="text-2xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Street Address / Landmark
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 4802 South Congress Ave"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{error}</span>
                {error.includes('₹50') && (
                  <button
                    type="button"
                    onClick={() => setShowPurchaseModal(true)}
                    className="block mt-1 font-bold text-[#4452FB] underline hover:text-[#3641C9]"
                  >
                    Click here to unlock 10 reports for ₹50
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Submit CTA */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              ⚡ Results generated in ~10 seconds • 100% actionable
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#4452FB] hover:bg-[#3641C9] disabled:opacity-60 text-white font-black text-sm px-6 py-3 rounded-xl transition-all shadow-md shadow-[#4452FB]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating Audit Report...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Local SEO Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Audit Results Section */}
      {result && (
        <div id="audit-results-container" className="space-y-6 max-w-4xl mx-auto text-left">
          {/* Celebratory 1st Audit Upsell Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-lg border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Audit Generated Successfully</span>
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                Need to audit more client locations or track competitors?
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Unlock <strong className="text-amber-300 font-bold">10 Full Local SEO Reports</strong> for just <strong className="text-white font-bold">₹50</strong>. Only ₹5 per report!
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPurchaseModal(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Get 10 Reports for ₹50</span>
            </button>
          </div>

          {/* Results Navigation Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'overview', label: 'Overview & Action Plan' },
                { id: 'gbp', label: 'Google Bio & Photos' },
                { id: 'keywords', label: 'Keywords & Citations' },
                { id: 'schema', label: 'Website Code (Schema)' },
                { id: 'calendar', label: '4-Week Content Plan' },
                { id: 'markdown', label: 'Full Markdown' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#4452FB] text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadMarkdown}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                title="Download full Markdown report"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Overview & Action Plan */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Entity Summary Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <div>
                    <span className="text-2xs font-bold uppercase tracking-wider text-[#4452FB] block">
                      Target Entity Identification
                    </span>
                    <h3 className="text-lg font-black text-slate-900">
                      {result.entities?.businessName || 'Your Business'}
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[#4452FB] text-xs font-bold">
                    {result.entities?.primaryCategory || 'Local Business'}
                  </span>
                </div>

                {/* NAP Diagnostic Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Business Name
                    </span>
                    <p className="text-xs font-bold text-slate-800">
                      {result.entities?.napData?.name || 'Not detected'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Phone Number
                    </span>
                    <p className={`text-xs font-bold ${result.entities?.napData?.phone === 'MISSING' ? 'text-amber-600' : 'text-slate-800'}`}>
                      {result.entities?.napData?.phone || 'MISSING'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Physical Address
                    </span>
                    <p className={`text-xs font-bold ${result.entities?.napData?.address === 'MISSING' ? 'text-amber-600' : 'text-slate-800'}`}>
                      {result.entities?.napData?.address || 'MISSING'}
                    </p>
                  </div>
                </div>

                {/* Missing Elements Warning */}
                {result.entities?.missingData && result.entities.missingData.length > 0 && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>Missing Contact Details:</strong> {result.entities.missingData.join(', ')}. Add these to your Google Profile to boost search ranking trust.
                    </span>
                  </div>
                )}
              </div>

              {/* Critical 3-Step Immediate Action Plan */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <ListTodo className="w-4 h-4 text-[#4452FB]" />
                      <span>3-Step Priority Action Checklist</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Complete these 3 tasks first to see ranking improvements within 14–30 days.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {result.technical?.criticalActionPlan?.map((action, idx) => (
                    <div 
                      key={idx}
                      onClick={() => toggleActionItem(idx)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                        checkedActions[idx] 
                          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950' 
                          : 'bg-slate-50 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!checkedActions[idx]}
                        onChange={() => {}}
                        className="w-4 h-4 mt-0.5 rounded text-[#4452FB] cursor-pointer"
                      />
                      <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed">
                        {action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Google Bio & Photos */}
          {activeTab === 'gbp' && (
            <div className="space-y-6">
              {/* 750-Char Bio */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div>
                    <span className="text-2xs font-bold uppercase tracking-wider text-[#4452FB] block">
                      Google Business Profile
                    </span>
                    <h3 className="text-base font-black text-slate-900">
                      Optimized 750-Character Description
                    </h3>
                  </div>

                  <button
                    onClick={() => handleCopy(result.tactical?.gbpDescription || '', 'gbp')}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#4452FB] text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    {copiedSection === 'gbp' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'gbp' ? 'Copied Bio!' : 'Copy Bio'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-sans text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                  {result.tactical?.gbpDescription}
                </div>
                <div className="mt-2 text-2xs text-slate-400 text-right">
                  Length: {result.tactical?.gbpDescription?.length || 0} / 750 characters
                </div>
              </div>

              {/* High-Value Photo Checklist */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h4 className="text-base font-black text-slate-900 flex items-center gap-2 mb-4">
                  <Camera className="w-4 h-4 text-[#4452FB]" />
                  <span>3 Must-Upload Photo Angles</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {result.tactical?.photoRecommendations?.map((photo, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-[#4452FB] font-bold text-xs flex items-center justify-center mb-2">
                        #{idx + 1}
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">
                        {photo}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Keywords & Citations */}
          {activeTab === 'keywords' && (
            <div className="space-y-6">
              {/* 5 High-Intent Keywords */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Search className="w-4 h-4 text-[#4452FB]" />
                      <span>5 High-Intent Local Keywords</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Target these search terms in your website headings, Google bio, and customer review requests.
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(result.entities?.targetKeywords?.join('\n') || '', 'keywords')}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#4452FB] text-xs font-bold flex items-center gap-1.5"
                  >
                    {copiedSection === 'keywords' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'keywords' ? 'Copied!' : 'Copy All'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {result.entities?.targetKeywords?.map((kw, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#4452FB]">#{idx + 1}</span>
                        <span className="text-xs font-bold text-slate-800">{kw}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(kw, `kw-${idx}`)}
                        className="text-slate-400 hover:text-slate-700"
                        title="Copy keyword"
                      >
                        {copiedSection === `kw-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top 3 Citations */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h4 className="text-base font-black text-slate-900 flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-[#4452FB]" />
                  <span>Top Recommended Directory Citations</span>
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  Claim your business profile on these authoritative local directories to build Google confidence.
                </p>

                <div className="space-y-2.5">
                  {result.tactical?.industryCitations?.map((cit, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-800">{cit}</span>
                      </div>
                      <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-[#4452FB]">
                        Recommended
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Website Code (Schema) */}
          {activeTab === 'schema' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Ready-to-Use LocalBusiness Website Code (JSON-LD)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Paste this snippet directly into your website header (<code className="bg-slate-100 px-1 py-0.5 rounded">&lt;head&gt;</code>) to help Google verify your address and service area.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(result.technical?.schemaJsonLdRaw || '', 'schema')}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#4452FB] text-xs font-bold flex items-center gap-1.5"
                  >
                    {copiedSection === 'schema' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'schema' ? 'Copied Code!' : 'Copy Code'}</span>
                  </button>

                  <button
                    onClick={handleDownloadSchema}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>.JSON</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-96">
                  {result.technical?.schemaJsonLdRaw || JSON.stringify(result.technical?.schemaJsonLd, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Tab 5: 4-Week Content Plan */}
          {activeTab === 'calendar' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#4452FB]" />
                    <span>4-Week Local Content Calendar</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Publish one update per week to keep your Google Business Profile active and authoritative.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {result.technical?.contentCalendar?.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#4452FB] bg-indigo-50 px-2.5 py-0.5 rounded-md">
                          {item.week}
                        </span>
                        <span className="text-2xs font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded">
                          {item.format}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        {item.topic}
                      </h4>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-2xs text-slate-400 block">Target Keyword:</span>
                      <span className="text-xs font-bold text-indigo-700">{item.targetKeyword}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 6: Raw Markdown */}
          {activeTab === 'markdown' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-900">Full Markdown Audit Deliverable</h3>
                <button
                  onClick={() => handleCopy(result.rawMarkdown || '', 'markdown')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#4452FB] text-xs font-bold flex items-center gap-1.5"
                >
                  {copiedSection === 'markdown' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'markdown' ? 'Copied!' : 'Copy Markdown'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-96">
                {result.rawMarkdown}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Purchase Modal (Razorpay) */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative text-left overflow-hidden">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowPurchaseModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[#4452FB] text-xs font-bold mb-3">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Special Micro-Pack</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                Unlock 10 Full Reports for ₹50
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Run in-depth audits for multiple business locations, clients, or track monthly optimization progress.
              </p>
            </div>

            {/* Price Highlight */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 mb-6 flex items-center justify-between">
              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-[#4452FB] block">
                  10 Audit Reports Pack
                </span>
                <div className="text-2xl font-black text-slate-900">
                  ₹50 <span className="text-xs font-semibold text-slate-500">only (₹5/report)</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Instant Activation
                </span>
              </div>
            </div>

            {/* Feature List */}
            <ul className="space-y-2.5 text-xs text-slate-700 font-medium mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>10 Full Local SEO Audits & Strategy Reports</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>750-Char Bio & Photo Checklists for Google Profile</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>LocalBusiness JSON-LD Schema Generator</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Export to Markdown, Schema .json & Client Deliverables</span>
              </li>
            </ul>

            {/* Pay Button */}
            <button
              type="button"
              disabled={isPurchasing}
              onClick={handleBuyPlan}
              className="w-full bg-[#4452FB] hover:bg-[#3641C9] disabled:opacity-60 text-white font-black text-sm py-3.5 rounded-xl transition-all shadow-md shadow-[#4452FB]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPurchasing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Opening Razorpay Checkout...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay ₹50 via Razorpay</span>
                </>
              )}
            </button>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-2xs text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Secure 256-bit encrypted payment via Razorpay UPI & Cards</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
