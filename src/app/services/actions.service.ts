import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Action, KeyMapping, DeviceType, ModifierKeyMapping, ModifierSet } from '../models/interfaces';
import { StorageService } from './storage.service';
import { ColorGroupsService } from './color-groups.service';
import { ModifierStateService } from './modifier-state.service';

@Injectable({
  providedIn: 'root'
})
export class ActionsService {
  private storageService = inject(StorageService);
  private colorGroupsService = inject(ColorGroupsService);
  private modifierStateService = inject(ModifierStateService);

  private actionsSubject = new BehaviorSubject<Action[]>([]);
  private selectedActionSubject = new BehaviorSubject<Action | null>(null);
  private selectedDeviceSubject = new BehaviorSubject<DeviceType>(DeviceType.KEYBOARD);
  private keyMappingsSubject = new BehaviorSubject<Map<string, KeyMapping>>(new Map());
  private modifierMappingsSubject = new BehaviorSubject<Map<string, ModifierKeyMapping>>(new Map());

  public actions$ = this.actionsSubject.asObservable();
  public selectedAction$ = this.selectedActionSubject.asObservable();
  public selectedDevice$ = this.selectedDeviceSubject.asObservable();
  public keyMappings$ = this.keyMappingsSubject.asObservable();
  public modifierMappings$ = this.modifierMappingsSubject.asObservable();

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    const actions = this.storageService.loadActions();
    const mappings = this.storageService.loadMappings();
    const modifierMappings = this.storageService.loadModifierMappings();
    
    this.actionsSubject.next(actions);
    this.keyMappingsSubject.next(mappings);
    this.modifierMappingsSubject.next(modifierMappings);
  }

  private saveData(): void {
    this.storageService.saveActions(this.actionsSubject.value);
    this.storageService.saveMappings(this.keyMappingsSubject.value);
    this.storageService.saveModifierMappings(this.modifierMappingsSubject.value);
  }

  // Actions management
  addAction(name: string, colorGroupId: string): Action {
    const newAction: Action = {
      id: this.generateId(),
      name,
      colorGroupId
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

  // Modifier-aware mapping management
  mapKeyToActionWithModifier(keyCode: string, deviceType: DeviceType, displayName: string): void {
    const selectedAction = this.selectedActionSubject.value;
    if (!selectedAction) return;

    const currentModifierSet = this.modifierStateService.getCurrentModifierSet();
    const mappingKey = this.createModifierMappingKey(keyCode, currentModifierSet);
    
    const currentMappings = this.modifierMappingsSubject.value;
    const newMappings = new Map(currentMappings);

    // Remove existing mapping for this key+modifier combination
    newMappings.delete(mappingKey);

    // Remove existing mapping for this action in the current modifier set
    newMappings.forEach((mapping, key) => {
      if (mapping.actionId === selectedAction.id && mapping.modifierSet === currentModifierSet) {
        newMappings.delete(key);
      }
    });

    // Add new mapping
    const newMapping: ModifierKeyMapping = {
      keyCode,
      deviceType,
      displayName,
      modifierSet: currentModifierSet,
      actionId: selectedAction.id
    };

    newMappings.set(mappingKey, newMapping);
    this.modifierMappingsSubject.next(newMappings);
    this.saveData();
  }

  clearModifierKeyMapping(keyCode: string, modifierSet?: ModifierSet): void {
    const targetModifierSet = modifierSet || this.modifierStateService.getCurrentModifierSet();
    const mappingKey = this.createModifierMappingKey(keyCode, targetModifierSet);
    
    const currentMappings = this.modifierMappingsSubject.value;
    const newMappings = new Map(currentMappings);
    
    newMappings.delete(mappingKey);
    this.modifierMappingsSubject.next(newMappings);
    this.saveData();
  }

  getModifierMappingForKey(keyCode: string, modifierSet?: ModifierSet): ModifierKeyMapping | undefined {
    const targetModifierSet = modifierSet || this.modifierStateService.getCurrentModifierSet();
    const mappingKey = this.createModifierMappingKey(keyCode, targetModifierSet);
    return this.modifierMappingsSubject.value.get(mappingKey);
  }

  getCurrentMappingForKey(keyCode: string): KeyMapping | ModifierKeyMapping | undefined {
    const currentModifierSet = this.modifierStateService.getCurrentModifierSet();
    
    // If no modifiers are pressed, use the regular mapping
    if (currentModifierSet === ModifierSet.NONE) {
      return this.keyMappingsSubject.value.get(keyCode);
    }
    
    // Otherwise, try to get the modifier mapping
    const modifierMapping = this.getModifierMappingForKey(keyCode, currentModifierSet);
    if (modifierMapping) {
      return modifierMapping;
    }
    
    // Fall back to regular mapping if no modifier mapping exists
    return this.keyMappingsSubject.value.get(keyCode);
  }

  private createModifierMappingKey(keyCode: string, modifierSet: ModifierSet): string {
    return `${keyCode}:${modifierSet}`;
  }

  // Utility methods
  getActionById(actionId: string): Action | undefined {
    return this.actionsSubject.value.find(action => action.id === actionId);
  }

  getActionColor(action: Action): string {
    const colorGroup = this.colorGroupsService.getColorGroupById(action.colorGroupId);
    return colorGroup?.color || '#cccccc'; // Default gray if color group not found
  }

  getMappingForKey(keyCode: string): KeyMapping | undefined {
    return this.keyMappingsSubject.value.get(keyCode);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
