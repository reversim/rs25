import { findSessionById } from "./agendaHelpers";

const LIKED_TALKS_KEY = "reversim-liked-talks";
const FILTERS_KEY = "reversim-filters";

export function getSavedFilters(): {
  themes: string[];
  rooms: string[];
  favorites: string[];
} {
  const defaultFilters = {
    themes: [],
    rooms: [],
    favorites: [],
  };

  try {
    return (
      JSON.parse(localStorage.getItem(FILTERS_KEY) || "") || defaultFilters
    );
  } catch {
    return defaultFilters;
  }
}

export function getLikedTalks(): string[] {
  try {
    const liked = localStorage.getItem(LIKED_TALKS_KEY);
    return liked ? JSON.parse(liked) : [];
  } catch (e) {
    console.error("Error reading liked talks from localStorage:", e);
    return [];
  }
}

export const getSessionTrackName = (session: any): string | null => {
  if (session?.isIgnites) return "Ignites";

  const trackCategory = session.categories?.find(
    (c: any) => c.name === "Track",
  );
  const item = trackCategory?.categoryItems?.[0];
  if (!item) return null;
  const raw = item.name;
  if (raw === "AI Apps" || raw === "AI Infra") return "AI";
  return raw;
};

export function filterHandler({
  card,
  sessionsData,
  selectedThemes,
  selectedRooms,
  isFavoritesFilterActive,
  likedTalks,
  breakContent,
}: {
  card: Element;
  breakContent?: Element | null;
  sessionsData: any[];
  selectedThemes: string[];
  selectedRooms: string[];
  isFavoritesFilterActive: boolean;
  likedTalks: string[];
}) {
  const sessionId = card.getAttribute("data-talk-id");
  const session = findSessionById(sessionId!, sessionsData);
  const applyStylesCard = breakContent || card;

  if (session?.id && session?.room) {
    // Check theme match
    const track = getSessionTrackName(session);
    const matchesTheme =
      selectedThemes.length === 0 || (track && selectedThemes.includes(track));

    // Check room match
    const matchesRoom =
      selectedRooms.length === 0 || selectedRooms.includes(session.room);

    // Check favorites match
    const matchesFavorites =
      !isFavoritesFilterActive || likedTalks.includes(sessionId!);

    if (matchesTheme && matchesRoom && matchesFavorites) {
      (applyStylesCard as HTMLElement).style.opacity = "1";
      (applyStylesCard as HTMLElement).style.transform = "scale(1)";
      (applyStylesCard as HTMLElement).style.transition = "all 0.3s ease";

      const likeBtn = (applyStylesCard as HTMLElement).querySelector(
        ".like-btn",
      );
      if (likeBtn && likeBtn instanceof HTMLButtonElement) {
        likeBtn.classList.remove("hidden");
        likeBtn.disabled = true;
      }
    } else {
      (applyStylesCard as HTMLElement).style.opacity = "0.2";
      (applyStylesCard as HTMLElement).style.transform = "scale(0.95)";
      (applyStylesCard as HTMLElement).style.transition = "all 0.3s ease";
      (applyStylesCard as HTMLElement).classList.add("hidden");

      // If any children have the class 'like-btn', add the 'hidden' class to that child as well
      const likeBtn = (applyStylesCard as HTMLElement).querySelector(
        ".like-btn",
      );
      if (likeBtn && likeBtn instanceof HTMLButtonElement) {
        likeBtn.classList.add("hidden");
        likeBtn.disabled = true;
      }
    }

    // If no filters are applied, show the like button
    if (
      selectedThemes.length === 0 &&
      selectedRooms.length === 0 &&
      !isFavoritesFilterActive
    ) {
      const likeBtn = (applyStylesCard as HTMLElement).querySelector(
        ".like-btn",
      );

      if (likeBtn && likeBtn instanceof HTMLButtonElement) {
        likeBtn.classList.remove("hidden");
        likeBtn.disabled = false;
      }
    }
  }
}

export function applyFilters(sessionsData: any[]): void {
  // Get all selected values from checkboxes
  const selectedThemes = Array.from(
    document.querySelectorAll("#theme-filters input:checked"),
  ).map((cb) => (cb as HTMLInputElement).value);
  const selectedRooms = Array.from(
    document.querySelectorAll("#room-filters input:checked"),
  ).map((cb) => (cb as HTMLInputElement).value);

  const selectedFavorites = Array.from(
    document.querySelectorAll("#favorite-filters input:checked"),
  ).map((cb) => (cb as HTMLInputElement).value);

  // Persist selections (single key)
  try {
    localStorage.setItem(
      FILTERS_KEY,
      JSON.stringify({
        themes: selectedThemes,
        rooms: selectedRooms,
        favorites: selectedFavorites,
      }),
    );
  } catch {
    // ignore
  }

  // Update Filters button badge with active count
  try {
    const activeCount =
      selectedThemes.length +
      selectedRooms.length +
      (selectedFavorites.length > 0 ? 1 : 0);
    const btn = document.querySelector(
      ".filter-toggle-btn",
    ) as HTMLElement | null;
    if (btn) {
      let badge = btn.querySelector(".filter-badge") as HTMLElement | null;
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "filter-badge";
        btn.prepend(badge);
      }
      if (activeCount > 0) {
        badge.textContent = `(${String(activeCount)})`;
        badge.style.display = "inline-flex";
      } else {
        badge.textContent = "";
        badge.style.display = "none";
      }
    }
  } catch {
    // ignore
  }

  // Get liked talks for favorites filter
  const likedTalks = getLikedTalks();
  const isFavoritesFilterActive = selectedFavorites.length > 0;

  // Filter desktop cards (including lightning talk cards)
  const desktopCards = document.querySelectorAll(".session-content");
  const desktopBreaks = document.querySelectorAll(".full-width-session-cell");
  const desktopBreakCells = document.querySelectorAll(".break-session-cell");

  // Filter mobile cards (including lightning talk cards)
  const mobileCards = document.querySelectorAll(".session-card");

  // Apply filters to desktop session cards
  [...desktopCards, ...desktopBreaks].forEach((card) => {
    filterHandler({
      card,
      sessionsData,
      selectedThemes,
      selectedRooms,
      isFavoritesFilterActive,
      likedTalks,
    });
  });

  // Apply filters to desktop full-width break session cells
  desktopBreakCells.forEach((cell) => {
    // Apply visual changes to the content only (like regular session cards)
    const breakContent = cell.querySelector(".full-width-session-cell");

    filterHandler({
      card: cell,
      isFavoritesFilterActive,
      likedTalks,
      selectedRooms,
      selectedThemes,
      sessionsData,
      breakContent,
    });
  });

  // Apply filters to mobile session cards
  mobileCards.forEach((card) => {
    filterHandler({
      card,
      sessionsData,
      selectedThemes,
      selectedRooms,
      isFavoritesFilterActive,
      likedTalks,
    });
  });
}

export function clearAllFilters(): void {
  // Uncheck all checkboxes
  document
    .querySelectorAll('.filter-section input[type="checkbox"]')
    .forEach((checkbox) => {
      (checkbox as HTMLInputElement).checked = false;
    });

  // Clear persisted selections (single key)
  try {
    localStorage.removeItem(FILTERS_KEY);
  } catch {
    // ignore
  }

  // Reset all cards to visible
  const allCards = document.querySelectorAll(
    ".session-content, .full-width-session-cell, .break-session, .session-card",
  );
  allCards.forEach((card) => {
    (card as HTMLElement).style.opacity = "1";
    (card as HTMLElement).style.transform = "scale(1)";
    (card as HTMLElement).style.transition = "all 0.3s ease";

    const likeBtn = (card as HTMLElement).querySelector(".like-btn");
    if (likeBtn && likeBtn instanceof HTMLButtonElement) {
      likeBtn.classList.remove("hidden");
      likeBtn.disabled = false;
    }
  });

  // Filters cleared successfully
  try {
    const btn = document.querySelector(
      ".filter-toggle-btn",
    ) as HTMLElement | null;
    const badge = btn?.querySelector(".filter-badge") as HTMLElement | null;
    if (badge) {
      badge.textContent = "";
      badge.style.display = "none";
    }
  } catch {
    // ignore
  }
}

export function toggleFilters(): void {
  const filterSection = document.getElementById("filter-section");
  const toggleBtn = document.querySelector(".filter-toggle-btn");

  if (filterSection && filterSection.style.display === "none") {
    filterSection.style.display = "block";
    toggleBtn?.classList.add("active");
  } else if (filterSection) {
    filterSection.style.display = "none";
    toggleBtn?.classList.remove("active");
  }
}

export function initializeFilters(sessionsData: any[]): void {
  // Restore saved selections into checkboxes (single key)
  const saved = getSavedFilters();
  const filterCheckboxes: { id: string; values: string[] }[] = [
    { id: "#theme-filters", values: saved.themes },
    { id: "#room-filters", values: saved.rooms },
    { id: "#favorite-filters", values: saved.favorites },
  ];

  filterCheckboxes.forEach(({ id, values }) => {
    if (values.length === 0) return;
    document.querySelectorAll(`${id} input[type="checkbox"]`).forEach((cb) => {
      const input = cb as HTMLInputElement;
      input.checked = values.includes(input.value);
    });
  });

  // Apply with restored state
  applyFilters(sessionsData);

  // Make functions globally available
  (window as any).applyFilters = () => applyFilters(sessionsData);
  (window as any).clearAllFilters = clearAllFilters;
  (window as any).toggleFilters = toggleFilters;
}
