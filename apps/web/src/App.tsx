export default function App() {
  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem" }}>
      <h1>InSeoul</h1>
      <p>Front-end skeleton. Back-end API(/api/*)만 호출합니다.</p>
      <p>API base: {import.meta.env.VITE_API_BASE_URL ?? "(unset)"}</p>
    </main>
  );
}
