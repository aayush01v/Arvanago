# Native App Blueprint: Edusimulate

This document outlines the architecture and technical specifications for developing high-performance native applications (Android, iOS, Windows) for Edusimulate.

## 1. Core Philosophy & Performance Strategy

### The Vision of Edusimulate
Edusimulate is **not** merely a video hosting platform; it is an **interactive learning ecosystem** designed to bridge the gap between passive consumption and active engagement.
-   **Interactive Learning:** Courses integrate video with real-time simulations, quizzes, and downloadable resources.
-   **Gamified Progression:** Features like streaks, XP (points), leaderboards, and "My Learnings" analytic dashboards drive user retention.
-   **Community-Centric:** Deep social integration (Chat, Blog, Profile Showcases) turns solitary learning into a collaborative experience.

### Strategy for Uncompromised Quality & Performance
To replicate the "premium" feel of the web app without the lag of hybrid wrappers, we will strictly adhere to these principles:

1.  **100% Native UI (No WebViews for Core):**
    -   **Android:** Jetpack Compose (Material 3).
    -   **iOS:** SwiftUI.
    -   **Why:** Ensures buttery smooth 60/120fps animations, instant screen transitions, and native gesture support (swipes, haptics) that webwrappers (Capacitor/Flutter) struggle to match perfectly.

2.  **Optimized Media Playback:**
    -   **Adaptive Streaming:** Use native players (ExoPlayer/AVPlayer) to handle HLS streams with adaptive bitrate switching, ensuring playback works even on poor connections.
    -   **Custom Controls:** Built-from-scratch player UI overlays to support features like "Critique Session" toggles, speed control, and double-tap-to-seek without the jank of HTML5 video layers.

3.  **Offline-First Architecture:**
    -   **Data Sync:** Users should be able to view their Dashboard, Notes, and Downloaded Courses without internet.
    -   **Local DB:** Use Room (Android) and CoreData (iOS) as the single source of truth. The app reads from local DB immediately (0ms latency/skeleton screens) and syncs with Firestore in the background.

4.  **Handling "Simulations" (The 'Simulate' in Edusimulate):**
    -   **High-Fidelity 3D:** Where possible, map web 3D experiences to native `SceneView` (Android) or `SceneKit` (iOS) for GPU-accelerated performance.
    -   **Isolated Web Modules:** Only when absolutely necessary (e.g., highly custom JS physics simulations), utilize a strictly scoped, headless WebView to run the logic while keeping the UI controls native.

## 2. Architecture Overview
To ensure code maintainability and testability, all apps will follow **Clean Architecture** with **MVVM (Model-View-ViewModel)**.

-   **Domain Layer (Shared Logic Concept):** Entities and Use Cases (Business Logic).
-   **Data Layer:** Repositories, Data Sources (Firebase, API wrappers).
-   **Presentation Layer:** UI (Views) and ViewModels.

## 2. Technology Stack

| Feature | Android | iOS | Windows |
| :--- | :--- | :--- | :--- |
| **Language** | Kotlin | Swift | C# |
| **UI Framework** | Jetpack Compose (Material 3) | SwiftUI | WinUI 3 (Windows App SDK) |
| **Dependency Injection** | Hilt | Swift Dependency Injection (or Factory pattern) | DependencyInjection (Microsoft.Extensions) |
| **Asynchronous** | Coroutines & Flow | Swift Concurrency (async/await) | Task Parallel Library (TPL) async/await |
| **Database** | Firebase Firestore SDK / Room (Local Cache) | Firebase Firestore SDK / CoreData (Local Cache) | Firebase C# SDK (or REST) / SQLite |
| **Image Loading** | Coil | Kingfisher | WinUI ImageSource / CommunityToolkit |
| **Video Player** | Media3 (ExoPlayer) | AVPlayer | MediaPlayerElement |

## 3. Data Layer & API Mapping

### Backend Services
-   **Authentication:** 
    -   *Web:* `firebase/auth` 
    -   *Native:* Firebase Auth SDK (Google Sign-In, Email/Password).
-   **Database:** 
    -   *Web:* `firebase/firestore`
    -   *Native:* Firebase Firestore SDK. Maps directly to `types.ts` models (`User`, `Course`, `Lecture`).
-   **Storage:** 
    -   *Web:* `firebase/storage`, ImgBB.
    -   *Native:* Firebase Storage SDK. ImgBB API via HTTP client (Retrofit/Alamofire/HttpClient).
-   **Payments:**
    -   *Web:* Razorpay Web SDK.
    -   *Native:* Razorpay Android/iOS SDKs. (Windows: Web view or link to billing portal).

### Key Data Models (Parity with `types.ts`)
-   **User:** Syncs `uid`, `email`, `enrolledCourses`, `progress`.
-   **Course:** content hierarchy (Sections -> Lectures).
-   **Note:** Rich text content. *Android:* Jetpack Compose RichText. *iOS:* TextKit.

## 4. Feature Implementation Strategy

### A. Course Player (Core)
-   **Requirement:** Play HLS streams and Vimeo videos. Support progress tracking.
-   **Android:** 
    -   Use **ExoPlayer** for HLS.
    -   For Vimeo, fetch mp4 links via API or embed WebView (native playback preferred if links available).
-   **iOS:** AVPlayer.
-   **Windows:** MediaPlayerElement.

### B. Live Chat & Community
-   **Requirement:** Real-time messages.
-   **Implementation:** Firestore `onSnapshot` listeners (real-time updates).
-   **UI:** 
    -   *Android:* `LazyColumn` with reverse layout.
    -   *iOS:* `ScrollView` with `LazyVStack`.

### C. Notes (Offline First)
-   **Requirement:** Create/Edit notes, sync when online.
-   **Strategy:** 
    -   Local Database (Room/CoreData/SQLite) as single source of truth.
    -   Worker (WorkManager/BGTaskScheduler) syncs changes to Firestore.

### D. Audio/Video Calls (WebRTC)
-   **Requirement:** Peer-to-peer calling.
-   **Android:** Google WebRTC library.
-   **iOS:** WebRTC framework.
-   **Windows:** Microsoft.MixedReality.WebRTC.

## 5. Android Specific Plan (Kotlin)
**Phase 1: Setup & Auth**
-   Initialize `Hilt`, `NavHost` (Compose Navigation).
-   Implement Login/Register screens.

**Phase 2: Main Dashboard & Course Listing**
-   `Scaffold` with `NavigationBar` (Bottom Nav).
-   Home Screen: `LazyVerticalGrid` for courses.

**Phase 3: Player & Learning**
-   Detail Screen: `ConstraintLayout` (Compose).
-   Player Activity: Generic `AndroidView` wrapping `PlayerView`.

## 6. Next Steps
1.  **Set up the Git Repositories:** One for each platform.
2.  **Initialize Android Project:** standard "Empty Compose Activity".
3.  **Port Types:** Convert `types.ts` interfaces to Kotlin Data Classes.
