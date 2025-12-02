import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ActionsService } from './services/actions.service';
import { DeviceType } from './models/interfaces';
import { KeyboardLayoutComponent } from './components/keyboard-layout/keyboard-layout.component';
import { MouseLayoutComponent } from './components/mouse-layout/mouse-layout.component';
import { ActionsListComponent } from './components/actions-list/actions-list.component';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    KeyboardLayoutComponent,
    MouseLayoutComponent,
    ActionsListComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private actionsService = inject(ActionsService);
  private destroy$ = new Subject<void>();

  title = 'Device Layout Manager';
  selectedDevice: DeviceType = DeviceType.KEYBOARD;
  DeviceType = DeviceType;

  ngOnInit(): void {
    this.actionsService.selectedDevice$
      .pipe(takeUntil(this.destroy$))
      .subscribe(device => {
        this.selectedDevice = device;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDeviceSelect(device: DeviceType): void {
    this.actionsService.selectDevice(device);
  }

  getDeviceTabClass(device: DeviceType): string {
    return this.selectedDevice === device ? 'device-tab active' : 'device-tab';
  }
}
