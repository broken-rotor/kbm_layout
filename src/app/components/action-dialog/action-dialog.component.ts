import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Action } from '../../models/interfaces';

@Component({
  selector: 'app-action-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './action-dialog.component.html',
  styleUrls: ['./action-dialog.component.css']
})
export class ActionDialogComponent implements OnInit {
  @Input() action: Action | null = null;
  @Output() save = new EventEmitter<{ name: string; color: string }>();
  @Output() cancel = new EventEmitter<void>();

  actionName = '';
  actionColor = '#3498db';
  
  // Predefined color palette
  colorPalette = [
    '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#f1c40f',
    '#8e44ad', '#16a085', '#2c3e50', '#d35400', '#7f8c8d',
    '#27ae60', '#c0392b', '#2980b9', '#8e44ad', '#d68910'
  ];

  ngOnInit(): void {
    if (this.action) {
      this.actionName = this.action.name;
      this.actionColor = this.action.color;
    }
  }

  onSave(): void {
    if (this.actionName.trim()) {
      this.save.emit({
        name: this.actionName.trim(),
        color: this.actionColor
      });
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onColorSelect(color: string): void {
    this.actionColor = color;
  }

  onCustomColorChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.actionColor = target.value;
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
}
