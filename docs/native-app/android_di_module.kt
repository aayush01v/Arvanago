package com.edusimulate.app.di

import com.edusimulate.app.data.repository.*
import com.edusimulate.app.domain.repository.*
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.storage.FirebaseStorage
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    // --- Firebase Instances ---
    
    @Provides
    @Singleton
    fun provideFirebaseAuth(): FirebaseAuth = FirebaseAuth.getInstance()

    @Provides
    @Singleton
    fun provideFirebaseFirestore(): FirebaseFirestore = FirebaseFirestore.getInstance()

    @Provides
    @Singleton
    fun provideFirebaseStorage(): FirebaseStorage = FirebaseStorage.getInstance()

    // --- Repository Bindings ---
    // Note: These assume you will create wrapper classes (e.g., FirebaseAuthRepositoryImpl) 
    // that implement the interfaces defined in android_repositories.kt.

    @Provides
    @Singleton
    fun provideAuthRepository(
        auth: FirebaseAuth,
        firestore: FirebaseFirestore
    ): AuthRepository {
        return AuthRepositoryImpl(auth, firestore)
    }

    @Provides
    @Singleton
    fun provideUserRepository(
        firestore: FirebaseFirestore
    ): UserRepository {
        return UserRepositoryImpl(firestore)
    }

    @Provides
    @Singleton
    fun provideCourseRepository(
        firestore: FirebaseFirestore
    ): CourseRepository {
        return CourseRepositoryImpl(firestore)
    }

    @Provides
    @Singleton
    fun provideNotesRepository(
        // In a real app, you'd inject the Room DAO here too
        firestore: FirebaseFirestore
    ): NotesRepository {
        return NotesRepositoryImpl(firestore) // + RoomDao
    }

    @Provides
    @Singleton
    fun provideChatRepository(
        firestore: FirebaseFirestore,
        auth: FirebaseAuth
    ): ChatRepository {
        return ChatRepositoryImpl(firestore) // Corrected: ChatRepositoryImpl(firestore, auth)
    }

    @Provides
    @Singleton
    fun provideBlogRepository(
        firestore: FirebaseFirestore
    ): BlogRepository {
        return BlogRepositoryImpl(firestore)
    }
}
