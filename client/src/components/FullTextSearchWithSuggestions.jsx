import React, { useState } from "react";
const suggestionsList = [
  "MEN",
  "WOMEN",
  "OVERSIZE TEES",
  "analytics",
  "settings",
  "profile",
  "report generation",
  "security",
  "subscription",
  "notification center"
];
const FullTextSearchWithSuggestions = () => {
  const [query, setQuery] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const clearHighlights = () => {
    const highlights = document.querySelectorAll("mark.highlight");
    highlights.forEach((mark) => {
      const parent = mark.parentNode;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    });
  };
  const highlightMatches = (term) => {
    if (!term.trim()) return;
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (
            node.parentNode &&
            node.parentNode.nodeName !== "SCRIPT" &&
            node.parentNode.nodeName !== "STYLE" &&
            node.nodeValue.toLowerCase().includes(term.toLowerCase())
          ) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        },
      },
      false
    );
    const regex = new RegExp(`(${term})`, "gi");
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const span = document.createElement("span");
      span.innerHTML = node.nodeValue.replace(
        regex,
        "<mark class=\"highlight\">$1</mark>"
      );
      node.parentNode.replaceChild(span, node);
    }
  };
  const handleSearch = (term) => {
    clearHighlights();
    highlightMatches(term);
  };
  const handleChange = (e) => {
    const input = e.target.value;
    setQuery(input);
    if (input.length === 0) {
      setFilteredSuggestions([]);
      return;
    }
    const matches = suggestionsList.filter((s) =>
      s.toLowerCase().includes(input.toLowerCase())
    );
    setFilteredSuggestions(matches);
  };
  return (
    <div className="relative max-w-xl p-2 mx-auto bg-white">
  <div className="flex items-center space-x-2">
    <input
      type="text"
      value={query}
      onChange={handleChange}
      placeholder="Search..."
      className="flex-1 py-2 pl-10 pr-4 border-2 border-gray-500 rounded-full outline-none focus:border-red-500"
    />
    <button
      onClick={() => handleSearch(query)}
      className="px-4 py-2 text-white bg-red-600 rounded-full"
    >
    Highlight
    </button>
  </div>
  {filteredSuggestions.length > 0 && (
    <ul className="absolute z-50 w-full mt-1 bg-white border rounded shadow">
      {filteredSuggestions.map((s, i) => (
        <li
          key={i}
          onClick={() => {
            setQuery(s);
            setFilteredSuggestions([]);
            handleSearch(s);
          }}
          className="p-2 cursor-pointer hover:bg-gray-100"
        >
          {s}
        </li>
      ))}
    </ul>
  )}
</div>
  );
};
export default FullTextSearchWithSuggestions;