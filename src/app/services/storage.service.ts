import { Injectable } from '@angular/core';
import { Action, ColorGroup, KeyMapping, ModifierSet, KeybindSet } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly ACTIONS_KEY = 'kbm_layout_actions';
  private readonly KEY_MAPPINGS_KEY = 'kbm_layout_key_mappings';
  private readonly COLOR_GROUPS_KEY = 'kbm_layout_color_groups';
  private readonly KEYBIND_SETS_KEY = 'kbm_layout_keybind_sets';
  private readonly STORAGE_VERSION_KEY = 'kbm_layout_storage_version';
  private readonly CURRENT_STORAGE_VERSION = 4;

  // Actions storage
  saveActions(actions: Action[]): void {
    try {
      // Serialize actions with nested Maps
      const serializedActions = actions.map(action => ({
        ...action,
        keyMappings: action.keyMappings
          ? Array.from(action.keyMappings.entries())
          : undefined
      }));
      localStorage.setItem(this.ACTIONS_KEY, JSON.stringify(serializedActions));
    } catch (error) {
      console.error('Failed to save actions to localStorage:', error);
    }
  }

  loadActions(): Action[] {
    try {
      const stored = localStorage.getItem(this.ACTIONS_KEY);
      if (!stored) return [];

      const parsedActions: (Omit<Action, 'keyMappings'> & { keyMappings?: [ModifierSet, KeyMapping][] })[] = JSON.parse(stored);
      // Deserialize actions with nested Maps
      return parsedActions.map((action) => ({
        ...action,
        keyMappings: action.keyMappings
          ? new Map(action.keyMappings)
          : undefined
      }));
    } catch (error) {
      console.error('Failed to load actions from localStorage:', error);
      return [];
    }
  }

  // Key mappings storage (includes all modifier sets including NONE for regular bindings)
  saveKeyMappings(mappings: Map<string, KeyMapping>): void {
    try {
      const mappingsArray = Array.from(mappings.entries());
      localStorage.setItem(this.KEY_MAPPINGS_KEY, JSON.stringify(mappingsArray));
    } catch (error) {
      console.error('Failed to save key mappings to localStorage:', error);
    }
  }

  loadKeyMappings(): Map<string, KeyMapping> {
    try {
      const stored = localStorage.getItem(this.KEY_MAPPINGS_KEY);
      if (stored) {
        const mappingsArray: [string, KeyMapping][] = JSON.parse(stored);
        return new Map(mappingsArray);
      }
      return new Map();
    } catch (error) {
      console.error('Failed to load key mappings from localStorage:', error);
      return new Map();
    }
  }

  // Color groups storage
  saveColorGroups(colorGroups: ColorGroup[]): void {
    try {
      localStorage.setItem(this.COLOR_GROUPS_KEY, JSON.stringify(colorGroups));
      this.updateStorageVersion();
    } catch (error) {
      console.error('Failed to save color groups to localStorage:', error);
    }
  }

  loadColorGroups(): ColorGroup[] {
    try {
      const stored = localStorage.getItem(this.COLOR_GROUPS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load color groups from localStorage:', error);
      return [];
    }
  }

  // Storage version management
  private updateStorageVersion(): void {
    try {
      localStorage.setItem(this.STORAGE_VERSION_KEY, this.CURRENT_STORAGE_VERSION.toString());
    } catch (error) {
      console.error('Failed to update storage version:', error);
    }
  }

  getStorageVersion(): number {
    try {
      const stored = localStorage.getItem(this.STORAGE_VERSION_KEY);
      return stored ? parseInt(stored, 10) : 0;
    } catch (error) {
      console.error('Failed to get storage version:', error);
      return 0;
    }
  }

  // Migration support
  needsMigration(): boolean {
    return this.getStorageVersion() < this.CURRENT_STORAGE_VERSION;
  }

  // Check if this is a fresh installation (no existing data)
  isFreshInstallation(): boolean {
    try {
      const hasActions = localStorage.getItem(this.ACTIONS_KEY) !== null;
      const hasKeyMappings = localStorage.getItem(this.KEY_MAPPINGS_KEY) !== null;
      const hasColorGroups = localStorage.getItem(this.COLOR_GROUPS_KEY) !== null;
      const hasVersion = localStorage.getItem(this.STORAGE_VERSION_KEY) !== null;

      return !hasActions && !hasKeyMappings && !hasColorGroups && !hasVersion;
    } catch (error) {
      console.error('Failed to check installation status:', error);
      return true;
    }
  }

  // Keybind sets storage
  saveKeybindSets(keybindSets: KeybindSet[]): void {
    try {
      // Serialize keybind sets with nested Maps and Dates
      const serializedSets = keybindSets.map(set => ({
        ...set,
        keyMappings: Array.from(set.keyMappings.entries()),
        actions: set.actions.map(action => ({
          ...action,
          keyMappings: action.keyMappings
            ? Array.from(action.keyMappings.entries())
            : undefined
        })),
        createdAt: set.createdAt.toISOString(),
        lastModified: set.lastModified.toISOString()
      }));
      localStorage.setItem(this.KEYBIND_SETS_KEY, JSON.stringify(serializedSets));
      this.updateStorageVersion();
    } catch (error) {
      console.error('Failed to save keybind sets to localStorage:', error);
    }
  }

  loadKeybindSets(): KeybindSet[] {
    try {
      const stored = localStorage.getItem(this.KEYBIND_SETS_KEY);
      if (!stored) return [];

      const parsedSets: any[] = JSON.parse(stored);
      // Deserialize keybind sets with nested Maps and Dates
      return parsedSets.map(set => ({
        ...set,
        keyMappings: new Map(set.keyMappings || []),
        actions: set.actions.map((action: any) => ({
          ...action,
          keyMappings: action.keyMappings
            ? new Map(action.keyMappings)
            : undefined
        })),
        createdAt: new Date(set.createdAt),
        lastModified: new Date(set.lastModified)
      }));
    } catch (error) {
      console.error('Failed to load keybind sets from localStorage:', error);
      return [];
    }
  }

  // Clear all data
  clearAll(): void {
    try {
      localStorage.removeItem(this.ACTIONS_KEY);
      localStorage.removeItem(this.KEY_MAPPINGS_KEY);
      localStorage.removeItem(this.COLOR_GROUPS_KEY);
      localStorage.removeItem(this.KEYBIND_SETS_KEY);
      localStorage.removeItem(this.STORAGE_VERSION_KEY);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }
}
