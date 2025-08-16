import type { AgendaSession } from "./getAgenda";

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
  if (session.title === "Keynote placeholder" || session.title === "Keynote Placeholder") return "keynote";
  const trackCategory = session.categories?.find((c) => c.name === "Track");
  const item = trackCategory?.categoryItems?.[0];
  if (!item) return null;
  const raw = item.name;
  if (raw === "AI Apps" || raw === "AI Infra") return "AI";
  return raw;
}

// Helper function to create URL-friendly slug
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

// Helper function to create speaker URL
export function createSpeakerUrl(speakerName: string): string {
  return `/speaker/${createSlug(speakerName)}`;
}

// Helper function to create talk URL
export function createTalkUrl(talkTitle: string): string {
  return `/session/${createSlug(talkTitle)}`;
}

// Alias for createTalkUrl to match server-side usage
export const getTalkUrl = (session: AgendaSession): string => {
  return createTalkUrl(session.title);
};

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

// Client-side helper functions for browser environment
export const clientHelpers = {
  // Helper function to get session track name (client-side version)
  getSessionTrackName: (session: any): string | null => {
    const trackCategory = session.categories?.find(
      (c: any) => c.name === "Track"
    );
    const item = trackCategory?.categoryItems?.[0];
    if (!item) return null;
    const raw = item.name;
    if (raw === "AI Apps" || raw === "AI Infra") return "AI";
    return raw;
  },

  // Helper function to get session category color (client-side version)
  getSessionCategoryColor: (session: any): string => {
    const track = clientHelpers.getSessionTrackName(session);
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
  },

  // Helper function to format time
  formatTime: (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  // Helper function to format date
  formatDate: (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  },

  // Helper function to create URL-friendly slug
  createSlug: (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  },

  // Helper function to create speaker URL
  createSpeakerUrl: (speakerName: string): string => {
    return `/speaker/${clientHelpers.createSlug(speakerName)}`;
  },

  // Helper function to create talk URL
  createTalkUrl: (talkTitle: string): string => {
    return `/session/${clientHelpers.createSlug(talkTitle)}`;
  },

  // Find session by ID
  findSessionById: (sessionId: string, sessionsData: any[]): any => {
    return sessionsData.find((session) => session.id === sessionId);
  },
};

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
