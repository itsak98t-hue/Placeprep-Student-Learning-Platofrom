/* eslint-disable no-console */
import fs from "fs"
import path from "path"
import admin from "firebase-admin"

function loadEnvFile(filePath: string) {
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
  throw new Error("Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY for scripts/seed.ts")
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
    order: 1,
    topics: [
      "arrays",
      "strings",
      "linked-lists",
      "stacks",
      "queues",
      "binary-search",
      "hashing",
      "sliding-window",
      "two-pointers",
      "sorting",
      "recursion",
      "backtracking",
      "trees",
      "bst",
      "heaps",
      "greedy",
      "dynamic-programming",
      "graphs",
      "trie",
      "bit-manipulation",
      "math",
      "prefix-sum",
      "intervals",
      "union-find",
    ],
  },
  { id: "aptitude", label: "Aptitude", totalTopics: 18, icon: "calculator", order: 2, topics: ["percentages", "profit-loss", "time-work", "time-speed-distance", "probability", "permutation-combination", "averages", "ratios", "number-system", "simple-interest", "compound-interest", "mixtures", "puzzles", "data-interpretation", "logical-reasoning", "series", "clocks-calendars", "mensuration"] },
  { id: "dbms", label: "DBMS", totalTopics: 12, icon: "database", order: 3, topics: ["er-model", "normalization", "sql-basics", "joins", "indexing", "transactions", "acid", "concurrency-control", "deadlocks", "views", "stored-procedures", "query-optimization"] },
  { id: "os", label: "OS", totalTopics: 10, icon: "cpu", order: 4, topics: ["processes-threads", "scheduling", "synchronization", "semaphores", "deadlocks", "memory-management", "paging", "virtual-memory", "file-systems", "system-calls"] },
  { id: "oops", label: "OOPs", totalTopics: 14, icon: "layers", order: 5, topics: ["classes-objects", "inheritance", "polymorphism", "encapsulation", "abstraction", "interfaces", "method-overloading", "method-overriding", "access-modifiers", "constructors", "solid-principles", "composition", "association", "exception-handling"] },
  { id: "behavioral_hr", label: "Behavioral HR", totalTopics: 16, icon: "users", order: 6, topics: ["leadership", "teamwork", "conflict", "failure", "initiative", "pressure", "communication", "ambiguity", "ownership", "challenge", "career-goals", "strengths", "weaknesses", "motivation", "adaptability", "decision-making"] },
  { id: "cn", label: "Computer Networks", totalTopics: 10, icon: "wifi", order: 7, topics: ["osi-model", "tcp-ip", "http-https", "dns", "routing", "switching", "congestion-control", "flow-control", "sockets", "network-security"] },
  { id: "system_design", label: "System Design", totalTopics: 8, icon: "server", order: 8, topics: ["load-balancing", "caching", "databases-at-scale", "queues", "microservices", "rate-limiting", "sharding", "observability"] },
]

const companies = [
  { id: "google", name: "Google", logoUrl: "/logos/google.png", difficulty: "hard", avgPackageLPA: 45, requiredCourseIds: ["dsa", "os", "oops", "system_design"], focusAreas: ["Algorithms", "System Design", "Distributed Systems"], openRoles: ["SWE", "SDE-2", "Data Engineer"], tips: "Focus on graph algorithms, system design at scale, and OS fundamentals.", order: 1 },
  { id: "microsoft", name: "Microsoft", logoUrl: "/logos/microsoft.png", difficulty: "hard", avgPackageLPA: 38, requiredCourseIds: ["dsa", "oops", "dbms", "os"], focusAreas: ["OOP Design", "Data Structures", "Cloud"], openRoles: ["SDE-1", "SDE-2", "PM"], tips: "Strong emphasis on OOP design patterns and behavioral rounds.", order: 2 },
  { id: "amazon", name: "Amazon", logoUrl: "/logos/amazon.png", difficulty: "hard", avgPackageLPA: 32, requiredCourseIds: ["dsa", "behavioral_hr", "system_design"], focusAreas: ["Leadership Principles", "Algorithms", "System Design"], openRoles: ["SDE-1", "SDE-2", "Solutions Architect"], tips: "Leadership principles are as important as coding. Practice STAR format.", order: 3 },
  { id: "flipkart", name: "Flipkart", logoUrl: "/logos/flipkart.png", difficulty: "medium", avgPackageLPA: 24, requiredCourseIds: ["dsa", "dbms", "oops"], focusAreas: ["DSA", "Database Design", "Backend"], openRoles: ["SDE-1", "Backend Engineer"], tips: "Heavy DSA and DB design. Watch for SQL query optimization questions.", order: 4 },
  { id: "adobe", name: "Adobe", logoUrl: "/logos/adobe.png", difficulty: "medium", avgPackageLPA: 28, requiredCourseIds: ["dsa", "oops", "cn"], focusAreas: ["DSA", "OOP", "Networking"], openRoles: ["SWE", "Product Engineer"], tips: "Strong focus on clean code and OOP principles.", order: 5 },
  { id: "uber", name: "Uber", logoUrl: "/logos/uber.png", difficulty: "medium", avgPackageLPA: 30, requiredCourseIds: ["dsa", "system_design", "os"], focusAreas: ["Distributed Systems", "Real-time Systems", "Algorithms"], openRoles: ["SWE", "SDE-2", "Infrastructure"], tips: "Focus on real-time data handling and distributed system design.", order: 6 },
  { id: "zomato", name: "Zomato", logoUrl: "/logos/zomato.png", difficulty: "medium", avgPackageLPA: 20, requiredCourseIds: ["dsa", "dbms", "behavioral_hr"], focusAreas: ["DSA", "Databases", "Product Sense"], openRoles: ["SDE-1", "Full Stack", "Data Analyst"], tips: "Product thinking matters. Know SQL and basic system design.", order: 7 },
  { id: "paytm", name: "Paytm", logoUrl: "/logos/paytm.png", difficulty: "medium", avgPackageLPA: 18, requiredCourseIds: ["dsa", "dbms", "cn"], focusAreas: ["DSA", "Networking", "Payments Systems"], openRoles: ["SDE-1", "Backend Engineer"], tips: "Fintech domain knowledge is a plus. Strong backend and DB skills needed.", order: 8 },
  { id: "oracle", name: "Oracle", logoUrl: "/logos/oracle.png", difficulty: "medium", avgPackageLPA: 25, requiredCourseIds: ["dbms", "oops", "dsa"], focusAreas: ["Database Internals", "OOP", "Java"], openRoles: ["SDE-1", "Database Engineer"], tips: "Oracle heavily tests SQL, PL/SQL and DB internals.", order: 9 },
  { id: "infosys", name: "Infosys", logoUrl: "/logos/infosys.png", difficulty: "easy", avgPackageLPA: 8, requiredCourseIds: ["aptitude", "dsa", "behavioral_hr"], focusAreas: ["Aptitude", "Verbal", "Basic Coding"], openRoles: ["Systems Engineer", "Technology Analyst"], tips: "Verbal and quantitative aptitude is heavily weighted in screening.", order: 10 },
  { id: "tcs", name: "TCS", logoUrl: "/logos/tcs.png", difficulty: "easy", avgPackageLPA: 7, requiredCourseIds: ["aptitude", "behavioral_hr"], focusAreas: ["Aptitude", "Communication", "Coding Basics"], openRoles: ["Assistant System Engineer", "Developer"], tips: "Focus on NQT pattern: numerical, verbal, reasoning, and coding sections.", order: 11 },
  { id: "wipro", name: "Wipro", logoUrl: "/logos/wipro.png", difficulty: "easy", avgPackageLPA: 7, requiredCourseIds: ["aptitude", "dsa", "behavioral_hr"], focusAreas: ["Aptitude", "Basic DSA", "HR"], openRoles: ["Project Engineer", "Software Developer"], tips: "WILP and NLTH patterns. Good communication is highly valued.", order: 12 },
]

async function seedCollection<T extends { id: string }>(collectionName: string, items: T[]) {
  const batch = db.batch()
  items.forEach((item) => {
    batch.set(db.collection(collectionName).doc(item.id), item, { merge: true })
  })
  await batch.commit()
  console.log(`Seeded ${items.length} documents into ${collectionName}`)
}

async function run() {
  await seedCollection("courses", courses)
  await seedCollection("companies", companies)
  console.log("Seed complete.")
}

run().catch((error) => {
  console.error("Seed failed:", error)
  process.exit(1)
})
