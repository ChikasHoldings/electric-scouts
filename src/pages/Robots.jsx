import React, { useEffect, useState } from "react";

/**
 * /robots — a human-readable view of the live robots.txt.
 *
 * This page used to hold its own hardcoded copy of the rules, which drifted out
 * of sync with the file actually served. It now fetches /robots.txt so there is
 * exactly one source of truth (generated from src/seo/robots.js at build time).
 */
export default function Robots() {
  const [content, setContent] = useState("Loading robots.txt…");

  useEffect(() => {
    let cancelled = false;
    fetch("/robots.txt")
      .then((response) => (response.ok ? response.text() : Promise.reject(new Error(String(response.status)))))
      .then((text) => {
        if (!cancelled) setContent(text);
      })
      .catch(() => {
        if (!cancelled) setContent("Could not load /robots.txt.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <pre
      style={{
        whiteSpace: 'pre-wrap',
        fontFamily: 'monospace',
        fontSize: '12px',
        padding: '20px',
        background: '#f5f5f5',
        margin: 0
      }}
    >
      {content}
    </pre>
  );
}
