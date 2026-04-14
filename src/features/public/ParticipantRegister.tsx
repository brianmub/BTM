import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/Button';
import { GlassBox } from '@/components/ui/Card';
import { supabase } from '@/services/supabase';
import { Loader2, User, Mail, Lock, Phone, ArrowRight, ArrowLeft, Eye, EyeOff, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { organizationService } from '@/services/organizationService';

export function ParticipantRegister() {
    const { orgSlug } = useParams();
    const [searchParams] = useSearchParams();
    const programId = searchParams.get('program');

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [orgData, setOrgData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [searching, setSearching] = useState(false);

    const [form, setForm] = useState({
        title: 'Mr',
        firstName: '',
        surname: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        address: '',
        maritalStatus: 'single',
        dob: '',
        church: '',
        suburb: '',
        cityTown: '',
        province: '',
        country: 'Zimbabwe'
    });

    const ZIM_CHURCHES = [
      "Apostolic Faith Mission in Zimbabwe (AFM)",
      "Zimbabwe Assemblies of God Africa (ZAOGA)",
      "United Family International Church (UFIC)",
      "Prophetic Healing and Deliverance (PHD) Ministries",
      "Celebration Ministries International",
      "Zion Christian Church (ZCC)",
      "African Apostolic Church (Johane Marange)",
      "Johane Masowe Apostles",
      "First Ethiopian Church of Zimbabwe",
      "Christian Marching Church",
      "Roman Catholic Church",
      "Anglican Church",
      "Methodist Church in Zimbabwe",
      "African Methodist Church",
      "African Methodist Episcopal Church",
      "United Methodist Church",
      "Reformed Church in Zimbabwe",
      "Church of Central Africa Presbyterian",
      "United Congregational Church of Southern Africa",
      "Uniting Presbyterian Church of Southern Africa",
      "United Church of Christ in Zimbabwe",
      "Evangelical Lutheran Church in Zimbabwe",
      "Salvation Army",
      "Baptist Convention of Zimbabwe",
      "Baptist Union of Zimbabwe",
      "Central Baptist Church",
      "Ebenezer Baptist Church",
      "Seventh-day Adventist Church",
      "Brethren in Christ Church",
      "New Apostolic Church",
      "Agape Missions",
      "Victory Fellowship Church",
      "Jehovah's Witnesses",
      "Heartfelt International Ministries",
      "Harvest House International",
      "Word of Life International Ministries",
      "Faith Ministries",
      "New Life Covenant Church",
      "Christ Embassy Zimbabwe",
      "Christ Connect Family Church (CCFC)",
      "Lighthouse Chapel International",
      "Church of Christ",
      "Zimbabwe Council of Churches (ZCC Umbrella)",
      "Evangel Fellowship of Zimbabwe (EFZ Umbrella)",
      "Zimbabwe Catholic Bishops' Conference (ZCBC Umbrella)",
    ];

    const [churchSearch, setChurchSearch] = useState('');
    const [showChurchDropdown, setShowChurchDropdown] = useState(false);

    const filteredChurches = ZIM_CHURCHES.filter(c => 
        c.toLowerCase().includes(churchSearch.toLowerCase())
    );

    const calculateAge = (dob: string) => {
        if (!dob) return null;
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const age = calculateAge(form.dob);

    const calculatePasswordStrength = (pass: string) => {
        let strength = 0;
        if (pass.length === 0) return { label: 'Awaiting Input', score: 0, color: 'slate' };
        if (pass.length > 5) strength++;
        if (/[A-Z]/.test(pass)) strength++;
        if (/[0-9]/.test(pass)) strength++;
        if (/[^A-Za-z0-9]/.test(pass)) strength++;

        if (strength < 2) return { label: 'Weak Soul', score: 1, color: 'red', advice: 'Try adding numbers or symbols.' };
        if (strength < 3) return { label: 'Average Watcher', score: 2, color: 'orange', advice: 'Almost there! Add a capital letter.' };
        if (strength < 4) return { label: 'Strong Guardian', score: 3, color: 'indigo', advice: 'Great choice! This is a solid guard.' };
        return { label: 'Divine Integrity', score: 4, color: 'emerald', advice: 'Impenetrable. Your account is well-protected.' };
    };

    const passStrength = calculatePasswordStrength(form.password);

    useEffect(() => {
        if (orgSlug) {
            fetchOrg();
        }
    }, [orgSlug]);

    const fetchOrg = async () => {
        setLoading(true);
        try {
            const { data } = await supabase.from('organizations').select('id, name, slug, primary_color').eq('slug', orgSlug).single();
            if (data) setOrgData(data);
        } finally {
            setLoading(false);
        }
    };

    const handleCodeLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode) return;

        setSearching(true);
        setError(null);
        try {
            const org = await organizationService.getOrganizationByJoinCode(joinCode);
            if (org) {
                setOrgData(org);
                // Also update URL if possible or just stay on /register
            } else {
                setError('Invalid organization code. Please check and try again.');
            }
        } catch (err) {
            setError('Error searching for organization.');
        } finally {
            setSearching(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (form.password !== form.confirmPassword) {
            setError('Password mismatch. Please verify your password entry.');
            return;
        }

        if (form.password.length < 6) {
            setError('Your security password requires more substance (minimum 6 characters).');
            return;
        }

        setLoading(true);

        try {
            if (!orgData) throw new Error('Organization not found');

            // 0. Clear any existing session first (prevents old user context bleeding in)
            await supabase.auth.signOut();

            // 1. Sign Up Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
            });

            if (authError) throw authError;

            if (authData.user) {
                // 2. Create User Profile
                // Check if profile already exists for this org
                const { data: existingProfile } = await supabase
                    .from('users')
                    .select('id')
                    .eq('auth_id', authData.user.id)
                    .eq('organization_id', orgData.id)
                    .maybeSingle();

                if (!existingProfile) {
                    const { error: profileError } = await supabase
                        .from('users')
                        .insert([{
                            // id: auto-generated
                            auth_id: authData.user.id,
                            organization_id: orgData.id,
                            email: form.email,
                            title: form.title,
                            first_name: form.firstName,
                            surname: form.surname,
                            phone_number: form.phone,
                            residential_address: form.address,
                            suburb: form.suburb,
                            city_town: form.cityTown,
                            province: form.province,
                            country: form.country,
                            marital_status: form.maritalStatus,
                            dob: form.dob,
                            church_name: form.church,
                            role: 'participant',
                            is_active: true
                        }]);

                    if (profileError) throw profileError;
                }

                // 3. Sign out the auto-login that signUp creates, then redirect to login
                await supabase.auth.signOut();
                navigate(`/portal/${orgSlug}/login?registered=true`);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    if (!orgData && !loading) {
        return (
            <PublicLayout showFooter={false}>
                <div className="max-w-md mx-auto mt-20">
                    <div className="text-center mb-10 space-y-2">
                        <Sparkles className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                        <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter">Join Organisation</h1>
                        <p className="text-slate-500 text-sm font-medium">Enter your unique registration code</p>
                    </div>

                    <GlassBox className="p-8 border-surface-border bg-surface backdrop-blur-xl shadow-2xl">
                        <form onSubmit={handleCodeLookup} className="space-y-6">
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold text-center">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center block">Organisation Code</label>
                                <input
                                    type="text"
                                    value={joinCode}
                                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                                    placeholder="Enter 6-digit code"
                                    maxLength={6}
                                    className="w-full bg-background border border-surface-border rounded-2xl px-6 py-5 text-center text-2xl font-black tracking-[0.5em] text-foreground outline-none focus:border-primary/50 transition-all shadow-inner uppercase"
                                    required
                                />
                            </div>

                            <Button 
                                variant="premium" 
                                className="w-full h-14 text-sm font-black uppercase tracking-widest" 
                                disabled={searching || joinCode.length < 6}
                            >
                                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                    <>Find Organisation <ArrowRight className="w-4 h-4 ml-2" /></>
                                )}
                            </Button>
                        </form>
                    </GlassBox>

                    <p className="text-center mt-8 text-xs text-slate-500 font-medium">
                        Don't have a code? Contact your organization administrator.
                    </p>
                </div>
            </PublicLayout>
        );
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    return (
        <PublicLayout showFooter={false}>
            <div className="max-w-md mx-auto mt-10">
                <Button variant="ghost" className="mb-8 pl-0 hover:pl-0 text-slate-500 hover:text-foreground transition-colors" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                </Button>

                <div className="text-center mb-10 space-y-2">
                    <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter">Create Account</h1>
                    <p className="text-slate-500 text-sm font-medium">Join <span className="text-primary font-bold">{orgData?.name}</span></p>
                </div>

                <GlassBox className="p-8 border-surface-border bg-surface backdrop-blur-xl shadow-2xl">
                    <form onSubmit={handleRegister} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold text-center">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-3 space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Title</label>
                                <select 
                                    className="w-full bg-background border border-surface-border rounded-xl px-2 py-3 text-foreground outline-none focus:border-primary/30 transition-colors shadow-inner font-medium appearance-none"
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                >
                                    <option value="Mr">Mr</option>
                                    <option value="Mrs">Mrs</option>
                                    <option value="Ms">Ms</option>
                                    <option value="Miss">Miss</option>
                                    <option value="Dr">Dr</option>
                                    <option value="Rev">Rev</option>
                                    <option value="Pastor">Pastor</option>
                                </select>
                            </div>
                            <div className="col-span-4 space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">First Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/30 transition-colors shadow-inner font-medium"
                                    value={form.firstName}
                                    onChange={e => setForm({ ...form, firstName: e.target.value })}
                                />
                            </div>
                            <div className="col-span-5 space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Surname</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/30 transition-colors shadow-inner font-medium"
                                    value={form.surname}
                                    onChange={e => setForm({ ...form, surname: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Date of Birth</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/30 transition-colors shadow-inner font-medium"
                                        value={form.dob}
                                        onChange={e => setForm({ ...form, dob: e.target.value })}
                                    />
                                    {age !== null && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-primary/10 rounded text-[9px] font-black text-primary uppercase">
                                            {age} Years
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Marital Status</label>
                                <select
                                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/30 transition-colors shadow-inner appearance-none font-medium"
                                    value={form.maritalStatus}
                                    onChange={e => setForm({ ...form, maritalStatus: e.target.value })}
                                >
                                    <option value="single">Single</option>
                                    <option value="married">Married</option>
                                    <option value="widowed">Widowed</option>
                                    <option value="divorced">Divorced</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2 relative">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Your Church / Ministry</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search or type your church name..."
                                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/30 transition-colors shadow-inner font-medium"
                                    value={form.church}
                                    onChange={e => {
                                        setForm({ ...form, church: e.target.value });
                                        setChurchSearch(e.target.value);
                                        setShowChurchDropdown(true);
                                    }}
                                    onFocus={() => setShowChurchDropdown(true)}
                                />
                                {showChurchDropdown && (churchSearch || filteredChurches.length > 0) && (
                                    <div className="absolute z-50 w-full mt-2 bg-surface border border-surface-border rounded-xl shadow-2xl max-h-48 overflow-y-auto overflow-x-hidden p-2 space-y-1 custom-scrollbar">
                                        {filteredChurches.map((church) => (
                                            <button
                                                key={church}
                                                type="button"
                                                className="w-full text-left px-4 py-3 rounded-lg hover:bg-primary/5 text-xs font-bold text-foreground transition-colors border border-transparent hover:border-primary/10"
                                                onClick={() => {
                                                    setForm({ ...form, church });
                                                    setChurchSearch(church);
                                                    setShowChurchDropdown(false);
                                                }}
                                            >
                                                {church}
                                            </button>
                                        ))}
                                        {churchSearch && !ZIM_CHURCHES.includes(churchSearch) && (
                                            <button
                                                type="button"
                                                className="w-full text-left px-4 py-3 rounded-lg hover:bg-primary/5 text-xs font-bold text-primary transition-colors border border-dashed border-primary/20"
                                                onClick={() => setShowChurchDropdown(false)}
                                            >
                                                Add "{churchSearch}" as new
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-background border border-surface-border rounded-xl pl-12 pr-4 py-3 text-foreground outline-none focus:border-primary/30 transition-colors shadow-inner font-medium"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="tel"
                                    required
                                    className="w-full bg-background border border-surface-border rounded-xl pl-12 pr-4 py-3 text-foreground outline-none focus:border-primary/30 transition-colors shadow-inner font-medium"
                                    value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Suburb</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/30 transition-colors shadow-inner font-medium"
                                    value={form.suburb}
                                    onChange={e => setForm({ ...form, suburb: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">City / Town</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/30 transition-colors shadow-inner font-medium"
                                    value={form.cityTown}
                                    onChange={e => setForm({ ...form, cityTown: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Province</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/30 transition-colors shadow-inner font-medium"
                                    value={form.province}
                                    onChange={e => setForm({ ...form, province: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Country</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/30 transition-colors shadow-inner font-medium"
                                    value={form.country}
                                    onChange={e => setForm({ ...form, country: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Secure Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        minLength={6}
                                        className="w-full bg-background border border-surface-border rounded-xl pl-12 pr-14 py-3 text-foreground outline-none focus:border-primary/30 transition-colors shadow-inner font-medium"
                                        value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* AI Strength Indicator */}
                            {form.password && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 rounded-xl border border-${passStrength.color}-100 bg-${passStrength.color}-50/30 space-y-3`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className={`w-3.5 h-3.5 text-${passStrength.color}-500`} />
                                            <span className={`text-[9px] font-black uppercase tracking-widest text-${passStrength.color}-600`}>
                                                {passStrength.label}
                                            </span>
                                        </div>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4].map(i => (
                                                <div
                                                    key={i}
                                                    className={`h-1 w-6 rounded-full transition-all duration-500 ${i <= passStrength.score ? `bg-${passStrength.color}-500` : 'bg-slate-200'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                                        <Sparkles className="w-3 h-3 inline mr-1 text-indigo-400" /> {passStrength.advice}
                                    </p>
                                </motion.div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        className={`w-full bg-background border ${form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-200 ring-2 ring-red-50' : 'border-surface-border'} rounded-xl pl-12 pr-4 py-3 text-foreground outline-none focus:border-primary/30 transition-colors shadow-inner font-medium`}
                                        value={form.confirmPassword}
                                        onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                                    />
                                    {form.confirmPassword && form.password !== form.confirmPassword && (
                                        <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> Passwords do not match
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Button variant="premium" className="w-full h-14 text-sm font-black uppercase tracking-widest mt-6" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
                        </Button>
                    </form>
                </GlassBox>

                <p className="text-center mt-8 text-xs text-slate-500 font-medium">
                    Already have an account? <span className="text-primary cursor-pointer hover:text-foreground transition-colors" onClick={() => navigate(`/portal/${orgSlug}/login`)}>Sign In</span>
                </p>
            </div>
        </PublicLayout>
    );
}
