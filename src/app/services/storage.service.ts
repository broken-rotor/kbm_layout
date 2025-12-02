import { Injectable } from '@angular/core';
import { Action, KeyMapping } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly ACTIONS_KEY = 'kbm_layout_actions';
  private readonly MAPPINGS_KEY = 'kbm_layout_mappings';

  constructor() {}

  // Actions storage
  saveActions(actions: Action[]): void {
    try {
      localStorage.setItem(this.ACTIONS_KEY, JSON.stringify(actions));
    } catch (error) {
      console.error('Failed to save actions to localStorage:', error);
    }
  }

  loadActions(): Action[] {
    try {
      const stored = localStorage.getItem(this.ACTIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load actions from localStorage:', error);
      return [];
    }
  }

  // Key mappings storage
  saveMappings(mappings: Map<string, KeyMapping>): void {
    try {
      const mappingsArray = Array.from(mappings.entries());
      localStorage.setItem(this.MAPPINGS_KEY, JSON.stringify(mappingsArray));
    } catch (error) {
      console.error('Failed to save mappings to localStorage:', error);
    }
  }

  loadMappings(): Map<string, KeyMapping> {
    try {
      const stored = localStorage.getItem(this.MAPPINGS_KEY);
      if (stored) {
        const mappingsArray: [string, KeyMapping][] = JSON.parse(stored);
        return new Map(mappingsArray);
      }
      return new Map();
    } catch (error) {
      console.error('Failed to load mappings from localStorage:', error);
      return new Map();
    }
  }

  // Clear all data
  clearAll(): void {
    try {
      localStorage.removeItem(this.ACTIONS_KEY);
      localStorage.removeItem(this.MAPPINGS_KEY);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }
}
