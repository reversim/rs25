import type { AgendaSession } from "../../types/agenda";
import { getTrackColor } from "../../config/trackColors";
import { resolveTrack } from "./resolveTrack";
import slugify from "slug";
import {
  AnalyticsEvent,
  SessionSource,
  analyticsAttrs,
} from "../../config/analytics";

// Category color from a full session (server-side version)
export function getTalkCategoryColor(session: AgendaSession): string {
  return getTrackColor(getTrackName(session));
}

// Rich track name: maps special sessions to pseudo-tracks (used for coloring),
// then falls back to the session's real Track category.
export function getTrackName(session: AgendaSession): string | null {
  if (session.isLightningGroup) return "Ignites";
  if (session.title === "Opening Words") return "opening";
  if (session.room === "Dining Hall") return "dining";
  if (session.title.startsWith("Registration")) return "Registration";
  if (
    session.title === "Keynote placeholder" ||
    session.title === "Keynote Placeholder"
  )
    return "keynote";
  return resolveTrack(session);
}

// Helper function to create speaker URL
export function createSpeakerUrl(speakerName: string): string {
  return `/speaker/${slugify(speakerName)}`;
}

// Helper function to create session URL
export function createSessionUrl(talkTitle: string): string {
  return `/session/${slugify(talkTitle)}`;
}

// Attributes for a session link in the agenda, so picking it records session_select.
export function agendaSessionAnalytics(talkTitle: string) {
  return analyticsAttrs(AnalyticsEvent.SessionSelect, {
    session_title: talkTitle,
    session_href: createSessionUrl(talkTitle),
    session_source: SessionSource.Agenda,
  });
}

// Helper function to format time
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Helper function to format date
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Plain track name (client-side version)
export function getSessionTrackName(session: any): string | null {
  return resolveTrack(session);
}

// Client-side helper functions for browser environment

// Category color from a raw session object (client-side version)
export function getSessionCategoryColor(session: any): string {
  return getTrackColor(getSessionTrackName(session));
}

// Toggle like status for a session
export function toggleLike(sessionId: string, el: Element) {
  const likedSessions = storageHelpers.getLikedTalks();
  const isCurrentlyLiked = likedSessions.includes(sessionId);

  let newLikedSessions;
  if (isCurrentlyLiked) {
    // Remove from liked
    newLikedSessions = likedSessions.filter((id) => id !== sessionId);
  } else {
    // Add to liked
    newLikedSessions = [...likedSessions, sessionId];
  }

  storageHelpers.saveLikedTalks(newLikedSessions || []);
  handleToggle(el);
  // updateAllLikeButtons();
  // updateAllTableLikeButtons();
  // updateLikedSection();
}

export function handleToggle(el: Element) {
  const sessionId = el.getAttribute("data-talk-id");

  if (!sessionId) return;

  const sessionsEl = document.querySelectorAll(
    `.like-btn[data-talk-id="${sessionId}"]`,
  );

  // change like button from mobile and desktop
  sessionsEl?.forEach((el) => {
    const isLiked = storageHelpers.isLiked(String(sessionId));
    el.classList.toggle("liked", isLiked);
    el.setAttribute("aria-pressed", String(isLiked));
  });
}

// Find session by ID
export function findSessionById(
  sessionId: string,
  sessionsData: AgendaSession[],
):
  | AgendaSession
  | { id: string; room: string; isIgnites: boolean }
  | undefined {
  // Synthetic per-day Ignites block built by buildDayGrid().
  if (sessionId.startsWith("lightning-")) {
    return {
      id: sessionId,
      room: "Main hall",
      isIgnites: true,
    };
  }
  return sessionsData.find((session) => session.id === sessionId);
}

export function getSessionDuration(startsAt: string, endsAt: string): number {
  const duration = Math.round(
    (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / (1000 * 60),
  );

  return duration;
}

// Constants for local storage
export const LIKED_TALKS_KEY = "reversim-liked-talks";

// Local storage helper functions
export const storageHelpers = {
  // Get liked talks from local storage
  getLikedTalks: (): string[] => {
    try {
      const liked = localStorage.getItem(LIKED_TALKS_KEY);
      return liked ? JSON.parse(liked) : [];
    } catch (e) {
      console.error("Error reading liked talks from localStorage:", e);
      return [];
    }
  },

  // Save liked talks to local storage
  saveLikedTalks: (likedTalkIds: string[]): void => {
    try {
      localStorage.setItem(LIKED_TALKS_KEY, JSON.stringify(likedTalkIds));
    } catch (e) {
      console.error("Error saving liked talks to localStorage:", e);
    }
  },

  // Check if talk is liked
  isLiked: (talkId: string): boolean => {
    const likedTalks = storageHelpers.getLikedTalks();
    return likedTalks.includes(talkId);
  },
};
