import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Action, KeyMapping, DeviceType } from '../models/interfaces';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class ActionsService {
  private storageService = inject(StorageService);

  private actionsSubject = new BehaviorSubject<Action[]>([]);
  private selectedActionSubject = new BehaviorSubject<Action | null>(null);
  private selectedDeviceSubject = new BehaviorSubject<DeviceType>(DeviceType.KEYBOARD);
  private keyMappingsSubject = new BehaviorSubject<Map<string, KeyMapping>>(new Map());

  public actions$ = this.actionsSubject.asObservable();
  public selectedAction$ = this.selectedActionSubject.asObservable();
  public selectedDevice$ = this.selectedDeviceSubject.asObservable();
  public keyMappings$ = this.keyMappingsSubject.asObservable();

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    const actions = this.storageService.loadActions();
    const mappings = this.storageService.loadMappings();
    
    this.actionsSubject.next(actions);
    this.keyMappingsSubject.next(mappings);
  }

  private saveData(): void {
    this.storageService.saveActions(this.actionsSubject.value);
    this.storageService.saveMappings(this.keyMappingsSubject.value);
  }

  // Actions management
  addAction(name: string, color: string): Action {
    const newAction: Action = {
      id: this.generateId(),
      name,
      color
    };

    const currentActions = this.actionsSubject.value;
    const updatedActions = [...currentActions, newAction];
    
    this.actionsSubject.next(updatedActions);
    this.saveData();
    
    return newAction;
  }

  updateAction(actionId: string, updates: Partial<Action>): void {
    const currentActions = this.actionsSubject.value;
    const updatedActions = currentActions.map(action => 
      action.id === actionId ? { ...action, ...updates } : action
    );
    
    this.actionsSubject.next(updatedActions);
    this.saveData();
  }

  deleteAction(actionId: string): void {
    // Remove action
    const currentActions = this.actionsSubject.value;
    const updatedActions = currentActions.filter(action => action.id !== actionId);
    
    // Remove associated mappings
    const currentMappings = this.keyMappingsSubject.value;
    const updatedMappings = new Map();
    
    currentMappings.forEach((mapping, key) => {
      if (mapping.actionId !== actionId) {
        updatedMappings.set(key, mapping);
      }
    });

    this.actionsSubject.next(updatedActions);
    this.keyMappingsSubject.next(updatedMappings);
    
    // Clear selected action if it was deleted
    if (this.selectedActionSubject.value?.id === actionId) {
      this.selectedActionSubject.next(null);
    }
    
    this.saveData();
  }

  // Selection management
  selectAction(action: Action | null): void {
    this.selectedActionSubject.next(action);
  }

  selectDevice(device: DeviceType): void {
    this.selectedDeviceSubject.next(device);
  }

  // Key mapping management
  mapKeyToAction(keyCode: string, deviceType: DeviceType, displayName: string): void {
    const selectedAction = this.selectedActionSubject.value;
    if (!selectedAction) return;

    const currentMappings = this.keyMappingsSubject.value;
    const newMappings = new Map(currentMappings);

    // Remove existing mapping for this key
    newMappings.delete(keyCode);

    // Remove existing mapping for this action (one action per key)
    newMappings.forEach((mapping, key) => {
      if (mapping.actionId === selectedAction.id) {
        newMappings.delete(key);
      }
    });

    // Add new mapping
    const newMapping: KeyMapping = {
      keyCode,
      deviceType,
      displayName,
      actionId: selectedAction.id
    };

    newMappings.set(keyCode, newMapping);
    this.keyMappingsSubject.next(newMappings);

    // Update action with mapping info
    this.updateAction(selectedAction.id, { keyMapping: newMapping });
  }

  clearKeyMapping(keyCode: string): void {
    const currentMappings = this.keyMappingsSubject.value;
    const mapping = currentMappings.get(keyCode);
    
    if (mapping && mapping.actionId) {
      // Remove mapping
      const newMappings = new Map(currentMappings);
      newMappings.delete(keyCode);
      this.keyMappingsSubject.next(newMappings);

      // Update action to remove mapping
      this.updateAction(mapping.actionId, { keyMapping: undefined });
    }
  }

  clearActionMapping(actionId: string): void {
    const currentMappings = this.keyMappingsSubject.value;
    const newMappings = new Map();

    currentMappings.forEach((mapping, key) => {
      if (mapping.actionId !== actionId) {
        newMappings.set(key, mapping);
      }
    });

    this.keyMappingsSubject.next(newMappings);
    this.updateAction(actionId, { keyMapping: undefined });
  }

  // Utility methods
  getActionById(actionId: string): Action | undefined {
    return this.actionsSubject.value.find(action => action.id === actionId);
  }

  getMappingForKey(keyCode: string): KeyMapping | undefined {
    return this.keyMappingsSubject.value.get(keyCode);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
