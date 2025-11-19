import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import 'rxjs/add/operator/map';
import {Connect} from '../../services/connect';

export interface TmpDatabase {
    db_name: string;
    original_db: string;
    target_environment?: string; // コピー先環境（production/staging/develop）
    privacy_deleted?: number; // プライバシーデータ削除済みかどうか
    created_date: string;
    age_days: number;
    expiry_date: string;
    is_expired: boolean;
    is_warning: boolean;
    compare_url: string;
    access_url: string;
    copied_tables?: string; // コピーしたテーブル（all または dataset__1,dataset__2 等）
    status?: string; // ステータス（creating:作成中, completed:作成済み, failed:失敗）
}

export interface TmpDatabaseListResponse {
    result: string;
    databases: TmpDatabase[];
    total: number;
}

export interface CreateTmpDatabaseResponse {
    result: string;
    status?: string;
    db_name: string;
    original_db: string;
    target_environment?: string;
    compare_url?: string;
    created_date?: string;
    expiry_date?: string;
    access_url?: string;
    message: string;
}

export interface DeleteTmpDatabaseResponse {
    status: string;
    message: string;
}

export interface DatabaseInfo {
    value: string;
    label: string;
    db_name?: string;
    target_environment?: string;
    [key: string]: any;
}

@Injectable({
    providedIn: 'root'
})
export class TmpDatabaseService {

    constructor(private _connect: Connect) {
    }

    /**
     * 一時DB一覧を取得
     */
    getTmpDatabases(): Observable<TmpDatabaseListResponse> {
        return this._connect.get('/admin/list-tmp-databases');
    }

    /**
     * 指定DBのデータセット一覧を取得
     */
    getDatabaseDatasets(db: string): Observable<any> {
        return this._connect.get(`/admin/database-datasets/${db}`);
    }

    /**
     * 一時DBを作成
     */
    createTmpDatabase(sourceDb: string, table?: string, tables?: string[], targetEnvironment: string = 'production'): Observable<CreateTmpDatabaseResponse> {
        const params: any = {
            db: sourceDb,
            target_environment: targetEnvironment
        };

        // 複数テーブル選択の場合
        if (tables && tables.length > 0) {
            params.tables = tables;
        }
        // 単一テーブル選択の場合（後方互換性）
        else if (table) {
            params.table = table;
        }

        return this._connect.post('/admin/copy-to-tmp-db', params);
    }

    /**
     * 一時DBを削除
     */
    deleteTmpDatabase(dbName: string): Observable<DeleteTmpDatabaseResponse> {
        return this._connect.post('/admin/delete-tmp-database', {db_name: dbName});
    }

    /**
     * 利用可能なDB一覧を取得
     */
    getAvailableDatabases(): Observable<DatabaseInfo[]> {
        return this._connect.get('/admin/available-databases').map(response => {
            console.log('Available databases response:', response);
            const databases = response?.databases || [];
            return databases
                .map((db: DatabaseInfo | string) => this.normalizeDatabaseInfo(db))
                .filter((db: DatabaseInfo) => !!db.value);
        });
    }

    /**
     * デバッグ情報を取得
     */
    getDebugInfo(dbName: string): Observable<any> {
        return this._connect.get(`/admin/tmp-database-debug/${dbName}`);
    }

    private normalizeDatabaseInfo(db: DatabaseInfo | string): DatabaseInfo {
        if (typeof db === 'string') {
            return {
                value: db,
                label: db
            };
        }

        const value = db.value || db.db_name || db.label || db.display || '';
        const label = db.label || db.display || db.db_name || db.value || value;

        return {
            ...db,
            value,
            label
        };
    }
}
