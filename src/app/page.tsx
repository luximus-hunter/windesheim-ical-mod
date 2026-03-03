"use client";

import { useState, useEffect } from "react";

const URL_REGEX = /^https:\/\/ical\.windesheim\.nl\/api\/Rooster-v10[^&]*/;

export default function Home() {
  const [input, setInput] = useState("");
  const [removeAllDay, setRemoveAllDay] = useState(false);
  const [removeFullSpan, setRemoveFullSpan] = useState(false);
  const [removeFloatingCharacters, setRemoveFloatingCharacters] =
    useState(false);
  const [removeTime, setRemoveTime] = useState(false);
  const [removeRoom, setRemoveRoom] = useState(false);
  const [removeClass, setRemoveClass] = useState(false);
  const [removeTeachers, setRemoveTeachers] = useState(false);
  const [removeOeEvLUoE, setRemoveOeEvLUoE] = useState(false);

  const isValid = URL_REGEX.test(input);

  useEffect(() => {
    setInput(localStorage.getItem("icalUrl") ?? "");
    setRemoveAllDay(localStorage.getItem("removeAllDay") === "true");
    setRemoveFullSpan(localStorage.getItem("removeFullSpan") === "true");
    setRemoveFloatingCharacters(
      localStorage.getItem("removeFloatingCharacters") === "true",
    );
    setRemoveTime(localStorage.getItem("removeTime") === "true");
    setRemoveRoom(localStorage.getItem("removeRoom") === "true");
    setRemoveClass(localStorage.getItem("removeClass") === "true");
    setRemoveTeachers(localStorage.getItem("removeTeachers") === "true");
    setRemoveOeEvLUoE(localStorage.getItem("removeOeEvLUoE") === "true");
  }, []);

  function generate() {
    const url = new URL(input);
    const key = url.searchParams.get("key");
    const culture = url.searchParams.get("culture");

    if (!key || !culture) return;

    const params = new URLSearchParams({
      key: key ?? "",
      culture,
      removeAllDayEvents: String(removeAllDay),
      removeFullSpan: String(removeFullSpan),
      removeFloatingCharacters: String(removeFloatingCharacters),
      removeTime: String(removeTime),
      removeRoom: String(removeRoom),
      removeClass: String(removeClass),
      removeTeachers: String(removeTeachers),
      removeOeEvLUoE: String(removeOeEvLUoE),
    });

    const finalUrl = `${window.location.origin}/api/ical?${params}`;
    navigator.clipboard.writeText(finalUrl);
    alert("Link copied to clipboard.");
  }

  return (
    <main className="flex min-h-screen max-w-xl flex-col gap-4 p-4 select-none">
      <h1 className="text-2xl font-bold">Windesheim iCal Mod</h1>
      <p>Improve your Windesheim schedule in other calendar apps.</p>

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
          <h2 className="text-lg font-semibold">Event Removal</h2>

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
              Remove 00:00 - 00:00 events (all-day events)
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
          </div>

          <h2 className="text-lg font-semibold">Formatting</h2>

          <div className="flex flex-col gap-2">
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

          <h2 className="text-lg font-semibold">Description Cleanup</h2>

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={removeTime}
                onChange={() => {
                  setRemoveTime(!removeTime);
                  localStorage.setItem("removeTime", String(!removeTime));
                }}
              />
              Remove time (this is already the event time, so it's redundant)
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={removeRoom}
                onChange={() => {
                  setRemoveRoom(!removeRoom);
                  localStorage.setItem("removeRoom", String(!removeRoom));
                }}
              />
              Remove room (this is already the event location, so it's
              redundant)
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={removeClass}
                onChange={() => {
                  setRemoveClass(!removeClass);
                  localStorage.setItem("removeClass", String(!removeClass));
                }}
              />
              Remove class
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={removeTeachers}
                onChange={() => {
                  setRemoveTeachers(!removeTeachers);
                  localStorage.setItem(
                    "removeTeachers",
                    String(!removeTeachers),
                  );
                }}
              />
              Remove teacher(s)
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={removeOeEvLUoE}
                onChange={() => {
                  setRemoveOeEvLUoE(!removeOeEvLUoE);
                  localStorage.setItem(
                    "removeOeEvLUoE",
                    String(!removeOeEvLUoE),
                  );
                }}
              />
              Remove OE/EvL/UoE
            </label>
          </div>

          <button onClick={generate} disabled={!isValid}>
            Create link
          </button>
        </>
      )}
    </main>
  );
}
