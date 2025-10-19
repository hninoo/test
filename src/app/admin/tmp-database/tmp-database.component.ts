import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormControl} from '@angular/forms';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {TmpDatabaseService, TmpDatabase, CreateTmpDatabaseResponse} from '../services/tmp-database.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '../components/confirm-dialog.component';
import {PusherService} from '../../service/PusherService';
import {DebugDialogComponent} from './debug-dialog.component';

@Component({
    selector: 'app-tmp-database',
    templateUrl: './tmp-database.component.html',
    styleUrls: ['./tmp-database.component.css']
})
export class TmpDatabaseComponent implements OnInit, OnDestroy {
    tmpDatabases: TmpDatabase[] = [];
    availableDatabases: string[] = [];
    isLoading = false;
    isCreating = false;  // 作成中の状態を別管理
    selectedSourceDb = '';
    selectedTable = '';
    selectedTables: string[] = [];  // 複数選択対応
    selectedTargetEnvironment = 'production';  // コピー先環境
    totalCount = 0;
    lastCreatedDatabase: CreateTmpDatabaseResponse | null = null;

    // データセット一覧
    datasets: any[] = [];

    // ページリロード用のタイマー
    private reloadTimer: any;

    displayedColumns: string[] = [
        'access',
        'original_db',
        'target_environment',
        'created_date',
        'copied_tables',
        'status',
        'age_days',
        'expiry_date',
        'actions'
    ];

    constructor(
        private tmpDbService: TmpDatabaseService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        private pusherService: PusherService
    ) {
    }

    ngOnInit(): void {
        // localhost以外でloftal.pigeon-cloud.com以外のホストの場合は/admin/にリダイレクト
        if (window.location.hostname !== 'loftal.pigeon-cloud.com' && window.location.hostname !== 'localhost') {
            window.location.href = '/admin/';
            return;
        }

        this.loadTmpDatabases();
        this.loadAvailableDatabases();
        this.setupPusherNotifications();
        this.setupAutoReload();
    }

    ngOnDestroy(): void {
        // Pusher接続をクリーンアップ
        this.pusherService.unbind('tmp-database-completed');
        this.pusherService.cleanup();

        // ページリロードタイマーをクリア
        if (this.reloadTimer) {
            clearInterval(this.reloadTimer);
        }
    }

    private setupPusherNotifications(): void {
        // 一時DBコピー完了イベントをバインド
        this.pusherService.bindTmpDatabaseCompleted((data: any) => {
            console.log('Tmp database creation completed:', data);

            // ローディング状態を解除
            this.isCreating = false;

            // 作成完了通知を表示
            this.showSuccessMessage(`一時DB「${data.db_name}」の作成が完了しました`);

            // 現在作成中のDBが完了した場合、詳細情報を更新
            if (this.lastCreatedDatabase && this.lastCreatedDatabase.db_name === data.db_name) {
                this.lastCreatedDatabase = {
                    ...this.lastCreatedDatabase,
                    status: 'completed',
                    created_date: data.created_date,
                    expiry_date: data.expiry_date,
                    access_url: data.access_url,
                    compare_url: data.compare_url
                };
            }

            // 一覧を再読み込み
            this.loadTmpDatabases();

            // 通知受信後、すぐに接続を終了
            this.pusherService.finishOperation();
        });
    }

    /**
     * 一時DB一覧を読み込み
     */
    loadTmpDatabases(): void {
        this.isLoading = true;
        this.tmpDbService.getTmpDatabases().subscribe({
            next: (response) => {
                if (response.result === 'success') {
                    this.tmpDatabases = response.databases;
                    this.totalCount = response.total;
                } else {
                    this.showErrorMessage('一時DB一覧の取得に失敗しました');
                }
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading tmp databases:', error);
                this.showErrorMessage('一時DB一覧の取得中にエラーが発生しました');
                this.isLoading = false;
            }
        });
    }

    /**
     * DB選択時の処理
     */
    onDatabaseChange(db: string): void {
        // Copy対象テーブルの選択をリセット
        this.selectedTables = [];

        if (db) {
            this.loadDatabaseDatasets(db);
        } else {
            this.datasets = [];
        }
    }

    /**
     * 利用可能なDB一覧を読み込み
     */
    loadAvailableDatabases(): void {
        this.tmpDbService.getAvailableDatabases().subscribe({
            next: (databases) => {
                this.availableDatabases = databases;
                if (databases.length > 0) {
                    this.selectedSourceDb = databases[0];
                    this.onDatabaseChange(databases[0]);
                }
            },
            error: (error) => {
                console.error('Error loading available databases:', error);
            }
        });
    }

    /**
     * 指定DBのデータセット一覧を読み込み
     */
    loadDatabaseDatasets(db: string): void {
        this.tmpDbService.getDatabaseDatasets(db).subscribe({
            next: (response) => {
                if (response.result === 'success' && response.datasets && response.datasets.length > 0) {
                    this.datasets = response.datasets;
                } else {
                    // 空の場合は読み込み失敗を示すダミーデータをセット
                    this.datasets = [{
                        value: '',
                        label: '読み込み失敗',
                        display: '読み込み失敗',
                        disabled: true
                    }];
                }
            },
            error: (error) => {
                console.error('Error loading database datasets:', error);
                // エラー時は読み込み失敗を示すダミーデータをセット
                this.datasets = [{
                    value: '',
                    label: '読み込み失敗',
                    display: '読み込み失敗',
                    disabled: true
                }];
            }
        });
    }


    /**
     * 選択されたテーブルの表示文字列を取得
     */
    getSelectedTablesDisplay(): string {
        if (!this.selectedTables || this.selectedTables.length === 0) {
            return '';
        }

        const displays = this.selectedTables.map(value => {
            const dataset = this.datasets.find(d => d.value === value);
            return dataset ? dataset.label : value;
        });

        return displays.slice(0, 2).join(', ');
    }

    /**
     * 一時DBを作成
     */
    createTmpDatabase(): void {
        if (!this.selectedSourceDb) {
            this.showErrorMessage('コピー元DBを選択してください');
            return;
        }

        this.isCreating = true;
        // 複数テーブル選択対応
        this.tmpDbService.createTmpDatabase(
            this.selectedSourceDb,
            undefined,
            this.selectedTables.length > 0 ? this.selectedTables : undefined,
            this.selectedTargetEnvironment
        ).subscribe({
                next: (response) => {
                    if (response.result === 'success') {
                        this.lastCreatedDatabase = response;
                        if (response.status === 'started') {
                            this.showSuccessMessage('一時DBのコピーを開始しました。完了したら通知されます');
                            // 非同期処理の場合はローディング状態を継続（Pusher通知で解除）
                        } else {
                            this.showSuccessMessage('一時DBの作成が完了しました');
                            this.isCreating = false;
                        }
                        this.loadTmpDatabases(); // 一覧を再読み込み
                    } else {
                        this.showErrorMessage(response.message || '一時DBの作成に失敗しました');
                        this.isCreating = false;
                    }
                },
                error: (error) => {
                    console.error('Error creating tmp database:', error);
                    this.showErrorMessage('一時DBの作成中にエラーが発生しました');
                    this.isCreating = false;
                }
            });
    }

    /**
     * 一時DBを削除
     */
    deleteTmpDatabase(database: TmpDatabase): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '400px',
            data: {
                title: '一時DB削除確認',
                message: `本当に ${database.db_name} を削除しますか？\n\nこの操作は取り消せません。すべてのデータとS3ファイルが削除されます。`,
                confirmText: '削除',
                cancelText: 'キャンセル',
                isDestructive: true
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.isLoading = true;
                this.tmpDbService.deleteTmpDatabase(database.db_name).subscribe({
                    next: (response) => {
                        if (response.status === 'success') {
                            this.showSuccessMessage(`${database.db_name} を削除しました`);
                            this.loadTmpDatabases(); // 一覧を再読み込み
                        } else {
                            this.showErrorMessage(`削除に失敗しました: ${response.message}`);
                        }
                        this.isLoading = false;
                    },
                    error: (error) => {
                        console.error('Error deleting tmp database:', error);
                        this.showErrorMessage('削除中にエラーが発生しました');
                        this.isLoading = false;
                    }
                });
            }
        });
    }

    /**
     * 経過日数に応じたCSSクラスを取得
     */
    getAgeDaysClass(database: TmpDatabase): string {
        if (database.is_expired) {
            return 'age-danger';
        } else if (database.is_warning) {
            return 'age-warning';
        }
        return '';
    }

    /**
     * 一時DB環境にアクセス
     */
    accessTmpDatabase(database: TmpDatabase | { db_name: string }): void {
        // PHP側で生成されたaccess_urlを使用
        if ('access_url' in database && database.access_url) {
            window.open(database.access_url, '_blank');
        } else {
            // フォールバック: access_urlがない場合は環境に応じたURLを使用
            let domain = 'pigeon-cloud.com';
            if ('target_environment' in database) {
                if (database.target_environment === 'staging') {
                    domain = 'pigeon-demo.com';
                } else if (database.target_environment === 'develop') {
                    domain = 'pigeon-dev.com';
                }
            }
            const url = `https://${database.db_name}.${domain}`;
            window.open(url, '_blank');
        }
    }

    /**
     * 経過日数の状態を取得
     */
    getStatusText(database: TmpDatabase): string {
        if (database.is_expired) {
            return '期限切れ';
        } else if (database.is_warning) {
            return '期限間近';
        }
        return '正常';
    }

    /**
     * コピーしたテーブル名を省略形で表示
     */
    getTruncatedTables(tables: string): string {
        if (!tables) {
            return '-';
        }

        const tableList = tables.split(',').map(t => t.trim());

        // 2つ以下の場合はカンマ後に改行を入れて表示
        if (tableList.length <= 2) {
            return tableList.join(',\n');
        }

        // 最初の2つのテーブル名を表示し、残りは省略
        const firstTwo = tableList.slice(0, 2).join(',\n');
        const remaining = tableList.length - 2;
        return `${firstTwo}\n他${remaining}件`;
    }

    /**
     * 作成完了ダイアログを閉じる
     */
    closeCreatedDialog(): void {
        this.lastCreatedDatabase = null;
    }

    /**
     * 成功メッセージを表示
     */
    private showSuccessMessage(message: string): void {
        this.snackBar.open(message, '閉じる', {
            duration: 5000,
            panelClass: ['success-snackbar']
        });
    }

    /**
     * エラーメッセージを表示
     */
    private showErrorMessage(message: string): void {
        this.snackBar.open(message, '閉じる', {
            duration: 8000,
            panelClass: ['error-snackbar']
        });
    }

    /**
     * デバッグ情報を表示
     */
    showDebugInfo(database: TmpDatabase): void {
        this.tmpDbService.getDebugInfo(database.db_name).subscribe({
            next: (response) => {
                if (response.result === 'success' && response.debug_info) {
                    this.dialog.open(DebugDialogComponent, {
                        width: '800px',
                        data: response.debug_info
                    });
                } else {
                    this.showErrorMessage('デバッグ情報の取得に失敗しました');
                }
            },
            error: (error) => {
                console.error('Error loading debug info:', error);
                this.showErrorMessage('デバッグ情報の取得中にエラーが発生しました');
            }
        });
    }

    /**
     * 25分毎のページリロード設定
     * l_hashの有効期限（30分）が切れる前に新しいhashを取得するため
     */
    private setupAutoReload(): void {
        // 25分 = 1500秒 = 1500000ミリ秒
        const reloadInterval = 25 * 60 * 1000;

        this.reloadTimer = setInterval(() => {
            console.log('Auto-reloading page to refresh l_hash...');
            // 一覧を再読み込みして新しいaccess_urlを取得
            this.loadTmpDatabases();
        }, reloadInterval);

        console.log('Auto-reload timer set for 25 minutes interval');
    }
}
