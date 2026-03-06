import Link from "next/link";

type Resource = {
  id: string;
  title: string;
  type: "Video" | "Article" | "Sheet";
  topic: string;
};

const RESOURCES: Resource[] = [
  { id: "arrays-notes", title: "Arrays Notes (Beginner)", type: "Sheet", topic: "Arrays" },
  { id: "dsa-playlist", title: "DSA Playlist", type: "Video", topic: "DSA" },
  { id: "system-design", title: "System Design Basics", type: "Article", topic: "System Design" },
];

export default function ResourcesPage() {
  return (
    <main style={{ padding: 20 }}>
      <h1>Learning Resources</h1>
      <p>Pick a resource to open details.</p>

      <ul style={{ marginTop: 16 }}>
        {RESOURCES.map((r) => (
          <li key={r.id} style={{ marginBottom: 10 }}>
            <Link href={`/resources/${r.id}`}>
              {r.title} — {r.type} — {r.topic}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}