import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicNote } from '../services/firestoreService';
import { Note } from '../types';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import Icon from '../components/common/Icon';

const PublicNotePage: React.FC = () => {
    const { noteId } = useParams<{ noteId: string }>();
    const [note, setNote] = useState<Note | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchNote = async () => {
            if (!noteId) return;
            try {
                // We don't have userId in URL, so we rely on collectionGroup implementation in service
                // passing empty string or ignoring userId param if service is robust enough, 
                // OR we update route to include userId.
                // for now, let's assume service handles it via collectionGroup query
                const fetchedNote = await getPublicNote('', noteId);
                if (fetchedNote) {
                    setNote(fetchedNote);
                } else {
                    setError("Note not found or is private.");
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load note.");
            } finally {
                setLoading(false);
            }
        };
        fetchNote();
    }, [noteId]);

    if (loading) {
        return <div className="p-10 text-center"><div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-brand-primary rounded-full"></div></div>;
    }

    if (error || !note) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
                <div className="text-center">
                    <Icon name="lock" className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-slate-700 dark:text-slate-300">{error || "Content Unavailable"}</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900">
            <Helmet>
                <title>{note.title} | Edusimulate</title>
            </Helmet>
            <div className="max-w-3xl mx-auto px-6 py-12">
                <header className="mb-8 pb-8 border-b border-slate-200 dark:border-slate-800">
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">{note.title}</h1>
                    <div className="flex items-center text-sm text-slate-500">
                        <span>Published {note.updatedAt?.toDate ? note.updatedAt.toDate().toLocaleDateString() : 'recently'}</span>
                    </div>
                </header>
                <article className="prose dark:prose-invert max-w-none">
                    <ReactMarkdown>{note.content}</ReactMarkdown>
                </article>
                <footer className="mt-20 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-slate-500 text-sm">
                    <p>Powered by <span className="font-bold text-brand-primary">Edusimulate</span></p>
                </footer>
            </div>
        </div>
    );
};

export default PublicNotePage;
