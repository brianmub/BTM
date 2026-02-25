import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Download, Eye, Layout, Type, Image as ImageIcon, Palette, Save, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CertificateDesigner() {
    const navigate = useNavigate();
    const [template, setTemplate] = useState('classic');
    const [primaryColor, setPrimaryColor] = useState('#000000');

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/dashboard/rewards')}
                        className="p-2 hover:bg-background rounded-xl transition-colors text-slate-400 hover:text-foreground"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">Certificate Designer</h1>
                        <p className="text-slate-500 font-medium">Create beautiful completion certificates for your programs.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" className="bg-surface">
                        <Eye className="w-5 h-5 mr-2" /> Preview PDF
                    </Button>
                    <Button variant="primary">
                        <Save className="w-5 h-5 mr-2" /> Save Template
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Editor Controls */}
                <div className="space-y-6">
                    <Card className="bg-surface border-surface-border shadow-xl">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Design Tools</h3>

                        <div className="space-y-4">
                            <button className="w-full flex items-center justify-between p-4 bg-background rounded-xl hover:bg-surface transition-colors border border-transparent hover:border-surface-border">
                                <div className="flex items-center gap-3">
                                    <Layout className="w-5 h-5 text-primary" />
                                    <span className="text-sm font-bold text-foreground">Layout Template</span>
                                </div>
                                <span className="text-xs text-primary font-bold">Classic</span>
                            </button>

                            <button className="w-full flex items-center justify-between p-4 bg-background rounded-xl hover:bg-surface transition-colors border border-transparent hover:border-surface-border">
                                <div className="flex items-center gap-3">
                                    <Type className="w-5 h-5 text-primary" />
                                    <span className="text-sm font-bold text-foreground">Typography</span>
                                </div>
                                <span className="text-xs text-slate-400 font-bold italic">Inter Bold</span>
                            </button>
                        </div>
                    </Card>

                    <Card className="bg-amber-500/5 border-amber-500/20 shadow-lg">
                        <h4 className="text-sm font-bold text-amber-600 mb-2 uppercase tracking-tight">Automation Tags</h4>
                        <p className="text-[10px] text-amber-700 leading-relaxed mb-4 font-bold uppercase tracking-widest">
                            Use these tags in your text to automatically insert participant data.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {['{{name}}', '{{program}}', '{{date}}', '{{issuer}}'].map((tag) => (
                                <span key={tag} className="px-2 py-1 bg-surface border border-amber-500/30 rounded-md text-[10px] font-black font-mono text-amber-600 cursor-pointer hover:bg-amber-500/10 transition-colors">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Live Preview Area */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-background rounded-3xl p-10 flex items-center justify-center border-2 border-dashed border-surface-border min-h-[600px] relative overflow-hidden shadow-2xl">

                        {/* Certificate Mockup */}
                        <div className="bg-white w-full aspect-[1.414/1] shadow-2xl rounded-sm p-16 flex flex-col items-center justify-between relative border-[12px] border-double border-slate-100 overflow-hidden">

                            {/* Pattern Background */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                            <div className="absolute top-0 left-0 w-32 h-32 bg-slate-50 -scale-100 border-r border-b border-slate-100 rotate-45 transform -translate-x-16 -translate-y-16"></div>
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-slate-50 border-r border-b border-slate-100 rotate-45 transform translate-x-16 translate-y-16"></div>

                            <div className="text-center w-full">
                                <div className="text-4xl mb-4">⛪</div>
                                <h2 className="text-sm font-black tracking-[0.3em] uppercase text-slate-400 mb-10">Certificate of Completion</h2>
                                <p className="text-slate-500 font-serif italic mb-2">This is to certify that</p>
                                <h1 className="text-5xl font-serif text-slate-900 mb-6 border-b border-slate-100 pb-4 inline-block px-10">Emmanuel Mutasa</h1>
                                <p className="text-slate-500 font-serif italic max-w-lg mx-auto leading-relaxed">
                                    Has successfully completed the requirements for the discipleship track in
                                </p>
                                <h3 className="text-2xl font-black text-primary uppercase tracking-widest mt-4">Discipleship 101</h3>
                            </div>

                            <div className="flex justify-between items-end w-full px-10">
                                <div className="text-center border-t border-slate-200 pt-2 min-w-[150px]">
                                    <p className="text-xs font-bold text-slate-900 uppercase">Rev. John Doe</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Lead Pastor</p>
                                </div>

                                <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center border-2 border-primary/10">
                                    <div className="w-12 h-12 bg-white rounded-full shadow-inner flex items-center justify-center">
                                        <Award className="w-6 h-6 text-primary" />
                                    </div>
                                </div>

                                <div className="text-center border-t border-slate-200 pt-2 min-w-[150px]">
                                    <p className="text-xs font-bold text-slate-900 uppercase">12 Oct 2026</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Date Issued</p>
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                            <span className="px-4 py-2 bg-foreground text-background text-[10px] font-bold rounded-full shadow-lg">
                                LIVE PREVIEW • CLASSIC TEMPLATE
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-center gap-4">
                        <Button variant="outline" size="sm" className="bg-surface">
                            <Download className="w-4 h-4 mr-2" /> Download JPG
                        </Button>
                        <Button variant="outline" size="sm" className="bg-surface">
                            <Download className="w-4 h-4 mr-2" /> Download PNG
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
