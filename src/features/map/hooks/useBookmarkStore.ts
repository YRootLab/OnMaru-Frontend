'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'sonner';
import { hasAuthenticatedUser } from '@/features/auth/privateState';

export interface BookmarkedPlace {
  id: string;
  name: string;
  category?: string;
  addr?: string;
  image?: string;
  lat?: number;
  lng?: number;
  savedAt: number;
}

interface BookmarkState {
  bookmarks: BookmarkedPlace[];
  toggleBookmark: (place: Omit<BookmarkedPlace, 'savedAt'>) => boolean;
  isBookmarked: (id: string) => boolean;
  removeBookmark: (id: string) => void;
  clearAllBookmarks: () => void;
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: [],

      toggleBookmark: (place) => {
        if (!hasAuthenticatedUser()) {
          toast.info('로그인해주세요.');
          return false;
        }
        const { bookmarks } = get();
        const exists = bookmarks.some((b) => b.id === place.id);
        if (exists) {
          set({ bookmarks: bookmarks.filter((b) => b.id !== place.id) });
          return false;
        } else {
          set({
            bookmarks: [
              {
                ...place,
                savedAt: Date.now(),
              },
              ...bookmarks,
            ],
          });
          return true;
        }
      },

      isBookmarked: (id) => {
        return get().bookmarks.some((b) => b.id === id);
      },

      removeBookmark: (id) => {
        set({ bookmarks: get().bookmarks.filter((b) => b.id !== id) });
      },

      clearAllBookmarks: () => set({ bookmarks: [] }),
    }),
    {
      name: 'onmaru-place-bookmarks',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
    },
  ),
);
