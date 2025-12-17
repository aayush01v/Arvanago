import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import CourseEditor from './CourseEditor';
import { getCourses, deleteCourse } from '../../services/firestoreService';
import { Course } from '../../types';

const CourseManager: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const data = await getCourses({ forceRefresh: true });
            setCourses(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (courseId: string) => {
        if (!window.confirm('Are you sure you want to delete this course?')) return;
        try {
            await deleteCourse(courseId);
            fetchCourses();
        } catch (error) {
            console.error('Failed to delete course:', error);
        }
    };

    if (isEditing) {
        return (
            <CourseEditor
                onBack={() => {
                    setIsEditing(false);
                    setSelectedCourseId(null);
                    fetchCourses();
                }}
                courseId={selectedCourseId}
            />
        );
    }

    if (loading) {
        return <div className="text-white p-8 text-center">Loading courses...</div>;
    }

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="relative w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500/50"
                    />
                </div>
                <button
                    onClick={() => {
                        setSelectedCourseId(null);
                        setIsEditing(true);
                    }}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                >
                    <Plus className="w-5 h-5" />
                    <span>Create Course</span>
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredCourses.map((course) => (
                    <div key={course.id} className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-all duration-300 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 rounded-lg bg-gray-700 overflow-hidden flex-shrink-0">
                                {course.thumbnail && <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">{course.title}</h3>
                                <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                                    <span>{course.studentCount || 0} Students</span>
                                    <span>★ {course.rating || 0}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${course.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                        {course.isPublished ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => {
                                    setSelectedCourseId(course.id);
                                    setIsEditing(true);
                                }}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => handleDelete(course.id)}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
                {filteredCourses.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No courses found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseManager;
