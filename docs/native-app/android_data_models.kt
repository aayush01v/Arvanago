package com.edusimulate.app.domain.model

import com.google.firebase.Timestamp

data class User(
    val uid: String = "",
    val name: String = "",
    val email: String? = null,
    val avatar: String = "",
    val level: Int = 0,
    val points: Int = 0,
    val streak: Int = 0,
    val completedChallenges: Int = 0,
    val enrolledCourses: List<String> = emptyList(),
    val ongoingCourses: List<String> = emptyList(),
    val wishlist: List<String> = emptyList(),
    val pendingTasks: List<Task> = emptyList(),
    val bio: String? = null,
    val coursesAuthored: Int? = 0,
    val lastLogin: Timestamp? = null,
    val themePreference: String? = null, // "light" | "dark"
    val role: String? = "student", // "student" | "admin" | "super_admin"
    val isDisabled: Boolean? = false,
    val disabledUntil: Timestamp? = null,
    val isDeleted: Boolean? = false,
    val progress: Map<String, List<String>>? = emptyMap(), // courseId -> completedLectureIds
    // Profile Fields
    val username: String? = null,
    val isPublic: Boolean? = false,
    val lastHandleChangeDate: Timestamp? = null,
    val jobTitle: String? = null,
    val coverPhoto: String? = null,
    val socialLinks: List<SocialLink>? = emptyList(),
    val website: String? = null,
    val publicEmail: String? = null,
    val followers: Int = 0,
    val following: Int = 0,
    val postsCount: Int = 0,
    val gallery: List<String>? = emptyList(),
    val deletionRequested: Boolean? = false,
    val deletionRequestedAt: Timestamp? = null
)

data class SocialLink(
    val platform: String = "",
    val url: String = ""
)

data class Course(
    val id: String = "",
    val title: String = "",
    val description: String = "",
    val category: String = "",
    val thumbnail: String = "",
    val thumbnailUrl: String? = null,
    val isFree: Boolean = false,
    val isPaid: Boolean = false,
    val isPublished: Boolean = false,
    val isFeaturedOnHome: Boolean? = false,
    val featuredPriority: Int? = 0,
    val lectures: List<Lecture> = emptyList(),
    val sections: List<CourseSection>? = emptyList(),
    val progress: Int = 0,
    val author: User = User(),
    val price: Double? = null,
    val currency: String? = null,
    val originalPrice: Double? = null,
    val rating: Double? = 0.0,
    val reviewCount: Int? = 0,
    val studentCount: Int? = 0,
    val lessonsCount: Int? = 0,
    val totalDuration: String? = null,
    val skillLevel: String? = null, // "Beginner" | "Intermediate" | "Advanced"
    val views: Int? = 0,
    val subtitle: String? = null,
    val headline: String? = null,
    val lastUpdated: String? = null,
    val updatedAt: String? = null,
    val language: String? = null,
    val previewVideoUrl: String? = null,
    val previewImageUrl: String? = null,
    val learningOutcomes: List<String>? = emptyList(),
    val requirements: List<String>? = emptyList(),
    val longDescription: String? = null,
    val descriptionHtml: String? = null,
    val descriptionSections: List<DescriptionSection>? = emptyList(),
    val instructors: List<CourseInstructor>? = emptyList(),
    val includes: List<String>? = emptyList(),
    val faqs: List<FAQ>? = emptyList(),
    val suggestedCourses: List<String>? = emptyList(),
    val suggestedCourseDetails: List<SuggestedCourseSummary>? = emptyList(),
    val lectureType: String? = null,
    val critiqueSession: String? = null,
    val tags: List<String> = emptyList(),
    val comments: List<Comment>? = emptyList(),
    val resources: List<DownloadableResource>? = emptyList(),
    val simulations: List<Simulation>? = emptyList()
)

data class DescriptionSection(
    val title: String = "",
    val content: String = ""
)

data class FAQ(
    val question: String = "",
    val answer: String = ""
)

data class Lecture(
    val id: String = "",
    val title: String = "",
    val duration: String = "",
    val videoUrl: String = "",
    val isCompleted: Boolean = false,
    val summary: String = "",
    val isPreview: Boolean? = false
)

data class CourseSection(
    val title: String = "",
    val lectures: List<Lecture> = emptyList(),
    val progress: Int? = 0
)

data class Task(
    val id: String = "",
    val text: String = "",
    val dueDate: String = "",
    val courseId: String = "",
    val courseTitle: String = "",
    val completed: Boolean? = false
)

data class Comment(
    val id: String = "",
    val user: CommentUser = CommentUser(),
    val text: String = "",
    val imageUrl: String? = null,
    val timestamp: String = "",
    val replies: List<Comment>? = emptyList(),
    val likes: List<String>? = emptyList(),
    val isPinned: Boolean? = false
)

data class CommentUser(
    val uid: String? = null,
    val name: String = "",
    val avatar: String = "",
    val isAdmin: Boolean? = false
)

data class DownloadableResource(
    val id: String = "",
    val name: String = "",
    val type: String = "", // "PDF" | "ZIP" | "Blend File"
    val size: String = "",
    val url: String? = null
)

data class Simulation(
    val id: String = "",
    val title: String = "",
    val description: String = "",
    val thumbnail: String = "",
    val launchUrl: String = "",
    val type: String = "" // "3D" | "Lab" | "Quiz"
)

data class CourseInstructor(
    val id: String = "",
    val name: String = "",
    val title: String? = null,
    val headline: String? = null,
    val avatar: String? = null,
    val rating: Double? = 0.0,
    val totalStudents: Int? = 0,
    val totalReviews: Int? = 0,
    val bio: String? = null,
    val description: String? = null,
    val socialLinks: List<CourseSocialLink>? = emptyList()
)

data class CourseSocialLink(
    val label: String = "",
    val url: String = ""
)

data class SuggestedCourseSummary(
    val id: String = "",
    val title: String = "",
    val category: String = "",
    val thumbnailUrl: String? = null,
    val price: Double? = null,
    val currency: String? = null,
    val isPaid: Boolean? = false,
    val tags: List<String>? = emptyList()
)

data class Note(
    val id: String = "",
    val userId: String = "",
    val title: String = "",
    val content: String = "",
    val vaultId: String? = null,
    val isPublic: Boolean? = false,
    val path: String? = null,
    val createdAt: Timestamp? = null,
    val updatedAt: Timestamp? = null
)

data class Vault(
    val id: String = "",
    val userId: String = "",
    val name: String = "",
    val description: String? = null,
    val css: String? = null,
    val createdAt: Timestamp? = null,
    val updatedAt: Timestamp? = null,
    val isDefault: Boolean? = false
)

data class BlogPost(
    val id: String = "",
    val title: String = "",
    val slug: String = "",
    val content: String = "",
    val excerpt: String = "",
    val coverImage: String? = null,
    val author: BlogAuthor = BlogAuthor(),
    val tags: List<String> = emptyList(),
    val likes: Int = 0,
    val commentsCount: Int = 0,
    val isPublished: Boolean = false,
    val createdAt: Timestamp? = null,
    val updatedAt: Timestamp? = null
)

data class BlogAuthor(
    val uid: String = "",
    val name: String = "",
    val avatar: String = ""
)

data class ChatMessage(
    val sender: String = "", // "user" | "ai"
    val text: String = ""
)
