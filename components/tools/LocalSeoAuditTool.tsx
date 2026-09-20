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
  RefreshCw, 
  Zap, 
  ListTodo, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  CreditCard, 
  X,
  Bookmark,
  BookmarkCheck,
  Code,
  Layers,
  ChevronRight
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

interface PresetBusiness {
  id: string;
  brand: string;
  category: string;
  name: string;
  location: string;
  rate: string;
  subRate: string;
  tags: string[];
  description: string;
  phone?: string;
  address?: string;
  iconBg: string;
  iconColor: string;
  iconLetter: string;
}

const PRESET_BUSINESSES: PresetBusiness[] = [
  {
    id: 'hvac',
    brand: 'Apex Service Co.',
    category: 'HVAC & Cooling',
    name: 'Apex 24/7 HVAC Solutions',
    location: 'Austin, TX',
    rate: 'Emergency 24/7',
    subRate: 'Same-Day Service',
    tags: ['AC Maintenance', 'Heating Repair', 'In office & Mobile'],
    description: 'Apex 24/7 HVAC Solutions is a licensed heating and air conditioning repair business serving Austin, Round Rock, and Cedar Park. We specialize in same-day AC repairs, heat pump installations, commercial HVAC maintenance, and emergency cooling services. Phone: (512) 555-0199. Address: 4802 South Congress Ave, Austin, TX 78745.',
    phone: '(512) 555-0199',
    address: '4802 South Congress Ave, Austin, TX 78745',
    iconBg: 'bg-red-50 text-red-600 border-red-100',
    iconColor: 'text-red-600',
    iconLetter: 'A'
  },
  {
    id: 'dental',
    brand: 'Dr. Mehta Clinic',
    category: 'Healthcare & Dental',
    name: 'Aesthetic Dental Care',
    location: 'Bangalore, India',
    rate: 'Invisalign & Implants',
    subRate: 'Koramangala 4th Block',
    tags: ['Invisible Aligners', 'Smile Design', 'Digital 3D Scans'],
    description: 'Dr. Mehta Aesthetic Dental & Orthodontic Clinic provides invisible aligners, dental implants, root canal treatments, and smile design in Koramangala and HSR Layout, Bangalore. Open Monday to Saturday with digital 3D scans. Call +91 80 4912 8800. Location: 80 Feet Road, 4th Block, Koramangala, Bengaluru, Karnataka 560034.',
    phone: '+91 80 4912 8800',
    address: '80 Feet Road, 4th Block, Koramangala, Bengaluru 560034',
    iconBg: 'bg-sky-50 text-sky-600 border-sky-100',
    iconColor: 'text-sky-600',
    iconLetter: 'M'
  },
  {
    id: 'bakery',
    brand: 'Crust & Crumb',
    category: 'Artisan Food & Cafe',
    name: 'Artisan Sourdough Bakery',
    location: 'Bandra West, Mumbai',
    rate: 'Wood-Fired',
    subRate: 'Naturally Fermented',
    tags: ['Sourdough Loaves', 'Specialty Espresso', 'Event Catering'],
    description: 'Crust & Crumb is an artisan wood-fired sourdough bakery and specialty espresso bar in Bandra West, Mumbai. We bake naturally fermented country loaves, almond croissants, babkas, and cater bespoke brunch events across Khar and Bandra. Contact: +91 98200 11223. Pali Hill, Bandra West, Mumbai 400050.',
    phone: '+91 98200 11223',
    address: 'Pali Hill, Bandra West, Mumbai 400050',
    iconBg: 'bg-amber-50 text-amber-700 border-amber-100',
    iconColor: 'text-amber-700',
    iconLetter: 'C'
  },
  {
    id: 'pilates',
    brand: 'Form & Flow Studio',
    category: 'Fitness & Wellness',
    name: 'Boutique Reformer Pilates',
    location: 'Shoreditch, London',
    rate: 'Dynamic Classes',
    subRate: 'East London E2',
    tags: ['Reformer Pilates', 'Posture Rehab', 'Pre/Post-Natal'],
    description: 'Form & Flow is a boutique reformer Pilates studio located in Shoreditch, East London. Offering dynamic reformer classes, private posture rehabilitation, pre/post-natal conditioning, and instructor certifications. Located at 14 Redchurch St, London E2 7DD.',
    phone: '+44 20 7946 0912',
    address: '14 Redchurch St, London E2 7DD',
    iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    iconColor: 'text-emerald-700',
    iconLetter: 'F'
  },
  {
    id: 'legal',
    brand: 'Apex Law Partners',
    category: 'Professional Services',
    name: 'Corporate & Estate Counsel',
    location: 'Chicago, IL',
    rate: 'Free Consultation',
    subRate: 'Top-Rated Local Firm',
    tags: ['Business Formation', 'Estate Planning', 'Contract Review'],
    description: 'Apex Law Partners is a full-service boutique legal practice in Downtown Chicago, IL specializing in small business formation, commercial leases, trademarks, and family trust administration. Call (312) 555-0810. Address: 200 West Madison St, Suite 1400, Chicago, IL 60606.',
    phone: '(312) 555-0810',
    address: '200 West Madison St, Suite 1400, Chicago, IL 60606',
    iconBg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    iconColor: 'text-indigo-700',
    iconLetter: 'L'
  },
  {
    id: 'auto',
    brand: 'Precision Auto',
    category: 'Automotive Care',
    name: 'European Car Diagnostics',
    location: 'Sydney, Australia',
    rate: 'Certified Techs',
    subRate: 'Surry Hills NSW',
    tags: ['Logbook Service', 'Brake Specialists', 'Same-Day Diagnostics'],
    description: 'Precision European Auto Care provides dealer-level maintenance, brake replacement, transmission servicing, and roadworthy certificates for BMW, Audi, Mercedes, and Volkswagen vehicles in Surry Hills and Eastern Sydney. Call (02) 9555 4321.',
    phone: '(02) 9555 4321',
    address: '54 Crown St, Surry Hills NSW 2010',
    iconBg: 'bg-purple-50 text-purple-700 border-purple-100',
    iconColor: 'text-purple-700',
    iconLetter: 'P'
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
  const [result, setResult] = useState<LocalSeoAuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeModalSection, setActiveModalSection] = useState<'gbp' | 'keywords' | 'schema' | 'citations' | 'photos' | 'calendar' | 'markdown' | null>(null);

  // Quota & Purchase states
  const [quota, setQuota] = useState<LocalSeoQuotaInfo | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccessMessage, setPurchaseSuccessMessage] = useState<string | null>(null);

  // Saved / Bookmarked presets in UI
  const [savedCards, setSavedCards] = useState<Record<string, boolean>>({ hvac: true });

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

  const handleApplyPreset = (preset: PresetBusiness) => {
    setBusinessDescription(preset.description);
    setLocation(preset.location);
    if (preset.name) setBusinessName(preset.name);
    if (preset.phone) setPhone(preset.phone);
    if (preset.address) setAddress(preset.address);
    setError(null);

    // Scroll smoothly to form
    const formEl = document.getElementById('audit-form-card');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const toggleSaveCard = (cardId: string) => {
    setSavedCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const handleBuyPlan = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
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
          setPurchaseSuccessMessage('Payment verified! 10 Local SEO audit reports added to your account.');
          await refreshQuota();
          setTimeout(() => setPurchaseSuccessMessage(null), 6000);
        },
        onError: (err) => {
          setIsPurchasing(false);
          setError(err.message || 'Payment was not completed. Please try again.');
        },
        onDismiss: () => {
          setIsPurchasing(false);
        }
      });
    } catch (err: any) {
      setIsPurchasing(false);
      setError(err.message || 'Unable to start checkout. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessDescription.trim()) {
      setError('Please provide business details or services offered.');
      return;
    }
    if (!location.trim()) {
      setError('Please enter your target city or service area.');
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

      // Scroll smoothly to results
      setTimeout(() => {
        const resultsEl = document.getElementById('audit-results-container');
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    } catch (err: any) {
      console.error('Audit generation error:', err);
      if (err instanceof LocalSeoAuditError && err.requiresPurchase) {
        setShowPurchaseModal(true);
        setError(err.message || 'Free audit used. Unlock 10 full reports for ₹50.');
      } else {
        setError(err.message || 'Could not complete audit. Please check your details and retry.');
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
    <div className="w-full space-y-12" id="local-seo-audit-app">
      {/* Toast Banner */}
      {purchaseSuccessMessage && (
        <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-zinc-900 text-white text-sm font-medium flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{purchaseSuccessMessage}</span>
          </div>
          <button 
            onClick={() => setPurchaseSuccessMessage(null)}
            className="text-zinc-400 hover:text-white text-xs font-semibold px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SAMPLE OPPORTUNITIES: Authentic 6-Card Grid matching the user's reference image */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 max-w-6xl mx-auto mb-6 text-left px-1">
          <div>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
              Example Business Blueprints
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-950">
              Select an archetype to test the audit engine
            </h2>
          </div>
          <div className="text-xs text-zinc-500">
            Click <span className="font-semibold text-zinc-900">"Audit now"</span> on any card to populate details
          </div>
        </div>

        {/* 6 Clean White Cards with Rounded Radius, Squircle Avatar, Tags & Solid Black Button */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {PRESET_BUSINESSES.map((preset) => {
            const isSaved = !!savedCards[preset.id];
            return (
              <div
                key={preset.id}
                className="bg-white rounded-[26px] p-6 border border-zinc-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.06)] hover:border-zinc-300 transition-all text-left flex flex-col justify-between relative group"
              >
                <div>
                  {/* Top Bar: Squircle Icon & Bookmark Tag */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center font-bold text-lg shadow-2xs ${preset.iconBg}`}>
                      {preset.iconLetter}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSaveCard(preset.id)}
                      className="px-3 py-1 rounded-lg border border-zinc-200 hover:border-zinc-300 text-xs font-medium text-zinc-700 hover:text-zinc-950 flex items-center gap-1.5 transition-colors bg-white cursor-pointer"
                    >
                      <span className="text-xs font-semibold">Save</span>
                      {isSaved ? (
                        <BookmarkCheck className="w-3.5 h-3.5 fill-zinc-900 text-zinc-900" />
                      ) : (
                        <Bookmark className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700" />
                      )}
                    </button>
                  </div>

                  {/* Subtitle / Entity Meta */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-zinc-900">{preset.brand}</span>
                    <span className="text-zinc-400 font-normal">{preset.category}</span>
                  </div>

                  {/* Big Card Title */}
                  <h3 className="text-xl font-bold tracking-tight text-zinc-950 mt-1 mb-3 leading-snug">
                    {preset.name}
                  </h3>

                  {/* Grey Pill Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {preset.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Row: Rate/Metric + High-Contrast Black Action Button */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 mt-auto">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-zinc-950 tracking-tight">
                      {preset.rate}
                    </span>
                    <span className="text-2xs text-zinc-400">
                      {preset.location}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 active:scale-[0.98] text-white text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Audit now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Form: Clean Architectural Card without AI Slop */}
      <div 
        id="audit-form-card"
        className="bg-white rounded-[28px] p-7 sm:p-9 border border-zinc-200/90 shadow-[0_6px_30px_rgba(0,0,0,0.04)] max-w-4xl mx-auto text-left relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md bg-zinc-100 text-zinc-800 text-xs font-semibold">
                Local SEO Engine
              </span>
              <span className="text-xs text-zinc-400">Version 2.0</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-950">
              Audit & Rank Your Local Business
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Generate an optimized Google Profile bio, top local search keywords, structured website schema, and a 4-week ranking plan.
            </p>
          </div>

          {/* Account Quota Badge */}
          <div className="flex items-center gap-2 shrink-0">
            {quota ? (
              quota.remainingAudits > 0 ? (
                <div className="px-3.5 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{quota.freeAuditAvailable ? '1 Free Audit Available' : `${quota.remainingAudits} Audits Left`}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(true)}
                  className="px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Unlock 10 for ₹50</span>
                </button>
              )
            ) : null}

            <button
              type="button"
              onClick={() => setShowPurchaseModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <Zap className="w-3 h-3" />
              <span>Get 10 for ₹50</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Main Description */}
          <div>
            <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider block mb-1.5">
              Business Services & Specialties *
            </label>
            <textarea
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="e.g., Apex 24/7 HVAC Solutions is a licensed heating and cooling repair service in Austin, TX. We offer same-day AC maintenance, emergency heat pump replacements, and commercial duct cleaning. Call (512) 555-0199. Located on South Congress Ave."
              rows={4}
              required
              className="w-full px-4 py-3 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 text-sm text-zinc-950 placeholder:text-zinc-400 transition-all font-sans resize-y"
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider block mb-1.5">
              Target City or Primary Service Area *
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Austin, Texas or Bandra West, Mumbai or Shoreditch, London"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 text-sm text-zinc-950 placeholder:text-zinc-400 transition-all font-sans"
            />
          </div>

          {/* Collapsible Contact Specifics */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvancedInputs(!showAdvancedInputs)}
              className="text-xs font-semibold text-zinc-700 hover:text-zinc-950 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>{showAdvancedInputs ? '− Hide specific NAP overrides' : '+ Add exact business name, address, or phone (optional)'}</span>
            </button>

            {showAdvancedInputs && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
                <div>
                  <label className="text-2xs font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Apex 24/7 HVAC"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-white focus:border-zinc-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-2xs font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. (512) 555-0199"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-white focus:border-zinc-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-2xs font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                    Physical Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 4802 South Congress Ave"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-white focus:border-zinc-900 focus:outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-300 text-zinc-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{error}</span>
                {error.includes('₹50') && (
                  <button
                    type="button"
                    onClick={() => setShowPurchaseModal(true)}
                    className="block mt-1 font-bold text-zinc-950 underline hover:text-black cursor-pointer"
                  >
                    Click here to unlock 10 reports for ₹50
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Submit Row */}
          <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-zinc-100">
            <div className="text-xs text-zinc-500">
              ⚡ Results generated in ~10 seconds • 100% actionable
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Auditing Local Signals...</span>
                </>
              ) : (
                <>
                  <span>Generate Local SEO Report</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* RESULTS: Deliverables rendered in the clean 6-card design archetype */}
      {result && (
        <div id="audit-results-container" className="space-y-8 max-w-6xl mx-auto text-left">
          {/* Upsell / Confirmation Banner */}
          <div className="bg-zinc-950 text-white rounded-[26px] p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xl">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-zinc-800 text-zinc-200 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Audit Completed for {result.entities?.businessName || 'Business'}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                Auditing multiple locations or managing local clients?
              </h3>
              <p className="text-xs text-zinc-400">
                Get <span className="text-white font-semibold">10 Full Local SEO Reports</span> for <span className="text-white font-semibold">₹50</span> (only ₹5 per report).
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleDownloadMarkdown}
                className="px-4 py-2.5 rounded-xl border border-zinc-700 hover:bg-zinc-900 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .MD</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPurchaseModal(true)}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-zinc-950" />
                <span>Get 10 for ₹50</span>
              </button>
            </div>
          </div>

          {/* Priority Checklist (High Visibility) */}
          <div className="bg-white rounded-[26px] p-6 border border-zinc-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                  High-Impact Implementation
                </span>
                <h3 className="text-lg font-bold text-zinc-950 flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-zinc-900" />
                  <span>3-Step Immediate Ranking Roadmap</span>
                </h3>
              </div>
              <span className="text-xs text-zinc-400">Click task to check off</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {result.technical?.criticalActionPlan?.map((action, idx) => (
                <div
                  key={idx}
                  onClick={() => toggleActionItem(idx)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    checkedActions[idx]
                      ? 'bg-zinc-100/70 border-zinc-300 text-zinc-400 line-through'
                      : 'bg-zinc-50/60 border-zinc-200 hover:border-zinc-300 text-zinc-900'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!checkedActions[idx]}
                    onChange={() => {}}
                    className="w-4 h-4 mt-0.5 rounded text-zinc-900 cursor-pointer"
                  />
                  <div className="text-xs font-medium leading-relaxed">
                    {action}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DELIVERABLES: 6 Cards in 2x3 Grid matching the User Reference Image */}
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <div>
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-0.5">
                  Actionable Deliverables
                </span>
                <h3 className="text-xl font-bold text-zinc-950">
                  Ready-to-Use Local SEO Assets
                </h3>
              </div>
              <span className="text-xs text-zinc-500">
                Click any action to inspect or copy directly
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Card 1: Google Business Profile Bio */}
              <div className="bg-white rounded-[26px] p-6 border border-zinc-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between text-left">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center font-bold text-zinc-900 text-lg shadow-2xs">
                      G
                    </div>
                    <button
                      onClick={() => handleCopy(result.tactical?.gbpDescription || '', 'gbp')}
                      className="px-3 py-1 rounded-lg border border-zinc-200 hover:border-zinc-300 text-xs font-medium text-zinc-700 hover:text-zinc-950 flex items-center gap-1 transition-colors bg-white cursor-pointer"
                    >
                      {copiedSection === 'gbp' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
                      <span>{copiedSection === 'gbp' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-zinc-900">Google Business</span>
                    <span className="text-zinc-400 font-normal">{result.entities?.primaryCategory || 'Local'}</span>
                  </div>

                  <h4 className="text-xl font-bold tracking-tight text-zinc-950 mt-1 mb-3 leading-snug">
                    750-Char Profile Bio
                  </h4>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 text-xs font-medium">
                      {result.tactical?.gbpDescription?.length || 0} / 750 Chars
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 text-xs font-medium">
                      Keyword Optimized
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 line-clamp-3 mb-4 font-sans leading-relaxed">
                    {result.tactical?.gbpDescription}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 mt-auto">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-zinc-950">100% Ready</span>
                    <span className="text-2xs text-zinc-400">Paste in GBP bio</span>
                  </div>

                  <button
                    onClick={() => setActiveModalSection('gbp')}
                    className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>View full bio</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 2: 5 Local Keywords */}
              <div className="bg-white rounded-[26px] p-6 border border-zinc-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between text-left">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center font-bold text-zinc-900 text-lg shadow-2xs">
                      <Search className="w-5 h-5 text-zinc-900" />
                    </div>
                    <button
                      onClick={() => handleCopy(result.entities?.targetKeywords?.join('\n') || '', 'keywords')}
                      className="px-3 py-1 rounded-lg border border-zinc-200 hover:border-zinc-300 text-xs font-medium text-zinc-700 hover:text-zinc-950 flex items-center gap-1 transition-colors bg-white cursor-pointer"
                    >
                      {copiedSection === 'keywords' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
                      <span>{copiedSection === 'keywords' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-zinc-900">Google Maps</span>
                    <span className="text-zinc-400 font-normal">Buyer Intent</span>
                  </div>

                  <h4 className="text-xl font-bold tracking-tight text-zinc-950 mt-1 mb-3 leading-snug">
                    Top 5 Local Keywords
                  </h4>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 text-xs font-medium">
                      5 Search Terms
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 text-xs font-medium">
                      High Conversion
                    </span>
                  </div>

                  <ul className="text-xs text-zinc-700 space-y-1.5 mb-4">
                    {result.entities?.targetKeywords?.slice(0, 3).map((kw, i) => (
                      <li key={i} className="truncate font-medium flex items-center gap-1.5">
                        <span className="text-2xs font-bold text-zinc-400">0{i + 1}</span>
                        <span>{kw}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 mt-auto">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-zinc-950">5 Queries</span>
                    <span className="text-2xs text-zinc-400">{location || 'Local area'}</span>
                  </div>

                  <button
                    onClick={() => setActiveModalSection('keywords')}
                    className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>View all keywords</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 3: Website Code (Schema.org) */}
              <div className="bg-white rounded-[26px] p-6 border border-zinc-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between text-left">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center font-bold text-zinc-900 text-lg shadow-2xs">
                      <Code className="w-5 h-5 text-zinc-900" />
                    </div>
                    <button
                      onClick={() => handleCopy(result.technical?.schemaJsonLdRaw || '', 'schema')}
                      className="px-3 py-1 rounded-lg border border-zinc-200 hover:border-zinc-300 text-xs font-medium text-zinc-700 hover:text-zinc-950 flex items-center gap-1 transition-colors bg-white cursor-pointer"
                    >
                      {copiedSection === 'schema' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
                      <span>{copiedSection === 'schema' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-zinc-900">Schema.org</span>
                    <span className="text-zinc-400 font-normal">JSON-LD Code</span>
                  </div>

                  <h4 className="text-xl font-bold tracking-tight text-zinc-950 mt-1 mb-3 leading-snug">
                    LocalBusiness Schema
                  </h4>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 text-xs font-medium">
                      Valid Microdata
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 text-xs font-medium">
                      Header Snippet
                    </span>
                  </div>

                  <p className="text-xs text-zinc-500 mb-4">
                    Embed in your website <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-800">&lt;head&gt;</code> to verify address, phone, and geo coordinates.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 mt-auto">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-zinc-950">Valid JSON</span>
                    <span className="text-2xs text-zinc-400">Google Rich Results</span>
                  </div>

                  <button
                    onClick={() => setActiveModalSection('schema')}
                    className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>View schema</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 4: Top Local Citations */}
              <div className="bg-white rounded-[26px] p-6 border border-zinc-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between text-left">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center font-bold text-zinc-900 text-lg shadow-2xs">
                      <Globe className="w-5 h-5 text-zinc-900" />
                    </div>
                    <button
                      onClick={() => handleCopy(result.tactical?.industryCitations?.join('\n') || '', 'citations')}
                      className="px-3 py-1 rounded-lg border border-zinc-200 hover:border-zinc-300 text-xs font-medium text-zinc-700 hover:text-zinc-950 flex items-center gap-1 transition-colors bg-white cursor-pointer"
                    >
                      {copiedSection === 'citations' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
                      <span>{copiedSection === 'citations' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-zinc-900">Directories</span>
                    <span className="text-zinc-400 font-normal">Backlinks & Citations</span>
                  </div>

                  <h4 className="text-xl font-bold tracking-tight text-zinc-950 mt-1 mb-3 leading-snug">
                    Top Authority Citations
                  </h4>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 text-xs font-medium">
                      High DA Platforms
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 text-xs font-medium">
                      NAP Consistency
                    </span>
                  </div>

                  <ul className="text-xs text-zinc-700 space-y-1.5 mb-4">
                    {result.tactical?.industryCitations?.slice(0, 3).map((cit, i) => (
                      <li key={i} className="truncate font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span>{cit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 mt-auto">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-zinc-950">Top 3 Citations</span>
                    <span className="text-2xs text-zinc-400">Claim to boost trust</span>
                  </div>

                  <button
                    onClick={() => setActiveModalSection('citations')}
                    className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>View directories</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 5: Photo Optimization Guide */}
              <div className="bg-white rounded-[26px] p-6 border border-zinc-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between text-left">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center font-bold text-zinc-900 text-lg shadow-2xs">
                      <Camera className="w-5 h-5 text-zinc-900" />
                    </div>
                    <button
                      onClick={() => handleCopy(result.tactical?.photoRecommendations?.join('\n') || '', 'photos')}
                      className="px-3 py-1 rounded-lg border border-zinc-200 hover:border-zinc-300 text-xs font-medium text-zinc-700 hover:text-zinc-950 flex items-center gap-1 transition-colors bg-white cursor-pointer"
                    >
                      {copiedSection === 'photos' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
                      <span>{copiedSection === 'photos' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-zinc-900">Google Photos</span>
                    <span className="text-zinc-400 font-normal">Conversion Triggers</span>
                  </div>

                  <h4 className="text-xl font-bold tracking-tight text-zinc-950 mt-1 mb-3 leading-snug">
                    3 Must-Upload Photo Angles
                  </h4>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 text-xs font-medium">
                      Storefront & Team
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 text-xs font-medium">
                      Higher CTR
                    </span>
                  </div>

                  <ul className="text-xs text-zinc-700 space-y-1.5 mb-4">
                    {result.tactical?.photoRecommendations?.slice(0, 2).map((photo, i) => (
                      <li key={i} className="line-clamp-2 text-xs font-medium text-zinc-600">
                        • {photo}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 mt-auto">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-zinc-950">3 Angles</span>
                    <span className="text-2xs text-zinc-400">Increases directions</span>
                  </div>

                  <button
                    onClick={() => setActiveModalSection('photos')}
                    className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>View photo guide</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 6: 4-Week Local Content Plan */}
              <div className="bg-white rounded-[26px] p-6 border border-zinc-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between text-left">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center font-bold text-zinc-900 text-lg shadow-2xs">
                      <Calendar className="w-5 h-5 text-zinc-900" />
                    </div>
                    <button
                      onClick={() => handleCopy(JSON.stringify(result.technical?.contentCalendar, null, 2), 'calendar')}
                      className="px-3 py-1 rounded-lg border border-zinc-200 hover:border-zinc-300 text-xs font-medium text-zinc-700 hover:text-zinc-950 flex items-center gap-1 transition-colors bg-white cursor-pointer"
                    >
                      {copiedSection === 'calendar' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
                      <span>{copiedSection === 'calendar' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-zinc-900">Google Updates</span>
                    <span className="text-zinc-400 font-normal">Freshness Signals</span>
                  </div>

                  <h4 className="text-xl font-bold tracking-tight text-zinc-950 mt-1 mb-3 leading-snug">
                    4-Week Ranking Calendar
                  </h4>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 text-xs font-medium">
                      4 Weekly Posts
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 text-xs font-medium">
                      Weekly Cadence
                    </span>
                  </div>

                  <ul className="text-xs text-zinc-700 space-y-1.5 mb-4">
                    {result.technical?.contentCalendar?.slice(0, 2).map((item, i) => (
                      <li key={i} className="truncate font-medium text-xs text-zinc-600">
                        <strong className="text-zinc-950">{item.week}:</strong> {item.topic}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 mt-auto">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-zinc-950">4 Milestones</span>
                    <span className="text-2xs text-zinc-400">Weekly cadence</span>
                  </div>

                  <button
                    onClick={() => setActiveModalSection('calendar')}
                    className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>View calendar</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Inspector Drawer / Modal */}
      {activeModalSection && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-[28px] max-w-2xl w-full p-6 sm:p-8 border border-zinc-200 shadow-2xl relative text-left overflow-hidden max-h-[90vh] flex flex-col">
            {/* Close */}
            <button
              type="button"
              onClick={() => setActiveModalSection(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Content Routing */}
            {activeModalSection === 'gbp' && (
              <div className="space-y-4 overflow-y-auto pr-1">
                <div>
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                    Google Business Profile
                  </span>
                  <h3 className="text-xl font-bold text-zinc-950">
                    Optimized 750-Character Description
                  </h3>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-800 leading-relaxed whitespace-pre-line font-sans">
                  {result.tactical?.gbpDescription}
                </div>
                <div className="text-2xs text-zinc-400 text-right">
                  Length: {result.tactical?.gbpDescription?.length || 0} / 750 characters
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => handleCopy(result.tactical?.gbpDescription || '', 'gbp-modal')}
                    className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedSection === 'gbp-modal' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'gbp-modal' ? 'Copied Bio!' : 'Copy to Clipboard'}</span>
                  </button>
                </div>
              </div>
            )}

            {activeModalSection === 'keywords' && (
              <div className="space-y-4 overflow-y-auto pr-1">
                <div>
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                    Local Search Signals
                  </span>
                  <h3 className="text-xl font-bold text-zinc-950">
                    5 High-Intent Local Keywords
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {result.entities?.targetKeywords?.map((kw, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-zinc-200 text-zinc-800 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-semibold text-zinc-900">{kw}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(kw, `kw-modal-${idx}`)}
                        className="px-2.5 py-1 rounded-md border border-zinc-200 hover:bg-white text-xs font-medium text-zinc-700 cursor-pointer"
                      >
                        {copiedSection === `kw-modal-${idx}` ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => handleCopy(result.entities?.targetKeywords?.join('\n') || '', 'kw-all')}
                    className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedSection === 'kw-all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'kw-all' ? 'All Copied!' : 'Copy All 5 Keywords'}</span>
                  </button>
                </div>
              </div>
            )}

            {activeModalSection === 'schema' && (
              <div className="space-y-4 overflow-y-auto pr-1">
                <div>
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                    Website Integration
                  </span>
                  <h3 className="text-xl font-bold text-zinc-950">
                    LocalBusiness Structured Schema (JSON-LD)
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Paste this snippet directly into your site header (<code className="bg-zinc-100 px-1 py-0.5 rounded">&lt;head&gt;</code>) to verify address & services with Google.
                  </p>
                </div>

                <pre className="p-4 rounded-xl bg-zinc-950 text-zinc-100 font-mono text-xs overflow-x-auto max-h-72">
                  {result.technical?.schemaJsonLdRaw || JSON.stringify(result.technical?.schemaJsonLd, null, 2)}
                </pre>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={handleDownloadSchema}
                    className="px-4 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .JSON</span>
                  </button>

                  <button
                    onClick={() => handleCopy(result.technical?.schemaJsonLdRaw || '', 'schema-modal')}
                    className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedSection === 'schema-modal' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'schema-modal' ? 'Copied Code!' : 'Copy JSON-LD Code'}</span>
                  </button>
                </div>
              </div>
            )}

            {activeModalSection === 'citations' && (
              <div className="space-y-4 overflow-y-auto pr-1">
                <div>
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                    Authoritative Directories
                  </span>
                  <h3 className="text-xl font-bold text-zinc-950">
                    Recommended Local Citations
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {result.tactical?.industryCitations?.map((cit, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0" />
                        <span className="text-sm font-semibold text-zinc-900">{cit}</span>
                      </div>
                      <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-zinc-200 text-zinc-800">
                        Recommended
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeModalSection === 'photos' && (
              <div className="space-y-4 overflow-y-auto pr-1">
                <div>
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                    Visual Proof
                  </span>
                  <h3 className="text-xl font-bold text-zinc-950">
                    3 Must-Upload Photo Angles
                  </h3>
                </div>

                <div className="space-y-3">
                  {result.tactical?.photoRecommendations?.map((photo, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                      <div className="text-xs font-bold text-zinc-400 mb-1">
                        Angle #{idx + 1}
                      </div>
                      <p className="text-sm text-zinc-800 font-medium leading-relaxed">
                        {photo}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeModalSection === 'calendar' && (
              <div className="space-y-4 overflow-y-auto pr-1">
                <div>
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                    Google Maps Updates
                  </span>
                  <h3 className="text-xl font-bold text-zinc-950">
                    4-Week Local Content Calendar
                  </h3>
                </div>

                <div className="space-y-3">
                  {result.technical?.contentCalendar?.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-950 bg-zinc-200 px-2 py-0.5 rounded">
                          {item.week}
                        </span>
                        <span className="text-2xs text-zinc-500 font-medium">
                          {item.format}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-zinc-900">
                        {item.topic}
                      </h4>
                      <p className="text-xs text-zinc-500">
                        Keyword target: <strong className="text-zinc-800">{item.targetKeyword}</strong>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Razorpay Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 sm:p-8 border border-zinc-200 shadow-2xl relative text-left overflow-hidden">
            <button
              type="button"
              onClick={() => setShowPurchaseModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-800 text-xs font-semibold mb-2 inline-block">
                Micro-Pack
              </span>
              <h3 className="text-2xl font-bold text-zinc-950 tracking-tight">
                Unlock 10 Reports for ₹50
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Audit multiple locations, client businesses, or track ranking improvements month over month.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 mb-6 flex items-center justify-between">
              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-zinc-400 block">
                  10 Audit Reports Pack
                </span>
                <div className="text-2xl font-bold text-zinc-950">
                  ₹50 <span className="text-xs font-normal text-zinc-500">only (₹5/report)</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Instant Activation
                </span>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs text-zinc-700 font-medium mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0" />
                <span>10 Full Local SEO Audits & Strategy Reports</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0" />
                <span>750-Char Bio & Photo Checklists for Google Profile</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0" />
                <span>LocalBusiness JSON-LD Schema Generator</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0" />
                <span>Export to Markdown, Schema .json & Client Deliverables</span>
              </li>
            </ul>

            <button
              type="button"
              disabled={isPurchasing}
              onClick={handleBuyPlan}
              className="w-full bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
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

            <div className="mt-4 flex items-center justify-center gap-1.5 text-2xs text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-600" />
              <span>Secure 256-bit encrypted checkout via Razorpay UPI & Cards</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
