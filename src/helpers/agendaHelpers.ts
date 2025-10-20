import type { AgendaSession, Cell } from "./getAgenda";
import slugify from "slug";

// Helper function for getting category color (server-side version)
export function getTalkCategoryColor(session: AgendaSession): string {
  const track = getTrackName(session);

  if (!track) return "#506592";

  const categoryName = track.toLowerCase();
  const colorMap: Record<string, string> = {
    frontend: "#fd6a82",
    front: "#fd6a82",
    backend: "#f78750",
    back: "#f78750",
    ai: "#81c47a",
    "artificial intelligence": "#81c47a",
    data: "#81c47a",
    mobile: "#506592",
    devops: "#9d4edd",
    security: "#e63946",
    "ui/ux": "#f72585",
    design: "#f72585",
    ignites: "#f7ab22",
    opening: "#7ebec8",
    keynote: "#7ebec8",
    registration: "#5065926e",
    dining: "transparent",
  };

  return colorMap[categoryName] || "#506592";
}

// Helper function to get track name from session
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
  const trackCategory = session.categories?.find((c) => c.name === "Track");
  const item = trackCategory?.categoryItems?.[0];
  if (!item) return null;
  const raw = item.name;
  if (raw === "AI Apps" || raw === "AI Infra") return "AI";
  return raw;
}

// Helper function to create speaker URL
export function createSpeakerUrl(speakerName: string): string {
  return `/speaker/${slugify(speakerName)}`;
}

// Helper function to create session URL
export function createSessionUrl(talkTitle: string): string {
  return `/session/${slugify(talkTitle)}`;
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

// Helper function to get session track name (client-side version)
export function getSessionTrackName(session: any): string | null {
  const trackCategory = session.categories?.find(
    (c: any) => c.name === "Track",
  );
  const item = trackCategory?.categoryItems?.[0];
  if (!item) return null;
  const raw = item.name;
  if (raw === "AI Apps" || raw === "AI Infra") return "AI";
  return raw;
}

// Client-side helper functions for browser environment

// Helper function to get session category color (client-side version)
export function getSessionCategoryColor(session: any): string {
  const track = getSessionTrackName(session);
  if (!track) return "#506592";

  const categoryName = track.toLowerCase();
  const colorMap: Record<string, string> = {
    frontend: "#fd6a82",
    front: "#fd6a82",
    backend: "#f78750",
    back: "#f78750",
    ai: "#81c47a",
    "artificial intelligence": "#81c47a",
    data: "#81c47a",
    mobile: "#506592",
    devops: "#9d4edd",
    security: "#e63946",
    "ui/ux": "#f72585",
    design: "#f72585",
  };

  return colorMap[categoryName] || "#506592";
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
  });
}

// Find session by ID
export function findSessionById(
  sessionId: string,
  sessionsData: AgendaSession[],
): AgendaSession | { id: string; room: string } | undefined {
  if (sessionId === "lightning-2025-10-27") {
    return {
      id: "lightning-2025-10-27",
      room: "Main hall",
    };
  }
  if (sessionId === "lightning-2025-10-28") {
    return {
      id: "lightning-2025-10-28",
      room: "Main hall",
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
