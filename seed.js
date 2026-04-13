/* eslint-disable no-console */
const fs = require("fs")
const path = require("path")
const admin = require("firebase-admin")

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return
  }

  const raw = fs.readFileSync(filePath, "utf8")
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) {
      return
    }

    const separatorIndex = trimmed.indexOf("=")
    if (separatorIndex === -1) {
      return
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "")
    if (!process.env[key]) {
      process.env[key] = value
    }
  })
}

loadEnvFile(path.join(process.cwd(), ".env.local"))
loadEnvFile(path.join(process.cwd(), ".env"))

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY for seed.js")
  process.exit(1)
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  })
}

const db = admin.firestore()

const courses = [
  {
    id: "dsa",
    label: "DSA",
    totalTopics: 24,
    icon: "code",
    topics: [
      "Arrays",
      "Strings",
      "Linked Lists",
      "Stacks",
      "Queues",
      "Binary Search",
      "Hashing",
      "Sliding Window",
      "Two Pointers",
      "Sorting",
      "Recursion",
      "Backtracking",
      "Trees",
      "BST",
      "Heaps",
      "Greedy",
      "Dynamic Programming",
      "Graphs",
      "Trie",
      "Bit Manipulation",
      "Math",
      "Prefix Sum",
      "Intervals",
      "Union Find",
    ],
  },
  {
    id: "aptitude",
    label: "Aptitude",
    totalTopics: 18,
    icon: "calculator",
    topics: [
      "Percentages",
      "Profit and Loss",
      "Time and Work",
      "Time Speed Distance",
      "Probability",
      "Permutation and Combination",
      "Averages",
      "Ratios",
      "Number System",
      "Simple Interest",
      "Compound Interest",
      "Mixtures",
      "Puzzles",
      "Data Interpretation",
      "Logical Reasoning",
      "Series",
      "Clocks and Calendars",
      "Mensuration",
    ],
  },
  {
    id: "dbms",
    label: "DBMS",
    totalTopics: 12,
    icon: "database",
    topics: [
      "ER Model",
      "Normalization",
      "SQL Basics",
      "Joins",
      "Indexing",
      "Transactions",
      "ACID",
      "Concurrency Control",
      "Deadlocks",
      "Views",
      "Stored Procedures",
      "Query Optimization",
    ],
  },
  {
    id: "os",
    label: "OS",
    totalTopics: 10,
    icon: "cpu",
    topics: [
      "Processes and Threads",
      "Scheduling",
      "Synchronization",
      "Semaphores",
      "Deadlocks",
      "Memory Management",
      "Paging",
      "Virtual Memory",
      "File Systems",
      "System Calls",
    ],
  },
  {
    id: "oops",
    label: "OOPs",
    totalTopics: 14,
    icon: "layers",
    topics: [
      "Classes and Objects",
      "Inheritance",
      "Polymorphism",
      "Encapsulation",
      "Abstraction",
      "Interfaces",
      "Method Overloading",
      "Method Overriding",
      "Access Modifiers",
      "Constructors",
      "SOLID Principles",
      "Composition",
      "Association",
      "Exception Handling",
    ],
  },
  {
    id: "behavioral_hr",
    label: "Behavioral HR",
    totalTopics: 16,
    icon: "users",
    topics: [
      "Leadership",
      "Teamwork",
      "Conflict",
      "Failure",
      "Initiative",
      "Pressure",
      "Communication",
      "Ambiguity",
      "Ownership",
      "Challenge",
      "Career Goals",
      "Strengths",
      "Weaknesses",
      "Motivation",
      "Adaptability",
      "Decision Making",
    ],
  },
  {
    id: "cn",
    label: "Computer Networks",
    totalTopics: 10,
    icon: "wifi",
    topics: [
      "OSI Model",
      "TCP IP",
      "HTTP HTTPS",
      "DNS",
      "Routing",
      "Switching",
      "Congestion Control",
      "Flow Control",
      "Sockets",
      "Network Security",
    ],
  },
  {
    id: "system_design",
    label: "System Design",
    totalTopics: 8,
    icon: "server",
    topics: [
      "Load Balancing",
      "Caching",
      "Databases at Scale",
      "Queues",
      "Microservices",
      "Rate Limiting",
      "Sharding",
      "Observability",
    ],
  },
]

const companies = [
  { id: "google", name: "Google", logo: "/logos/google.png", requiredCourses: ["dsa", "oops", "os", "dbms"], focusAreas: ["Algorithms", "System Design", "Coding"], difficulty: "hard", avgPackageLPA: 45, openRoles: ["SWE", "SDE-2", "Data Engineer"], tips: "Focus on graph algorithms and system design at scale." },
  { id: "microsoft", name: "Microsoft", logo: "/logos/microsoft.png", requiredCourses: ["dsa", "oops", "system_design"], focusAreas: ["Coding", "Design", "Collaboration"], difficulty: "hard", avgPackageLPA: 38, openRoles: ["SDE", "Intern", "Cloud Engineer"], tips: "Practice core DSA plus clean communication for design trade-offs." },
  { id: "amazon", name: "Amazon", logo: "/logos/amazon.png", requiredCourses: ["dsa", "system_design", "behavioral_hr"], focusAreas: ["DSA", "Leadership Principles", "Scalability"], difficulty: "hard", avgPackageLPA: 32, openRoles: ["SDE-1", "SDE-2", "Applied Scientist"], tips: "Pair coding prep with ownership-heavy behavioral answers." },
  { id: "flipkart", name: "Flipkart", logo: "/logos/flipkart.png", requiredCourses: ["dsa", "dbms", "cn"], focusAreas: ["Problem Solving", "Backend", "Data"], difficulty: "medium", avgPackageLPA: 24, openRoles: ["SDE", "Backend Engineer"], tips: "Review API design, data modeling, and commerce use cases." },
  { id: "infosys", name: "Infosys", logo: "/logos/infosys.png", requiredCourses: ["aptitude", "oops", "behavioral_hr"], focusAreas: ["Aptitude", "Fundamentals", "Communication"], difficulty: "easy", avgPackageLPA: 8, openRoles: ["Systems Engineer", "Analyst"], tips: "Sharpen aptitude speed and basic CS fundamentals." },
  { id: "tcs", name: "TCS", logo: "/logos/tcs.png", requiredCourses: ["aptitude", "oops", "dbms"], focusAreas: ["Aptitude", "Basics", "Project Clarity"], difficulty: "easy", avgPackageLPA: 7, openRoles: ["Ninja", "Digital", "Prime"], tips: "Stay consistent with aptitude drills and concise project storytelling." },
  { id: "wipro", name: "Wipro", logo: "/logos/wipro.png", requiredCourses: ["aptitude", "oops", "cn"], focusAreas: ["Reasoning", "Core CS", "Behavioral"], difficulty: "easy", avgPackageLPA: 7, openRoles: ["Project Engineer", "Developer"], tips: "Keep answers structured and fundamentals crisp." },
  { id: "adobe", name: "Adobe", logo: "/logos/adobe.png", requiredCourses: ["dsa", "system_design", "dbms"], focusAreas: ["DSA", "Scalability", "Quality"], difficulty: "medium", avgPackageLPA: 28, openRoles: ["MTS", "Frontend Engineer", "Backend Engineer"], tips: "Expect medium-hard DSA plus design depth for product quality." },
  { id: "uber", name: "Uber", logo: "/logos/uber.png", requiredCourses: ["dsa", "system_design", "cn"], focusAreas: ["Algorithms", "Distributed Systems", "Optimization"], difficulty: "medium", avgPackageLPA: 30, openRoles: ["Software Engineer", "Platform Engineer"], tips: "Practice graph/pathfinding and scalability trade-offs." },
  { id: "zomato", name: "Zomato", logo: "/logos/zomato.png", requiredCourses: ["dsa", "dbms", "behavioral_hr"], focusAreas: ["Backend", "Product Sense", "Execution"], difficulty: "medium", avgPackageLPA: 20, openRoles: ["SDE", "Product Engineer"], tips: "Anchor answers in user impact and delivery speed." },
  { id: "paytm", name: "Paytm", logo: "/logos/paytm.png", requiredCourses: ["dsa", "dbms", "cn"], focusAreas: ["Backend", "Payments", "Reliability"], difficulty: "medium", avgPackageLPA: 18, openRoles: ["SDE", "Payments Engineer"], tips: "Brush up on transaction safety and reliability under load." },
  { id: "oracle", name: "Oracle", logo: "/logos/oracle.png", requiredCourses: ["dbms", "dsa", "system_design"], focusAreas: ["Databases", "Distributed Systems", "Core CS"], difficulty: "medium", avgPackageLPA: 25, openRoles: ["Applications Engineer", "Database Engineer"], tips: "Lean into SQL depth, transactions, and scalable systems." },
]

async function seedCollection(collectionName, items) {
  const batch = db.batch()
  items.forEach((item) => {
    batch.set(db.collection(collectionName).doc(item.id), item, { merge: true })
  })
  await batch.commit()
  console.log(`Seeded ${items.length} documents into ${collectionName}`)
}

async function seedSampleProgress() {
  const sampleUserId = process.env.SAMPLE_USER_ID
  if (!sampleUserId) {
    console.log("No SAMPLE_USER_ID provided. Skipping sample user progress.")
    return
  }

  const userRef = db.collection("users").doc(sampleUserId)
  await userRef.set(
    {
      displayName: "Sample Student",
      email: "sample@placeprep.ai",
      tier: "Tier 2",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      streak: 5,
      lastActiveDate: new Date().toISOString().split("T")[0],
    },
    { merge: true }
  )

  const progressBatch = db.batch()
  courses.forEach((course, index) => {
    const topicsCompleted = course.topics
      .slice(0, Math.min(course.topics.length, 2 + index))
      .map((topic) => topic.toLowerCase().replace(/\s+/g, "-"))
    const scores = topicsCompleted.map((_, scoreIndex) => 60 + scoreIndex * 6 + (index % 4) * 3)

    progressBatch.set(
      userRef.collection("progress").doc(course.id),
      {
        courseId: course.id,
        topicsCompleted,
        totalTopics: course.totalTopics,
        scores,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        status: scores.length >= 3 && scores[scores.length - 1] > scores[0] ? "improving" : "in-progress",
      },
      { merge: true }
    )
  })

  await progressBatch.commit()
  console.log(`Seeded sample progress for ${sampleUserId}`)
}

async function run() {
  await seedCollection("courses", courses)
  await seedCollection("companies", companies)
  await seedSampleProgress()
  console.log("Seeding complete.")
}

run().catch((error) => {
  console.error("Seed failed:", error)
  process.exit(1)
})
