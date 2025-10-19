import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
    selector: 'app-debug-dialog',
    template: `
        <h2 mat-dialog-title>デバッグ情報: {{ data.db_name }}</h2>
        <mat-dialog-content>
            <div class="debug-info">
                <div class="info-section">
                    <h3>基本情報</h3>
                    <div class="info-row">
                        <span class="label">データベース名:</span>
                        <span class="value">{{ data.db_name }}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">元データベース:</span>
                        <span class="value">{{ data.original_db }}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">環境:</span>
                        <span class="value">{{ data.target_environment || 'production' }}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">ステータス:</span>
                        <span class="value" [ngClass]="getStatusClass(data.status)">{{ data.status }}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">プライバシー削除:</span>
                        <span class="value">{{ data.privacy_deleted ? '削除済み' : '未削除' }}</span>
                    </div>
                </div>

                <div class="info-section">
                    <h3>時刻情報</h3>
                    <div class="info-row">
                        <span class="label">作成開始:</span>
                        <span class="value">{{ data.created_at }}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">作成完了:</span>
                        <span class="value">{{ data.completed_at || '未完了' }}</span>
                    </div>
                </div>

                <div class="info-section">
                    <h3>コピー対象テーブル</h3>
                    <div class="copy-tables">{{ data.copied_tables || 'all' }}</div>
                </div>

                <div class="info-section" *ngIf="data.error_message">
                    <h3>エラーメッセージ</h3>
                    <div class="error-message">{{ data.error_message }}</div>
                </div>

                <div class="info-section" *ngIf="data.copy_output">
                    <h3>実行ログ</h3>
                    <div class="copy-output">
                        <pre>{{ data.copy_output }}</pre>
                    </div>
                </div>
            </div>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button mat-button (click)="close()">閉じる</button>
        </mat-dialog-actions>
    `,
    styles: [`
        .debug-info {
            font-family: 'Courier New', monospace;
            font-size: 14px;
        }

        .info-section {
            margin-bottom: 20px;
            padding: 10px;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
        }

        .info-section h3 {
            margin: 0 0 10px 0;
            color: #333;
            font-size: 16px;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 5px;
        }

        .info-row {
            display: flex;
            margin-bottom: 5px;
        }

        .label {
            font-weight: bold;
            width: 150px;
            color: #666;
        }

        .value {
            flex: 1;
            color: #333;
        }

        .value.status-completed {
            color: #4caf50;
        }

        .value.status-failed {
            color: #f44336;
        }

        .value.status-creating {
            color: #ff9800;
        }

        .copy-tables,
        .error-message {
            padding: 10px;
            background-color: #f5f5f5;
            border-radius: 4px;
            word-break: break-all;
        }

        .error-message {
            background-color: #ffebee;
            color: #c62828;
        }

        .copy-output {
            max-height: 400px;
            overflow-y: auto;
            background-color: #263238;
            color: #aed581;
            padding: 10px;
            border-radius: 4px;
        }

        .copy-output pre {
            margin: 0;
            white-space: pre-wrap;
            word-wrap: break-word;
        }

        mat-dialog-content {
            max-width: 800px;
            min-width: 600px;
        }
    `]
})
export class DebugDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<DebugDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
    }

    close(): void {
        this.dialogRef.close();
    }

    getStatusClass(status: string): string {
        return `status-${status}`;
    }
}
