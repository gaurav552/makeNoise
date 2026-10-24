import { usePlayer, usePlayerState } from 'makenoise/react';

/** `state.queue` is the real play order: history, then the current entry, then up next. */
export function Queue() {
  const player = usePlayer();
  const queue = usePlayerState((s) => s.queue);
  const currentIndex = usePlayerState((s) => s.currentIndex);

  return (
    <section className="card" aria-labelledby="queue-title">
      <div className="section-head">
        <h2 id="queue-title" className="section-title">Queue ({queue.length})</h2>
        {queue.length > 0 && (
          <button type="button" className="mini" onClick={() => player.clearQueue()}>
            Clear
          </button>
        )}
      </div>
      {queue.length === 0 ? (
        <p className="hint">The queue is empty.</p>
      ) : (
        <ol className="tracks">
          {queue.map((item, index) => {
            const title = item.track.title ?? item.track.id;
            const isCurrent = index === currentIndex;
            return (
              <li key={item.qid} className={`track${isCurrent ? ' current' : index < currentIndex ? ' played' : ''}`}>
                <button
                  type="button"
                  className="track-main"
                  aria-current={isCurrent ? 'true' : undefined}
                  onClick={() => player.jumpTo(item.qid)}
                >
                  <span className="t">{title}</span>
                  <span className="a">{item.track.artist}</span>
                </button>
                <button type="button" className="mini" aria-label={`Remove ${title}`} onClick={() => player.remove(item.qid)}>
                  ✕
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
