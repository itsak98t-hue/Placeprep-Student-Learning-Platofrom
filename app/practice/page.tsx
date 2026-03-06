import Link from "next/link";

type Problem = {
  id: string;
  title: string;
  company: string;
  difficulty: "Easy" | "Medium" | "Hard";
};

const PROBLEMS: Problem[] = [
  { id: "two-sum", title: "Two Sum", company: "google", difficulty: "Easy" },
  { id: "valid-parentheses", title: "Valid Parentheses", company: "amazon", difficulty: "Easy" },
  { id: "lru-cache", title: "LRU Cache", company: "google", difficulty: "Hard" },
  { id: "merge-intervals", title: "Merge Intervals", company: "microsoft", difficulty: "Medium" },
];

export default function PracticePage() {
  const companies = ["all", "google", "amazon", "microsoft"] as const;
  const difficulties = ["all", "Easy", "Medium", "Hard"] as const;

  // Simple defaults (we will add real filtering next)
  const selectedCompany = "all";
  const selectedDifficulty = "all";

  const filtered = PROBLEMS.filter((p) => {
    const companyOk = selectedCompany === "all" || p.company === selectedCompany;
    const diffOk = selectedDifficulty === "all" || p.difficulty === selectedDifficulty;
    return companyOk && diffOk;
  });

  return (
    <main style={{ padding: 20 }}>
      <h1>Practice Problems</h1>
      <p>Pick a problem and practice.</p>

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <p><b>Filters</b> (we’ll make these interactive next)</p>
        <p>Company options: {companies.join(", ")}</p>
        <p>Difficulty options: {difficulties.join(", ")}</p>
      </div>

      <h2 style={{ marginTop: 20 }}>Problems</h2>
      <ul>
        {filtered.map((p) => (
          <li key={p.id} style={{ marginBottom: 10 }}>
            <Link href={`/practice/${p.id}`}>
              {p.title} — {p.company} — {p.difficulty}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}