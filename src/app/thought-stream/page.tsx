"use client";
import React, { useEffect, useRef, useState } from "react";

interface ThoughtEvent {
  timestamp: string;
  type: string;
  content: string;
  confidence?: number;
  details?: any;
}

export default function ThoughtStreamPage() {
  const [events, setEvents] = useState<ThoughtEvent[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const eventSource = new EventSource("/api/thought-stream");
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed.type === "history") {
          setEvents(parsed.data);
        } else if (parsed.type === "thought") {
          setEvents((prev) => [...prev, parsed.data]);
        }
      } catch (err) {
        // Ignore malformed events
      }
    };
    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <main style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
      <h1>Thought Stream</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {events.map((event, idx) => (
          <div
            key={event.timestamp + idx}
            style={{
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: "1rem",
              background: event.type === "reflection"
                ? "#e3fcec"
                : event.type === "thought"
                ? "#e6f0fa"
                : event.type === "action"
                ? "#fff4e6"
                : "#f8f9fa",
            }}
            aria-label={`Thought event: ${event.type}`}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
              {event.confidence !== undefined && (
                <span style={{ marginLeft: 8, color: "#888", fontSize: 12 }}>
                  Confidence: {(event.confidence * 100).toFixed(0)}%
                </span>
              )}
            </div>
            <div style={{ marginBottom: 4 }}>{event.content}</div>
            {event.details && (
              <details>
                <summary>Details</summary>
                <pre style={{ fontSize: 12, background: "#f6f8fa", padding: 8, borderRadius: 4 }}>
                  {JSON.stringify(event.details, null, 2)}
                </pre>
              </details>
            )}
            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              {new Date(event.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
