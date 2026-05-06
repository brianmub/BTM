import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { broadcastService } from '@/services/broadcastService';
import { Broadcast } from '@/types';
import { useOrganization } from '@/hooks/useOrganization';
import { PlayCircle, Newspaper, Image as ImageIcon, Plus, Trash2, Calendar, FileText } from 'lucide-react';

export const BroadcastManager: React.FC = () => {
    const { organization: currentOrganization } = useOrganization();
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'news' as 'podcast' | 'news' | 'story',
        published_at: '', // Will be local datetime string
        file: null as File | null,
    });

    useEffect(() => {
        if (currentOrganization) {
            loadBroadcasts();
        }
    }, [currentOrganization]);

    const loadBroadcasts = async () => {
        try {
            setLoading(true);
            const data = await broadcastService.getBroadcasts(currentOrganization!.id);
            setBroadcasts(data);
        } catch (error) {
            console.error('Error loading broadcasts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this broadcast?')) {
            try {
                await broadcastService.deleteBroadcast(id);
                setBroadcasts(broadcasts.filter(b => b.id !== id));
            } catch (error) {
                console.error('Error deleting broadcast:', error);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentOrganization || !formData.title) return;

        try {
            setIsUploading(true);
            let mediaUrl = '';

            if (formData.file) {
                const path = `${currentOrganization.id}/${Date.now()}_${formData.file.name}`;
                mediaUrl = await broadcastService.uploadMedia(formData.file, path);
            }

            // Determine publish date
            const publishDate = formData.published_at
                ? new Date(formData.published_at).toISOString()
                : new Date().toISOString();

            const newBroadcast = await broadcastService.createBroadcast({
                organization_id: currentOrganization.id,
                type: formData.type,
                title: formData.title,
                description: formData.description,
                media_url: mediaUrl,
                is_published: true,
                published_at: publishDate,
            });

            setBroadcasts([newBroadcast, ...broadcasts]);
            setShowModal(false);
            setFormData({ title: '', description: '', type: 'news', published_at: '', file: null });
        } catch (error) {
            console.error('Error creating broadcast:', error);
            alert('Failed to create broadcast. Ensure you ran the SQL migration.');
        } finally {
            setIsUploading(false);
        }
    };

    const isScheduled = (dateString: string | undefined) => {
        if (!dateString) return false;
        return new Date(dateString).getTime() > new Date().getTime();
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading broadcasts...</div>;

    return (
        <div className="space-y-6 relative">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Broadcasts</h2>
                    <p className="text-sm text-gray-500">Manage your MUTV-style media and scheduled news.</p>
                </div>
                <div className="flex space-x-2">
                    <Button onClick={() => setShowModal(true)} className="bg-primary text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Broadcast
                    </Button>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <Card className="max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Create Broadcast</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 bg-white"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                >
                                    <option value="news">News Header (Text or Image)</option>
                                    <option value="podcast">Podcast (Audio)</option>
                                    <option value="story">Story (Video/Image)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                                    placeholder="Enter a title..."
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional text news)</label>
                                <textarea
                                    rows={3}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                                    placeholder="Write your news update here..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Publish Date (Optional)</label>
                                <input
                                    type="datetime-local"
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                                    value={formData.published_at}
                                    onChange={e => setFormData({ ...formData, published_at: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 mt-1">Leave empty to publish immediately.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Attach Media File (Optional)</label>
                                <input
                                    type="file"
                                    accept="image/*,video/*,audio/*"
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                    onChange={e => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                                />
                            </div>

                            <div className="pt-4 flex justify-end space-x-3">
                                <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={isUploading}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isUploading || !formData.title}>
                                    {isUploading ? 'Uploading...' : 'Save Broadcast'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {broadcasts.map((broadcast) => (
                    <Card key={broadcast.id} className="overflow-hidden">
                        <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
                            {broadcast.media_url ? (
                                <>
                                    {broadcast.type === 'podcast' && <PlayCircle className="w-12 h-12 text-gray-400" />}
                                    {broadcast.type === 'news' && <Newspaper className="w-12 h-12 text-gray-400" />}
                                    {broadcast.type === 'story' && <ImageIcon className="w-12 h-12 text-gray-400" />}
                                </>
                            ) : (
                                <FileText className="w-12 h-12 text-gray-400" />
                            )}

                            <div className="absolute top-2 right-2 flex space-x-2">
                                {isScheduled(broadcast.published_at) && (
                                    <span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-400 text-yellow-900 flex items-center">
                                        <Calendar className="w-3 h-3 mr-1" /> Scheduled
                                    </span>
                                )}
                                <span className={`px-2 py-1 text-xs font-bold rounded-full text-white
                                  ${broadcast.type === 'podcast' ? 'bg-blue-500' : ''}
                                  ${broadcast.type === 'news' ? 'bg-green-500' : ''}
                                  ${broadcast.type === 'story' ? 'bg-purple-500' : ''}
                                `}>
                                    {broadcast.type.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <div className="p-4">
                            <h3 className="text-lg font-bold text-gray-900 truncate" title={broadcast.title}>
                                {broadcast.title}
                            </h3>
                            {broadcast.description && (
                                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                    {broadcast.description}
                                </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                                Publish: {new Date(broadcast.published_at || broadcast.created_at).toLocaleString()}
                            </p>

                            <div className="mt-4 flex justify-between items-center">
                                {broadcast.media_url ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(broadcast.media_url, '_blank')}
                                    >
                                        View Media
                                    </Button>
                                ) : (
                                    <span className="text-sm font-medium text-gray-400">Text Only</span>
                                )}
                                <button
                                    onClick={() => handleDelete(broadcast.id)}
                                    className="text-red-500 hover:text-red-700 p-2"
                                    title="Delete broadcast"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </Card>
                ))}
                {broadcasts.length === 0 && !loading && (
                    <div className="col-span-full p-8 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                        No broadcasts found. Click "Create Broadcast" to add podcasts, stories or scheduled news!
                    </div>
                )}
            </div>
        </div>
    );
};
