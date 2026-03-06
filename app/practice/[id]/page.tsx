export function generateStaticParams() {
  return [
    { id: "two-sum" },
    { id: "valid-parentheses" },
    { id: "lru-cache" },
    { id: "merge-intervals" },
  ];
}

export default function PracticeDetailPage({ params }: { params: { id: string } }) {
  return (
    <main style={{ padding: 20 }}>
      <h1>Problem: {params.id}</h1>
      <p>This is the problem detail page.</p>

      <h2 style={{ marginTop: 20 }}>Problem Statement</h2>
      <p>(We’ll add real content later.)</p>

      <h2 style={{ marginTop: 20 }}>Solution</h2>
      <p>(We’ll add explanation + code later.)</p>
    </main>
  );
}