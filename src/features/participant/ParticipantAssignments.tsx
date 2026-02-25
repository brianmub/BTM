import { useState, useEffect } from 'react';
import { assignmentService } from '@/services/assignmentService';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    FileText,
    Calendar,
    CheckCircle,
    Clock,
    AlertCircle,
    Loader2,
    Send,
    XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

export function ParticipantAssignments({ programId }: { programId: string }) {
    const { user } = useAuth();
    const { organization } = useOrganization();
    const [assignments, setAssignments] = useState<any[]>([]);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
    const [submissionText, setSubmissionText] = useState('');

    useEffect(() => {
        if (user && organization) fetchData();
    }, [user, organization, programId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [asgData, subData] = await Promise.all([
                assignmentService.getAssignmentsByProgram(programId),
                assignmentService.getParticipantSubmissions(user!.id, organization!.id)
            ]);
            setAssignments(asgData || []);
            setSubmissions(subData || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await assignmentService.submitAssignment({
                assignment_id: selectedAssignment.id,
                user_id: user!.id,
                organization_id: organization!.id,
                submission_text: submissionText,
                status: 'submitted'
            });
            setIsSubmitModalOpen(false);
            setSubmissionText('');
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const getSubmissionForAssignment = (assignmentId: string) => {
        return submissions.find(s => s.assignment_id === assignmentId);
    };

    if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>;

    return (
        <div className="space-y-6">
            <div className="grid gap-4">
                {assignments.map((assignment) => {
                    const submission = getSubmissionForAssignment(assignment.id);
                    const isOverdue = new Date(assignment.due_date) < new Date() && !submission;

                    return (
                        <Card key={assignment.id} className="p-6 bg-surface border-surface-border hover:border-primary/30 transition-all shadow-xl">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xl ${submission
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                                        : isOverdue
                                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-600'
                                            : 'bg-primary/10 border-primary/20 text-primary'
                                        }`}>
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-black text-foreground uppercase tracking-tight">{assignment.name}</h4>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed line-clamp-2 max-w-md">
                                            {assignment.description || 'No description provided.'}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center">
                                                <Calendar className="w-3 h-3 mr-1 text-pink-400" /> Due: {new Date(assignment.due_date).toLocaleDateString()}
                                            </span>
                                            {submission?.status === 'graded' && (
                                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center">
                                                    <CheckCircle className="w-3 h-3 mr-1" /> Score: {submission.score}/{assignment.max_score}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {submission ? (
                                        <div className="flex flex-col items-end">
                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider mb-2 ${submission.status === 'graded' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-primary/10 text-primary border border-primary/20'
                                                }`}>
                                                {submission.status === 'graded' ? 'Evaluated' : 'Handed In'}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-foreground bg-background border border-surface-border px-4 shadow-sm"
                                                onClick={() => {
                                                    setSelectedAssignment(assignment);
                                                    setSubmissionText(submission.submission_text);
                                                    setIsSubmitModalOpen(true);
                                                }}
                                            >
                                                View My Work
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            variant={isOverdue ? 'outline' : 'premium'}
                                            size="sm"
                                            className="h-10 text-[10px] font-black uppercase tracking-widest px-6"
                                            onClick={() => {
                                                setSelectedAssignment(assignment);
                                                setIsSubmitModalOpen(true);
                                            }}
                                        >
                                            <Send className="w-3 h-3 mr-2" /> Hand In Task
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    );
                })}

                {assignments.length === 0 && (
                    <div className="text-center py-20 bg-background rounded-3xl border border-dashed border-surface-border">
                        <Clock className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-tight">No Active Tasks</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Assignments will appear here once deployed by your facilitator.</p>
                    </div>
                )}
            </div>

            {/* Submission Modal */}
            {isSubmitModalOpen && selectedAssignment && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-surface border border-surface-border rounded-3xl w-full max-w-md p-8 shadow-2xl relative"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-premium"></div>
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">
                                    {getSubmissionForAssignment(selectedAssignment.id) ? 'My Submission' : 'Hand In Task'}
                                </h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{selectedAssignment.name}</p>
                            </div>
                            <button onClick={() => setIsSubmitModalOpen(false)} className="text-slate-400 hover:text-foreground transition-colors">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Submission Text</label>
                                <textarea
                                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-foreground text-sm focus:border-primary/30 outline-none h-40 font-bold shadow-inner"
                                    placeholder="Enter your response or findings..."
                                    value={submissionText}
                                    onChange={e => setSubmissionText(e.target.value)}
                                    required
                                    disabled={!!getSubmissionForAssignment(selectedAssignment.id)}
                                />
                            </div>
                            {!getSubmissionForAssignment(selectedAssignment.id) ? (
                                <>
                                    <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex items-start gap-3">
                                        <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                        <p className="text-[9px] text-primary/70 font-bold uppercase tracking-widest leading-relaxed">
                                            Submitting this task marks it as complete. You can update your submission until the due date or until it is graded.
                                        </p>
                                    </div>
                                    <Button type="submit" variant="premium" className="w-full h-14 uppercase font-black tracking-widest">
                                        <CheckCircle className="w-4 h-4 mr-2" /> Confirm Submission
                                    </Button>
                                </>
                            ) : (
                                <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 flex items-start gap-3">
                                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Submission Finalized</p>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed mt-1">
                                            Submitted on {new Date(getSubmissionForAssignment(selectedAssignment.id).submitted_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
