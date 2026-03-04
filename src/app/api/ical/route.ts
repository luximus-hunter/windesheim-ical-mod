import { NextRequest } from "next/server";
import ICAL from "ical.js";

const DUTCH_TIME_ZONE = "Europe/Amsterdam";
const FLOATING_CHARACTERS_ARRAY = [" \\,", " \\.", " ,", " ."];

function getTimePartsInTimeZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);

  return { hour, minute };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const key = searchParams.get("key");
  const culture = searchParams.get("culture") ?? "en";

  // Event Removal options
  const removeAllDay = searchParams.get("removeAllDayEvents") === "true";
  const removeFullSpan = searchParams.get("removeFullSpan") === "true";

  // Formatting options
  const removeFloatingCharacters =
    searchParams.get("removeFloatingCharacters") === "true";
  const teachersAsAttendees =
    searchParams.get("teachersAsAttendees") === "true";

  // Description Cleanup
  const removeTime = searchParams.get("removeTime") === "true";
  const removeRoom = searchParams.get("removeRoom") === "true";
  const removeClass = searchParams.get("removeClass") === "true";
  const removeTeachers = searchParams.get("removeTeachers") === "true";
  const removeOeEvLUoE = searchParams.get("removeOeEvLUoE") === "true";

  if (!key) {
    return new Response("Missing key", { status: 400 });
  }

  const sourceUrl = `https://ical.windesheim.nl/api/Rooster-v10?culture=${culture}&key=${key}`;

  const res = await fetch(sourceUrl);
  const rawIcs = await res.text();

  const jcalData = ICAL.parse(rawIcs);
  const comp = new ICAL.Component(jcalData);
  const events = comp.getAllSubcomponents("vevent");

  // Create output calendar
  const outputComp = new ICAL.Component("vcalendar");
  outputComp.addPropertyWithValue("version", "2.0");
  outputComp.addPropertyWithValue(
    "prodid",
    comp.getFirstPropertyValue("prodid") || "-//Windesheim//iCal Modifier//EN",
  );

  for (const e of events) {
    const event = new ICAL.Event(e);

    let start: Date;
    let end: Date;

    try {
      if (!event.startDate || !event.endDate) continue;

      start = event.startDate.toJSDate();
      end = event.endDate.toJSDate();
    } catch (err) {
      // Skip events with malformed dates
      continue;
    }

    const startTime = getTimePartsInTimeZone(start, DUTCH_TIME_ZONE);
    const endTime = getTimePartsInTimeZone(end, DUTCH_TIME_ZONE);

    const isDateOnlyEvent =
      !!event.startDate?.isDate && !!event.endDate?.isDate;

    // Remove 00:00–00:00
    if (
      removeAllDay &&
      (isDateOnlyEvent ||
        (startTime.hour === 0 &&
          startTime.minute === 0 &&
          endTime.hour === 0 &&
          endTime.minute === 0))
    ) {
      continue;
    }

    // Remove 08:30–22:30
    if (
      removeFullSpan &&
      startTime.hour === 8 &&
      startTime.minute === 30 &&
      endTime.hour === 22 &&
      endTime.minute === 30
    ) {
      continue;
    }

    // Remove floating characters
    // Event names can have " ." or " ," or any combination of these.
    // If removeFloatingCharacters is enabled, we remove these from the end of the event name.
    if (removeFloatingCharacters) {
      const summary = event.summary || "";
      let modifiedSummary = summary;

      for (const chars of FLOATING_CHARACTERS_ARRAY) {
        const regex = new RegExp(`${chars}$`);
        modifiedSummary = modifiedSummary.replace(regex, "");
      }
      e.updatePropertyWithValue("summary", modifiedSummary);
    }

    const descriptionRows = event.description
      .split("\n")
      .filter((line) => line.length > 0)
      .map((line) => line.trim());

    const modifiedDescriptionRows = descriptionRows.filter((line) => {
      // CLean up description based on user preferences
      if (removeTime && line.startsWith("Time:")) return false;
      if (removeRoom && line.startsWith("Room:")) return false;
      if (removeClass && line.startsWith("Class:")) return false;
      if (removeTeachers && line.startsWith("Teacher(s):")) return false;
      if (removeOeEvLUoE && line.startsWith("OE/EvL/UoE:")) return false;

      return true;
    });

    if (teachersAsAttendees) {
      const teacherLine = descriptionRows.find((line) =>
        line.startsWith("Teacher(s):"),
      );

      if (teacherLine) {
        // ORGANIZER
        const organizer = new ICAL.Property("organizer");
        organizer.setParameter("CN", "Windesheim Rooster");
        organizer.setValue("mailto:rooster@windesheim.invalid");
        e.addProperty(organizer);

        const teachers = teacherLine
          .replace("Teacher(s):", "")
          .split(";")
          .map((t) => t.trim())
          .filter((t) => t.length > 0);

        for (const teacher of teachers) {
          const attendee = new ICAL.Property("attendee");
          attendee.setParameter("CN", teacher);
          attendee.setParameter("ROLE", "REQ-PARTICIPANT");
          attendee.setParameter("PARTSTAT", "ACCEPTED");
          attendee.setParameter("CUTYPE", "INDIVIDUAL");
          attendee.setValue(
            `mailto:${teacher.toLowerCase().replace(/\s+/g, ".")}@windesheim.invalid`,
          );

          e.addProperty(attendee);
        }

        e.addPropertyWithValue("status", "CONFIRMED");
        e.addPropertyWithValue("transp", "OPAQUE");
      }
    }

    const description = modifiedDescriptionRows.join("\n");
    e.updatePropertyWithValue("description", description);

    outputComp.addSubcomponent(e);
  }

  const output = outputComp.toString();

  return new Response(output, {
    headers: {
      "Content-Type": "text/calendar",
    },
  });
}
