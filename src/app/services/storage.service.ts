import { Injectable } from '@angular/core';
import { Action, KeyMapping, ColorGroup, ModifierKeyMapping } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly ACTIONS_KEY = 'kbm_layout_actions';
  private readonly MAPPINGS_KEY = 'kbm_layout_mappings';
  private readonly MODIFIER_MAPPINGS_KEY = 'kbm_layout_modifier_mappings';
  private readonly COLOR_GROUPS_KEY = 'kbm_layout_color_groups';
  private readonly STORAGE_VERSION_KEY = 'kbm_layout_storage_version';
  private readonly CURRENT_STORAGE_VERSION = 2;

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

  // Modifier key mappings storage
  saveModifierMappings(mappings: Map<string, ModifierKeyMapping>): void {
    try {
      const mappingsArray = Array.from(mappings.entries());
      localStorage.setItem(this.MODIFIER_MAPPINGS_KEY, JSON.stringify(mappingsArray));
    } catch (error) {
      console.error('Failed to save modifier mappings to localStorage:', error);
    }
  }

  loadModifierMappings(): Map<string, ModifierKeyMapping> {
    try {
      const stored = localStorage.getItem(this.MODIFIER_MAPPINGS_KEY);
      if (stored) {
        const mappingsArray: [string, ModifierKeyMapping][] = JSON.parse(stored);
        return new Map(mappingsArray);
      }
      return new Map();
    } catch (error) {
      console.error('Failed to load modifier mappings from localStorage:', error);
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
      const hasMappings = localStorage.getItem(this.MAPPINGS_KEY) !== null;
      const hasColorGroups = localStorage.getItem(this.COLOR_GROUPS_KEY) !== null;
      const hasVersion = localStorage.getItem(this.STORAGE_VERSION_KEY) !== null;
      
      return !hasActions && !hasMappings && !hasColorGroups && !hasVersion;
    } catch (error) {
      console.error('Failed to check installation status:', error);
      return true;
    }
  }

  // Clear all data
  clearAll(): void {
    try {
      localStorage.removeItem(this.ACTIONS_KEY);
      localStorage.removeItem(this.MAPPINGS_KEY);
      localStorage.removeItem(this.COLOR_GROUPS_KEY);
      localStorage.removeItem(this.STORAGE_VERSION_KEY);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }
}
