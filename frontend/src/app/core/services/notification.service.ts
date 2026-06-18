import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private snack: MatSnackBar) {}

  success(msg: string) {
    this.snack.open(msg, '✕', { duration: 3500, panelClass: ['success-snack'] });
  }

  error(msg: string) {
    this.snack.open(msg, '✕', { duration: 5000, panelClass: ['error-snack'] });
  }

  info(msg: string) {
    this.snack.open(msg, '✕', { duration: 3000 });
  }
}
