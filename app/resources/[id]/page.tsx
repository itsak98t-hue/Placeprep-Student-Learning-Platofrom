export function generateStaticParams() {
  return [
    { id: "arrays-notes" },
    { id: "dsa-playlist" },
    { id: "system-design" },
  ];
}

export default function ResourceDetail({ params }: { params: { id: string } }) {
  return (
    <main style={{ padding: 20 }}>
      <h1>Resource: {params.id}</h1>
      <p>This is the resource detail page.</p>
      <p>(Later we’ll load title/link/content from Firestore.)</p>
    </main>
  );
}