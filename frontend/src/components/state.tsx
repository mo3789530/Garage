export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="state-box">
      <strong>{title}</strong>
      {detail && <span>{detail}</span>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <main className="loading state-page">
      <div className="state-box error">
        <strong>読み込みに失敗しました</strong>
        <span>{message}</span>
        {onRetry && <button onClick={onRetry}>再試行</button>}
      </div>
    </main>
  );
}
