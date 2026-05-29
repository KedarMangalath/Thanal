export default function LoadingDots() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-xl) 0' }}>
      <div className="newtons-cradle">
        <div className="newtons-cradle__dot" />
        <div className="newtons-cradle__dot" />
        <div className="newtons-cradle__dot" />
        <div className="newtons-cradle__dot" />
      </div>
    </div>
  );
}
