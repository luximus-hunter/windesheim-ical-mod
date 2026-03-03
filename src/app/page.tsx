"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [removeAllDay, setRemoveAllDay] = useState(false);
  const [removeFullSpan, setRemoveFullSpan] = useState(false);
  const [removeFloatingCharacters, setRemoveFloatingCharacters] =
    useState(false);
  const [generatedUrl, setGeneratedUrl] = useState("");

  useEffect(() => {
    setInput(localStorage.getItem("icalUrl") ?? "");
    setRemoveAllDay(localStorage.getItem("removeAllDay") === "true");
    setRemoveFullSpan(localStorage.getItem("removeFullSpan") === "true");
    setRemoveFloatingCharacters(
      localStorage.getItem("removeFloatingCharacters") === "true",
    );
  }, []);

  function generate() {
    if (!input) return;

    const url = new URL(input);

    const key = url.searchParams.get("key");
    const culture = url.searchParams.get("culture") ?? "en";

    const params = new URLSearchParams({
      key: key ?? "",
      culture,
      removeAllDayEvents: String(removeAllDay),
      removeFullSpan: String(removeFullSpan),
      removeFloatingCharacters: String(removeFloatingCharacters),
    });

    const finalUrl = `${window.location.origin}/api/ical?${params}`;
    setGeneratedUrl(finalUrl);
    navigator.clipboard.writeText(finalUrl);
  }

  return (
    <main className="flex min-h-screen max-w-xl flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Windesheim iCal Mod</h1>

      <input
        type="text"
        placeholder="Paste Windesheim iCal link"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          localStorage.setItem("icalUrl", e.target.value);
        }}
      />

      {input.length > 0 && (
        <>
          <h2 className="text-lg font-semibold">Options</h2>

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={removeAllDay}
                onChange={() => {
                  setRemoveAllDay(!removeAllDay);
                  localStorage.setItem("removeAllDay", String(!removeAllDay));
                }}
              />
              Remove 00:00 - 00:00 events
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={removeFullSpan}
                onChange={() => {
                  setRemoveFullSpan(!removeFullSpan);
                  localStorage.setItem(
                    "removeFullSpan",
                    String(!removeFullSpan),
                  );
                }}
              />
              Remove 08:30 - 22:30 events
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={removeFloatingCharacters}
                onChange={() => {
                  setRemoveFloatingCharacters(!removeFloatingCharacters);
                  localStorage.setItem(
                    "removeFloatingCharacters",
                    String(!removeFloatingCharacters),
                  );
                }}
              />
              Remove floating characters
            </label>
          </div>

          <button onClick={generate}>Create link</button>
        </>
      )}

      {generatedUrl && <p>Link copied to clipboard.</p>}
    </main>
  );
}
