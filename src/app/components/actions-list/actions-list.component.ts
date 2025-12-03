import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { ActionsService } from '../../services/actions.service';
import { ColorGroupsService } from '../../services/color-groups.service';
import { Action, ColorGroup } from '../../models/interfaces';
import { ActionDialogComponent } from '../action-dialog/action-dialog.component';
import { ColorGroupsManagementComponent } from '../color-groups-management/color-groups-management.component';

interface ColorGroupInfo {
  group: ColorGroup;
  count: number;
}

@Component({
  selector: 'app-actions-list',
  standalone: true,
  imports: [CommonModule, ActionDialogComponent, ColorGroupsManagementComponent],
  templateUrl: './actions-list.component.html',
  styleUrls: ['./actions-list.component.css']
})
export class ActionsListComponent implements OnInit, OnDestroy {
  private actionsService = inject(ActionsService);
  private colorGroupsService = inject(ColorGroupsService);
  private destroy$ = new Subject<void>();

  actions: Action[] = [];
  filteredActions: Action[] = [];
  selectedAction: Action | null = null;
  showActionDialog = false;
  editingAction: Action | null = null;
  showGroupManager = false;

  colorGroups: ColorGroup[] = [];
  colorGroupsWithActions: ColorGroupInfo[] = [];
  selectedColorGroupId: string | null = null;

  ngOnInit(): void {
    // Combine actions and color groups data
    combineLatest([
      this.actionsService.actions$,
      this.colorGroupsService.colorGroups$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([actions, colorGroups]) => {
        this.actions = actions;
        this.colorGroups = colorGroups;
        this.updateColorGroupsWithActions();
        this.updateFilteredActions();
      });

    this.actionsService.selectedAction$
      .pipe(takeUntil(this.destroy$))
      .subscribe(action => {
        this.selectedAction = action;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onActionClick(action: Action): void {
    if (this.selectedAction?.id === action.id) {
      // Deselect if clicking the same action
      this.actionsService.selectAction(null);
    } else {
      // Select the action
      this.actionsService.selectAction(action);
    }
  }

  onAddAction(): void {
    this.editingAction = null;
    this.showActionDialog = true;
  }

  onEditAction(action: Action, event: Event): void {
    event.stopPropagation();
    this.editingAction = action;
    this.showActionDialog = true;
  }

  onDeleteAction(action: Action, event: Event): void {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete "${action.name}"?`)) {
      this.actionsService.deleteAction(action.id);
    }
  }

  onClearMapping(action: Action, event: Event): void {
    event.stopPropagation();
    this.actionsService.clearActionMapping(action.id);
  }

  onDialogSave(actionData: { name: string; colorGroupId: string }): void {
    if (this.editingAction) {
      // Update existing action
      this.actionsService.updateAction(this.editingAction.id, {
        name: actionData.name,
        colorGroupId: actionData.colorGroupId
      });
    } else {
      // Create new action with the selected color group (or the provided one)
      const colorGroupId = actionData.colorGroupId || this.selectedColorGroupId || this.getFirstAvailableColorGroupId();
      this.actionsService.addAction(actionData.name, colorGroupId);
    }
    this.closeDialog();
  }

  onDialogCancel(): void {
    this.closeDialog();
  }

  private closeDialog(): void {
    this.showActionDialog = false;
    this.editingAction = null;
  }

  getActionClasses(action: Action): string {
    let classes = 'action-item';
    
    if (this.selectedAction?.id === action.id) {
      classes += ' action-selected';
    }

    return classes;
  }

  getMappingDisplay(action: Action): string {
    const mappings: string[] = [];

    // All mappings are now in keyMappings (all modifier sets including NONE)
    if (action.keyMappings && action.keyMappings.size > 0) {
      action.keyMappings.forEach((mapping, modifierSet) => {
        const modifierPrefix = this.getModifierPrefix(modifierSet);
        mappings.push(`${modifierPrefix}${mapping.displayName}`);
      });
    }

    return mappings.length > 0 ? mappings.join(', ') : 'Not Mapped';
  }

  private getModifierPrefix(modifierSet: string): string {
    switch (modifierSet) {
      case 'none': return ''; // No prefix for regular (no-modifier) bindings
      case 'ctrl': return 'Ctrl+';
      case 'alt': return 'Alt+';
      case 'shift': return 'Shift+';
      case 'ctrl+alt': return 'Ctrl+Alt+';
      case 'ctrl+shift': return 'Ctrl+Shift+';
      case 'alt+shift': return 'Alt+Shift+';
      case 'ctrl+alt+shift': return 'Ctrl+Alt+Shift+';
      default: return '';
    }
  }

  getActionColor(action: Action): string {
    return this.actionsService.getActionColor(action);
  }

  getContrastColor(hexColor: string): string {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  // New methods for tabbed functionality
  onColorTabClick(colorGroupId: string): void {
    this.selectedColorGroupId = colorGroupId;
    this.updateFilteredActions();
  }

  private updateColorGroupsWithActions(): void {
    // Create a map of color group IDs to action counts
    const actionCounts = new Map<string, number>();
    this.actions.forEach(action => {
      const count = actionCounts.get(action.colorGroupId) || 0;
      actionCounts.set(action.colorGroupId, count + 1);
    });

    // Filter color groups to only show those with actions
    this.colorGroupsWithActions = this.colorGroups
      .filter(group => actionCounts.has(group.id))
      .map(group => ({
        group,
        count: actionCounts.get(group.id) || 0
      }))
      .sort((a, b) => a.group.name.localeCompare(b.group.name));

    // Auto-select the first color group if none is selected
    if (!this.selectedColorGroupId && this.colorGroupsWithActions.length > 0) {
      this.selectedColorGroupId = this.colorGroupsWithActions[0].group.id;
    }

    // If the selected color group no longer has actions, select the first available one
    if (this.selectedColorGroupId && !this.colorGroupsWithActions.some(info => info.group.id === this.selectedColorGroupId)) {
      this.selectedColorGroupId = this.colorGroupsWithActions.length > 0 ? this.colorGroupsWithActions[0].group.id : null;
    }
  }

  private updateFilteredActions(): void {
    if (this.selectedColorGroupId) {
      this.filteredActions = this.actions.filter(action => action.colorGroupId === this.selectedColorGroupId);
    } else {
      this.filteredActions = this.actions;
    }
  }

  private getFirstAvailableColorGroupId(): string {
    return this.colorGroups.length > 0 ? this.colorGroups[0].id : '';
  }

  toggleGroupManager(): void {
    this.showGroupManager = !this.showGroupManager;
  }

  closeGroupManager(): void {
    this.showGroupManager = false;
  }

  getColorEmoji(color: string): string {
    // Convert color to a simple emoji based on hue
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    
    // Determine dominant color
    if (r > g && r > b) {
      return '🔴'; // Red
    } else if (g > r && g > b) {
      return '🟢'; // Green
    } else if (b > r && b > g) {
      return '🔵'; // Blue
    } else if (r > 200 && g > 200 && b < 100) {
      return '🟡'; // Yellow
    } else if (r > 200 && g < 100 && b > 200) {
      return '🟣'; // Purple/Magenta
    } else if (r > 200 && g > 100 && b < 100) {
      return '🟠'; // Orange
    } else if (r < 100 && g > 200 && b > 200) {
      return '🩵'; // Cyan
    } else {
      return '⚪'; // Default/Gray
    }
  }

  getColorName(color: string): string {
    // Convert color to a simple name based on hue
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    
    // Determine dominant color
    if (r > g && r > b) {
      return 'Red';
    } else if (g > r && g > b) {
      return 'Green';
    } else if (b > r && b > g) {
      return 'Blue';
    } else if (r > 200 && g > 200 && b < 100) {
      return 'Yellow';
    } else if (r > 200 && g < 100 && b > 200) {
      return 'Purple';
    } else if (r > 200 && g > 100 && b < 100) {
      return 'Orange';
    } else if (r < 100 && g > 200 && b > 200) {
      return 'Cyan';
    } else {
      return 'Gray';
    }
  }
}
