import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { KeybindSet, Action, KeyMapping, ColorGroup } from '../models/interfaces';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class KeybindSetsService {
  private storageService = inject(StorageService);

  private keybindSetsSubject = new BehaviorSubject<KeybindSet[]>([]);
  private selectedKeybindSetSubject = new BehaviorSubject<KeybindSet | null>(null);

  public keybindSets$ = this.keybindSetsSubject.asObservable();
  public selectedKeybindSet$ = this.selectedKeybindSetSubject.asObservable();

  constructor() {
    this.loadKeybindSets();
  }

  private loadKeybindSets(): void {
    const sets = this.storageService.loadKeybindSets();
    this.keybindSetsSubject.next(sets);
    
    // Select the first set if available, or create a default one
    if (sets.length > 0) {
      this.selectedKeybindSetSubject.next(sets[0]);
    } else {
      this.createDefaultKeybindSet();
    }
  }

  private saveKeybindSets(): void {
    this.storageService.saveKeybindSets(this.keybindSetsSubject.value);
  }

  private createDefaultKeybindSet(): void {
    const defaultSet: KeybindSet = {
      id: this.generateId(),
      name: 'Default',
      actions: [],
      keyMappings: new Map(),
      colorGroups: [
        {
          id: this.generateId(),
          name: 'Default',
          color: '#2196f3',
          isDefault: true
        }
      ],
      createdAt: new Date(),
      lastModified: new Date()
    };

    const sets = [defaultSet];
    this.keybindSetsSubject.next(sets);
    this.selectedKeybindSetSubject.next(defaultSet);
    this.saveKeybindSets();
  }

  // Keybind set management
  createKeybindSet(name: string): KeybindSet {
    const newSet: KeybindSet = {
      id: this.generateId(),
      name,
      actions: [],
      keyMappings: new Map(),
      colorGroups: [
        {
          id: this.generateId(),
          name: 'Default',
          color: '#2196f3',
          isDefault: true
        }
      ],
      createdAt: new Date(),
      lastModified: new Date()
    };

    const currentSets = this.keybindSetsSubject.value;
    const updatedSets = [...currentSets, newSet];
    
    this.keybindSetsSubject.next(updatedSets);
    this.selectedKeybindSetSubject.next(newSet);
    this.saveKeybindSets();
    
    return newSet;
  }

  renameKeybindSet(setId: string, newName: string): void {
    const currentSets = this.keybindSetsSubject.value;
    const updatedSets = currentSets.map(set => 
      set.id === setId 
        ? { ...set, name: newName, lastModified: new Date() }
        : set
    );
    
    this.keybindSetsSubject.next(updatedSets);
    
    // Update selected set if it was renamed
    const selectedSet = this.selectedKeybindSetSubject.value;
    if (selectedSet && selectedSet.id === setId) {
      this.selectedKeybindSetSubject.next(updatedSets.find(s => s.id === setId) || null);
    }
    
    this.saveKeybindSets();
  }

  deleteKeybindSet(setId: string): void {
    const currentSets = this.keybindSetsSubject.value;
    
    // Don't allow deletion if it's the only set
    if (currentSets.length <= 1) {
      return;
    }

    const updatedSets = currentSets.filter(set => set.id !== setId);
    this.keybindSetsSubject.next(updatedSets);
    
    // If the deleted set was selected, select the first remaining set
    const selectedSet = this.selectedKeybindSetSubject.value;
    if (selectedSet && selectedSet.id === setId) {
      this.selectedKeybindSetSubject.next(updatedSets[0] || null);
    }
    
    this.saveKeybindSets();
  }

  selectKeybindSet(setId: string): void {
    const sets = this.keybindSetsSubject.value;
    const set = sets.find(s => s.id === setId);
    if (set) {
      this.selectedKeybindSetSubject.next(set);
    }
  }

  // Update current keybind set data
  updateCurrentSetActions(actions: Action[]): void {
    const selectedSet = this.selectedKeybindSetSubject.value;
    if (!selectedSet) return;

    this.updateKeybindSet(selectedSet.id, { actions, lastModified: new Date() });
  }

  updateCurrentSetKeyMappings(keyMappings: Map<string, KeyMapping>): void {
    const selectedSet = this.selectedKeybindSetSubject.value;
    if (!selectedSet) return;

    this.updateKeybindSet(selectedSet.id, { keyMappings, lastModified: new Date() });
  }

  updateCurrentSetColorGroups(colorGroups: ColorGroup[]): void {
    const selectedSet = this.selectedKeybindSetSubject.value;
    if (!selectedSet) return;

    this.updateKeybindSet(selectedSet.id, { colorGroups, lastModified: new Date() });
  }

  private updateKeybindSet(setId: string, updates: Partial<KeybindSet>): void {
    const currentSets = this.keybindSetsSubject.value;
    const updatedSets = currentSets.map(set => 
      set.id === setId ? { ...set, ...updates } : set
    );
    
    this.keybindSetsSubject.next(updatedSets);
    
    // Update selected set if it was modified
    const selectedSet = this.selectedKeybindSetSubject.value;
    if (selectedSet && selectedSet.id === setId) {
      this.selectedKeybindSetSubject.next(updatedSets.find(s => s.id === setId) || null);
    }
    
    this.saveKeybindSets();
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
