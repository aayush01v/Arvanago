import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Video, Save, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import { createCourse, updateCourse, getCourses } from '../../services/firestoreService';
import { Course, CourseSection, Lecture } from '../../types';

interface CourseEditorProps {
    onBack: () => void;
    courseId?: string | null;
}

const CourseEditor: React.FC<CourseEditorProps> = ({ onBack, courseId }) => {
    // State for course metadata
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [longDescription, setLongDescription] = useState('');
    const [thumbnail, setThumbnail] = useState('');
    const [learningOutcomes, setLearningOutcomes] = useState<string[]>(['']);

    // State for loading
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (courseId) {
            loadCourseData();
        }
    }, [courseId]);

    const loadCourseData = async () => {
        // In a real app, you might want a getCourseById function
        // For now we'll fetch all and find (not efficient but checking logic)
        try {
            const courses = await getCourses();
            const course = courses.find(c => c.id === courseId);
            if (course) {
                setTitle(course.title);
                setDescription(course.description || '');
                setLongDescription(course.longDescription || '');
                setThumbnail(course.thumbnail || '');
                setLearningOutcomes(course.learningOutcomes || ['']);
            }
        } catch (error) {
            console.error("Failed to load course", error);
        }
    };

    // State for curriculum
    const [sections, setSections] = useState<CourseSection[]>([
        { title: 'Introduction', lectures: [] }
    ]);

    const addSection = () => {
        setSections([...sections, { title: 'New Section', lectures: [] }]);
    };

    const updateSectionTitle = (index: number, title: string) => {
        const newSections = [...sections];
        newSections[index].title = title;
        setSections(newSections);
    };

    const removeSection = (index: number) => {
        setSections(sections.filter((_, i) => i !== index));
    };

    const addLecture = (sectionIndex: number) => {
        const newSections = [...sections];
        const newLecture: Lecture = {
            id: `new-${Date.now()}`,
            title: 'New Lecture',
            duration: '5m',
            videoUrl: '',
            isCompleted: false,
            isPreview: false,
            summary: ''
        };
        // Initialize lectures array if undefined
        if (!newSections[sectionIndex].lectures) {
            newSections[sectionIndex].lectures = [];
        }
        newSections[sectionIndex].lectures.push(newLecture);
        setSections(newSections);
    };

    const updateLecture = (sectionIndex: number, lectureIndex: number, field: keyof Lecture, value: any) => {
        const newSections = [...sections];
        newSections[sectionIndex].lectures[lectureIndex] = {
            ...newSections[sectionIndex].lectures[lectureIndex],
            [field]: value
        };
        setSections(newSections);
    };

    const removeLecture = (sectionIndex: number, lectureIndex: number) => {
        const newSections = [...sections];
        newSections[sectionIndex].lectures = newSections[sectionIndex].lectures.filter((_, i) => i !== lectureIndex);
        setSections(newSections);
    };

    const handleOutcomeChange = (index: number, value: string) => {
        const newOutcomes = [...learningOutcomes];
        newOutcomes[index] = value;
        setLearningOutcomes(newOutcomes);
    };

    const addOutcome = () => setLearningOutcomes([...learningOutcomes, '']);
    const removeOutcome = (index: number) => setLearningOutcomes(learningOutcomes.filter((_, i) => i !== index));

    const handleSave = async () => {
        if (!title) {
            alert('Title is required');
            return;
        }

        setSaving(true);
        try {
            const courseData: Partial<Course> = {
                title,
                description, // Maps to short description
                longDescription,
                thumbnail,
                learningOutcomes: learningOutcomes.filter(o => o.trim() !== ''),
                sections,
            };

            if (courseId) {
                await updateCourse(courseId, courseData);
            } else {
                await createCourse(courseData);
            }
            onBack();
        } catch (error) {
            console.error('Failed to save course:', error);
            alert('Failed to save course. Check console for details.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                <button onClick={onBack} className="flex items-center text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Courses
                </button>
                <div className="flex items-center space-x-4">
                    <button className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" />
                        <span>{saving ? 'Saving...' : 'Save Course'}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">
                            Course Details
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Course Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500/50"
                                    placeholder="e.g. Advanced Regenerative Design"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Short Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500/50"
                                    placeholder="Brief summary for cards..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Detailed Description</label>
                                <textarea
                                    value={longDescription}
                                    onChange={(e) => setLongDescription(e.target.value)}
                                    rows={6}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500/50"
                                    placeholder="Full course details..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Curriculum</h3>
                            <button onClick={addSection} className="flex items-center space-x-2 text-blue-400 hover:text-blue-300">
                                <Plus className="w-4 h-4" />
                                <span>Add Section</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {sections.map((section, sIndex) => (
                                <div key={sIndex} className="bg-black/20 border border-white/10 rounded-xl overflow-hidden">
                                    <div className="p-4 bg-white/5 flex items-center justify-between">
                                        <div className="flex items-center space-x-3 flex-1">
                                            <GripVertical className="w-5 h-5 text-gray-500 cursor-grab" />
                                            <input
                                                type="text"
                                                value={section.title}
                                                onChange={(e) => updateSectionTitle(sIndex, e.target.value)}
                                                className="bg-transparent border-none text-white font-medium focus:ring-0 w-full"
                                                placeholder="Section Title"
                                            />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button onClick={() => addLecture(sIndex)} className="p-2 text-gray-400 hover:text-blue-400">
                                                <Plus className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => removeSection(sIndex)} className="p-2 text-gray-400 hover:text-red-400">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 space-y-2">
                                        {section.lectures?.map((lecture, lIndex) => (
                                            <div key={lecture.id} className="flex items-center space-x-4 pl-4 py-2 border-l-2 border-white/10 ml-2">
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <input
                                                        type="text"
                                                        value={lecture.title}
                                                        onChange={(e) => updateLecture(sIndex, lIndex, 'title', e.target.value)}
                                                        className="bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-white"
                                                        placeholder="Lecture Title"
                                                    />
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={lecture.duration}
                                                            onChange={(e) => updateLecture(sIndex, lIndex, 'duration', e.target.value)}
                                                            className="w-20 bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-white"
                                                            placeholder="Duration"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={lecture.videoUrl}
                                                            onChange={(e) => updateLecture(sIndex, lIndex, 'videoUrl', e.target.value)}
                                                            className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-white"
                                                            placeholder="Video URL"
                                                        />
                                                    </div>
                                                </div>
                                                <button onClick={() => removeLecture(sIndex, lIndex)} className="text-gray-500 hover:text-red-400">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {(!section.lectures || section.lectures.length === 0) && (
                                            <div className="text-center py-2 text-sm text-gray-500 italic">No lectures in this section</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-4">Thumbnail</h3>
                        <div className="aspect-video rounded-xl bg-black/40 border border-white/10 flex items-center justify-center mb-4 overflow-hidden relative group">
                            {thumbnail ? (
                                <img src={thumbnail} alt="Thumbnail preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center">
                                    <Video className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                                    <span className="text-xs text-gray-500">No image selected</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="text-white text-sm font-medium hover:underline">Change</button>
                            </div>
                        </div>
                        <input
                            type="text"
                            value={thumbnail}
                            onChange={(e) => setThumbnail(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-blue-500/50"
                            placeholder="Image URL..."
                        />
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Outcomes</h3>
                            <button onClick={addOutcome} className="text-blue-400 hover:text-blue-300">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {learningOutcomes.map((outcome, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={outcome}
                                        onChange={(e) => handleOutcomeChange(index, e.target.value)}
                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 text-sm text-white focus:outline-none focus:border-blue-500/50"
                                        placeholder="What will they learn?"
                                    />
                                    {learningOutcomes.length > 1 && (
                                        <button onClick={() => removeOutcome(index)} className="text-gray-500 hover:text-red-400">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseEditor;
