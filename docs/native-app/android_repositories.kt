package com.edusimulate.app.domain.repository

import com.edusimulate.app.domain.model.*
import kotlinx.coroutines.flow.Flow

/**
 * Repository definitions for Clean Architecture.
 * These interfaces reside in the Domain layer and are implemented in the Data layer.
 */

interface AuthRepository {
    val currentUser: Flow<User?>
    
    suspend fun signInWithGoogle(idToken: String): Result<User>
    suspend fun signInWithEmail(email: String, password: String): Result<User>
    suspend fun signUpWithEmail(email: String, password: String, name: String): Result<User>
    suspend fun signOut()
    suspend fun deleteAccount(): Result<Unit>
}

interface UserRepository {
    suspend fun getUserProfile(uid: String): Result<User>
    suspend fun updateUserProfile(uid: String, updates: Map<String, Any>): Result<Unit>
    suspend fun updateUserAvatar(uid: String, imageUri: String): Result<String> // Returns new URL
    
    // Gamification & Stats
    fun getUserStats(uid: String): Flow<UserStats> // Wrapper for points, streak, etc.
    suspend fun updateThemePreference(uid: String, isDark: Boolean): Result<Unit>
}

interface CourseRepository {
    // Fetching
    fun getFeaturedCourses(): Flow<List<Course>>
    fun getCoursesByCategory(category: String): Flow<List<Course>>
    suspend fun getCourseDetails(courseId: String): Result<Course>
    suspend fun searchCourses(query: String): Result<List<Course>>
    
    // Learning Progress
    fun getEnrolledCourses(uid: String): Flow<List<Course>>
    suspend fun enrollInCourse(uid: String, courseId: String): Result<Unit>
    suspend fun updateLectureProgress(uid: String, courseId: String, lectureId: String, isCompleted: Boolean): Result<Unit>
    
    // Resources
    suspend fun getCourseResources(courseId: String): Result<List<DownloadableResource>>
}

interface NotesRepository {
    // Offline-first approach: These return Flow from local DB (Room), synced with remote
    fun getUserVaults(uid: String): Flow<List<Vault>>
    fun getNotesInVault(vaultId: String): Flow<List<Note>>
    suspend fun getNote(noteId: String): Result<Note>
    
    // CRUD
    suspend fun createVault(vault: Vault): Result<String> // Returns ID
    suspend fun createNote(note: Note): Result<String>
    suspend fun updateNote(note: Note): Result<Unit>
    suspend fun deleteNote(noteId: String): Result<Unit>
}

interface ChatRepository {
    fun getRecentChats(uid: String): Flow<List<Chat>> // Define Chat model if missing or use simplified version
    fun getMessages(chatId: String): Flow<List<ChatMessage>>
    suspend fun sendMessage(chatId: String, message: ChatMessage): Result<Unit>
    suspend fun createPrivateChat(targetUserId: String): Result<String> // Returns chatId
}

interface SimulationRepository {
    suspend fun getSimulationDetails(simulationId: String): Result<Simulation>
    // For launching native simulations or preparing webview bridge
    suspend fun prepareSimulation(simulationId: String): Result<String> // Returns launch config/URL
}

interface BlogRepository {
    fun getLatestPosts(): Flow<List<BlogPost>>
    suspend fun getPostDetails(slug: String): Result<BlogPost>
    suspend fun likePost(postId: String, uid: String): Result<Unit>
    suspend fun addComment(postId: String, comment: Comment): Result<Unit>
}

// Helper for Stats aggregation if needed
data class UserStats(
    val level: Int,
    val points: Int,
    val streak: Int,
    val completedChallenges: Int
)

// Placeholder for Chat if not in core types yet, or import if it exists
data class Chat(
    val id: String,
    val participants: List<String>,
    val lastMessage: ChatMessage?,
    val updatedAt: Long
)
