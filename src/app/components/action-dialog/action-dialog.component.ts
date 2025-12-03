import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Action, ColorGroup } from '../../models/interfaces';
import { ColorGroupsService } from '../../services/color-groups.service';
import { ColorGroupsManagementComponent } from '../color-groups-management/color-groups-management.component';

@Component({
  selector: 'app-action-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ColorGroupsManagementComponent],
  templateUrl: './action-dialog.component.html',
  styleUrls: ['./action-dialog.component.css']
})
export class ActionDialogComponent implements OnInit, OnDestroy {
  private colorGroupsService = inject(ColorGroupsService);
  private destroy$ = new Subject<void>();

  @Input() action: Action | null = null;
  @Output() save = new EventEmitter<{ name: string; colorGroupId: string }>();
  @Output() cancelled = new EventEmitter<void>();

  actionName = '';
  selectedColorGroupId = '';
  colorGroups: ColorGroup[] = [];
  showGroupManager = false;

  ngOnInit(): void {
    this.colorGroupsService.colorGroups$
      .pipe(takeUntil(this.destroy$))
      .subscribe(groups => {
        this.colorGroups = groups;
        // Set default selection to first group if no action is being edited
        if (!this.action && groups.length > 0 && !this.selectedColorGroupId) {
          this.selectedColorGroupId = groups[0].id;
        }
      });

    if (this.action) {
      this.actionName = this.action.name;
      this.selectedColorGroupId = this.action.colorGroupId;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSave(): void {
    if (this.actionName.trim() && this.selectedColorGroupId) {
      this.save.emit({
        name: this.actionName.trim(),
        colorGroupId: this.selectedColorGroupId
      });
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onColorGroupSelect(colorGroupId: string): void {
    this.selectedColorGroupId = colorGroupId;
  }

  getSelectedColorGroup(): ColorGroup | undefined {
    return this.colorGroups.find(group => group.id === this.selectedColorGroupId);
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

  get isEditing(): boolean {
    return this.action !== null;
  }

  get dialogTitle(): string {
    return this.isEditing ? 'Edit Action' : 'Add New Action';
  }

  /**
   * Toggle group manager visibility
   */
  toggleGroupManager(): void {
    this.showGroupManager = !this.showGroupManager;
  }
}
