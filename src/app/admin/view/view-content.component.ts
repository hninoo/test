import {Component, Input, OnChanges, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {Data} from '../../class/Data';
import {TableInfo} from 'app/class/TableInfo';
import {Observable} from 'rxjs/Observable';
import {Forms} from '../../class/Forms';
import {SharedService} from '../../services/shared';
import {RelationTable} from '../../class/RelationTable';
import {CustomFilter} from '../../class/Filter/CustomFilter';
import {Connect} from '../../services/connect';
import {ToastrService} from 'ngx-toastr';
import {Router} from '@angular/router';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {Subject} from 'rxjs';
import {FormFieldEditModalComponent} from '../form-field-edit-modal.component';

@Component({
    selector: 'admin-view-content',
    templateUrl: './view-content.component.html',
})

export class ViewContentComponent implements OnChanges {
    /**
     * 子テーブルで非表示にするフィールドの設定
     * Configuration for hiding specific fields in child tables
     */
    private child_table_ignore_fields = {
        'dataset__3687': ['field__359909543', 'field__359909539', 'field__359909538']
    };

    /**
     * 特定のテーブルの特定のフィールドを非表示にするかどうかを判定する
     * Determine whether to hide a specific field in a specific table
     * @param tableName テーブル名 / table name
     * @param fieldName フィールド名 / field name
     * @returns 非表示にする場合はtrue、表示する場合はfalse / true if the field should be hidden, false otherwise
     */
    public shouldHideField(tableName: string, fieldName: string): boolean {
        if (this.child_table_ignore_fields[tableName] &&
            this.child_table_ignore_fields[tableName].includes(fieldName)) {
            return true;
        }
        return false;
    }

    @Input('data') data: Data = new Data(new TableInfo([]));
    @Input('reload') reload: Function;
    @Input('loading') loading: Boolean;
    @Input('table_info') table_info: TableInfo;
    @Input('extend_headers') extend_headers: Array<any>
    @Input('extend_data') extend_data: {};
    @Input('customFilter') customFilter: CustomFilter;
    @Input() selectDataMode: boolean = false;

    @ViewChild('editFormFieldModal') editFormFieldModal: FormFieldEditModalComponent;

    public isEditMode: boolean = false;
    public isSaving: boolean = false;
    public update$ = new Subject<any>();

    modalRef: BsModalRef;
    modalData: Data = null;
    modalTableInfo: TableInfo = null;
    modalDataIndex: number = null;

    constructor(
        public _share: SharedService,
        public _connect: Connect,
        public toasterService: ToastrService,
        private router: Router,
        private modalService: BsModalService
    ) {

    }


    public relation_table_info_by_table: Object = {}

    public childTableEditMode: boolean = false;
    public childTableOriginalData: any = null;
    public indexColumnAdded: boolean = false;
    public editedChildData: { [table: string]: number[] } = {}; // 編集された子テーブルデータのインデックスを追跡

    private tempEditData: any = {};

    public fields: Array<any> = [];

    ngOnChanges(): void {
        if (this.data && this.data.relation_table_a) {
            this.data.relation_table_a.forEach(relation_table => {
                this._share.getTableInfo(relation_table.table).subscribe(_table_info => {
                    this.relation_table_info_by_table[relation_table.table] = _table_info
                })
            })
        }
        this.fields = this.getFields()
    }

    public getRelationTableInfo(relation_table: RelationTable): Observable<TableInfo> {
        return new Observable(observer => {
            this._share.getTableInfo(relation_table.table).subscribe(_table_info => {
                observer.next(_table_info)
            })
        });
    }

    public getRelationTableForms(relation_table: RelationTable): Observable<Forms> {
        return new Observable(observer => {
            this._share.getTableInfo(relation_table.table).subscribe(_table_info => {
                observer.next(_table_info.forms)
            })
        });

    }

    public getRelationViewFields(relation_table: RelationTable): Observable<Array<string>> {
        return new Observable(observer => {
            this._share.getTableInfo(relation_table.table).subscribe(_table_info => {
                if (!_table_info) {
                    observer.next([]);
                } else {
                    observer.next(relation_table.getViewFields(_table_info))
                }
            })
        });

    }

    public getFields() {
        if (!this.table_info) {
            return [];
        }
        if (!this.customFilter || !this.customFilter.view_use_show_fields || this.customFilter.show_fields.length == 0) {
            return this.table_info.fields;
        }
        return this.customFilter.show_fields.map(field_name => {
            return this.table_info.fields.find(f => {
                return f['Field'] === field_name
            })
        }).filter(f => {
            return !!f
        })

    }

    call_func(button, val) {
        eval('this.' + button.button_function + '(' + val + ',' + button.value + ')')
    }

    public sending_custom_button: boolean = false;
    public customInputField;

    importMailNow(child_id: number, value) {
        this.sending_custom_button = true;
        let hash = {id: child_id, from_days: value};
        this._connect.post(this._connect.getApiUrl() + '/admin/mail-import', hash, {}, false).subscribe(res => {
            this.sending_custom_button = false;
            this.toasterService.success(res.message);
        }, (error) => {
            console.log(error)
            this.sending_custom_button = false;
            this.toasterService.error(error.error['error_message'], 'エラー');
        });
    }

    /**
     * 子テーブルの詳細を表示
     * @param table テーブル名
     * @param id レコードID
     */
    viewChildDetail(table: string, id: number) {
        this.router.navigate(['/admin/', table, 'view', id]);
    }

    /**
     * 子テーブルの編集画面に遷移
     * @param table テーブル名
     * @param id レコードID
     */
    editChildDetail(table: string, id: number) {
        this.router.navigate(['/admin/', table, 'edit', id]);
    }

    /**
     * 子テーブルの削除確認
     * @param table テーブル名
     * @param id レコードID
     */
    deleteChildDetail(table: string, id: number) {
        if (confirm('このデータを削除しますか？')) {
            this._connect.post(this._connect.getApiUrl() + '/admin/delete/' + table, {id_a: [id]}, {}, false).subscribe(res => {
                this.toasterService.success('削除しました');
                if (this.reload) {
                    this.reload();
                }
            }, (error) => {
                console.log(error);
                this.toasterService.error(error.error['error_message'] || '削除に失敗しました', 'エラー');
            });
        }
    }

    /**
     * 新しい子テーブルデータを追加
     * @param table テーブル名
     */
    addNewChildData(table: string) {
        if (!this.data || !this.data.child_data_by_table || !this.data.child_data_by_table[table]) {
            this.toasterService.error('テーブル情報の取得に失敗しました', 'エラー');
            return;
        }

        const childTableInfo = this.table_info.getChildTableInfo(table);
        if (!childTableInfo) {
            this.toasterService.error('テーブル情報の取得に失敗しました', 'エラー');
            return;
        }

        const newData = new Data(childTableInfo);
        newData.setDefaultData();

        newData.raw_data['parent_id'] = this.data.getId();
        newData.raw_data['parent_table'] = this.table_info.table;

        if (!this.data.child_data_by_table[table]) {
            this.data.child_data_by_table[table] = [];
        }

        this.data.child_data_by_table[table].push(newData);

        const newIndex = this.data.child_data_by_table[table].length - 1;
        if (!this.editedChildData[table]) {
            this.editedChildData[table] = [];
        }
        if (this.editedChildData[table].indexOf(newIndex) === -1) {
            this.editedChildData[table].push(newIndex);
        }

        this.update$.next(true);
        // this.toasterService.info('新しい行を追加しました。編集後、保存ボタンを押してください。');
    }

    /**
     * 編集モードを切り替える
     * @param table テーブル名
     */
    toggleEditMode(table: string) {
        this.isEditMode = true;
        this.editedChildData = {}; // 編集データの追跡をリセット
    }

    /**
     * セルの値が変更された時の処理
     * @param event イベントデータ
     * @param data 変更対象のデータ
     */
    onValueChanged(event: any, data: Data) {
        data.raw_data[event.field_name] = event.value;
        // 編集されたデータのインデックスを追跡
        const table = event.table || this.getTableNameFromData(data);
        if (table && this.data && this.data.child_data_by_table && this.data.child_data_by_table[table]) {
            const index = this.data.child_data_by_table[table].findIndex(item => item === data);
            if (index !== -1) {
                if (!this.editedChildData[table]) {
                    this.editedChildData[table] = [];
                }
                if (this.editedChildData[table].indexOf(index) === -1) {
                    this.editedChildData[table].push(index);
                }
            }
        }
        this.update$.next(true);
    }

    /**
     * データからテーブル名を取得するヘルパーメソッド
     * @param data データオブジェクト
     * @returns テーブル名
     */
    private getTableNameFromData(data: Data): string {
        for (const table in this.data.child_data_by_table) {
            if (this.data.child_data_by_table[table].includes(data)) {
                return table;
            }
        }
        return '';
    }

    /**
     * 変更を保存
     * @param table テーブル名
     */
    saveChanges(table: string) {
        this.isSaving = true;

        if (!this.data || !this.data.child_data_by_table || !this.data.child_data_by_table[table]) {
            this.isSaving = false;
            return;
        }

        const childTableInfo = this.table_info.getChildTableInfo(table);
        if (!childTableInfo) {
            this.toasterService.error('テーブル情報の取得に失敗しました', 'エラー');
            this.isSaving = false;
            return;
        }

        // 編集されたデータと新規追加データ（IDがないデータ）を送信するために、editedIndexesを準備
        let editedIndexes = this.editedChildData[table] || [];

        this.data.child_data_by_table[table].forEach((data, index) => {
            if (!data.raw_data.id && editedIndexes.indexOf(index) === -1) {
                editedIndexes.push(index);
            }
        });

        const toDeleteData = []; // 削除データ（今回は未実装）

        const formData = this._share.getCommitData(
            childTableInfo,
            this.data.child_data_by_table[table],
            childTableInfo.fields,
            childTableInfo.forms,
            editedIndexes,
            toDeleteData
        );

        this._connect.post(
            this._connect.getApiUrl() + '/admin/' + table + '/commit',
            formData,
            {},
            false
        ).subscribe(
            (res) => {
                this.toasterService.success('保存しました');
                this.isEditMode = false;
                this.isSaving = false;
                this.editedChildData = {}; // 編集データの追跡をリセット

                // 保存完了後にデータをリロード
                if (this.reload) {
                    this.reload();
                }
            },
            (error) => {
                console.error('保存エラー:', error);
                this.toasterService.error(error.error?.error_message || '保存に失敗しました', 'エラー');
                this.isSaving = false;
            }
        );
    }

    /**
     * 編集をキャンセル
     */
    cancelEdit() {
        this.isEditMode = false;
        this.editedChildData = {};
        // データをリロード
        if (this.reload) {
            this.reload();
        }
    }

    /**
     * フォーム編集モーダルを表示
     * @param data モーダルに表示するデータ
     * @param dataId データID
     * @param child_table_info 子テーブル情報
     */
    showFormEditModal = (data: any, dataId: any, child_table_info: TableInfo, data_index: number) => {
        console.log('=== フォーム編集モーダル表示開始 ===');
        console.log('編集データ:', data);
        console.log('form:', data.form);
        console.log('field:', data.field);

        // フォーム編集モーダルで使用するデータをセット
        this.modalData = data;
        this.modalDataIndex = data_index;
        this.modalTableInfo = child_table_info;

        // ngAfterViewInitが実行された後に実行するために少し遅延させる
        setTimeout(() => {
            // 直接コンポーネントのshowメソッドを呼び出す
            if (this.editFormFieldModal) {
                this.editFormFieldModal.form = data.form;
                this.editFormFieldModal.field = data.field;
                this.editFormFieldModal.data = data.data || data;
                this.editFormFieldModal.table_info = child_table_info;
                this.editFormFieldModal.grant_menu_a = data.grant_menu_a;
                this.editFormFieldModal.is_setting = data.is_setting;
                this.editFormFieldModal.data_index = data.data_index || data_index;
                this.editFormFieldModal.selectChange = data.selectChange;

                console.log('モーダル表示直前のform:', this.editFormFieldModal.form);
                console.log('モーダル表示直前のfield:', this.editFormFieldModal.field);

                // モーダルを表示
                this.editFormFieldModal.show();
            } else {
                console.error('editFormFieldModal が見つかりません');
                // もう一度試行
                setTimeout(() => {
                    if (this.editFormFieldModal) {
                        this.editFormFieldModal.form = data.form;
                        this.editFormFieldModal.field = data.field;
                        this.editFormFieldModal.data = data.data || data;
                        this.editFormFieldModal.table_info = child_table_info;
                        this.editFormFieldModal.grant_menu_a = data.grant_menu_a;
                        this.editFormFieldModal.is_setting = data.is_setting;
                        this.editFormFieldModal.data_index = data.data_index || data_index;
                        this.editFormFieldModal.selectChange = data.selectChange;
                        this.editFormFieldModal.show();
                    } else {
                        console.error('再試行してもeditFormFieldModalが見つかりません');
                    }
                }, 100);
            }
        }, 0);
    }

    /**
     * フォーム編集モーダルを閉じる
     */
    closeFormEditModal = () => {
        console.log('=== モーダルを閉じる ===');
        if (this.editFormFieldModal) {
            console.log('editFormFieldModal.hide()を呼び出し');
            // this.editFormFieldModal.hide();
        } else {
            console.error('editFormFieldModalが見つかりません');
        }
    }

    /**
     * フォーム編集完了時の処理
     * @param event 編集完了イベントデータ
     */
    handleFormEditComplete(event: any) {
        console.log('=== フォーム編集完了 ===', event);
        // 編集された値を反映
        if (event && event.data) {
            // フィールド情報を取得
            const fieldName = event.field.Field;
            console.log('更新フィールド:', fieldName, '新しい値:', event.data.raw_data[fieldName]);

            //add editedChildData
            const table = event.table_info.table;
            const index = event.data_index || 0;
            if (this.data.child_data_by_table[table] && this.data.child_data_by_table[table][index]) {
                this.data.child_data_by_table[table][index] = event.data;

                // 編集したデータをeditedChildDataに追加して保存対象にする
                if (!this.editedChildData[table]) {
                    this.editedChildData[table] = [];
                }
                if (this.editedChildData[table].indexOf(index) === -1) {
                    this.editedChildData[table].push(index);
                }
            }

            // 値が変更されたことを通知してUI更新
            this.update$.next({
                field: event.field,
                value: event.data.raw_data[fieldName]
            });
        }

        // モーダルを閉じる
        this.closeFormEditModal();
    }

    /**
     * 表示するフィールドを取得する
     */
    public getDisplayFields(child: any): any[] {
        if (!child || !child.fields) {
            return [];
        }

        // フィールドをフィルタリングし、ラベル情報を追加
        return child.fields.filter(f => {
            // 非表示フィールドを除外
            if (['id', 'created', 'updated', 'admin_id', 'updated_admin_id', 'order'].includes(f.Field)) {
                return false;
            }
            // 特定のテーブルのフィールドを非表示にする
            if (this.shouldHideField(child.table, f.Field)) {
                return false;
            }

            // Check if field should be included in list view based on form configuration
            // "Include in list view" オプションをチェック
            if (child.forms && child.forms.byFieldName) {
                const form = child.forms.byFieldName(f.Field);
                if (form) {
                    let isShowList = form.custom_field['show-list'] !== false;
                    if (!isShowList) {
                        return false;
                    }
                }
            }
            
            return true;
        }).map(f => {
            // formsからラベル情報を取得
            if (child.forms && child.forms.byFieldName) {
                const form = child.forms.byFieldName(f.Field);
                if (form) {
                    f.label = form.label || f.Comment || f.Field;
                } else {
                    f.label = f.Comment || f.Field;
                }
            } else {
                f.label = f.Comment || f.Field;
            }
            return f;
        });
    }

    /**
     * フィールドのフォーム設定を取得する
     */
    public getFormForField(child: any, fieldName: string): any {
        if (!child || !child.forms) {
            console.warn('child.forms is not initialized:', child);
            return null;
        }

        // formsがFormsクラスのインスタンスか確認
        if (typeof child.forms.byFieldName !== 'function') {
            console.error('child.forms is not a Forms instance:', child.forms);
            return null;
        }

        return child.forms.byFieldName(fieldName);
    }

    private dataTypeByFieldCache = {}

    getdataTypeByFieldCacheFromByFieldName(fieldName: string, child_table: TableInfo = null) {
        // 計算フィールドのemail,urlの場合のみ、calc_result_typeからdatatypeを設定
        // 計算フィールドに個別に設定しなくてもなんとなく動いたが、文字列フィールドのurl,emailと同じ状態、挙動にするためにロジック追加
        if (child_table.forms.byFieldName(fieldName).original_type === 'calc'
            && ['email', 'url'].includes(child_table.forms.byFieldName(fieldName).custom_field['calc_result_type'])) {
            return child_table.forms.byFieldName(fieldName).custom_field['calc_result_type'];
        }
        return child_table.forms.byFieldName(fieldName).original_type;
    }

    getDataType(field: Object, child_table: TableInfo = null): string {
        if (!this.dataTypeByFieldCache[field['Field']]) {
            this.dataTypeByFieldCache[field['Field']] = child_table.forms.byFieldName(field['Field']) != undefined
                ? this.getdataTypeByFieldCacheFromByFieldName(field['Field'], child_table)
                : null;
        }
        return this.dataTypeByFieldCache[field['Field']]
    }

    /**
     * Event handler for format view data (based on dataset-table-row implementation)
     * @param event Event data
     */
    public onFormatViewData($event: any, table_name): void {
        console.log('onFormatViewData event:', $event, 'table_name:', table_name);
    }

    /**
     * Event handler for Ctrl+click events
     * @param event Event data
     */
    public onCtrlClick(event: any): void {
        // Handle Ctrl+click events if needed
        console.log('Ctrl+click event:', event);
    }
}
