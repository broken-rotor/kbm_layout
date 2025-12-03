import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ActionsService } from '../../services/actions.service';
import { ModifierStateService } from '../../services/modifier-state.service';
import { MouseButton, DeviceType, Action, KeyMapping, ModifierSet } from '../../models/interfaces';

@Component({
  selector: 'app-mouse-layout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mouse-layout.component.html',
  styleUrls: ['./mouse-layout.component.css']
})
export class MouseLayoutComponent implements OnInit, OnDestroy {
  private actionsService = inject(ActionsService);
  private modifierStateService = inject(ModifierStateService);
  private destroy$ = new Subject<void>();

  selectedAction: Action | null = null;
  keyMappings = new Map<string, KeyMapping>();
  currentModifierSet: ModifierSet = ModifierSet.NONE;

  // Mouse button layout
  mouseButtons: MouseButton[] = [
    { code: 'MouseLeft', display: 'Left Click', x: 20, y: 20, width: 80, height: 60, className: 'mouse-left' },
    { code: 'MouseMiddle', display: 'Scroll', x: 100, y: 20, width: 40, height: 60, className: 'mouse-middle' },
    { code: 'MouseRight', display: 'Right Click', x: 140, y: 20, width: 80, height: 60, className: 'mouse-right' },
    { code: 'MouseScrollUp', display: 'Scroll Up', x: 100, y: 5, width: 40, height: 15, className: 'mouse-scroll' },
    { code: 'MouseScrollDown', display: 'Scroll Down', x: 100, y: 80, width: 40, height: 15, className: 'mouse-scroll' },
    { code: 'MouseForward', display: 'Forward', x: 5, y: 110, width: 50, height: 30, className: 'mouse-side' },
    { code: 'MouseBack', display: 'Back', x: 5, y: 145, width: 50, height: 30, className: 'mouse-side' }
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

    this.modifierStateService.modifierState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Calculate effective modifier set considering conflicts
        this.currentModifierSet = this.modifierStateService.getEffectiveModifierSet(
          (modifier) => this.actionsService.isModifierKeyBound(modifier)
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onButtonClick(button: MouseButton): void {
    if (this.selectedAction) {
      // Use modifier-aware mapping if modifiers are pressed, otherwise use regular mapping
      if (this.currentModifierSet !== ModifierSet.NONE) {
        this.actionsService.mapKeyToActionWithModifier(button.code, DeviceType.MOUSE, button.display);
      } else {
        this.actionsService.mapKeyToAction(button.code, DeviceType.MOUSE, button.display);
      }
    } else {
      // If no action selected, clear the mapping for this button
      if (this.currentModifierSet !== ModifierSet.NONE) {
        this.actionsService.clearModifierKeyMapping(button.code);
      } else {
        this.actionsService.clearKeyMapping(button.code);
      }
    }
  }

  getButtonStyle(button: MouseButton): Record<string, string> {
    const mapping = this.actionsService.getCurrentMappingForKey(button.code);
    const baseStyle: Record<string, string> = {
      left: button.x + 'px',
      top: button.y + 'px',
      width: button.width + 'px',
      height: button.height + 'px'
    };

    if (mapping && mapping.actionId) {
      const action = this.actionsService.getActionById(mapping.actionId);
      if (action) {
        const actionColor = this.actionsService.getActionColor(action);
        baseStyle['background-color'] = actionColor;
        baseStyle['color'] = this.getContrastColor(actionColor);
        baseStyle['border-color'] = actionColor;
      }
    }

    return baseStyle;
  }

  getButtonClasses(button: MouseButton): string {
    let classes = 'mouse-button';

    if (button.className) {
      classes += ` ${button.className}`;
    }

    const mapping = this.actionsService.getCurrentMappingForKey(button.code);
    if (mapping && mapping.actionId) {
      classes += ' button-mapped';
    }

    if (this.selectedAction) {
      classes += ' button-selectable';
    }

    return classes;
  }

  getButtonTitle(button: MouseButton): string {
    const mapping = this.actionsService.getCurrentMappingForKey(button.code);
    if (mapping && mapping.actionId) {
      const action = this.actionsService.getActionById(mapping.actionId);
      if (action) {
        const modifierText = this.currentModifierSet !== ModifierSet.NONE ? ` (${this.currentModifierSet})` : '';
        return `${button.display} - ${action.name}${modifierText}`;
      }
    }
    return button.display;
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
