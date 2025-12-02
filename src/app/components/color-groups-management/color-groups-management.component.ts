import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ColorGroupsService } from '../../services/color-groups.service';
import { ColorGroup } from '../../models/interfaces';

@Component({
  selector: 'app-color-groups-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './color-groups-management.component.html',
  styleUrls: ['./color-groups-management.component.css']
})
export class ColorGroupsManagementComponent implements OnInit, OnDestroy {
  private colorGroupsService = inject(ColorGroupsService);
  private destroy$ = new Subject<void>();

  colorGroups: ColorGroup[] = [];
  showAddDialog = false;
  editingGroup: ColorGroup | null = null;
  
  // Form data
  groupName = '';
  groupColor = '#ff4444';

  ngOnInit(): void {
    this.colorGroupsService.colorGroups$
      .pipe(takeUntil(this.destroy$))
      .subscribe(groups => {
        this.colorGroups = groups;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onAddGroup(): void {
    this.editingGroup = null;
    this.groupName = '';
    this.groupColor = '#ff4444';
    this.showAddDialog = true;
  }

  onEditGroup(group: ColorGroup): void {
    this.editingGroup = group;
    this.groupName = group.name;
    this.groupColor = group.color;
    this.showAddDialog = true;
  }

  onDeleteGroup(group: ColorGroup): void {
    if (confirm(`Are you sure you want to delete "${group.name}"? This will affect all actions using this color group.`)) {
      this.colorGroupsService.deleteColorGroup(group.id);
    }
  }

  onSaveGroup(): void {
    if (!this.groupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    if (this.editingGroup) {
      // Update existing group
      this.colorGroupsService.updateColorGroup(this.editingGroup.id, {
        name: this.groupName.trim(),
        color: this.groupColor
      });
    } else {
      // Create new group
      this.colorGroupsService.addColorGroup(this.groupName.trim(), this.groupColor);
    }

    this.closeDialog();
  }

  onCancelDialog(): void {
    this.closeDialog();
  }

  private closeDialog(): void {
    this.showAddDialog = false;
    this.editingGroup = null;
    this.groupName = '';
    this.groupColor = '#ff4444';
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
