import PDFDocument from "pdfkit";
import type { ITrip, IActivity, IDay, IHotel } from "../models/Trip.js";

// Some fields appear in the design spec but are not (yet) on the Trip model.
// Read them defensively so the PDF works whether or not they're present.
type TripLike = ITrip & { originCity?: string; startDate?: string | Date };

// ---- palette / layout ----------------------------------------------------
const ACCENT = "#E5481E"; // terracotta
const INK = "#1A1A1A";
const INK2 = "#555555";
const GREY = "#9A958C";
const LINE = "#E5E2DC";

const MARGIN = 50;
const PAGE_W = 595.28; // A4 portrait
const PAGE_H = 841.89;
const CONTENT_W = PAGE_W - MARGIN * 2;
const RIGHT = PAGE_W - MARGIN;

// pdfkit's built-in Helvetica/Courier only speak WinAnsi. CJK, arrows, etc.
// would render as broken glyphs, so map the common ones and strip the rest.
// (No font files — we stay on the built-in font families per spec.)
const WINANSI_SPECIALS = new Set([
  0x2022, 0x2018, 0x2019, 0x201c, 0x201d, 0x2013, 0x2014, 0x2026, 0x2020,
  0x2021, 0x2030, 0x20ac, 0x2122, 0x0152, 0x0153, 0x0160, 0x0161, 0x0178,
  0x017d, 0x017e, 0x0192, 0x02c6, 0x02dc,
]);

function safe(input: string): string {
  return Array.from(input ?? "")
    .map((ch) => {
      const cp = ch.codePointAt(0)!;
      if (cp === 0x2192) return "->"; // → has no WinAnsi glyph
      if (cp >= 0x20 && cp <= 0x7e) return ch; // ASCII
      if (cp >= 0xa0 && cp <= 0xff) return ch; // Latin-1 supplement
      if (WINANSI_SPECIALS.has(cp)) return ch; // smart quotes, dashes, bullet…
      return ""; // strip anything the font can't encode (e.g. kanji)
    })
    .join("");
}

const usd = (n: number): string => "$" + Math.round(n).toLocaleString("en-US");
const cost = (n: number): string => (n <= 0 ? "Free" : usd(n));

const TIER_LEVEL: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  budget: 1,
  mid: 2,
  luxury: 3,
};
// Filled bullets only — • (U+2022) is WinAnsi-safe; ● (U+25CF) is not.
const dots = (tier: string): string => "•".repeat(TIER_LEVEL[tier] ?? 1);

function confidenceWord(c: number): string {
  if (c >= 0.85) return "STRONG FIT";
  if (c >= 0.7) return "SOLID";
  if (c >= 0.6) return "REASONABLE";
  return "EXPERIMENTAL";
}

const todLabel: Record<string, string> = {
  morning: "MORNING",
  afternoon: "AFTERNOON",
  evening: "EVENING",
};

// Optional per-day calendar date, only if the trip carries a start date.
function dayDate(trip: TripLike, dayNumber: number): Date | null {
  if (!trip.startDate) return null;
  const d = new Date(trip.startDate);
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + (dayNumber - 1));
  return d;
}

// --------------------------------------------------------------------------
export function buildTripPdf(trip: ITrip): PDFKit.PDFDocument {
  const t = trip as TripLike;
  const doc = new PDFDocument({
    size: "A4",
    margin: MARGIN,
    bufferPages: true, // needed so we can stamp "page i / n" footers at the end
    info: {
      Title: `${t.destination} itinerary`,
      Author: "Wayfare",
    },
  });

  drawCover(doc, t);
  drawBudget(doc, t);

  const days = [...t.itinerary.days].sort((a, b) => a.dayNumber - b.dayNumber);
  for (const day of days) drawDay(doc, t, day);

  drawHotels(doc, t.hotels);
  drawFooters(doc);

  return doc;
}

// ---- helpers --------------------------------------------------------------
function monoLabel(doc: PDFKit.PDFDocument, text: string, color = GREY, size = 9) {
  doc
    .font("Courier")
    .fontSize(size)
    .fillColor(color)
    .text(safe(text), { characterSpacing: 1 });
}

function hr(doc: PDFKit.PDFDocument, gap = 12) {
  doc.moveDown(0.4);
  const y = doc.y;
  doc.save().strokeColor(LINE).lineWidth(1).moveTo(MARGIN, y).lineTo(RIGHT, y).stroke().restore();
  doc.y = y + gap;
}

// label left / value right on a single mono row
function moneyRow(doc: PDFKit.PDFDocument, label: string, value: string) {
  const y = doc.y;
  doc.font("Courier").fontSize(10).fillColor(INK2).text(safe(label.toUpperCase()), MARGIN, y);
  doc
    .font("Courier")
    .fontSize(10)
    .fillColor(INK)
    .text(safe(value), MARGIN, y, { width: CONTENT_W, align: "right" });
  doc.moveDown(0.5);
}

// ---- sections -------------------------------------------------------------
function drawCover(doc: PDFKit.PDFDocument, t: TripLike) {
  doc.y = MARGIN + 10;

  // WAYFARE / ITINERARY stacked mono labels
  doc.font("Courier").fontSize(9).fillColor(INK2).text("WAYFARE", { characterSpacing: 2 });
  doc.moveDown(0.2);
  doc.font("Courier").fontSize(9).fillColor(ACCENT).text("ITINERARY", { characterSpacing: 2 });
  doc.moveDown(1.1);

  // Title: [Origin] -> [Destination] when an origin is known.
  const title = t.originCity ? `${t.originCity} → ${t.destination}` : t.destination;
  doc.font("Helvetica-Bold").fontSize(32).fillColor(INK).text(safe(title), { lineGap: 2 });
  doc.moveDown(0.6);

  // Subtitle: N DAYS / ••• TIER / Vx
  const subtitle = `${t.numDays} DAYS   /   ${dots(t.budgetTier)} ${t.budgetTier.toUpperCase()}   /   V${t.version}`;
  doc.font("Courier").fontSize(10).fillColor(INK2).text(safe(subtitle), { characterSpacing: 0.5 });
  doc.moveDown(0.5);

  // Interests as a comma-separated mono line
  if (t.interests.length) {
    doc
      .font("Courier")
      .fontSize(9)
      .fillColor(GREY)
      .text(safe(t.interests.join("  /  ")), { characterSpacing: 0.5 });
  }

  doc.moveDown(1.2);
  const generated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.font("Courier").fontSize(8).fillColor(GREY).text(safe(`Generated ${generated}`));

  hr(doc, 18);
}

function drawBudget(doc: PDFKit.PDFDocument, t: TripLike) {
  const b = t.budget;
  monoLabel(doc, "BUDGET ESTIMATE", GREY, 9);
  doc.moveDown(0.3);
  doc.font("Courier-Bold").fontSize(22).fillColor(INK).text(safe(usd(b.total)));
  doc.moveDown(0.7);

  moneyRow(doc, "Flights", usd(b.flights));
  moneyRow(doc, "Stay", usd(b.accommodation));
  moneyRow(doc, "Food", usd(b.food));
  moneyRow(doc, "Activities", usd(b.activities));
}

function drawDay(doc: PDFKit.PDFDocument, t: TripLike, day: IDay) {
  doc.addPage(); // each day starts fresh — clean, no split headers

  // DAY 01  WEEKDAY  Mon D  (accent on the DAY label, dark on the rest)
  const dd = String(day.dayNumber).padStart(2, "0");
  doc.font("Courier-Bold").fontSize(13).fillColor(ACCENT).text(`DAY ${dd}`, MARGIN, doc.y, {
    continued: true,
    characterSpacing: 1,
  });
  const date = dayDate(t, day.dayNumber);
  if (date) {
    const weekday = date.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
    const md = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    doc.fillColor(INK).font("Courier").text(safe(`   ${weekday}   ${md}`), { characterSpacing: 1 });
  } else {
    doc.text("", { continued: false }); // close the continued run
  }
  hr(doc, 16);

  if (day.activities.length === 0) {
    doc.font("Helvetica-Oblique").fontSize(11).fillColor(GREY).text("No activities planned for this day.");
    return;
  }

  const ordered = orderByTimeOfDay(day.activities);
  ordered.forEach((a, i) => {
    if (i > 0) doc.moveDown(0.8);
    drawActivity(doc, a);
  });
}

const TOD_ORDER: Record<string, number> = { morning: 0, afternoon: 1, evening: 2 };
function orderByTimeOfDay(activities: IActivity[]): IActivity[] {
  return [...activities].sort((a, b) => (TOD_ORDER[a.timeOfDay] ?? 3) - (TOD_ORDER[b.timeOfDay] ?? 3));
}

function drawActivity(doc: PDFKit.PDFDocument, a: IActivity) {
  // time-of-day mono label
  doc
    .font("Courier")
    .fontSize(8)
    .fillColor(GREY)
    .text(safe(todLabel[a.timeOfDay] ?? a.timeOfDay.toUpperCase()), { characterSpacing: 1 });
  doc.moveDown(0.15);

  // title (left) + cost (right) on the same baseline
  const y = doc.y;
  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor(INK)
    .text(safe(a.title), MARGIN, y, { width: CONTENT_W - 70 });
  const afterTitle = doc.y;
  doc
    .font("Courier")
    .fontSize(11)
    .fillColor(INK)
    .text(safe(cost(a.estCostUsd)), MARGIN, y, { width: CONTENT_W, align: "right" });
  doc.y = Math.max(afterTitle, doc.y);
  doc.moveDown(0.2);

  // description
  doc.font("Helvetica").fontSize(10.5).fillColor(INK2).text(safe(a.description), { width: CONTENT_W, lineGap: 1 });
  doc.moveDown(0.25);

  // confidence — worded label only (no glyph in print)
  doc
    .font("Courier")
    .fontSize(8)
    .fillColor(ACCENT)
    .text(safe(confidenceWord(a.confidence)), { characterSpacing: 1 });
  doc.moveDown(0.2);

  // reasoning, italic + indented
  doc
    .font("Helvetica-Oblique")
    .fontSize(9.5)
    .fillColor(GREY)
    .text(safe(`Why this: ${a.reasoning}`), MARGIN + 14, doc.y, { width: CONTENT_W - 14, lineGap: 1 });
}

function drawHotels(doc: PDFKit.PDFDocument, hotels: IHotel[]) {
  doc.addPage();
  monoLabel(doc, "WHERE TO STAY", GREY, 9);
  hr(doc, 16);

  hotels.forEach((h, i) => {
    if (i > 0) doc.moveDown(0.8);
    doc.font("Helvetica-Bold").fontSize(13).fillColor(INK).text(safe(h.name));
    doc.moveDown(0.15);
    doc
      .font("Courier")
      .fontSize(9)
      .fillColor(INK2)
      .text(safe(`${dots(h.tier)} ${h.tier.toUpperCase()}`), { characterSpacing: 1 });
    doc.moveDown(0.15);
    doc.font("Helvetica").fontSize(10.5).fillColor(INK2).text(safe(h.reasoning), { width: CONTENT_W, lineGap: 1 });
  });

  doc.moveDown(1.4);
  doc
    .font("Helvetica-Oblique")
    .fontSize(9.5)
    .fillColor(GREY)
    .text("Suggestions only — not bookable in Wayfare.");
}

// Page footer on every page: WAYFARE (left) / page i / n (right)
function drawFooters(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();
  const total = range.count;
  for (let i = 0; i < total; i++) {
    doc.switchToPage(range.start + i);
    const y = PAGE_H - 38;
    // The footer sits below the bottom margin. Writing there makes pdfkit
    // auto-append a fresh page per stamp (doubling the page count), so drop the
    // bottom margin to 0 for the duration of the write, then restore it.
    const savedBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.font("Courier").fontSize(8).fillColor(GREY);
    doc.text("WAYFARE", MARGIN, y, { lineBreak: false, characterSpacing: 1.5 });
    doc.text(`${i + 1} / ${total}`, MARGIN, y, { width: CONTENT_W, align: "right", lineBreak: false });
    doc.page.margins.bottom = savedBottom;
  }
}
