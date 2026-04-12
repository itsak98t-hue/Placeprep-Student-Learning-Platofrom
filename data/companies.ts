export type CompanyQuestionType = "behavioral" | "coding"

export type CompanyCodingQuestion = {
  title: string
  difficulty: "easy" | "medium" | "hard"
  link: string
}

export type CompanyBehavioralQuestion = string

export type CompanyQuestionSet = {
  behavioral: CompanyBehavioralQuestion[]
  coding: CompanyCodingQuestion[]
}

export type CompanyData = {
  id: string
  name: string
  roles: string[]
  questions: CompanyQuestionSet
}

export const companies: CompanyData[] = [
  {
    id: "google",
    name: "Google",
    roles: ["SDE", "Intern"],
    questions: {
      behavioral: [
        "Tell me about a challenging project you worked on and how you approached it.",
        "Describe a conflict with a teammate and how you resolved it.",
      ],
      coding: [
        {
          title: "Two Sum",
          difficulty: "easy",
          link: "https://leetcode.com/problems/two-sum/",
        },
        {
          title: "LRU Cache",
          difficulty: "hard",
          link: "https://leetcode.com/problems/lru-cache/",
        },
      ],
    },
  },
  {
    id: "amazon",
    name: "Amazon",
    roles: ["SDE", "Intern"],
    questions: {
      behavioral: [
        "Tell me about a time you took ownership of a difficult problem.",
        "Describe a situation where you had to make a decision with incomplete information.",
      ],
      coding: [
        {
          title: "Merge Intervals",
          difficulty: "medium",
          link: "https://leetcode.com/problems/merge-intervals/",
        },
        {
          title: "Top K Frequent Elements",
          difficulty: "medium",
          link: "https://leetcode.com/problems/top-k-frequent-elements/",
        },
      ],
    },
  },
  {
    id: "microsoft",
    name: "Microsoft",
    roles: ["SDE", "Intern"],
    questions: {
      behavioral: [
        "Describe a time you helped unblock a teammate or project.",
        "Tell me about a failure and what you learned from it.",
      ],
      coding: [
        {
          title: "Binary Tree Level Order Traversal",
          difficulty: "medium",
          link: "https://leetcode.com/problems/binary-tree-level-order-traversal/",
        },
        {
          title: "Number of Islands",
          difficulty: "medium",
          link: "https://leetcode.com/problems/number-of-islands/",
        },
      ],
    },
  },
  {
    id: "meta",
    name: "Meta",
    roles: ["SWE", "Intern"],
    questions: {
      behavioral: [
        "Tell me about a time you moved fast under pressure without losing quality.",
        "Describe a situation where you had to communicate a technical tradeoff clearly.",
      ],
      coding: [
        {
          title: "Group Anagrams",
          difficulty: "medium",
          link: "https://leetcode.com/problems/group-anagrams/",
        },
        {
          title: "Lowest Common Ancestor of a Binary Tree",
          difficulty: "medium",
          link: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/",
        },
      ],
    },
  },
  {
    id: "apple",
    name: "Apple",
    roles: ["SWE", "Intern"],
    questions: {
      behavioral: [
        "Describe a time you improved quality in a product or process.",
        "Tell me about a situation where you had to balance detail and speed.",
      ],
      coding: [
        {
          title: "Longest Substring Without Repeating Characters",
          difficulty: "medium",
          link: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
        },
        {
          title: "Product of Array Except Self",
          difficulty: "medium",
          link: "https://leetcode.com/problems/product-of-array-except-self/",
        },
      ],
    },
  },
  {
    id: "netflix",
    name: "Netflix",
    roles: ["SDE", "Backend Engineer"],
    questions: {
      behavioral: [
        "Tell me about a time you made a high-judgment decision independently.",
        "Describe a moment when you had to give or receive candid feedback.",
      ],
      coding: [
        {
          title: "Design Hit Counter",
          difficulty: "medium",
          link: "https://leetcode.com/problems/design-hit-counter/",
        },
        {
          title: "Sliding Window Maximum",
          difficulty: "hard",
          link: "https://leetcode.com/problems/sliding-window-maximum/",
        },
      ],
    },
  },
  {
    id: "uber",
    name: "Uber",
    roles: ["SDE", "Intern"],
    questions: {
      behavioral: [
        "Describe a time you handled ambiguity and still delivered a result.",
        "Tell me about a time you improved an inefficient system or workflow.",
      ],
      coding: [
        {
          title: "Course Schedule",
          difficulty: "medium",
          link: "https://leetcode.com/problems/course-schedule/",
        },
        {
          title: "Design Underground System",
          difficulty: "medium",
          link: "https://leetcode.com/problems/design-underground-system/",
        },
      ],
    },
  },
  {
    id: "adobe",
    name: "Adobe",
    roles: ["SDE", "Intern"],
    questions: {
      behavioral: [
        "Tell me about a time you had to collaborate across functions.",
        "Describe a project where your creativity improved the outcome.",
      ],
      coding: [
        {
          title: "Spiral Matrix",
          difficulty: "medium",
          link: "https://leetcode.com/problems/spiral-matrix/",
        },
        {
          title: "Clone Graph",
          difficulty: "medium",
          link: "https://leetcode.com/problems/clone-graph/",
        },
      ],
    },
  },
  {
    id: "flipkart",
    name: "Flipkart",
    roles: ["SDE", "Intern"],
    questions: {
      behavioral: [
        "Describe a time you delivered under a tight deadline.",
        "Tell me about a time you handled customer-impacting pressure well.",
      ],
      coding: [
        {
          title: "Koko Eating Bananas",
          difficulty: "medium",
          link: "https://leetcode.com/problems/koko-eating-bananas/",
        },
        {
          title: "Find Median from Data Stream",
          difficulty: "hard",
          link: "https://leetcode.com/problems/find-median-from-data-stream/",
        },
      ],
    },
  },
  {
    id: "paytm",
    name: "Paytm",
    roles: ["SDE", "Backend Engineer"],
    questions: {
      behavioral: [
        "Tell me about a time you improved reliability or prevented a failure.",
        "Describe a time you took initiative without being asked.",
      ],
      coding: [
        {
          title: "Subarray Sum Equals K",
          difficulty: "medium",
          link: "https://leetcode.com/problems/subarray-sum-equals-k/",
        },
        {
          title: "Validate Binary Search Tree",
          difficulty: "medium",
          link: "https://leetcode.com/problems/validate-binary-search-tree/",
        },
      ],
    },
  },
  {
    id: "atlassian",
    name: "Atlassian",
    roles: ["SDE", "Intern"],
    questions: {
      behavioral: [
        "Describe a time you improved team communication or documentation.",
        "Tell me about a time you solved a recurring engineering pain point.",
      ],
      coding: [
        {
          title: "Insert Interval",
          difficulty: "medium",
          link: "https://leetcode.com/problems/insert-interval/",
        },
        {
          title: "Task Scheduler",
          difficulty: "medium",
          link: "https://leetcode.com/problems/task-scheduler/",
        },
      ],
    },
  },
  {
    id: "goldman-sachs",
    name: "Goldman Sachs",
    roles: ["Analyst", "SDE"],
    questions: {
      behavioral: [
        "Tell me about a time you worked with high accountability.",
        "Describe a situation where accuracy mattered more than speed.",
      ],
      coding: [
        {
          title: "Valid Parentheses",
          difficulty: "easy",
          link: "https://leetcode.com/problems/valid-parentheses/",
        },
        {
          title: "Meeting Rooms II",
          difficulty: "medium",
          link: "https://leetcode.com/problems/meeting-rooms-ii/",
        },
      ],
    },
  },
  {
    id: "jpmorgan",
    name: "JPMorgan",
    roles: ["Analyst", "SDE"],
    questions: {
      behavioral: [
        "Describe a time you learned a new domain quickly.",
        "Tell me about a time you managed risk in a project decision.",
      ],
      coding: [
        {
          title: "Reverse Linked List",
          difficulty: "easy",
          link: "https://leetcode.com/problems/reverse-linked-list/",
        },
        {
          title: "LRU Cache",
          difficulty: "hard",
          link: "https://leetcode.com/problems/lru-cache/",
        },
      ],
    },
  },
  {
    id: "salesforce",
    name: "Salesforce",
    roles: ["SDE", "Intern"],
    questions: {
      behavioral: [
        "Tell me about a time you balanced customer needs with technical limits.",
        "Describe a situation where you simplified something complex.",
      ],
      coding: [
        {
          title: "Accounts Merge",
          difficulty: "medium",
          link: "https://leetcode.com/problems/accounts-merge/",
        },
        {
          title: "Word Search",
          difficulty: "medium",
          link: "https://leetcode.com/problems/word-search/",
        },
      ],
    },
  },
  {
    id: "oracle",
    name: "Oracle",
    roles: ["SDE", "Intern"],
    questions: {
      behavioral: [
        "Describe a time you worked through a difficult production issue.",
        "Tell me about a time you had to understand a large existing codebase.",
      ],
      coding: [
        {
          title: "Merge Two Sorted Lists",
          difficulty: "easy",
          link: "https://leetcode.com/problems/merge-two-sorted-lists/",
        },
        {
          title: "Rotting Oranges",
          difficulty: "medium",
          link: "https://leetcode.com/problems/rotting-oranges/",
        },
      ],
    },
  },
  {
    id: "walmart",
    name: "Walmart",
    roles: ["SDE", "Intern"],
    questions: {
      behavioral: [
        "Tell me about a time you improved process efficiency.",
        "Describe a time you handled scale or operational complexity.",
      ],
      coding: [
        {
          title: "Best Time to Buy and Sell Stock",
          difficulty: "easy",
          link: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
        },
        {
          title: "01 Matrix",
          difficulty: "medium",
          link: "https://leetcode.com/problems/01-matrix/",
        },
      ],
    },
  },
  {
    id: "swiggy",
    name: "Swiggy",
    roles: ["SDE", "Intern"],
    questions: {
      behavioral: [
        "Describe a time you worked fast while keeping user experience in mind.",
        "Tell me about a time you handled an unexpected blocker during execution.",
      ],
      coding: [
        {
          title: "Minimum Size Subarray Sum",
          difficulty: "medium",
          link: "https://leetcode.com/problems/minimum-size-subarray-sum/",
        },
        {
          title: "Network Delay Time",
          difficulty: "medium",
          link: "https://leetcode.com/problems/network-delay-time/",
        },
      ],
    },
  },
  {
    id: "zomato",
    name: "Zomato",
    roles: ["SDE", "Intern"],
    questions: {
      behavioral: [
        "Tell me about a time you made a product or user-flow better.",
        "Describe a time you learned from a customer-facing failure.",
      ],
      coding: [
        {
          title: "Daily Temperatures",
          difficulty: "medium",
          link: "https://leetcode.com/problems/daily-temperatures/",
        },
        {
          title: "Reconstruct Itinerary",
          difficulty: "hard",
          link: "https://leetcode.com/problems/reconstruct-itinerary/",
        },
      ],
    },
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    roles: ["SDE", "Intern"],
    questions: {
      behavioral: [
        "Describe a time you influenced a team decision without authority.",
        "Tell me about a time your communication changed the outcome of a project.",
      ],
      coding: [
        {
          title: "Nested List Weight Sum",
          difficulty: "medium",
          link: "https://leetcode.com/problems/nested-list-weight-sum/",
        },
        {
          title: "Graph Valid Tree",
          difficulty: "medium",
          link: "https://leetcode.com/problems/graph-valid-tree/",
        },
      ],
    },
  },
  {
    id: "airbnb",
    name: "Airbnb",
    roles: ["SDE", "Intern"],
    questions: {
      behavioral: [
        "Tell me about a time you designed for ambiguity or changing requirements.",
        "Describe a situation where empathy improved collaboration.",
      ],
      coding: [
        {
          title: "Text Justification",
          difficulty: "hard",
          link: "https://leetcode.com/problems/text-justification/",
        },
        {
          title: "Evaluate Division",
          difficulty: "medium",
          link: "https://leetcode.com/problems/evaluate-division/",
        },
      ],
    },
  },
]

export function getCompanyById(id: string) {
  return companies.find((company) => company.id === id)
}

export function getQuestionsByCompany(id: string, type: "behavioral"): CompanyBehavioralQuestion[]
export function getQuestionsByCompany(id: string, type: "coding"): CompanyCodingQuestion[]
export function getQuestionsByCompany(id: string, type: CompanyQuestionType) {
  const company = getCompanyById(id)
  if (!company) {
    return []
  }

  return company.questions[type]
}
