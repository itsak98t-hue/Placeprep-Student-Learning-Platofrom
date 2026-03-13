import type { CompanyDetail } from "@/types/company"

export const companyDetails: CompanyDetail[] = [
  {
    name: "Google",
    slug: "google",
    tier: 1,
    roles: ["Software Engineer", "Product Manager", "Data Scientist"],
    openings: 12,
    salaryRange: "$150-180K",
    growth: 15,
    location: "Bengaluru, Hyderabad, Remote-friendly global teams",
    difficulty: "Very High",
    intro:
      "Google interviews emphasize structured problem solving, coding clarity, and communication. Candidates are expected to reason out loud and optimize thoughtfully instead of rushing to code.",
    overview: [
      "Google hires across backend, frontend, infrastructure, product, cloud, AI, and data roles.",
      "The company values strong computer science fundamentals and clean, scalable thinking.",
      "Behavioral evaluation often focuses on collaboration, ownership, and learning mindset.",
    ],
    eligibility: [
      "Strong DSA fundamentals with comfort in arrays, graphs, trees, and dynamic programming",
      "Solid CS basics in DBMS, OS, networking, and object-oriented design",
      "Clear communication and ability to explain tradeoffs under pressure",
    ],
    onlineAssessment: {
      format: "Often 1-2 coding questions with strict time pressure, though some campus or referral flows may skip OA.",
      topics: ["Arrays and strings", "Graphs", "Binary search", "Dynamic programming", "Greedy and intervals"],
      tips: [
        "Practice solving medium problems within 25-30 minutes.",
        "Narrate your assumptions and edge cases before coding.",
        "Always discuss time and space complexity before wrapping up.",
      ],
    },
    interviewRounds: [
      {
        title: "Technical Round 1",
        duration: "45-60 min",
        focus: "Core data structures and coding fluency",
        details: [
          "Expect one medium-to-hard problem with follow-up optimization.",
          "Interviewers usually probe brute force first, then guide toward better tradeoffs.",
        ],
      },
      {
        title: "Technical Round 2",
        duration: "45-60 min",
        focus: "Problem solving depth and edge-case handling",
        details: [
          "Common patterns include graphs, recursion, intervals, and search-space reduction.",
          "The round rewards clean reasoning more than memorized tricks.",
        ],
      },
      {
        title: "Googlyness / Behavioral",
        duration: "30-45 min",
        focus: "Collaboration, ambiguity handling, and ownership",
        details: [
          "Use STAR-format stories with measurable outcomes.",
          "Have examples around conflict resolution, leadership, and learning from failure ready.",
        ],
      },
      {
        title: "Team Match / Hiring Committee",
        duration: "Varies",
        focus: "Role alignment and final evaluation",
        details: [
          "This stage checks fit for the target team and level.",
          "Strong notes across earlier rounds matter a lot here.",
        ],
      },
    ],
    questionBank: [
      {
        title: "DSA",
        questions: [
          {
            question: "Given an array of integers and a target, return the indices of two numbers that add up to the target.",
            round: "Technical Round 1",
            difficulty: "Easy",
            whatToFocusOn: "Explain the brute-force approach first, then optimize with a hash map and discuss duplicate handling.",
            answerOutline: [
              "Start with O(n^2) pair checking to show baseline reasoning.",
              "Use a hash map from value to index while iterating once.",
              "For each number, check whether target - current exists in the map.",
              "Return indices immediately when a valid complement is found.",
            ],
          },
          {
            question: "Given a list of intervals, merge all overlapping intervals and return the simplified result.",
            round: "Technical Round 1",
            difficulty: "Medium",
            whatToFocusOn: "Sorting + interval sweep logic, especially why sorting by start time makes greedy merging valid.",
            answerOutline: [
              "Sort intervals by start time.",
              "Initialize the result with the first interval.",
              "Compare the current interval to the last merged interval.",
              "If they overlap, extend the end; otherwise append a new interval.",
            ],
          },
          {
            question: "Transform one word into another using the shortest number of valid dictionary transformations.",
            round: "Technical Round 2",
            difficulty: "Hard",
            whatToFocusOn: "Why this is an unweighted shortest path problem and how BFS guarantees minimum steps.",
            answerOutline: [
              "Model each word as a node and valid one-letter transformations as edges.",
              "Use BFS from the source word because each transformation has equal cost.",
              "Track visited words to avoid cycles and repeated work.",
              "Stop when the target word is dequeued and return the level depth.",
            ],
          },
        ],
      },
      {
        title: "Core CS",
        questions: [
          {
            question: "What is a database index, and when can adding too many indexes hurt performance?",
            round: "Technical / Core CS",
            difficulty: "Medium",
            whatToFocusOn: "Read vs write tradeoffs, storage overhead, and why indexes help lookups but slow writes.",
            answerOutline: [
              "Define an index as an auxiliary data structure that speeds up reads.",
              "Explain faster search on filtered and sorted queries.",
              "Mention index maintenance cost on insert, update, and delete operations.",
              "Conclude with the need to index based on real query patterns rather than everything.",
            ],
          },
          {
            question: "What is the difference between a process and a thread, and when would you choose multithreading?",
            round: "Technical / Core CS",
            difficulty: "Medium",
            whatToFocusOn: "Isolation, memory sharing, scheduling cost, and concurrency tradeoffs.",
            answerOutline: [
              "A process has isolated memory space, while threads share memory within a process.",
              "Processes are heavier to create and switch between.",
              "Threads are lighter and good for concurrent tasks sharing the same state.",
              "Mention the added risk of race conditions and synchronization complexity.",
            ],
          },
        ],
      },
      {
        title: "Behavioral",
        questions: [
          {
            question: "Tell me about a time you handled disagreement in a team.",
            round: "Googlyness / Behavioral",
            difficulty: "Medium",
            whatToFocusOn: "Use STAR format and show respect, data-driven discussion, and a constructive outcome.",
            answerOutline: [
              "Set context around the disagreement and why it mattered.",
              "Describe how you listened, clarified the tradeoffs, and aligned on facts.",
              "Explain the specific action you took to move toward resolution.",
              "Close with the result and what the team learned.",
            ],
          },
          {
            question: "Describe a project where you took ownership end to end.",
            round: "Googlyness / Behavioral",
            difficulty: "Medium",
            whatToFocusOn: "Highlight initiative, decision-making, obstacles, and measurable impact.",
            answerOutline: [
              "Briefly describe the project and your responsibility.",
              "Explain the gap or risk you noticed and why you stepped in.",
              "Walk through the execution decisions you made.",
              "Quantify the result and reflect on what you would improve next time.",
            ],
          },
        ],
      },
    ],
    preparationTips: [
      "Focus on medium-to-hard LeetCode patterns instead of random problem volume.",
      "Practice writing bug-free code on a plain editor without autocomplete.",
      "Prepare 5-6 behavioral stories that highlight impact, teamwork, and resilience.",
    ],
    resources: [
      { label: "Practice Problems", href: "/practice", type: "Internal" },
      { label: "System Design Basics", href: "/resources/system-design", type: "Internal" },
      { label: "Resume Builder", href: "/dashboard/resume", type: "Internal" },
    ],
    lastUpdated: "March 13, 2026",
  },
  {
    name: "Microsoft",
    slug: "microsoft",
    tier: 1,
    roles: ["Software Engineer", "Cloud Solutions Architect"],
    openings: 8,
    salaryRange: "$140-170K",
    growth: 12,
    location: "Hyderabad, Bengaluru, Noida, global engineering hubs",
    difficulty: "High",
    intro:
      "Microsoft interviews usually balance coding, practical engineering thinking, and behavioral depth. Communication and collaboration are evaluated alongside technical problem solving.",
    overview: [
      "Microsoft roles often emphasize software engineering, cloud, developer platforms, and enterprise systems.",
      "Interviewers frequently look for maintainable solutions and real-world tradeoff awareness.",
      "Behavioral rounds often connect to teamwork, customer obsession, and growth mindset.",
    ],
    eligibility: [
      "Strong problem-solving ability in arrays, strings, trees, and hash maps",
      "Comfortable with OOP, DBMS, OS, and networking basics",
      "Ability to write readable code and explain design choices clearly",
    ],
    onlineAssessment: {
      format: "Usually a coding assessment with aptitude or MCQ sections depending on role and campus flow.",
      topics: ["Strings", "Hash maps", "Trees", "Dynamic programming basics", "Object-oriented concepts"],
      tips: [
        "Prioritize correctness and readable code before micro-optimizing.",
        "Revise resume projects carefully because project deep dives are common.",
        "Be ready to explain class design and real implementation decisions.",
      ],
    },
    interviewRounds: [
      {
        title: "Coding Round 1",
        duration: "45-60 min",
        focus: "Problem solving and clean implementation",
        details: [
          "Questions often involve strings, maps, arrays, or trees.",
          "Interviewers usually value clarity and edge-case coverage.",
        ],
      },
      {
        title: "Coding / Design Round 2",
        duration: "45-60 min",
        focus: "System thinking or deeper problem solving",
        details: [
          "Some roles include low-level design or scalable feature design discussions.",
          "Follow-up questions may test testing strategy and maintainability.",
        ],
      },
      {
        title: "Managerial / Behavioral",
        duration: "30-45 min",
        focus: "Growth mindset, collaboration, and impact",
        details: [
          "Expect questions about teamwork, learning, and ambiguous delivery situations.",
          "Customer-focused examples often resonate strongly.",
        ],
      },
    ],
    questionBank: [
      {
        title: "Coding",
        questions: [
          {
            question: "Find the length of the longest substring without repeating characters.",
            round: "Coding Round 1",
            difficulty: "Medium",
            whatToFocusOn: "Sliding window reasoning, character frequency or index tracking, and why the window only moves forward.",
            answerOutline: [
              "Use two pointers to maintain a window of unique characters.",
              "Track the latest seen index or count of each character.",
              "Shrink or jump the left pointer when a duplicate appears.",
              "Update the maximum window length after each step.",
            ],
          },
          {
            question: "Design an LRU cache with O(1) get and put operations.",
            round: "Coding / Design Round 2",
            difficulty: "Hard",
            whatToFocusOn: "Combining a hash map with a doubly linked list and explaining why both are needed.",
            answerOutline: [
              "Use a hash map for direct key lookup.",
              "Use a doubly linked list to maintain recency order.",
              "On access, move the node to the front.",
              "On overflow, remove the least recently used node from the tail.",
            ],
          },
          {
            question: "Clone a graph given a reference node in a connected undirected graph.",
            round: "Coding Round 1",
            difficulty: "Medium",
            whatToFocusOn: "Graph traversal plus visited mapping to avoid duplicate cloning and infinite loops.",
            answerOutline: [
              "Use DFS or BFS to traverse the original graph.",
              "Map each original node to its cloned node.",
              "If a node is already cloned, reuse it instead of recreating it.",
              "Recursively or iteratively connect cloned neighbors.",
            ],
          },
        ],
      },
      {
        title: "Project / Design",
        questions: [
          {
            question: "Explain one of your projects end to end, including architecture, tradeoffs, and what you would improve.",
            round: "Coding / Design Round 2",
            difficulty: "Medium",
            whatToFocusOn: "Structure your explanation around problem, design, stack choice, bottlenecks, and lessons learned.",
            answerOutline: [
              "Start with the user problem and the core feature set.",
              "Describe the system flow from frontend to backend to database.",
              "Justify major tech choices and tradeoffs.",
              "End with performance limits and what you would improve next.",
            ],
          },
          {
            question: "How would you model user roles and access control in a multi-user system?",
            round: "Coding / Design Round 2",
            difficulty: "Medium",
            whatToFocusOn: "RBAC basics, permission mapping, and enforcement points on both API and UI.",
            answerOutline: [
              "Define roles such as admin, editor, and viewer.",
              "Map permissions to roles instead of hardcoding per user.",
              "Check permissions at the API layer as the source of truth.",
              "Use UI restrictions as convenience, not as the only enforcement layer.",
            ],
          },
        ],
      },
      {
        title: "Behavioral",
        questions: [
          {
            question: "Tell me about a time you learned something quickly to unblock delivery.",
            round: "Managerial / Behavioral",
            difficulty: "Medium",
            whatToFocusOn: "Show urgency, learning strategy, execution, and delivery impact.",
            answerOutline: [
              "Describe the blocker and why new learning was required.",
              "Explain how you broke the learning task into manageable parts.",
              "Share how you applied the new knowledge immediately.",
              "Close with the result and what it changed for future work.",
            ],
          },
          {
            question: "Describe a situation where you supported a teammate under pressure.",
            round: "Managerial / Behavioral",
            difficulty: "Medium",
            whatToFocusOn: "Emphasize empathy, teamwork, concrete support, and team outcome.",
            answerOutline: [
              "Set the context and pressure point clearly.",
              "Explain how you noticed the issue and stepped in.",
              "Describe the support you gave and how you coordinated.",
              "Share the result for both the teammate and the project.",
            ],
          },
        ],
      },
    ],
    preparationTips: [
      "Revise your resume deeply because interviewers often ask implementation-level project questions.",
      "Practice explaining tradeoffs, not just final answers.",
      "Prepare behavioral answers around collaboration, empathy, and learning.",
    ],
    resources: [
      { label: "DSA Playlist", href: "/resources/dsa-playlist", type: "Internal" },
      { label: "Practice Problems", href: "/practice", type: "Internal" },
      { label: "Resume Builder", href: "/dashboard/resume", type: "Internal" },
    ],
    lastUpdated: "March 13, 2026",
  },
  {
    name: "Amazon",
    slug: "amazon",
    tier: 1,
    roles: ["SDE", "Technical Program Manager", "UX Designer"],
    openings: 15,
    salaryRange: "$135-165K",
    growth: 18,
    location: "Bengaluru, Hyderabad, Chennai, Pune, global teams",
    difficulty: "High",
    intro:
      "Amazon interviews strongly combine coding ability with Leadership Principles. Even technically strong candidates can struggle if their examples lack ownership and measurable impact.",
    overview: [
      "Amazon hires heavily across engineering, product, operations technology, and cloud teams.",
      "The process often starts with an online assessment and moves into coding plus behavioral evaluation.",
      "Leadership Principles are not a side topic; they are a core scoring dimension.",
    ],
    eligibility: [
      "Strong DSA practice in arrays, graphs, trees, stacks, queues, and hashing",
      "Confidence in discussing scalable systems for experienced or stronger campus roles",
      "Prepared STAR stories aligned to ownership, bias for action, and customer obsession",
    ],
    onlineAssessment: {
      format: "Usually coding plus work-style or behavioral assessment depending on the hiring stream.",
      topics: ["Arrays and hashing", "Stacks and queues", "Graphs", "Linked lists", "Trees"],
      tips: [
        "Time-box OA questions carefully because work-style sections can also matter.",
        "Prepare Leadership Principles examples before interview rounds begin.",
        "Do not give vague impact statements; quantify outcomes.",
      ],
    },
    interviewRounds: [
      {
        title: "Online Assessment",
        duration: "60-120 min",
        focus: "Coding, work style, and reasoning",
        details: [
          "The OA may include one or two coding questions plus a work-style assessment.",
          "Coding questions are often medium difficulty with strong edge-case expectations.",
        ],
      },
      {
        title: "Technical Coding Round",
        duration: "45-60 min",
        focus: "DSA problem solving",
        details: [
          "Expect discussion of complexity, test cases, and production-quality thinking.",
          "Interviewers may ask you to improve your first solution progressively.",
        ],
      },
      {
        title: "Leadership Principles Round",
        duration: "45 min",
        focus: "Ownership, customer obsession, and delivery",
        details: [
          "Every answer should be concrete and metric-backed when possible.",
          "Weak or generic STAR stories are a common rejection reason.",
        ],
      },
      {
        title: "System / Bar Raiser",
        duration: "45-60 min",
        focus: "Depth, judgment, and consistency",
        details: [
          "For some roles, system design or architecture questions appear.",
          "Bar raiser-style evaluation checks whether your overall signal is consistently strong.",
        ],
      },
    ],
    questionBank: [
      {
        title: "Coding",
        questions: [
          {
            question: "Design an LRU cache that supports O(1) get and put operations.",
            round: "Technical Coding Round",
            difficulty: "Hard",
            whatToFocusOn: "Hash map plus doubly linked list, eviction logic, and why both operations stay O(1).",
            answerOutline: [
              "Store nodes in a hash map for constant-time lookup.",
              "Use a doubly linked list to keep most-recently-used items at the front.",
              "Move accessed or updated entries to the front.",
              "Evict from the tail when capacity is exceeded.",
            ],
          },
          {
            question: "Given an array, return the k most frequent elements.",
            round: "Technical Coding Round",
            difficulty: "Medium",
            whatToFocusOn: "Frequency counting, heap or bucket-sort approach, and complexity comparison.",
            answerOutline: [
              "Count frequencies using a hash map.",
              "Use a min-heap of size k or bucket sort depending on the expected constraints.",
              "Maintain only the top k entries while iterating.",
              "Return the collected keys after processing.",
            ],
          },
          {
            question: "Merge k sorted linked lists into one sorted list.",
            round: "Technical Coding Round",
            difficulty: "Hard",
            whatToFocusOn: "Heap-based merging versus divide-and-conquer and their time complexity.",
            answerOutline: [
              "Push the head of each list into a min-heap.",
              "Repeatedly pop the smallest node and append it to the output.",
              "If the popped node has a next node, push that into the heap.",
              "Continue until the heap is empty.",
            ],
          },
        ],
      },
      {
        title: "Leadership Principles",
        questions: [
          {
            question: "Tell me about a time you disagreed and committed.",
            round: "Leadership Principles Round",
            difficulty: "Medium",
            whatToFocusOn: "Show respectful disagreement, principled reasoning, and commitment after decision.",
            answerOutline: [
              "Describe the disagreement and the stakes.",
              "Explain how you presented your perspective with evidence.",
              "Show how you supported the final decision once alignment was reached.",
              "End with the outcome and what you learned about teamwork.",
            ],
          },
          {
            question: "Tell me about a time you took ownership without being asked.",
            round: "Leadership Principles Round",
            difficulty: "Medium",
            whatToFocusOn: "Initiative, accountability, and measurable impact are more important than titles.",
            answerOutline: [
              "Set up the problem and why it was being missed.",
              "Explain the action you proactively took.",
              "Describe obstacles you handled during execution.",
              "Quantify the result and why it mattered.",
            ],
          },
        ],
      },
      {
        title: "System / Architecture",
        questions: [
          {
            question: "How would you design an order tracking system for a large e-commerce platform?",
            round: "System / Bar Raiser",
            difficulty: "Hard",
            whatToFocusOn: "Event-driven updates, scale, consistency, and user-visible state transitions.",
            answerOutline: [
              "Start with the main entities: order, shipment, status events, and user notifications.",
              "Discuss write flow from warehouse or courier updates into an event stream.",
              "Use a read-optimized store or cache for fast customer-facing status lookups.",
              "Cover retries, idempotency, and monitoring for delayed or duplicate events.",
            ],
          },
          {
            question: "How would you handle retries and idempotency in distributed workflows?",
            round: "System / Bar Raiser",
            difficulty: "Hard",
            whatToFocusOn: "Exactly-once expectations are rare; focus on safe retries and deduplication.",
            answerOutline: [
              "Assign idempotency keys to client or service requests.",
              "Persist processed keys or operation states in durable storage.",
              "Make retryable operations safe by checking whether work has already been applied.",
              "Use backoff, dead-letter handling, and monitoring for repeated failures.",
            ],
          },
        ],
      },
    ],
    preparationTips: [
      "Prepare at least two strong STAR examples for each major Leadership Principle.",
      "Practice coding with explanation because Amazon interviews often test both correctness and clarity.",
      "Use measurable numbers in both technical and behavioral answers whenever possible.",
    ],
    resources: [
      { label: "Practice Problems", href: "/practice", type: "Internal" },
      { label: "System Design Basics", href: "/resources/system-design", type: "Internal" },
      { label: "Interview Experience Form", href: "/company/amazon", type: "Internal" },
    ],
    lastUpdated: "March 13, 2026",
  },
]

export const companyDetailsBySlug = Object.fromEntries(
  companyDetails.map((company) => [company.slug, company])
) as Record<string, CompanyDetail>

export const supportedCompanySlugs = companyDetails.map((company) => company.slug)
