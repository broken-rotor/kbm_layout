import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ColorGroup } from '../models/interfaces';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class ColorGroupsService {
  private storageService = inject(StorageService);
  
  private colorGroupsSubject = new BehaviorSubject<ColorGroup[]>([]);
  public colorGroups$ = this.colorGroupsSubject.asObservable();

  private readonly STORAGE_KEY = 'colorGroups';

  constructor() {
    this.loadColorGroups();
  }

  private loadColorGroups(): void {
    const stored = this.storageService.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const colorGroups = JSON.parse(stored) as ColorGroup[];
        this.colorGroupsSubject.next(colorGroups);
      } catch (error) {
        console.error('Error loading color groups:', error);
        this.initializeDefaultColorGroups();
      }
    } else {
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
    const colorGroups = this.colorGroupsSubject.value;
    this.storageService.setItem(this.STORAGE_KEY, JSON.stringify(colorGroups));
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

  private generateId(): string {
    return 'color-group-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }
}
