import type { QueueItem } from 'makenoise';
import { usePlayerEvent } from 'makenoise/react';
import { useRef, useState } from 'react';

interface Entry {
  id: number;
  time: string;
  name: string;
  detail: string;
}

const MAX_ENTRIES = 8;
const title = (item: QueueItem | null) => item?.track.title ?? 'nothing';

export function EventLog() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const nextId = useRef(0);

  const log = (name: string, detail = '') => {
    const entry = { id: nextId.current++, time: new Date().toLocaleTimeString([], { hour12: false }), name, detail };
    setEntries((list) => [entry, ...list].slice(0, MAX_ENTRIES));
  };

  usePlayerEvent('trackchange', (current, previous) => log('trackchange', `${title(previous)} → ${title(current)}`));
  usePlayerEvent('play', (item) => log('play', title(item)));
  usePlayerEvent('pause', (item) => log('pause', title(item)));
  usePlayerEvent('queueend', () => log('queueend'));
  usePlayerEvent('error', (error) => log('error', `${title(error.item)}: ${error.message}`));
  usePlayerEvent('blocked', () => log('blocked', 'autoplay blocked by the browser'));

  return (
    <section className="card log" aria-labelledby="log-title">
      <h2 id="log-title" className="section-title">Event log</h2>
      {entries.length === 0 ? (
        <p className="hint">No events yet.</p>
      ) : (
        <ol>
          {entries.map((entry) => (
            <li key={entry.id}>
              <time>{entry.time}</time> <b className={`ev-${entry.name}`}>{entry.name}</b> {entry.detail}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
