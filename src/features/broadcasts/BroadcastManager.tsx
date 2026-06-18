import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { broadcastService } from '@/services/broadcastService';
import { Broadcast } from '@/types';
import { useOrganization } from '@/hooks/useOrganization';
import {
    PlayCircle,
    Newspaper,
    Video,
    Plus,
    Trash2,
    Calendar,
    FileText,
    Image as ImageIcon,
    ExternalLink,
} from 'lucide-react';

type BroadcastType = 'podcast' | 'news' | 'story';

const TYPE_CONFIG: Record<BroadcastType, { label: string; color: string; icon: React.ReactNode; hint: string }> = {
    news: {
        label: 'News Article',
        color: 'bg-green-500',
        icon: <Newspaper className="w-4 h-4" />,
        hint: 'Text article with optional image. Shows a "Read" button on mobile.',
    },
    story: {
        label: 'Video / Reel',
        color: 'bg-purple-500',
        icon: <Video className="w-4 h-4" />,
        hint: 'Short video or reel. Shows a "Watch Now" button on mobile.',
    },
    podcast: {
        label: 'Video / Podcast',
        color: 'bg-blue-500',
        icon: <PlayCircle className="w-4 h-4" />,
        hint: 'Audio or video podcast. Shows a "Watch Now" button on mobile.',
    },
};

export const BroadcastManager: React.FC = () => {
    const { organization: currentOrganization } = useOrganization();
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'news' as BroadcastType,
        published_at: '',
        mediaFile: null as File | null,
        thumbnailFile: null as File | null,
        thumbnailPreview: '' as string,
    });

    useEffect(() => {
        if (currentOrganization) loadBroadcasts();
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

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            const preview = URL.createObjectURL(file);
            setFormData(prev => ({ ...prev, thumbnailFile: file, thumbnailPreview: preview }));
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            type: 'news',
            published_at: '',
            mediaFile: null,
            thumbnailFile: null,
            thumbnailPreview: '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentOrganization || !formData.title) return;

        try {
            setIsUploading(true);
            let mediaUrl = '';
            let thumbnailUrl = '';

            // Upload media file if provided
            if (formData.mediaFile) {
                const path = `${currentOrganization.id}/${Date.now()}_${formData.mediaFile.name}`;
                mediaUrl = await broadcastService.uploadMedia(formData.mediaFile, path);
            }

            // Upload thumbnail if provided
            if (formData.thumbnailFile) {
                const thumbPath = `${currentOrganization.id}/thumbnails/${Date.now()}_${formData.thumbnailFile.name}`;
                thumbnailUrl = await broadcastService.uploadMedia(formData.thumbnailFile, thumbPath);
            }

            const publishDate = formData.published_at
                ? new Date(formData.published_at).toISOString()
                : new Date().toISOString();

            const newBroadcast = await broadcastService.createBroadcast({
                organization_id: currentOrganization.id,
                type: formData.type,
                title: formData.title,
                description: formData.description,
                media_url: mediaUrl,
                thumbnail_url: thumbnailUrl,
                is_published: true,
                published_at: publishDate,
            });

            setBroadcasts([newBroadcast, ...broadcasts]);
            setShowModal(false);
            resetForm();
        } catch (error) {
            console.error('Error creating broadcast:', error);
            alert('Failed to create broadcast. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const isScheduled = (dateString: string | undefined) => {
        if (!dateString) return false;
        return new Date(dateString).getTime() > new Date().getTime();
    };

    const timeAgo = (dateStr: string): string => {
        const now = new Date();
        const date = new Date(dateStr);
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
        return `${Math.floor(diff / 86400)} days ago`;
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading media...</div>;

    return (
        <div className="space-y-6 relative">

            {/* ── Header ── */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Media</h2>
                    <p className="text-sm text-gray-500">
                        Manage news articles, videos and reels for your organization.
                    </p>
                </div>
                <Button onClick={() => setShowModal(true)} className="bg-primary text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Broadcast
                </Button>
            </div>

            {/* ── Type Legend ── */}
            <div className="flex gap-4 flex-wrap">
                {(Object.entries(TYPE_CONFIG) as [BroadcastType, typeof TYPE_CONFIG[BroadcastType]][]).map(([type, config]) => (
                    <div key={type} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className={`w-2 h-2 rounded-full ${config.color}`} />
                        <span>{config.label}</span>
                        <span className="text-gray-400">→ {type === 'news' ? '"Read" on mobile' : '"Watch Now" on mobile'}</span>
                    </div>
                ))}
            </div>

            {/* ── Create Modal ── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <Card className="max-w-lg w-full p-6 my-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">Create Broadcast</h3>
                        <p className="text-sm text-gray-500 mb-5">
                            This will appear in the <strong>Media</strong> section of the mobile app.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Content Type
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(Object.entries(TYPE_CONFIG) as [BroadcastType, typeof TYPE_CONFIG[BroadcastType]][]).map(([type, config]) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, type }))}
                                            className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium
                                                ${formData.type === type
                                                    ? 'border-primary bg-primary/5 text-primary'
                                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            {config.icon}
                                            {config.label}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                    {TYPE_CONFIG[formData.type].hint}
                                </p>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
                                    placeholder="Enter a compelling title..."
                                    value={formData.title}
                                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                    <span className="text-gray-400 font-normal ml-1">(optional)</span>
                                </label>
                                <textarea
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
                                    placeholder={formData.type === 'news'
                                        ? 'Write your news article content here...'
                                        : 'Brief description of this video...'}
                                    value={formData.description}
                                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>

                            {/* Thumbnail Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Thumbnail Image
                                    <span className="text-gray-400 font-normal ml-1">
                                        (recommended — shown in hero carousel)
                                    </span>
                                </label>
                                <div className="flex gap-3 items-start">
                                    {formData.thumbnailPreview ? (
                                        <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                                            <img
                                                src={formData.thumbnailPreview}
                                                alt="Thumbnail preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({
                                                    ...prev,
                                                    thumbnailFile: null,
                                                    thumbnailPreview: '',
                                                }))}
                                                className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5"
                                            >
                                                <Trash2 className="w-3 h-3 text-white" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-24 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                                            <ImageIcon className="w-5 h-5 text-gray-400" />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="flex-1 text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                        onChange={handleThumbnailChange}
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    Ideal size: 1280×720px (16:9). Used as hero card background on mobile.
                                </p>
                            </div>

                            {/* Media File */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {formData.type === 'news' ? 'Attach Image / File' : 'Upload Video / Audio'}
                                    <span className="text-gray-400 font-normal ml-1">(optional)</span>
                                </label>
                                <input
                                    type="file"
                                    accept={formData.type === 'news' ? 'image/*' : 'video/*,audio/*,image/*'}
                                    className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                    onChange={e => setFormData(prev => ({
                                        ...prev,
                                        mediaFile: e.target.files?.[0] || null,
                                    }))}
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    {formData.type === 'news'
                                        ? 'Optional image to attach to the article.'
                                        : 'This file will open when users tap "Watch Now".'}
                                </p>
                            </div>

                            {/* Schedule */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Schedule Publish Date
                                    <span className="text-gray-400 font-normal ml-1">(optional)</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    className="w-full border border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
                                    value={formData.published_at}
                                    onChange={e => setFormData(prev => ({ ...prev, published_at: e.target.value }))}
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Leave empty to publish immediately.
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="pt-2 flex justify-end gap-3 border-t border-gray-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    disabled={isUploading}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isUploading || !formData.title}>
                                    {isUploading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                            </svg>
                                            Uploading...
                                        </span>
                                    ) : 'Publish Broadcast'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* ── Broadcasts Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {broadcasts.map((broadcast) => {
                    const config = TYPE_CONFIG[broadcast.type as BroadcastType];
                    const scheduled = isScheduled(broadcast.published_at);
                    const dateStr = broadcast.published_at || broadcast.created_at;

                    return (
                        <Card key={broadcast.id} className="overflow-hidden hover:shadow-md transition-shadow">

                            {/* Thumbnail / Preview */}
                            <div className="aspect-video bg-gray-100 flex items-center justify-center relative overflow-hidden">
                                {broadcast.thumbnail_url ? (
                                    <img
                                        src={broadcast.thumbnail_url}
                                        alt={broadcast.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : broadcast.media_url && broadcast.type === 'news' ? (
                                    <img
                                        src={broadcast.media_url}
                                        alt={broadcast.title}
                                        className="w-full h-full object-cover"
                                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-gray-300">
                                        {broadcast.type === 'news' && <Newspaper className="w-10 h-10" />}
                                        {broadcast.type === 'story' && <Video className="w-10 h-10" />}
                                        {broadcast.type === 'podcast' && <PlayCircle className="w-10 h-10" />}
                                        <span className="text-xs text-gray-400">No thumbnail</span>
                                    </div>
                                )}

                                {/* Play overlay for video types */}
                                {(broadcast.type === 'story' || broadcast.type === 'podcast') && broadcast.thumbnail_url && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                        <div className="bg-black/60 rounded-full p-3">
                                            <PlayCircle className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                )}

                                {/* Badges */}
                                <div className="absolute top-2 right-2 flex gap-2">
                                    {scheduled && (
                                        <span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-400 text-yellow-900 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> Scheduled
                                        </span>
                                    )}
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full text-white ${config?.color || 'bg-gray-500'}`}>
                                        {config?.label || broadcast.type}
                                    </span>
                                </div>
                            </div>

                            {/* Card Content */}
                            <div className="p-4">
                                <h3 className="text-base font-bold text-gray-900 line-clamp-2 mb-1" title={broadcast.title}>
                                    {broadcast.title}
                                </h3>
                                {broadcast.description && (
                                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                                        {broadcast.description}
                                    </p>
                                )}
                                <p className="text-xs text-gray-400 mb-4">
                                    {scheduled
                                        ? `Scheduled: ${new Date(broadcast.published_at!).toLocaleString()}`
                                        : `Published: ${timeAgo(dateStr)}`
                                    }
                                </p>

                                <div className="flex justify-between items-center">
                                    {broadcast.media_url ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(broadcast.media_url, '_blank')}
                                            className="flex items-center gap-1 text-xs"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            {broadcast.type === 'news' ? 'View Article' : 'View Media'}
                                        </Button>
                                    ) : (
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <FileText className="w-3 h-3" />
                                            Text only
                                        </span>
                                    )}
                                    <button
                                        onClick={() => handleDelete(broadcast.id)}
                                        className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                        title="Delete broadcast"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    );
                })}

                {broadcasts.length === 0 && !loading && (
                    <div className="col-span-full p-12 text-center text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed">
                        <Video className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium text-gray-500 mb-1">No broadcasts yet</p>
                        <p className="text-sm">Click "Create Broadcast" to add news, videos or reels.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
