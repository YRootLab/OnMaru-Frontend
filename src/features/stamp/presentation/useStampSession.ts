'use client';

import { useCallback, useEffect } from 'react';
import { loadPersonalStampBook } from '../application/loadStampBook';
import type { StampCatalogResponse } from '../domain/models';
import { browserLegacyStampStorage } from '../infrastructure/legacyStampStorage';
import { stampHttpRepository } from '../infrastructure/stampHttpRepository';
import { useStampStore } from './useStampStore';

interface UseStampSessionOptions {
  authLoading: boolean;
  loggedIn: boolean;
  initialCatalog?: StampCatalogResponse | null;
}

export function useStampSession({
  authLoading,
  loggedIn,
  initialCatalog = null,
}: UseStampSessionOptions) {
  const catalog = useStampStore((state) => state.catalog);
  const book = useStampStore((state) => state.book);
  const catalogLoading = useStampStore((state) => state.catalogLoading);
  const bookLoading = useStampStore((state) => state.bookLoading);
  const catalogError = useStampStore((state) => state.catalogError);
  const bookError = useStampStore((state) => state.bookError);

  const refreshCatalog = useCallback(async () => {
    useStampStore.getState().setCatalogLoading(true);
    try {
      const nextCatalog = await stampHttpRepository.getCatalog();
      useStampStore.getState().setCatalog(nextCatalog);
      return nextCatalog;
    } catch (error) {
      useStampStore.getState().setCatalogError(error);
      throw error;
    } finally {
      useStampStore.getState().setCatalogLoading(false);
    }
  }, []);

  const refreshBook = useCallback(async () => {
    useStampStore.getState().setBookLoading(true);
    try {
      const nextBook = await loadPersonalStampBook(
        stampHttpRepository,
        browserLegacyStampStorage,
      );
      useStampStore.getState().setBook(nextBook);
      return nextBook;
    } catch (error) {
      useStampStore.getState().setBookError(error);
      throw error;
    } finally {
      useStampStore.getState().setBookLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialCatalog) useStampStore.getState().setCatalog(initialCatalog);
  }, [initialCatalog]);

  useEffect(() => {
    if (!initialCatalog && !useStampStore.getState().catalog) {
      void refreshCatalog().catch(() => undefined);
    }
  }, [initialCatalog, refreshCatalog]);

  useEffect(() => {
    if (authLoading) return;
    if (!loggedIn) {
      useStampStore.getState().clearPrivateState();
      return;
    }
    void refreshBook().catch(() => undefined);
  }, [authLoading, loggedIn, refreshBook]);

  return {
    catalog,
    book,
    catalogLoading,
    bookLoading,
    catalogError,
    bookError,
    refreshCatalog,
    refreshBook,
  };
}
