import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ActionsService } from '../../services/actions.service';
import { Action } from '../../models/interfaces';
import { ActionDialogComponent } from '../action-dialog/action-dialog.component';

@Component({
  selector: 'app-actions-list',
  standalone: true,
  imports: [CommonModule, ActionDialogComponent],
  templateUrl: './actions-list.component.html',
  styleUrls: ['./actions-list.component.css']
})
export class ActionsListComponent implements OnInit, OnDestroy {
  private actionsService = inject(ActionsService);
  private destroy$ = new Subject<void>();

  actions: Action[] = [];
  selectedAction: Action | null = null;
  showActionDialog = false;
  editingAction: Action | null = null;

  ngOnInit(): void {
    this.actionsService.actions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(actions => {
        this.actions = actions;
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
      // Create new action
      this.actionsService.addAction(actionData.name, actionData.colorGroupId);
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
}
