import {Component, OnInit, ViewChild} from '@angular/core';
import ToastrService from '../toastr-service-wrapper.service';
import {Router} from '@angular/router';
import {Connect} from '../services/connect';
import {SharedService} from '../services/shared';

/**
 * tsv（エクセル）インポート用ウィンドウ
 */
@Component({
    selector: 'admin-tsv-import',
    templateUrl: './tsv-import.component.html',
    styleUrls: ['./tsv-import.component.css']
})
export class TsvImportComponent implements OnInit {

    // インポート中
    public loading: boolean;

    // テーブル名
    public datasetName: string;
    // インポートするtsv
    public datasetTsvText: string;
    // カラム名一覧
    public datasetColumnNameList: Array<Object>;
    // 通知ウィンドウ
    private toasterService: ToastrService;

    @ViewChild('importMenu') importMenu: any;
    @ViewChild('tsvImportMenu') tsvImportMenu: any;
    @ViewChild('tsvConfirmMenu') tsvConfirmMenu: any;

    public tsvDataCount: number = null
    private option_list: Array<Object> = [];

    constructor(public _share: SharedService, private _router: Router, private _connect: Connect, toasterService: ToastrService) {
        this.toasterService = toasterService;
        this.loading = false;
    }

    ngOnInit(): void {
    }

    ngAfterViewInit(): void {
        // ngOnInitだと@ViewChildで設定されない
        this.importMenu.hide();
        this.tsvImportMenu.hide();
        this.tsvConfirmMenu.hide();
    }

    public openImportMenu() {
        this.importMenu.show();
        this.tsvImportMenu.hide();
        this.tsvConfirmMenu.hide();
    }

    public openTsvImportMenu() {
        this.importMenu.hide();
        this.tsvImportMenu.show();
        this.tsvConfirmMenu.hide();
    }

    public openTsvConfirmMenu() {
        // パラメータ中の改行をプレースホルダーに置換（split(\n)対策）
        if (!this.datasetName) {
            this.toasterService.error('テーブル名を入力してください');
            return;
        }
        let reg_exp = new RegExp(/\"[\s\S]*?\"/, 'g');
        let target_text = [];
        while ((target_text = reg_exp.exec(this.datasetTsvText)) != null) {
            let text = target_text[0];
            let after_text = text.replace(/\n/g, '&#13;&#10;');
            after_text = after_text.replace(/\"/g, '');
            this.datasetTsvText = this.datasetTsvText.replace(text, after_text);
        }

        // tsvから項目を読み取る(パラメータ中の改行はプレースホルダーに置換済み)
        let tsv_list = this.datasetTsvText.split('\n');
        if (tsv_list.length >= 500) {
            this.toasterService.error('500件以上の場合、一度500件以下でインポート後、CSVにてインポートしてください');
            return;
        }
        let column_list = tsv_list[0].split('\t');
        column_list = column_list.map(d => d.trim());
        console.log(column_list)

        // 型判別
        let type_list = [];
        let option_list = []
        for (let n = 0; n < tsv_list[0].split('\t').length; n++) {
            type_list[n] = 'textarea'
            option_list[n] = {}

        }
        let textarea_flg_list = [];
        this.tsvDataCount = tsv_list.length - 1
        let priority_a = {
            'text': 200,
            'float': 150,
            'number': 100,

            'datetime': 150,
            'date': 100,
            'textarea': 0

        }


        //typeを確定する
        for (let i = 1; i < tsv_list.length; i++) {
            let param_list = tsv_list[i].split('\t');
            for (let n = 0; n < param_list.length; n++) {
                // パラメータの型を判別 edit.component.ts settingTypesに合わせる
                let type = this.getType(param_list[n]);
                if (!type) {
                    continue
                }
                if (type == 'textarea') {
                    textarea_flg_list[n] = true;
                }
                let pre_priority = priority_a[type_list[n]] ?? 1
                let priority = priority_a[type] ?? 1

                // 既に登録されている型と比較
                if (priority > pre_priority) {
                    type_list[n] = type;
                }

            }
        }

        let text_val_a = {};
        for (let n = 0; n < tsv_list[0].split('\t').length; n++) {
            let type = type_list[n]
            if (type == 'float') {
                for (let i = 1; i < tsv_list.length; i++) {
                    let val = tsv_list[i].split('\t')[n]
                    let g = val.match(/\.(\d+)/);
                    if (g) {

                        if (!option_list[n]['decimal_places']) {
                            option_list[n]['decimal_places'] = 1;
                        }

                        option_list[n]['decimal_places'] = Math.max(option_list[n]['decimal_places'], g[1].length)
                    }
                }
            } else if (type == 'text') {
                let val_a = []

                function getMultiple(value, index, self) {
                    return self.indexOf(value) === index;
                }


                let has_multi_value = false;
                for (let i = 1; i < tsv_list.length; i++) {
                    let val = tsv_list[i].split('\t')[n]
                    if (val) {
                        val = val.trim()
                    }
                    if (val != '' && val) {
                        //カンマ区切りがある場合
                        if (val.match(/,/)) {
                            has_multi_value = true
                            val.split(',').forEach(v => {
                                if (v != '') {
                                    val_a.push(v)
                                }
                            })
                        } else {
                            if (val != '') {
                                val_a.push(val)
                            }
                        }
                    }
                }

                function onlyUnique(value, index, self) {
                    return self.indexOf(value) === index;
                }

                var val_unique = val_a.filter(onlyUnique);
                //もし同じ値が結構あるなら、select
                console.log('値の同じ割合')
                console.log(val_unique)
                console.log(val_unique.length / val_a.length)
                if (val_unique.length / val_a.length < 0.7) {
                    type_list[n] = has_multi_value ? 'checkbox' : 'select'
                    option_list[n]['items'] = val_unique.join(',')
                }

            }
        }

        this.option_list = option_list

        // 項目名と型を紐付ける
        console.log(column_list)
        this.datasetColumnNameList = [];
        for (let i = 0; i < column_list.length; i++) {
            this.datasetColumnNameList.push(
                {
                    name: column_list[i],
                    type: type_list[i],
                    type_list: this.getTypeList(type_list[i], textarea_flg_list[i])
                }
            )
        }
        console.log(this.datasetColumnNameList)

        // 表示物の準備が終わってからウィンドウ切り替え
        this.tsvImportMenu.hide();
        this.tsvConfirmMenu.show();
    }

    back() {
        this.tsvImportMenu.show();
        this.tsvConfirmMenu.hide();
    }

    public importTsv() {

        // 型を取得
        let type_list = [];
        this.datasetColumnNameList.forEach(function (value) {
            type_list.push(value['type']);
        });

        // インポート開始
        this.loading = true;

        this._connect.post('/admin/add/tsv/' + this.datasetName + '/', {
            dataset_name: this.datasetName,
            tsv: this.datasetTsvText,
            column_list: this.datasetColumnNameList,
            option_list: this.option_list
        }, {}, false).subscribe((jsonData) => {
            // インポート終了
            this.loading = false;

            // 通信後初期化
            if (jsonData['result'] === 'success') {
                this._router.navigate([this._share.getAdminTable(), jsonData['table_name']]);
                this._share.loadAdminDatas();
                if (jsonData['ignore_list'].length > 0) {
                    for (let i = 0; i < 10; i++) {
                        if (jsonData['ignore_list'][i]) {
                            this.toasterService.warning(jsonData['ignore_list'][i] + '行目の読み込みで失敗しました。', '警告');
                        }
                    }
                } else {
                    this.datasetName = '';
                    this.datasetTsvText = '';
                    this.importMenu.hide();
                    this.tsvImportMenu.hide();
                    this.tsvConfirmMenu.hide();
                    this.toasterService.success('テーブルを作成しました。', '成功');
                }
            } else {
                this.toasterService.error('インポートに失敗しました。', 'エラー');
            }
        }, (e) => {
            console.log(e)
            // エラー発生
            // インポート終了
            this.loading = false;
            if (e.error && e.error.error_a && typeof e.error.error_a === 'object') {
                const errorMessages = Object.keys(e.error.error_a).map(key => e.error.error_a[key]).join(', ');
                this.toasterService.error(errorMessages, 'エラー');
            } else {
                this.toasterService.error(e.error.error_a.join(','), 'エラー');
            }
        });
    }

    /**
     * 指定されたtypeから変更可能なtypeを取得
     * @param {string} type
     * @param {boolean} textarea_flg
     * @returns {string[]}
     */
    public getTypeList(type, textarea_flg) {
        let type_list = [];
        switch (type) {
            case 'number':
                type_list = ['number', 'text', 'textarea'];
                break;
            case 'float':
                type_list = ['float', 'text', 'textarea'];
                break;
            case 'datetime':
                type_list = ['datetime', 'text', 'textarea'];
                break;
            case 'date':
                type_list = ['date', 'text', 'textarea'];
                break;
            case 'time':
                type_list = ['time', 'text', 'textarea'];
                break;
            case 'text':
                type_list = ['text', 'textarea'];
                break;
            case 'email':
                type_list = ['email', 'text', 'textarea'];
                break;
            case 'url':
                type_list = ['url', 'text', 'textarea'];
                break;
            case 'boolean':
                type_list = ['boolean', 'text', 'textarea'];
                break;
            case 'select':
                type_list = ['select', 'text', 'textarea'];
                break;
            case 'checkbox':
                type_list = ['checkbox', 'text', 'textarea'];
                break;
            default:    // textarea
                type_list = ['textarea', 'text'];
                break;
        }

        if (type != 'textarea' && textarea_flg) {
            type_list.push('textarea');
        }

        return type_list;
    }

    /**
     * タイプ名称取得
     * @param type
     * @returns {string}
     */
    public getTypeName(type) {
        switch (type) {
            case 'number':
                return '数値';
            case 'float':
                return '小数';
            case 'datetime':
                return '日時';
            case 'date':
                return '日付のみ';
            case 'time':
                return '時刻のみ';
            case 'textarea':
                return '文章(複数行)';
            case 'email':
                return 'メールアドレス';
            case 'url':
                return 'URL';
            case 'boolean':
                return 'YESNO';
            case 'checkbox':
                return '選択肢(複数選択)';
            case 'select':
                return '選択肢';
            default:    // textarea
                return '文字列(一行)';
        }
    }

    /**
     * パラメータから型を取得
     * @param param
     * @returns {string}
     */
    public getType(param): string {
        if (param == null || param == '') {
            return null
        }
        let type = 'text';      // 文字列（1行）
        if (param.match(/^[+,-]?[0-9]+\.[0-9]+$/)) {
            type = 'float';    // 小数
        } else if (param.match(/^[+,-]?[0-9,.]+$/)) {
            type = 'number';    // 数値
        } else if (param.match(/^"?(TRUE|FALSE)"?$/i)) {
            type = 'boolean';
        } else if (param.match(/^"?[0-9]{4}\/[0-9]{1,2}\/[0-9]{1,2} [0-9]{1,2}:[0-9]{1,2}(:[0-9]{1,2})?"?$/)) {
            type = 'datetime';  // 日時（yyyy/mm/dd hh:mm:ss）
        } else if (param.match(/^"?[0-9]{4}-[0-9]{1,2}-[0-9]{1,2} [0-9]{1,2}:[0-9]{1,2}(:[0-9]{1,2})?"?$/)) {
            type = 'datetime';  // 日時（yyyy-mm-dd hh:mm:ss）
        } else if (param.match(/^"?[0-9]{4}\/[0-9]{1,2}\/[0-9]{1,2}"?$/)) {
            type = 'date';      // 日付（yyyy/mm/dd）
        }/* else if (param.match(/^"?([0-9]{4}年)?[0-9]{1,2}月[0-9]{1,2}日"?$/)) {
            type = 'date';      // 日付（yyyy年mm月dd）
        }*/ else if (param.match(/^"?[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}"?$/)) {
            type = 'date';      // 日付（yyyy-mm-dd）
        } else if (param.match(/^"?[0-9]{1,2}:[0-9]{1,2}(:[0-9]{1,2})?"?$/)) {
            type = 'time';  // 時刻（hh:mm:ss）
        } else if (param.match(/&#13;&#10;/) || param.length > 180) {
            // 改行のプレースホルダーを条件にする
            type = 'textarea';  // 文章（複数行）
        } else if (param.match(/^([a-zA-Z0-9])+([a-zA-Z0-9\._-])*@([a-zA-Z0-9_-])+([a-zA-Z0-9\._-]+)+$/)) {
            type = 'email'      // メールアドレス
        } else if (param.match(/https?:\/\/[\w\/:%#\$&\?\(\)~\.=\+\-]+/)) {
            type = 'url';       // URL
        }
        console.log(param + ':' + type)
        return type;
    }

    /**
     * ngForで配列の展開順が変わってしまう対策
     * @returns {number}
     */
    public returnZero() {
        return 0;
    }

    public navigateDashboard() {
        this.importMenu.hide();
        this.tsvImportMenu.hide();
        this.tsvConfirmMenu.hide();
        this._router.navigate([this._share.getAdminTable(), 'dataset', 'edit', 'new']);
    }
}
