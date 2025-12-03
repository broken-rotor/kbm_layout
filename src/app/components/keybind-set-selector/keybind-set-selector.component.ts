import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { KeybindSetsService } from '../../services/keybind-sets.service';
import { KeybindSet } from '../../models/interfaces';

@Component({
  selector: 'app-keybind-set-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './keybind-set-selector.component.html',
  styleUrl: './keybind-set-selector.component.css'
})
export class KeybindSetSelectorComponent implements OnDestroy {
  private keybindSetsService = inject(KeybindSetsService);
  private destroy$ = new Subject<void>();

  keybindSets: KeybindSet[] = [];
  selectedKeybindSet: KeybindSet | null = null;
  showAddModal = false;
  showRenameModal = false;
  showDeleteModal = false;
  newSetName = '';
  renameSetName = '';

  constructor() {
    this.keybindSetsService.keybindSets$
      .pipe(takeUntil(this.destroy$))
      .subscribe(sets => {
        this.keybindSets = sets;
      });

    this.keybindSetsService.selectedKeybindSet$
      .pipe(takeUntil(this.destroy$))
      .subscribe(set => {
        this.selectedKeybindSet = set;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onKeybindSetChange(setId: string): void {
    this.keybindSetsService.selectKeybindSet(setId);
  }

  // Add new keybind set
  openAddModal(): void {
    this.newSetName = '';
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.newSetName = '';
  }

  confirmAdd(): void {
    if (this.newSetName.trim()) {
      this.keybindSetsService.createKeybindSet(this.newSetName.trim());
      this.closeAddModal();
    }
  }

  // Rename keybind set
  openRenameModal(): void {
    if (this.selectedKeybindSet) {
      this.renameSetName = this.selectedKeybindSet.name;
      this.showRenameModal = true;
    }
  }

  closeRenameModal(): void {
    this.showRenameModal = false;
    this.renameSetName = '';
  }

  confirmRename(): void {
    if (this.selectedKeybindSet && this.renameSetName.trim()) {
      this.keybindSetsService.renameKeybindSet(
        this.selectedKeybindSet.id,
        this.renameSetName.trim()
      );
      this.closeRenameModal();
    }
  }

  // Delete keybind set
  openDeleteModal(): void {
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
  }

  confirmDelete(): void {
    if (this.selectedKeybindSet) {
      this.keybindSetsService.deleteKeybindSet(this.selectedKeybindSet.id);
      this.closeDeleteModal();
    }
  }

  canDelete(): boolean {
    return this.keybindSets.length > 1;
  }

  onKeydown(event: KeyboardEvent, action: string): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      switch (action) {
        case 'add':
          this.confirmAdd();
          break;
        case 'rename':
          this.confirmRename();
          break;
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      switch (action) {
        case 'add':
          this.closeAddModal();
          break;
        case 'rename':
          this.closeRenameModal();
          break;
        case 'delete':
          this.closeDeleteModal();
          break;
      }
    }
  }
}
