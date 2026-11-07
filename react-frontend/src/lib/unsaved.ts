import { useEffect } from 'react';

const dirty = new Set<symbol>();

/** True while any form on screen holds changes that are not saved yet. */
export function hasUnsavedChanges(): boolean {
  return dirty.size > 0;
}

/**
 * Marks a form as holding unsaved work while `isDirty` is true, so an app update never reloads
 * over it without asking first.
 */
export function useUnsavedChanges(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;
    const key = Symbol('unsaved form');
    dirty.add(key);
    return () => {
      dirty.delete(key);
    };
  }, [isDirty]);
}
