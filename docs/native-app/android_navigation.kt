package com.edusimulate.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.edusimulate.app.ui.screens.auth.LoginScreen
import com.edusimulate.app.ui.screens.dashboard.DashboardScreen
import com.edusimulate.app.ui.screens.course.CourseDetailScreen
import com.edusimulate.app.ui.screens.player.PlayerScreen
import com.edusimulate.app.ui.screens.profile.ProfileScreen
import com.edusimulate.app.ui.screens.chat.ChatListScreen
import com.edusimulate.app.ui.screens.chat.ChatDetailScreen

object Routes {
    const val LOGIN = "login"
    const val DASHBOARD = "dashboard"
    const val PROFILE = "profile"
    const val COURSE_DETAIL = "course_detail/{courseId}"
    const val PLAYER = "player/{courseId}/{lectureId}"
    const val CHATS = "chats"
    const val CHAT_DETAIL = "chat_detail/{chatId}"
    
    fun courseDetail(courseId: String) = "course_detail/$courseId"
    fun player(courseId: String, lectureId: String) = "player/$courseId/$lectureId"
    fun chatDetail(chatId: String) = "chat_detail/$chatId"
}

@Composable
fun EduNavGraph(
    navController: NavHostController = rememberNavController(),
    startDestination: String = Routes.LOGIN
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        
        // --- Auth ---
        composable(Routes.LOGIN) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Routes.DASHBOARD) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                }
            )
        }

        // --- Main App ---
        composable(Routes.DASHBOARD) {
            DashboardScreen(
                onCourseClick = { courseId ->
                    navController.navigate(Routes.courseDetail(courseId))
                },
                onProfileClick = {
                    navController.navigate(Routes.PROFILE)
                },
                onChatClick = {
                    navController.navigate(Routes.CHATS)
                }
            )
        }

        composable(Routes.PROFILE) {
            ProfileScreen(
                onBack = { navController.popBackStack() },
                onLogout = {
                    navController.navigate(Routes.LOGIN) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        // --- Course & Learning ---
        composable(Routes.COURSE_DETAIL) { backStackEntry ->
            val courseId = backStackEntry.arguments?.getString("courseId") ?: return@composable
            CourseDetailScreen(
                courseId = courseId,
                onBack = { navController.popBackStack() },
                onStartLecture = { cId, lId ->
                    navController.navigate(Routes.player(cId, lId))
                }
            )
        }

        composable(Routes.PLAYER) { backStackEntry ->
            val courseId = backStackEntry.arguments?.getString("courseId") ?: return@composable
            val lectureId = backStackEntry.arguments?.getString("lectureId") ?: return@composable
            PlayerScreen(
                courseId = courseId,
                lectureId = lectureId,
                onBack = { navController.popBackStack() }
            )
        }
        
        // --- Chat ---
        composable(Routes.CHATS) {
            ChatListScreen(
                onChatClick = { chatId -> 
                    navController.navigate(Routes.chatDetail(chatId))
                },
                onBack = { navController.popBackStack() }
            )
        }
        
        composable(Routes.CHAT_DETAIL) { backStackEntry ->
            val chatId = backStackEntry.arguments?.getString("chatId") ?: return@composable
            ChatDetailScreen(
                chatId = chatId,
                onBack = { navController.popBackStack() }
            )
        }
    }
}
