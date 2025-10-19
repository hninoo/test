import {Component, Inject} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

export interface ConfirmDialogData {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

@Component({
    selector: 'app-confirm-dialog',
    template: `
        <h2 mat-dialog-title>{{ data.title }}</h2>
        <mat-dialog-content>
            <p [innerHTML]="formatMessage(data.message)"></p>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button mat-button (click)="onCancel()">
                {{ data.cancelText || 'キャンセル' }}
            </button>
            <button mat-raised-button
                    [color]="data.isDestructive ? 'warn' : 'primary'"
                    (click)="onConfirm()">
                {{ data.confirmText || '確認' }}
            </button>
        </mat-dialog-actions>
    `,
    styles: [`
        mat-dialog-content {
            min-width: 300px;
        }

        mat-dialog-content p {
            white-space: pre-line;
            line-height: 1.5;
        }
    `]
})
export class ConfirmDialogComponent {

    constructor(
        public dialogRef: MatDialogRef<ConfirmDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
    ) {
    }

    onConfirm(): void {
        this.dialogRef.close(true);
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }

    formatMessage(message: string): string {
        return message.replace(/\n/g, '<br>');
    }
}
