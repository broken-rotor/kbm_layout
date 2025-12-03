import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ColorGroup } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ColorGroupsService {
  private colorGroupsSubject = new BehaviorSubject<ColorGroup[]>([]);
  public colorGroups$ = this.colorGroupsSubject.asObservable();

  private readonly STORAGE_KEY = 'kbm_layout_color_groups';

  constructor() {
    this.loadColorGroups();
  }

  private loadColorGroups(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const colorGroups = JSON.parse(stored) as ColorGroup[];
        this.colorGroupsSubject.next(colorGroups);
      } else {
        this.initializeDefaultColorGroups();
      }
    } catch (error) {
      console.error('Error loading color groups:', error);
      this.initializeDefaultColorGroups();
    }
  }

  private initializeDefaultColorGroups(): void {
    const defaultGroups: ColorGroup[] = [
      { id: 'red-group', name: 'Red Actions', color: '#ff4444' },
      { id: 'blue-group', name: 'Blue Actions', color: '#4444ff' },
      { id: 'green-group', name: 'Green Actions', color: '#44ff44' },
      { id: 'yellow-group', name: 'Yellow Actions', color: '#ffff44' },
      { id: 'purple-group', name: 'Purple Actions', color: '#ff44ff' },
      { id: 'orange-group', name: 'Orange Actions', color: '#ff8844' },
      { id: 'cyan-group', name: 'Cyan Actions', color: '#44ffff' },
      { id: 'pink-group', name: 'Pink Actions', color: '#ff88cc' }
    ];
    
    this.colorGroupsSubject.next(defaultGroups);
    this.saveColorGroups();
  }

  private saveColorGroups(): void {
    try {
      const colorGroups = this.colorGroupsSubject.value;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(colorGroups));
    } catch (error) {
      console.error('Failed to save color groups to localStorage:', error);
    }
  }

  getColorGroups(): ColorGroup[] {
    return this.colorGroupsSubject.value;
  }

  getColorGroupById(id: string): ColorGroup | undefined {
    return this.colorGroupsSubject.value.find(group => group.id === id);
  }

  addColorGroup(name: string, color: string): ColorGroup {
    const newGroup: ColorGroup = {
      id: this.generateId(),
      name,
      color
    };

    const currentGroups = this.colorGroupsSubject.value;
    const updatedGroups = [...currentGroups, newGroup];
    this.colorGroupsSubject.next(updatedGroups);
    this.saveColorGroups();

    return newGroup;
  }

  updateColorGroup(id: string, updates: Partial<Omit<ColorGroup, 'id'>>): void {
    const currentGroups = this.colorGroupsSubject.value;
    const updatedGroups = currentGroups.map(group => 
      group.id === id ? { ...group, ...updates } : group
    );
    
    this.colorGroupsSubject.next(updatedGroups);
    this.saveColorGroups();
  }

  deleteColorGroup(id: string): void {
    const currentGroups = this.colorGroupsSubject.value;
    const updatedGroups = currentGroups.filter(group => group.id !== id);
    
    this.colorGroupsSubject.next(updatedGroups);
    this.saveColorGroups();
  }

  setColorGroups(colorGroups: ColorGroup[]): void {
    this.colorGroupsSubject.next(colorGroups);
    // Note: We don't save to localStorage here since color groups are now managed per keybind set
  }

  private generateId(): string {
    return 'color-group-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }
}
