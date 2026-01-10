/**
 * seed.js
 * Firestore seeder for Edusimulate sample data.
 *
 * Usage:
 *  node seed.js [path/to/serviceKey.json]
 *  - or -
 *  SERVICE_KEY=./serviceKey.json node seed.js
 *
 * This script will:
 *  - create 'admins/{uid}' documents
 *  - create sample course documents under 'courses/{courseId}'
 *  - create a 'doubts' subcollection for each course
 *  - create a sample user document under 'users/{uid}'
 *
 * Schema reference used: Firestore Data Structure for CourseLearnPage.
 */

import { createRequire } from "module";
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const fs = require("fs");
// const path = require("path"); // Remove require(path) since we import it

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const admin = require("firebase-admin");

async function main() {
  try {
    // resolve service key path from CLI arg or environment variable
    const keyArg = process.argv[2] || process.env.SERVICE_KEY || "./serviceKey.json";
    const keyPath = path.resolve(keyArg);

    if (!fs.existsSync(keyPath)) {
      console.error(`ERROR: service key not found at: ${keyPath}`);
      console.error("Provide path as first arg or set SERVICE_KEY env var.");
      process.exit(1);
    }

    const serviceAccount = require(keyPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    const db = admin.firestore();
    const FieldValue = admin.firestore.FieldValue;



    // Safety check
    if (!process.argv.includes('--force')) {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      await new Promise((resolve) => {
        readline.question('⚠️  WARNING: This will overwrite database data. Are you sure? (y/N) ', (ans) => {
          readline.close();
          if (ans.trim().toLowerCase() !== 'y') {
            console.log('Aborted.');
            process.exit(0);
          }
          resolve();
        });
      });
    }

    console.log("🚀 Starting database seed...");

    // --- 1. ADMINS ---
    const admins = [
      {
        uid: "admin_user_1",
        email: "admin@edusimulate.com",
        name: "Super Admin",
        role: "super_admin",
        createdAt: FieldValue.serverTimestamp(),
      },
      // Add your real admin UID here if known, e.g.:
      // { uid: "YOUR_REAL_FIREBASE_UID", ... }
    ];

    console.log(`Creating ${admins.length} admin records...`);
    for (const a of admins) {
      await db.collection("admins").doc(a.uid).set(a, { merge: true });
      console.log(`  -> Admin seeded: ${a.uid}`);
    }

    // --- 2. COURSES ---
    const courses = [
      ...(() => {
        try {
          const migratedPath = path.resolve(__dirname, "../src/data/migrated_course.json");
          if (fs.existsSync(migratedPath)) {
            const migratedData = JSON.parse(fs.readFileSync(migratedPath, "utf8"));

            // Ensure top-level lectures array is populated (required for UI "Start Learning" button)
            if ((!migratedData.lectures || migratedData.lectures.length === 0) && migratedData.sections && migratedData.sections.length > 0) {
              console.log("  -> Populating top-level lectures from sections...");
              migratedData.lectures = migratedData.sections.flatMap(section => section.lectures);
            }

            // Ensure category is set (fixes empty badge in Dashboard)
            if (!migratedData.category) {
              migratedData.category = "Mathematics";
            }

            console.log("  -> Loaded migrated course:", migratedData.title);
            console.log(`     - Sections: ${migratedData.sections?.length || 0}`);
            console.log(`     - Total Lectures: ${migratedData.lectures?.length || 0}`);
            console.log(`     - Resources: ${migratedData.resources?.length || 0}`);

            return [migratedData];
          }
          return [];
        } catch (e) {
          console.error("Failed to load migrated course:", e);
          return [];
        }
      })(),
      {
        id: "cpp_basics",
        title: "C++ Basics Complete",
        category: "Programming",
        description: "Master C++ from scratch to advanced topics like Smart Pointers and Multithreading.",
        longDescription:
          "A comprehensive modular course designed to take you from absolute beginner to professional C++ developer. Covers syntax, OOP, memory management, STL, and modern C++20 features across 3 structured phases.",
        learningOutcomes: [
          "Master C++ Syntax & Control Flow",
          "Understand Pointers, References & Memory Management",
          "Build scalable apps with OOP & Design Patterns",
          "Utilize STL Containers & Algorithms",
          "Implement Advanced Features: Templates, Threads & Smart Pointers"
        ],
        thumbnail: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&q=80",
        progress: 0,
        totalDuration: "12h 30m",
        rating: 4.8,
        studentCount: 1205,
        isPublished: true,
        resources: [
          {
            id: "r1",
            name: "C++ Cheat Sheet",
            type: "PDF",
            size: "1.2MB",
            url: "https://example.com/resources/cpp_cheat_sheet.pdf",
          },
          {
            id: "r2",
            name: "Starter Code",
            type: "ZIP",
            size: "500KB",
            url: "https://example.com/resources/cpp_starter.zip",
          },
        ],
        sections: [
          {
            title: "Phase 1: Beginner – Fundamentals",
            lectures: [
              {
                id: "lec_cpp_intro",
                title: "Introduction and Setup",
                duration: "5m",
                videoUrl: "https://www.youtube.com/embed/OTroAxvRNbw",
                summary: "Quick overview of what C++ is, why use it, and basic setup. Great for motivation.",
                isCompleted: false,
                isPreview: true,
              },
              {
                id: "lec_cpp_vars",
                title: "Variables and Data Types",
                duration: "14m",
                videoUrl: "https://www.youtube.com/embed/2I0XkuGqik4",
                summary: "Explains storage, types (int, float, etc.), and common pitfalls visually.",
                isCompleted: false,
                isPreview: false,
              },
              {
                id: "lec_cpp_control",
                title: "Control Structures (If/Else, Loops)",
                duration: "12m",
                videoUrl: "https://www.youtube.com/embed/HT3q2G4GGm0",
                summary: "Hands-on examples with if statements, for/while loops, and switch.",
                isCompleted: false,
              },
              {
                id: "lec_cpp_funcs",
                title: "Functions",
                duration: "10m",
                videoUrl: "https://www.youtube.com/embed/9RHO6jU--3M",
                summary: "Covers parameters, returns, and scope simply; builds directly on variables.",
                isCompleted: false,
              },
              {
                id: "lec_cpp_arrays",
                title: "Arrays and Strings",
                duration: "15m",
                videoUrl: "https://www.youtube.com/embed/0_IZyPoa5oM",
                summary: "Practical intro to storing lists and manipulating text.",
                isCompleted: false,
              }
            ],
          },
          {
            title: "Phase 2: Intermediate – Core Features",
            lectures: [
              {
                id: "lec_cpp_pointers",
                title: "Pointers and References",
                duration: "13m",
                videoUrl: "https://www.youtube.com/embed/UfShX1uMnUw",
                summary: "Demystifies addresses vs. values with diagrams—essential for avoiding leaks.",
                isCompleted: false,
              },
              {
                id: "lec_cpp_classes",
                title: "Classes and Objects",
                duration: "18m",
                videoUrl: "https://www.youtube.com/embed/6dz7tJhZf5k",
                summary: "Step-by-step OOP intro with real-world analogies.",
                isCompleted: false,
              },
              {
                id: "lec_cpp_inheritance",
                title: "Inheritance and Polymorphism",
                duration: "16m",
                videoUrl: "https://www.youtube.com/embed/XXS53bV4k1c",
                summary: "Explains is-a relationships and virtual functions cleanly.",
                isCompleted: false,
              },
              {
                id: "lec_cpp_stl",
                title: "STL Containers (Vectors, Maps)",
                duration: "45m",
                videoUrl: "https://www.youtube.com/embed/VRGRTvfOxb4",
                summary: "Deep dive into std::vector usage from CppCon 2024.",
                isCompleted: false,
              }
            ],
          },
          {
            title: "Phase 3: Advanced – Modern and Professional",
            lectures: [
              {
                id: "lec_cpp_templates",
                title: "Templates",
                duration: "12m",
                videoUrl: "https://www.youtube.com/embed/5P4lVTVbZ9A",
                summary: "Generic programming basics with examples—unlocks reusable code.",
                isCompleted: false,
              },
              {
                id: "lec_cpp_smart_ptr",
                title: "Smart Pointers",
                duration: "60m",
                videoUrl: "https://www.youtube.com/embed/xGDLkt-jBJ4",
                summary: "Comprehensive on unique/shared_ptr for memory safety.",
                isCompleted: false,
              },
              {
                id: "lec_cpp_threads",
                title: "Multithreading",
                duration: "55m",
                videoUrl: "https://www.youtube.com/embed/2q37AAxF8pY",
                summary: "Threads, mutexes, and async—practical for parallel apps.",
                isCompleted: false,
              },
              {
                id: "lec_cpp_patterns",
                title: "Design Patterns",
                duration: "60m",
                videoUrl: "https://www.youtube.com/embed/jBnIMEb2GhA",
                summary: "Explores polymorphism patterns deeply—helps design scalable systems.",
                isCompleted: false,
              },
              {
                id: "lec_cpp_modern",
                title: "Modern Features (Friendship, Refactoring)",
                duration: "57m",
                videoUrl: "https://www.youtube.com/embed/T08YxaCG_OY",
                summary: "Fresh 2025 take on access control and code maintenance.",
                isCompleted: false,
              }
            ],
          }
        ],
        simulations: [
          {
            id: "sim_memory",
            title: "Memory Visualizer",
            description: "Interact with the stack and heap in real-time.",
            thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&q=80",
            launchUrl: "https://sim.example.com/memory",
            type: "3D",
          },
        ],
      },
      {
        id: "web_dev_bootcamp",
        title: "Complete Web Dev Bootcamp: Basics to Advanced",
        category: "Web Development",
        description: "Master full-stack web development: HTML/CSS/JS, React, Node.js, and MongoDB.",
        longDescription: "A complete zero-to-hero bootcamp curated from top industry resources. Master the modern web stack starting with static HTML/CSS, moving to dynamic React frontends, and finishing with robust Node.js/MongoDB backends. Build real production-ready applications.",
        learningOutcomes: [
          "Build responsive websites with HTML5 & CSS3 (Flexbox/Grid)",
          "Master modern JavaScript (ES2025+) mechanics",
          "Create interactive UIs with React 19 & Hooks",
          "Develop RESTful APIs with Node.js & Express",
          "Manage data with MongoDB & Mongoose"
        ],
        thumbnail: "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&q=80",
        progress: 0,
        totalDuration: "15h 20m",
        rating: 4.9,
        studentCount: 3420,
        isPublished: true,
        resources: [
          {
            id: "r_wd_1",
            name: "VS Code Setup Guide",
            type: "PDF",
            size: "2.1MB",
            url: "https://example.com/resources/vscode_setup.pdf",
          },
          {
            id: "r_wd_2",
            name: "Final Project Assets",
            type: "ZIP",
            size: "15MB",
            url: "https://example.com/resources/project_assets.zip",
          }
        ],
        sections: [
          {
            title: "Phase 1: Beginner – Core Frontend",
            lectures: [
              {
                id: "wd_html",
                title: "HTML Fundamentals",
                duration: "31m",
                videoUrl: "https://www.youtube.com/embed/Gs5yi3Hi5qo",
                summary: "Covers semantic tags, forms, and accessibility from scratch. A perfect intro with modern best practices.",
                isCompleted: false,
                isPreview: true,
              },
              {
                id: "wd_css",
                title: "CSS Styling and Layouts",
                duration: "45m",
                videoUrl: "https://www.youtube.com/embed/QeslNHmTObk",
                summary: "Hands-on Flexbox/Grid, responsive design, and animations. Essential for mobile-first sites.",
                isCompleted: false,
                isPreview: false,
              },
              {
                id: "wd_js_basics",
                title: "JavaScript Basics",
                duration: "120m",
                videoUrl: "https://www.youtube.com/embed/ogdtB_m6G5g",
                summary: "Variables, Loops, Functions. Simple explanations with console demos. Builds a basic calculator.",
                isCompleted: false,
              }
            ],
          },
          {
            title: "Phase 2: Intermediate – Dynamic Frontend (React)",
            lectures: [
              {
                id: "wd_react_state",
                title: "React Components and State",
                duration: "20m",
                videoUrl: "https://www.youtube.com/embed/OA5JAmTcTz4",
                summary: "Quick setup with props and hooks. Great for transitioning from vanilla JS without boilerplate overwhelm.",
                isCompleted: false,
              },
              {
                id: "wd_react_hooks",
                title: "React Hooks and Routing",
                duration: "90m",
                videoUrl: "https://www.youtube.com/embed/TtPXvEcE11E",
                summary: "Deep dive into useState/useEffect and React Router. Includes building a Todo app.",
                isCompleted: false,
              }
            ],
          },
          {
            title: "Phase 3: Advanced – Backend and Full-Stack",
            lectures: [
              {
                id: "wd_node",
                title: "Node.js and Express Setup",
                duration: "60m",
                videoUrl: "https://www.youtube.com/embed/yGl3f0xTl_0",
                summary: "From npm init to REST APIs. Covers middleware and error handling for MERN stack starters.",
                isCompleted: false,
              },
              {
                id: "wd_mongo",
                title: "MongoDB for Web Apps",
                duration: "120m",
                videoUrl: "https://www.youtube.com/embed/Zndy6PfyLLM",
                summary: "CRUD ops, schemas with Mongoose, and aggregation. Integrates directly with Node.",
                isCompleted: false,
              },
              {
                id: "wd_mern",
                title: "Full-Stack MERN Project",
                duration: "120m",
                videoUrl: "https://www.youtube.com/embed/LzMnsfqjzkA",
                summary: "Build a complete blog app with React, Node, and MongoDB. Covers Auth (JWT) and deployment.",
                isCompleted: false,
              }
            ],
          }
        ],
        simulations: [],
      },
    ];

    // --- 3. SUBCOLLECTIONS (DOUBTS) ---
    const sampleDoubts = [
      {
        userId: "demo_user",
        userName: "Demo Student",
        userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
        question: "Why do we need a semi-colon here?",
        lectureId: "lec_cpp_vars",
        status: "unresolved",
        replies: [],
      },
      {
        userId: "demo_user",
        userName: "Demo Student",
        userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
        question: "Can I use flexbox for everything?",
        lectureId: "lec_css_1",
        status: "resolved",
        replies: [
          {
            id: "rep_1",
            user: { name: "Instructor", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" },
            text: "Technically yes, but Grid is better for 2D layouts!",
            timestamp: new Date().toISOString()
          }
        ],
      },
    ];

    // --- 4. USERS ---
    const users = [
      {
        uid: "demo_user",
        email: "student@edusimulate.com",
        name: "Demo Student",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
        level: 5,
        points: 450,
        streak: 3,
        role: "student",
        enrolledCourses: ["cpp_basics", "web_dev_bootcamp"],
        ongoingCourses: ["cpp_basics"],
        completedChallenges: 2,
        wishlist: [],
        pendingTasks: [
          { id: "task1", text: "Complete C++ Intro", dueDate: "2024-05-20", courseId: "cpp_basics", courseTitle: "C++ Basics" }
        ],
        progress: {
          cpp_basics: ["lec_cpp_intro_1"], // lecture ids completed
        },
        createdAt: FieldValue.serverTimestamp(),
      },
    ];

    // --- WRITE OPERATIONS ---

    // Write Courses
    const BATCH_SIZE = 400;
    let batch = db.batch();
    let opsInBatch = 0;

    console.log(`Creating ${courses.length} courses...`);
    for (const course of courses) {
      const ref = db.collection("courses").doc(course.id);
      batch.set(ref, course, { merge: true });
      opsInBatch++;

      if (opsInBatch >= BATCH_SIZE) {
        await batch.commit();
        batch = db.batch();
        opsInBatch = 0;
      }
    }
    if (opsInBatch > 0) await batch.commit();

    // Write Doubts (Subcollections)
    console.log("Adding sample doubts...");
    for (const course of courses) {
      const relatedDoubts = sampleDoubts.filter((d) =>
        course.sections.some((s) => s.lectures.some((l) => l.id === d.lectureId))
      );

      for (const doubt of relatedDoubts) {
        // Check if doubt already exists to avoid duplicates if re-seeding (optional, here we just add)
        // For a cleaner seed, you might delete existing doubts first, but 'add' generates new IDs.
        // We will just add for now.
        await db.collection("courses").doc(course.id).collection("doubts").add({
          ...doubt,
          timestamp: FieldValue.serverTimestamp(),
        });
      }
    }

    // Write Users
    console.log(`Creating ${users.length} users...`);
    for (const u of users) {
      const userRef = db.collection("users").doc(u.uid);
      await userRef.set(u, { merge: true });
    }

    console.log("✅ Seeding complete!");
    console.log("   - Admins created: Ensure UID matches your login to see Admin features.");
    console.log("   - Users created: 'demo_user' with enrolled courses.");
    console.log("   - Open Firebase Console to verify data.");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

main();

