import {Component, OnChanges, OnInit} from '@angular/core';
import {BlockModalBaseComponent} from '../block-modal-base/block-modal-base.component';
import {Block, CreateBlock} from '../flow.component';
import {cloneDeep} from 'lodash';
import {FormAndValue} from '../../class/FormAndValue';
import {TableInfo} from '../../class/TableInfo';

@Component({
    selector: 'app-create-edit-modal',
    templateUrl: './create-edit-modal.component.html',
    styleUrls: ['./create-edit-modal.component.scss']
})
export class CreateEditModalComponent extends BlockModalBaseComponent implements OnChanges {
    public block: CreateBlock;
    public target_table_info: TableInfo;
    public target_table_a = [];
    public select_null: boolean = true;
    public is_select_open: boolean = false;

    public readonly Block = Block;

    ngOnChanges(changes: import('@angular/core').SimpleChanges): void {
        if (changes.srcBlock && this.srcBlock && this.srcBlock.type == 'CREATE_DATA') {
            this.block = cloneDeep(this.srcBlock) as CreateBlock;
            this.targetTableChanged();
        }

        // テーブル一覧を取得
        this.target_table_a = [];
        this._shared.exist_table_a.forEach(_table => {
            this.target_table_a.push(_table);
        });

        super.ngOnChanges(changes);
    }

    targetTableChanged($event = null) {
        console.log('Target table changed:', $event);
        console.log('Current target table:', this.block.target_table);

        if (this.block.target_table) {
            this._shared.getTableInfo(this.block.target_table).subscribe(_table_info => {
                this.target_table_info = _table_info;
                this.block.setTargetTable(_table_info);

                if ($event) {
                    // テーブル変更時に既存の設定をクリア
                    this.block.form_and_values = [];
                }
            });
            this.select_null = false;
        } else {
            this.select_null = true;
        }
    }

    public save() {
        if (this.validate()) {
            super.save(this.block);
        }
    }

    private validate(): boolean {
        const errors: string[] = [];

        // 対象テーブルが選択されているかチェック
        if (!this.block.target_table) {
            errors.push('追加先テーブルを選択してください');
        }

        // フィールドが設定されているかチェック
        if (!this.block.form_and_values || this.block.form_and_values.length === 0) {
            errors.push('最低一つのフィールドを設定してください');
        }

        // フィールドの重複チェック
        const fieldNames: string[] = [];
        this.block.form_and_values.forEach(form_and_value => {
            if (form_and_value.form && form_and_value.form.field) {
                const fieldName = form_and_value.form.field['Field'];
                if (fieldNames.includes(fieldName)) {
                    errors.push('同じフィールドが複数選択されています: ' + form_and_value.form.label);
                } else {
                    fieldNames.push(fieldName);
                }
            }
        });

        // 必須フィールドチェック（target_table_infoがある場合）
        if (this.target_table_info) {
            this.target_table_info.forms.getArray().forEach(form => {
                if (form.required && !fieldNames.includes(form.field['Field'])) {
                    // 値が設定されていない必須フィールドがあるかチェック
                    const hasValue = this.block.form_and_values.some(fv =>
                        fv.form && fv.form.field['Field'] === form.field['Field'] &&
                        (fv.value || (fv.value_a && fv.value_a.length > 0))
                    );
                    if (!hasValue) {
                        errors.push(form.label + 'は必須です');
                    }
                }
            });
        }

        if (errors.length > 0) {
            alert('エラー:\n' + errors.join('\n'));
            return false;
        }

        return true;
    }

    ngOnInit(): void {
    }

    onChangeCreateValue($event) {
        console.log('Form and values changed:', $event);
        this.block.form_and_values = $event.form_and_values;
    }
}
