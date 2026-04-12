export type AdaptiveCodingDifficulty = "easy" | "medium" | "hard"

export type AdaptiveCodingTopic =
  | "arrays"
  | "hashing"
  | "strings"
  | "sliding-window"
  | "two-pointers"
  | "linked-list"
  | "stack"
  | "queue"
  | "heap"
  | "intervals"
  | "binary-search"
  | "trees"
  | "graphs"
  | "dp"
  | "greedy"
  | "backtracking"
  | "design"
  | "prefix-sum"
  | "matrix"

export type AdaptiveCodingQuestion = {
  id: string
  title: string
  difficulty: AdaptiveCodingDifficulty
  topic: AdaptiveCodingTopic
  link: string
  companies: string[]
}

export const adaptiveCodingQuestionPool: AdaptiveCodingQuestion[] = [
  { id: "two-sum", title: "Two Sum", difficulty: "easy", topic: "arrays", link: "https://leetcode.com/problems/two-sum/", companies: ["google", "amazon", "microsoft", "meta"] },
  { id: "valid-parentheses", title: "Valid Parentheses", difficulty: "easy", topic: "stack", link: "https://leetcode.com/problems/valid-parentheses/", companies: ["amazon", "goldman-sachs", "jpmorgan"] },
  { id: "best-time-stock", title: "Best Time to Buy and Sell Stock", difficulty: "easy", topic: "arrays", link: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", companies: ["walmart", "apple", "paytm"] },
  { id: "contains-duplicate", title: "Contains Duplicate", difficulty: "easy", topic: "hashing", link: "https://leetcode.com/problems/contains-duplicate/", companies: ["google", "amazon", "oracle"] },
  { id: "valid-anagram", title: "Valid Anagram", difficulty: "easy", topic: "strings", link: "https://leetcode.com/problems/valid-anagram/", companies: ["meta", "adobe", "linkedin"] },
  { id: "merge-two-sorted-lists", title: "Merge Two Sorted Lists", difficulty: "easy", topic: "linked-list", link: "https://leetcode.com/problems/merge-two-sorted-lists/", companies: ["oracle", "microsoft", "amazon"] },
  { id: "reverse-linked-list", title: "Reverse Linked List", difficulty: "easy", topic: "linked-list", link: "https://leetcode.com/problems/reverse-linked-list/", companies: ["jpmorgan", "amazon", "uber"] },
  { id: "binary-search", title: "Binary Search", difficulty: "easy", topic: "binary-search", link: "https://leetcode.com/problems/binary-search/", companies: ["google", "microsoft", "swiggy"] },
  { id: "flood-fill", title: "Flood Fill", difficulty: "easy", topic: "graphs", link: "https://leetcode.com/problems/flood-fill/", companies: ["microsoft", "flipkart", "zomato"] },
  { id: "maximum-subarray", title: "Maximum Subarray", difficulty: "easy", topic: "dp", link: "https://leetcode.com/problems/maximum-subarray/", companies: ["amazon", "meta", "atlassian"] },
  { id: "invert-binary-tree", title: "Invert Binary Tree", difficulty: "easy", topic: "trees", link: "https://leetcode.com/problems/invert-binary-tree/", companies: ["google", "microsoft", "airbnb"] },
  { id: "symmetric-tree", title: "Symmetric Tree", difficulty: "easy", topic: "trees", link: "https://leetcode.com/problems/symmetric-tree/", companies: ["microsoft", "oracle", "walmart"] },
  { id: "palindrome-linked-list", title: "Palindrome Linked List", difficulty: "easy", topic: "linked-list", link: "https://leetcode.com/problems/palindrome-linked-list/", companies: ["amazon", "paytm", "salesforce"] },
  { id: "range-sum-query", title: "Range Sum Query - Immutable", difficulty: "easy", topic: "prefix-sum", link: "https://leetcode.com/problems/range-sum-query-immutable/", companies: ["google", "adobe", "swiggy"] },
  { id: "climbing-stairs", title: "Climbing Stairs", difficulty: "easy", topic: "dp", link: "https://leetcode.com/problems/climbing-stairs/", companies: ["google", "uber", "jpmorgan"] },

  { id: "group-anagrams", title: "Group Anagrams", difficulty: "medium", topic: "hashing", link: "https://leetcode.com/problems/group-anagrams/", companies: ["meta", "amazon", "google"] },
  { id: "longest-substring-without-repeating", title: "Longest Substring Without Repeating Characters", difficulty: "medium", topic: "sliding-window", link: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", companies: ["apple", "amazon", "adobe"] },
  { id: "product-of-array-except-self", title: "Product of Array Except Self", difficulty: "medium", topic: "arrays", link: "https://leetcode.com/problems/product-of-array-except-self/", companies: ["apple", "meta", "google"] },
  { id: "3sum", title: "3Sum", difficulty: "medium", topic: "two-pointers", link: "https://leetcode.com/problems/3sum/", companies: ["meta", "google", "linkedin"] },
  { id: "container-with-most-water", title: "Container With Most Water", difficulty: "medium", topic: "two-pointers", link: "https://leetcode.com/problems/container-with-most-water/", companies: ["amazon", "meta", "uber"] },
  { id: "merge-intervals", title: "Merge Intervals", difficulty: "medium", topic: "intervals", link: "https://leetcode.com/problems/merge-intervals/", companies: ["amazon", "atlassian", "flipkart"] },
  { id: "insert-interval", title: "Insert Interval", difficulty: "medium", topic: "intervals", link: "https://leetcode.com/problems/insert-interval/", companies: ["atlassian", "google", "netflix"] },
  { id: "top-k-frequent", title: "Top K Frequent Elements", difficulty: "medium", topic: "heap", link: "https://leetcode.com/problems/top-k-frequent-elements/", companies: ["amazon", "google", "paytm"] },
  { id: "koko-eating-bananas", title: "Koko Eating Bananas", difficulty: "medium", topic: "binary-search", link: "https://leetcode.com/problems/koko-eating-bananas/", companies: ["flipkart", "google", "swiggy"] },
  { id: "find-min-rotated", title: "Find Minimum in Rotated Sorted Array", difficulty: "medium", topic: "binary-search", link: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/", companies: ["google", "microsoft", "oracle"] },
  { id: "number-of-islands", title: "Number of Islands", difficulty: "medium", topic: "graphs", link: "https://leetcode.com/problems/number-of-islands/", companies: ["microsoft", "amazon", "meta"] },
  { id: "course-schedule", title: "Course Schedule", difficulty: "medium", topic: "graphs", link: "https://leetcode.com/problems/course-schedule/", companies: ["uber", "google", "linkedin"] },
  { id: "clone-graph", title: "Clone Graph", difficulty: "medium", topic: "graphs", link: "https://leetcode.com/problems/clone-graph/", companies: ["adobe", "meta", "amazon"] },
  { id: "rotting-oranges", title: "Rotting Oranges", difficulty: "medium", topic: "graphs", link: "https://leetcode.com/problems/rotting-oranges/", companies: ["oracle", "walmart", "zomato"] },
  { id: "binary-tree-level-order", title: "Binary Tree Level Order Traversal", difficulty: "medium", topic: "trees", link: "https://leetcode.com/problems/binary-tree-level-order-traversal/", companies: ["microsoft", "amazon", "google"] },
  { id: "validate-bst", title: "Validate Binary Search Tree", difficulty: "medium", topic: "trees", link: "https://leetcode.com/problems/validate-binary-search-tree/", companies: ["paytm", "google", "airbnb"] },
  { id: "lowest-common-ancestor", title: "Lowest Common Ancestor of a Binary Tree", difficulty: "medium", topic: "trees", link: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/", companies: ["meta", "google", "microsoft"] },
  { id: "daily-temperatures", title: "Daily Temperatures", difficulty: "medium", topic: "stack", link: "https://leetcode.com/problems/daily-temperatures/", companies: ["zomato", "amazon", "adobe"] },
  { id: "task-scheduler", title: "Task Scheduler", difficulty: "medium", topic: "greedy", link: "https://leetcode.com/problems/task-scheduler/", companies: ["atlassian", "google", "amazon"] },
  { id: "subarray-sum-equals-k", title: "Subarray Sum Equals K", difficulty: "medium", topic: "prefix-sum", link: "https://leetcode.com/problems/subarray-sum-equals-k/", companies: ["paytm", "amazon", "flipkart"] },
  { id: "spiral-matrix", title: "Spiral Matrix", difficulty: "medium", topic: "matrix", link: "https://leetcode.com/problems/spiral-matrix/", companies: ["adobe", "oracle", "walmart"] },
  { id: "word-search", title: "Word Search", difficulty: "medium", topic: "backtracking", link: "https://leetcode.com/problems/word-search/", companies: ["salesforce", "amazon", "airbnb"] },
  { id: "accounts-merge", title: "Accounts Merge", difficulty: "medium", topic: "graphs", link: "https://leetcode.com/problems/accounts-merge/", companies: ["salesforce", "meta", "linkedin"] },
  { id: "network-delay-time", title: "Network Delay Time", difficulty: "medium", topic: "graphs", link: "https://leetcode.com/problems/network-delay-time/", companies: ["swiggy", "uber", "google"] },
  { id: "minimum-size-subarray-sum", title: "Minimum Size Subarray Sum", difficulty: "medium", topic: "sliding-window", link: "https://leetcode.com/problems/minimum-size-subarray-sum/", companies: ["swiggy", "amazon", "apple"] },
  { id: "design-underground-system", title: "Design Underground System", difficulty: "medium", topic: "design", link: "https://leetcode.com/problems/design-underground-system/", companies: ["uber", "netflix", "google"] },
  { id: "design-hit-counter", title: "Design Hit Counter", difficulty: "medium", topic: "design", link: "https://leetcode.com/problems/design-hit-counter/", companies: ["netflix", "linkedin", "meta"] },
  { id: "graph-valid-tree", title: "Graph Valid Tree", difficulty: "medium", topic: "graphs", link: "https://leetcode.com/problems/graph-valid-tree/", companies: ["linkedin", "airbnb", "google"] },

  { id: "lru-cache", title: "LRU Cache", difficulty: "hard", topic: "design", link: "https://leetcode.com/problems/lru-cache/", companies: ["google", "jpmorgan", "meta"] },
  { id: "sliding-window-maximum", title: "Sliding Window Maximum", difficulty: "hard", topic: "heap", link: "https://leetcode.com/problems/sliding-window-maximum/", companies: ["netflix", "amazon", "google"] },
  { id: "find-median-data-stream", title: "Find Median from Data Stream", difficulty: "hard", topic: "heap", link: "https://leetcode.com/problems/find-median-from-data-stream/", companies: ["flipkart", "google", "meta"] },
  { id: "text-justification", title: "Text Justification", difficulty: "hard", topic: "strings", link: "https://leetcode.com/problems/text-justification/", companies: ["airbnb", "google", "apple"] },
  { id: "reconstruct-itinerary", title: "Reconstruct Itinerary", difficulty: "hard", topic: "graphs", link: "https://leetcode.com/problems/reconstruct-itinerary/", companies: ["zomato", "linkedin", "uber"] },
  { id: "word-ladder", title: "Word Ladder", difficulty: "hard", topic: "graphs", link: "https://leetcode.com/problems/word-ladder/", companies: ["google", "amazon", "microsoft"] },
  { id: "serialize-deserialize-binary-tree", title: "Serialize and Deserialize Binary Tree", difficulty: "hard", topic: "trees", link: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/", companies: ["meta", "google", "microsoft"] },
  { id: "trapping-rain-water", title: "Trapping Rain Water", difficulty: "hard", topic: "two-pointers", link: "https://leetcode.com/problems/trapping-rain-water/", companies: ["amazon", "apple", "google"] },
  { id: "minimum-window-substring", title: "Minimum Window Substring", difficulty: "hard", topic: "sliding-window", link: "https://leetcode.com/problems/minimum-window-substring/", companies: ["google", "meta", "netflix"] },
  { id: "n-queens", title: "N-Queens", difficulty: "hard", topic: "backtracking", link: "https://leetcode.com/problems/n-queens/", companies: ["google", "microsoft", "adobe"] },
  { id: "edit-distance", title: "Edit Distance", difficulty: "hard", topic: "dp", link: "https://leetcode.com/problems/edit-distance/", companies: ["google", "amazon", "linkedin"] },
  { id: "regular-expression-matching", title: "Regular Expression Matching", difficulty: "hard", topic: "dp", link: "https://leetcode.com/problems/regular-expression-matching/", companies: ["google", "airbnb", "apple"] },
  { id: "alien-dictionary", title: "Alien Dictionary", difficulty: "hard", topic: "graphs", link: "https://leetcode.com/problems/alien-dictionary/", companies: ["google", "linkedin", "meta"] },
  { id: "merge-k-sorted-lists", title: "Merge k Sorted Lists", difficulty: "hard", topic: "heap", link: "https://leetcode.com/problems/merge-k-sorted-lists/", companies: ["amazon", "microsoft", "oracle"] },
  { id: "maximal-rectangle", title: "Maximal Rectangle", difficulty: "hard", topic: "matrix", link: "https://leetcode.com/problems/maximal-rectangle/", companies: ["google", "amazon", "netflix"] },
]

export function getAdaptiveDifficulty(userScore: number): AdaptiveCodingDifficulty {
  if (userScore >= 2) {
    return "hard"
  }

  if (userScore <= -1) {
    return "easy"
  }

  return "medium"
}

export function getAdaptiveCodingQuestions(companyId?: string) {
  if (!companyId) {
    return adaptiveCodingQuestionPool
  }

  return adaptiveCodingQuestionPool.filter((question) => question.companies.includes(companyId))
}

export function getTopicLabel(topic: AdaptiveCodingTopic) {
  return topic
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

type PickNextAdaptiveQuestionInput = {
  companyId?: string
  userScore: number
  seenQuestionIds: string[]
  excludeQuestionId?: string | null
  difficultyFilter?: AdaptiveCodingDifficulty | "all"
}

export function pickNextAdaptiveQuestion({
  companyId,
  userScore,
  seenQuestionIds,
  excludeQuestionId,
  difficultyFilter = "all",
}: PickNextAdaptiveQuestionInput): AdaptiveCodingQuestion | null {
  const targetDifficulty = getAdaptiveDifficulty(userScore)
  const availableQuestions = getAdaptiveCodingQuestions(companyId).filter((question) =>
    difficultyFilter === "all" ? true : question.difficulty === difficultyFilter
  )
  const excludedIds = new Set(seenQuestionIds)

  if (excludeQuestionId) {
    excludedIds.add(excludeQuestionId)
  }

  const difficultyOrder: AdaptiveCodingDifficulty[] =
    targetDifficulty === "medium"
      ? ["medium", "easy", "hard"]
      : targetDifficulty === "hard"
        ? ["hard", "medium", "easy"]
        : ["easy", "medium", "hard"]

  for (const difficulty of difficultyOrder) {
    const pool = availableQuestions.filter(
      (question) => question.difficulty === difficulty && !excludedIds.has(question.id)
    )

    if (pool.length > 0) {
      return pool[Math.floor(Math.random() * pool.length)]
    }
  }

  const resetPool = availableQuestions.filter((question) => question.id !== excludeQuestionId)
  if (resetPool.length === 0) {
    return null
  }

  const preferredResetPool = resetPool.filter((question) => question.difficulty === targetDifficulty)
  const finalPool = preferredResetPool.length > 0 ? preferredResetPool : resetPool

  return finalPool[Math.floor(Math.random() * finalPool.length)]
}
