import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Action, DeviceType, KeyMapping, ModifierSet } from '../models/interfaces';
import { StorageService } from './storage.service';
import { ColorGroupsService } from './color-groups.service';
import { ModifierStateService } from './modifier-state.service';
import { KeybindSetsService } from './keybind-sets.service';

@Injectable({
  providedIn: 'root'
})
export class ActionsService {
  private storageService = inject(StorageService);
  private colorGroupsService = inject(ColorGroupsService);
  private modifierStateService = inject(ModifierStateService);
  private keybindSetsService = inject(KeybindSetsService);

  private actionsSubject = new BehaviorSubject<Action[]>([]);
  private selectedActionSubject = new BehaviorSubject<Action | null>(null);
  private selectedDeviceSubject = new BehaviorSubject<DeviceType>(DeviceType.KEYBOARD);
  private keyMappingsSubject = new BehaviorSubject<Map<string, KeyMapping>>(new Map());

  public actions$ = this.actionsSubject.asObservable();
  public selectedAction$ = this.selectedActionSubject.asObservable();
  public selectedDevice$ = this.selectedDeviceSubject.asObservable();
  public keyMappings$ = this.keyMappingsSubject.asObservable();

  constructor() {
    this.initializeFromKeybindSets();
  }

  private initializeFromKeybindSets(): void {
    // Subscribe to the selected keybind set and update actions/mappings accordingly
    this.keybindSetsService.selectedKeybindSet$.subscribe(keybindSet => {
      if (keybindSet) {
        this.actionsSubject.next(keybindSet.actions);
        this.keyMappingsSubject.next(keybindSet.keyMappings);

        // Update color groups service with the keybind set's color groups
        this.colorGroupsService.setColorGroups(keybindSet.colorGroups);
      } else {
        this.actionsSubject.next([]);
        this.keyMappingsSubject.next(new Map());
      }
    });
  }

  private saveData(): void {
    // Update the current keybind set with the latest actions and mappings in one call
    // to avoid race conditions from the subscription resetting values
    const currentActions = this.actionsSubject.value;
    const currentKeyMappings = this.keyMappingsSubject.value;

    this.keybindSetsService.updateCurrentSet({
      actions: currentActions,
      keyMappings: currentKeyMappings,
      lastModified: new Date()
    });
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

    // Update selected action if it was modified
    const selectedAction = this.selectedActionSubject.value;
    if (selectedAction && selectedAction.id === actionId) {
      const updatedSelectedAction = updatedActions.find(a => a.id === actionId);
      if (updatedSelectedAction) {
        this.selectedActionSubject.next(updatedSelectedAction);
      }
    }

    this.saveData();
  }

  deleteAction(actionId: string): void {
    // Remove action
    const currentActions = this.actionsSubject.value;
    const updatedActions = currentActions.filter(action => action.id !== actionId);

    // Remove associated key mappings (all modifier sets including NONE)
    const currentKeyMappings = this.keyMappingsSubject.value;
    const updatedKeyMappings = new Map();

    currentKeyMappings.forEach((mapping, key) => {
      if (mapping.actionId !== actionId) {
        updatedKeyMappings.set(key, mapping);
      }
    });

    this.actionsSubject.next(updatedActions);
    this.keyMappingsSubject.next(updatedKeyMappings);

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
    // Map with ModifierSet.NONE for regular (no-modifier) bindings
    this.mapKeyToActionWithModifier(keyCode, deviceType, displayName, ModifierSet.NONE);
  }

  clearKeyMapping(keyCode: string): void {
    // Clear with ModifierSet.NONE for regular (no-modifier) bindings
    this.clearModifierKeyMapping(keyCode, ModifierSet.NONE);
  }

  clearActionMapping(actionId: string): void {
    // Clear all key mappings (all modifier sets including NONE)
    const currentKeyMappings = this.keyMappingsSubject.value;
    const newKeyMappings = new Map();

    currentKeyMappings.forEach((mapping, key) => {
      if (mapping.actionId !== actionId) {
        newKeyMappings.set(key, mapping);
      }
    });

    this.keyMappingsSubject.next(newKeyMappings);

    // Update action to remove all mappings
    this.updateAction(actionId, { keyMappings: new Map() });
  }

  // Modifier-aware mapping management
  mapKeyToActionWithModifier(keyCode: string, deviceType: DeviceType, displayName: string, modifierSet?: ModifierSet): void {
    const selectedAction = this.selectedActionSubject.value;
    if (!selectedAction) return;

    const targetModifierSet = modifierSet ?? this.modifierStateService.getCurrentModifierSet();
    const mappingKey = this.createModifierMappingKey(keyCode, targetModifierSet);

    const currentMappings = this.keyMappingsSubject.value;
    const newMappings = new Map(currentMappings);

    // Remove existing mapping for this key+modifier combination (if any)
    newMappings.delete(mappingKey);

    // NOTE: We no longer remove existing mappings for the same action
    // This allows multiple different keys to be bound to the same action

    // Add new mapping
    const newMapping: KeyMapping = {
      keyCode,
      deviceType,
      displayName,
      modifierSet: targetModifierSet,
      actionId: selectedAction.id
    };

    newMappings.set(mappingKey, newMapping);
    this.keyMappingsSubject.next(newMappings);

    // Update action's keyMappings map to include this new mapping
    // We need to collect all mappings for this action and rebuild the map
    const actionKeyMappings = new Map<string, KeyMapping>();
    
    // Collect all existing mappings for this action
    newMappings.forEach((mapping, key) => {
      if (mapping.actionId === selectedAction.id) {
        // Use the full mapping key (keyCode:modifierSet) as the key
        actionKeyMappings.set(key, mapping);
      }
    });

    this.updateAction(selectedAction.id, { keyMappings: actionKeyMappings });

    this.saveData();
  }

  clearModifierKeyMapping(keyCode: string, modifierSet?: ModifierSet): void {
    const targetModifierSet = modifierSet || this.modifierStateService.getCurrentModifierSet();
    const mappingKey = this.createModifierMappingKey(keyCode, targetModifierSet);

    const currentMappings = this.keyMappingsSubject.value;
    const mapping = currentMappings.get(mappingKey);

    if (mapping && mapping.actionId) {
      const newMappings = new Map(currentMappings);
      newMappings.delete(mappingKey);
      this.keyMappingsSubject.next(newMappings);

      // Update action's keyMappings map - rebuild it with remaining mappings
      const action = this.getActionById(mapping.actionId);
      if (action) {
        const actionKeyMappings = new Map<string, KeyMapping>();
        
        // Collect all remaining mappings for this action
        newMappings.forEach((remainingMapping, key) => {
          if (remainingMapping.actionId === mapping.actionId) {
            actionKeyMappings.set(key, remainingMapping);
          }
        });

        this.updateAction(mapping.actionId, { keyMappings: actionKeyMappings });
      }
    }

    this.saveData();
  }

  getModifierMappingForKey(keyCode: string, modifierSet?: ModifierSet): KeyMapping | undefined {
    const targetModifierSet = modifierSet || this.modifierStateService.getCurrentModifierSet();
    const mappingKey = this.createModifierMappingKey(keyCode, targetModifierSet);
    return this.keyMappingsSubject.value.get(mappingKey);
  }

  getCurrentMappingForKey(keyCode: string): KeyMapping | undefined {
    const currentModifierSet = this.modifierStateService.getCurrentModifierSet();

    // Return the mapping for the current modifier set (including NONE for no-modifier bindings)
    // Only return keys that have bindings for the current modifier combination
    return this.getModifierMappingForKey(keyCode, currentModifierSet);
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

  // Check if any modifier key has an action bound to it
  isModifierKeyBound(modifierKey: 'ctrl' | 'alt' | 'shift'): boolean {
    const modifierKeyCodes = {
      ctrl: ['ControlLeft', 'ControlRight'],
      alt: ['AltLeft', 'AltRight'],
      shift: ['ShiftLeft', 'ShiftRight']
    };

    const keyCodes = modifierKeyCodes[modifierKey];
    const currentMappings = this.keyMappingsSubject.value;

    // Check if any of the modifier key codes have actions bound to them
    for (const keyCode of keyCodes) {
      // Check all modifier sets for this key
      for (const modifierSet of Object.values(ModifierSet)) {
        const mappingKey = this.createModifierMappingKey(keyCode, modifierSet);
        if (currentMappings.has(mappingKey)) {
          return true;
        }
      }
    }

    return false;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
