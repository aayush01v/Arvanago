import React from 'react';
import GlassPreviewPlayer from '../components/media/GlassPreviewPlayer';
import { PREVIEW_VIDEOS } from './previewVideos';

const VideoPreviewPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-900 text-white p-6 md:p-10">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Migrated Content Preview
                    </h1>
                    <p className="text-slate-400 mt-2">
                        Admin-only preview of recently migrated Vimeo videos.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {PREVIEW_VIDEOS.map((video) => (
                        <div key={video.id} className="bg-slate-800/50 rounded-3xl p-4 border border-white/5 backdrop-blur-sm hover:border-white/10 transition-all">
                            <div className="aspect-video w-full rounded-2xl overflow-hidden mb-4 shadow-lg bg-black">
                                <GlassPreviewPlayer
                                    title={video.title}
                                    videoUrl={video.url}
                                />
                            </div>
                            <h3 className="font-medium text-slate-200 line-clamp-2 px-1">
                                {video.title}
                            </h3>
                            <div className="mt-2 flex items-center justify-between px-1">
                                <span className="text-xs font-mono text-slate-500">ID: {video.id}</span>
                                <a
                                    href={video.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    Open in Vimeo
                                </a>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 p-6 bg-slate-800 rounded-2xl border border-dashed border-slate-700">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Migration Status</h4>
                    <p className="text-slate-300 text-sm mb-2">
                        Real-time logs are available in <code className="bg-black/30 px-2 py-1 rounded text-yellow-400">scripts/migrated_links.txt</code>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VideoPreviewPage;
