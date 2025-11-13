import React from "react";

// Component to highlight search terms in text
export default function SearchHighlight({ text, searchTerm }) {
  if (!searchTerm || !text) {
    return <>{text}</>;
  }

  const terms = searchTerm.toLowerCase().trim().split(/\s+/);
  let highlightedText = text;
  
  terms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 text-gray-900 font-semibold">$1</mark>');
  });

  return (
    <span dangerouslySetInnerHTML={{ __html: highlightedText }} />
  );
}