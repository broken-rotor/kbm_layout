import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { ActionsService } from '../../services/actions.service';
import { ModifierStateService } from '../../services/modifier-state.service';
import { KeyboardKey, DeviceType, Action, KeyMapping, ModifierKeyMapping, ModifierSet } from '../../models/interfaces';

@Component({
  selector: 'app-keyboard-layout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './keyboard-layout.component.html',
  styleUrls: ['./keyboard-layout.component.css']
})
export class KeyboardLayoutComponent implements OnInit, OnDestroy {
  private actionsService = inject(ActionsService);
  private modifierStateService = inject(ModifierStateService);
  private destroy$ = new Subject<void>();

  selectedAction: Action | null = null;
  keyMappings = new Map<string, KeyMapping>();
  modifierMappings = new Map<string, ModifierKeyMapping>();
  currentModifierSet: ModifierSet = ModifierSet.NONE;

  // UK Keyboard Layout (ISO Layout)
  keyboardRows: KeyboardKey[][] = [
    // Function row
    [
      { code: 'Escape', display: 'Esc', row: 0, col: 0, className: 'key-esc' },
      { code: 'Dead', display: '', row: 0, col: 1 },
      { code: 'F1', display: 'F1', row: 0, col: 2, className: 'key-function' },
      { code: 'F2', display: 'F2', row: 0, col: 3, className: 'key-function' },
      { code: 'F3', display: 'F3', row: 0, col: 4, className: 'key-function' },
      { code: 'F4', display: 'F4', row: 0, col: 5, className: 'key-function' },
      { code: 'Dead', display: '', row: 0, col: 6 },
      { code: 'F5', display: 'F5', row: 0, col: 7, className: 'key-function' },
      { code: 'F6', display: 'F6', row: 0, col: 8, className: 'key-function' },
      { code: 'F7', display: 'F7', row: 0, col: 9, className: 'key-function' },
      { code: 'F8', display: 'F8', row: 0, col: 10, className: 'key-function' },
      { code: 'Dead', display: '', row: 0, col: 11 },
      { code: 'F9', display: 'F9', row: 0, col: 12, className: 'key-function' },
      { code: 'F10', display: 'F10', row: 0, col: 13, className: 'key-function' },
      { code: 'F11', display: 'F11', row: 0, col: 14, className: 'key-function' },
      { code: 'F12', display: 'F12', row: 0, col: 15, className: 'key-function' }
    ],
    // Number row
    [
      { code: 'Backquote', display: '`', row: 1, col: 0 },
      { code: 'Digit1', display: '1', row: 1, col: 1 },
      { code: 'Digit2', display: '2', row: 1, col: 2 },
      { code: 'Digit3', display: '3', row: 1, col: 3 },
      { code: 'Digit4', display: '4', row: 1, col: 4 },
      { code: 'Digit5', display: '5', row: 1, col: 5 },
      { code: 'Digit6', display: '6', row: 1, col: 6 },
      { code: 'Digit7', display: '7', row: 1, col: 7 },
      { code: 'Digit8', display: '8', row: 1, col: 8 },
      { code: 'Digit9', display: '9', row: 1, col: 9 },
      { code: 'Digit0', display: '0', row: 1, col: 10 },
      { code: 'Minus', display: '-', row: 1, col: 11 },
      { code: 'Equal', display: '=', row: 1, col: 12 },
      { code: 'Backspace', display: 'Backspace', row: 1, col: 13, width: 2 }
    ],
    // QWERTY row (with ISO Enter spanning to next row)
    [
      { code: 'Tab', display: 'Tab', row: 2, col: 0, width: 1.5 },
      { code: 'KeyQ', display: 'Q', row: 2, col: 1 },
      { code: 'KeyW', display: 'W', row: 2, col: 2 },
      { code: 'KeyE', display: 'E', row: 2, col: 3 },
      { code: 'KeyR', display: 'R', row: 2, col: 4 },
      { code: 'KeyT', display: 'T', row: 2, col: 5 },
      { code: 'KeyY', display: 'Y', row: 2, col: 6 },
      { code: 'KeyU', display: 'U', row: 2, col: 7 },
      { code: 'KeyI', display: 'I', row: 2, col: 8 },
      { code: 'KeyO', display: 'O', row: 2, col: 9 },
      { code: 'KeyP', display: 'P', row: 2, col: 10 },
      { code: 'BracketLeft', display: '[', row: 2, col: 11 },
      { code: 'BracketRight', display: ']', row: 2, col: 12 },
      { code: 'Enter', display: 'Enter', row: 2, col: 13, className: 'key-enter-iso' }
    ],
    // ASDF row (with ISO Enter continuation and UK hash key)
    [
      { code: 'CapsLock', display: 'Caps', row: 3, col: 0, width: 1.75 },
      { code: 'KeyA', display: 'A', row: 3, col: 1 },
      { code: 'KeyS', display: 'S', row: 3, col: 2 },
      { code: 'KeyD', display: 'D', row: 3, col: 3 },
      { code: 'KeyF', display: 'F', row: 3, col: 4 },
      { code: 'KeyG', display: 'G', row: 3, col: 5 },
      { code: 'KeyH', display: 'H', row: 3, col: 6 },
      { code: 'KeyJ', display: 'J', row: 3, col: 7 },
      { code: 'KeyK', display: 'K', row: 3, col: 8 },
      { code: 'KeyL', display: 'L', row: 3, col: 9 },
      { code: 'Semicolon', display: ';', row: 3, col: 10 },
      { code: 'Quote', display: "'", row: 3, col: 11 },
      { code: 'Backslash', display: '#', row: 3, col: 12 }
    ],
    // ZXCV row (with UK backslash key)
    [
      { code: 'ShiftLeft', display: 'Shift', row: 4, col: 0, width: 1.25 },
      { code: 'IntlBackslash', display: '\\', row: 4, col: 1 },
      { code: 'KeyZ', display: 'Z', row: 4, col: 2 },
      { code: 'KeyX', display: 'X', row: 4, col: 3 },
      { code: 'KeyC', display: 'C', row: 4, col: 4 },
      { code: 'KeyV', display: 'V', row: 4, col: 5 },
      { code: 'KeyB', display: 'B', row: 4, col: 6 },
      { code: 'KeyN', display: 'N', row: 4, col: 7 },
      { code: 'KeyM', display: 'M', row: 4, col: 8 },
      { code: 'Comma', display: ',', row: 4, col: 9 },
      { code: 'Period', display: '.', row: 4, col: 10 },
      { code: 'Slash', display: '/', row: 4, col: 11 },
      { code: 'ShiftRight', display: 'Shift', row: 4, col: 12, width: 2.75 }
    ],
    // Bottom row
    [
      { code: 'ControlLeft', display: 'Ctrl', row: 5, col: 0, width: 1.5 },
      { code: 'MetaLeft', display: 'Win', row: 5, col: 1 },
      { code: 'AltLeft', display: 'Alt', row: 5, col: 2, width: 1.25 },
      { code: 'Space', display: 'Space', row: 5, col: 3, className: 'key-space' },
      { code: 'AltRight', display: 'AltGr', row: 5, col: 4, width: 1.25 },
      { code: 'MetaRight', display: 'Win', row: 5, col: 5 },
      { code: 'ContextMenu', display: 'Menu', row: 5, col: 6 },
      { code: 'ControlRight', display: 'Ctrl', row: 5, col: 7, width: 1.25 }
    ]
  ];

  ngOnInit(): void {
    this.actionsService.selectedAction$
      .pipe(takeUntil(this.destroy$))
      .subscribe(action => {
        this.selectedAction = action;
      });

    this.actionsService.keyMappings$
      .pipe(takeUntil(this.destroy$))
      .subscribe(mappings => {
        this.keyMappings = mappings;
      });

    this.actionsService.modifierMappings$
      .pipe(takeUntil(this.destroy$))
      .subscribe(mappings => {
        this.modifierMappings = mappings;
      });

    this.modifierStateService.currentModifierSet$
      .pipe(takeUntil(this.destroy$))
      .subscribe(modifierSet => {
        this.currentModifierSet = modifierSet;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onKeyClick(key: KeyboardKey): void {
    if (this.selectedAction) {
      // Use modifier-aware mapping if modifiers are pressed, otherwise use regular mapping
      if (this.currentModifierSet !== ModifierSet.NONE) {
        this.actionsService.mapKeyToActionWithModifier(key.code, DeviceType.KEYBOARD, key.display);
      } else {
        this.actionsService.mapKeyToAction(key.code, DeviceType.KEYBOARD, key.display);
      }
    } else {
      // If no action selected, clear the mapping for this key
      if (this.currentModifierSet !== ModifierSet.NONE) {
        this.actionsService.clearModifierKeyMapping(key.code);
      } else {
        this.actionsService.clearKeyMapping(key.code);
      }
    }
  }

  getKeyStyle(key: KeyboardKey): Record<string, string> {
    const mapping = this.actionsService.getCurrentMappingForKey(key.code);
    const baseStyle: Record<string, string> = {};

    if (mapping && mapping.actionId) {
      const action = this.actionsService.getActionById(mapping.actionId);
      if (action) {
        // Fill the entire key with the action color
        const actionColor = this.actionsService.getActionColor(action);
        baseStyle['background'] = actionColor;
        baseStyle['color'] = this.getContrastColor(actionColor);
        baseStyle['border-color'] = actionColor;
      }
    }

    return baseStyle;
  }

  getKeyClasses(key: KeyboardKey): string {
    let classes = 'keyboard-key';
    if (key.code === 'Dead') {
      classes = 'keyboard-dead-key'
    }
    
    if (key.className) {
      classes += ` ${key.className}`;
    }

    if (key.width) {
      classes += ' key-width-' + key.width*100;
    }

    if (key.code === 'Dead') {
      const mapping = this.keyMappings.get(key.code);
      if (mapping && mapping.actionId) {
        classes += ' key-mapped';
      }

      if (this.selectedAction) {
        classes += ' key-selectable';
      }
    }

    return classes;
  }

  getKeyTitle(key: KeyboardKey): string {
    const mapping = this.actionsService.getCurrentMappingForKey(key.code);
    if (mapping && mapping.actionId) {
      const action = this.actionsService.getActionById(mapping.actionId);
      if (action) {
        const modifierText = this.currentModifierSet !== ModifierSet.NONE ? ` (${this.currentModifierSet})` : '';
        return `${key.display} - ${action.name}${modifierText}`;
      }
    }
    return key.display;
  }

  private getContrastColor(hexColor: string): string {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }
}
