import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BookmarkService {
  private readonly storageKey = 'scholarship_portal_saved_ids';
  private readonly savedCountSubject = new BehaviorSubject<number>(0);
  public savedCount$: Observable<number> = this.savedCountSubject.asObservable();

  constructor() {
    this.updateCount();
  }

  /**
   * Get all saved scholarship IDs from localStorage
   */
  getSavedIds(): number[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Could not read saved scholarships from localStorage:', e);
      return [];
    }
  }

  /**
   * Check if a scholarship ID is saved
   */
  isSaved(id: number): boolean {
    const list = this.getSavedIds();
    return list.includes(id);
  }

  /**
   * Toggle save state for a scholarship ID
   */
  toggleSave(id: number): boolean {
    const list = this.getSavedIds();
    const index = list.indexOf(id);
    let nowSaved = false;

    if (index > -1) {
      list.splice(index, 1);
      nowSaved = false;
    } else {
      list.push(id);
      nowSaved = true;
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(list));
      this.updateCount();
    } catch (e) {
      console.warn('Could not update saved scholarships in localStorage:', e);
    }

    return nowSaved;
  }

  /**
   * Remove a saved scholarship ID
   */
  removeSaved(id: number): void {
    const list = this.getSavedIds().filter((itemId) => itemId !== id);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(list));
      this.updateCount();
    } catch (e) {
      console.warn('Could not remove item from localStorage:', e);
    }
  }

  /**
   * Clear all saved scholarships
   */
  clearAll(): void {
    try {
      localStorage.removeItem(this.storageKey);
      this.updateCount();
    } catch (e) {
      console.warn('Could not clear saved scholarships from localStorage:', e);
    }
  }

  private updateCount(): void {
    const ids = this.getSavedIds();
    this.savedCountSubject.next(ids.length);
  }
}

