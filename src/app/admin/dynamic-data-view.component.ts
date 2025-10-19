import {
    ChangeDetectorRef,
    Component,
    Input,
    OnInit,
    NgModule,
    ViewChild,
    ElementRef,
    TemplateRef,
    ChangeDetectionStrategy,
    OnChanges,
    SimpleChanges,
    SecurityContext,
    HostListener
} from '@angular/core';
import {SharedService} from 'app/services/shared';
import {Router} from '@angular/router';
import {Data} from '../class/Data';
import {Connect} from '../services/connect';
import {TableInfo} from '../class/TableInfo';
import * as FileSaver from 'file-saver';
import {Lightbox, LightboxConfig} from 'ngx-lightbox';
import ToastrService from '../toastr-service-wrapper.service';
import {ModalModule, BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {GrantGroupData} from '../class/GrantGroupData';
import {Form} from '../class/Form';
import {Observable} from 'rxjs/Observable';
import {NgDompurifySanitizer} from '@tinkoff/ng-dompurify';
import {LightboxEvent, LIGHTBOX_EVENT} from 'ngx-lightbox';
import {Subscription} from 'rxjs';
import {CrossTableHeader} from '../class/CrossTableHeader';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {RecordListService} from '../services/RecordListService';

import * as DOMPurify from 'dompurify';

@Component({
    selector: 'dynamic-data-view',
    templateUrl: './dynamic-data-view.component.html',
    styleUrls: ['./dynamic-data-view.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})


export class DynamicDataViewComponent implements OnChanges, OnInit {
    @Input() table_info: TableInfo;
    @Input() up: Function;
    @Input() down: Function;
    @Input() dataType;
    @Input() data: Data;
    @Input() field_name: string;
    @Input() download: Function;
    @Input() loading = false;
    @Input() nolink: boolean = false;
    @Input() crossTableHeader: CrossTableHeader;

    @Input() update: Observable<any>;

    //optional
    @Input() grantGroupData: GrantGroupData = null;
    @Input() loadGrantGroupAuto: boolean = true

    @Input() is_view_mode: boolean = false;
    @Input() isSummarizeMode: boolean = false;
    @Input() customFilter: any = null;

    //simple grant view
    @Input() simpleGrantView: boolean = false;

    public downloading: string = null;
    private isdownloading: boolean = false;
    private isdownloadpdf: string = '1';
    public arrayValue: Array<any>;
    public rawArrayValue: Array<any>;
    public isTextField: boolean = false;
    public form: Form;
    public videoLoading: boolean = true;

    public calendarLoading = false;

    public page = 1;

    public pageLabel!: string;

    public ispdf: boolean = false;
    public google_calendar_setting: boolean = false;

    src = '';

    //GrantGruop

    private toasterService: ToastrService;
    private lightboxIndex: number = null;

    modalRef: BsModalRef;

    constructor(public _share: SharedService, private _router: Router, private _connect: Connect,
                private _lightbox: Lightbox, private _lightboxConfig: LightboxConfig, public changeDetectorRef: ChangeDetectorRef,
                toasterService: ToastrService, private modalService: BsModalService, private cd: ChangeDetectorRef,
                private readonly dompurifySanitizer: NgDompurifySanitizer, private _lightboxEvent: LightboxEvent,private readonly domSanitizer: DomSanitizer) {
        this.toasterService = toasterService
        _lightboxConfig.centerVertically = true;
    }

    ngOnInit(): void {
        this.downloading = null;
        if (this.update) {
            this.update.subscribe(value => {
                this.cd.markForCheck();
            });
        }
    }

    is_string(data) {
        return data instanceof String;
    }

    download_file(url, no_action_log = false, file_name: string = null, isdownload = '1') {
        this.downloading = url;
        this._share.download_file(url, () => {
            this.downloading = null;
            this.changeDetectorRef.detectChanges();
        }, no_action_log, file_name, isdownload);
    }

    async showFileIfPossibleClicked(url, file_name, data, template: TemplateRef<any>) {
        let fileExt = file_name.split('.').pop()?.toLowerCase() || '';
        let image_extensions = ['jpg', 'jpeg', 'png'];
        let video_extensions = ['mp4', 'webm', 'mov', 'wmv', 'mkv'];
        let other_extensions = ['pdf'];
        let allowed_extensions = image_extensions.concat(video_extensions);
        allowed_extensions = allowed_extensions.concat(other_extensions);
        if(!allowed_extensions.includes(fileExt)) {
            this.download_file(url,false, file_name);
            return;
        }
        let form_array = this.table_info.forms.getArray();
        let field_name_array: string[] = [];
        // get forms when custom field, show_file, is true
        for (let i = 0; i < form_array.length; i++) {
            if (form_array[i]['_custom_field']) {
                if(form_array[i]['_custom_field']['show_file']) {
                    if(form_array[i]['field']['Field']==this.field_name)
                        this.isdownloadpdf="0";
                    field_name_array.push(form_array[i]['field']['Field']);
                }
            }
        }

        if (field_name_array.length > 0 && field_name_array.includes(this.field_name)) {
            if(image_extensions.includes(fileExt)) {
                let images: { src: string, thumb: string }[] = [];
                const src = url;
                const thumb = url + '/thumbnail';

                let image = {
                    src: src,
                    thumb: thumb
                };
                images.push(image);
                this._lightbox.open(images, 0);
            }
            if(video_extensions.includes(fileExt)) {
                let video_url = '';
                await this.getPresignedURL(url, data.id).then( res => video_url = res.body.presignedUrl);
                this.src = video_url;
                this.videoLoading = true;
                this.modalRef = this.modalService.show(template);
            }
            if(other_extensions.includes(fileExt)) {
                this.download_file(url,false, file_name,this.isdownloadpdf);
                return;
            }
        }
        else {
            // show file condition is false
            this.download_file(url,false, file_name);
        }
    }

     getPresignedURL(url, id) {
        return this._connect.get('/admin/get-presigned-url',
            {
                'url': url,
                'id' : id,
            },
            {observe: 'response'}
        ).toPromise();
    }

    toDetail(link_data) {
        this._router.navigate([this._share.getAdminTable(), link_data['table'], 'view', link_data['data']]);
    }

    private getArrayValue(is_raw: boolean = false): Array<string> {
        if (!this.getValue(is_raw)) {
            return []
        }
        if (!Array.isArray(this.getValue(is_raw))) {
            return [this.getValue(is_raw)];
        }
        return this.getValue(is_raw);

    }

    getValue(is_raw: boolean = false) {
        if (!this.field_name) {
            return null
        }
        if (is_raw) {
            return this.data.raw_data[this.field_name]
        }
        return this.data.view_data[this.field_name];
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.isTextField = ['image', 'thumbnail', 'file', 'url', 'number', 'richtext', 'grant_group'].indexOf(this.dataType) == -1;

        // yフィールドのデバッグ
        if (this.field_name && this.field_name.match(/^y\d+$/)) {
            console.log(`yフィールド ${this.field_name} debug:`, {
                dataType: this.dataType,
                isTextField: this.isTextField,
                form: this.form,
                data: this.data
            });
        }

        // calcタイプでも数値フォーマットを適用する場合があるため、データを準備
        if (this.dataType === 'calc' && this.data && this.data.table_info) {
            this.arrayValue = this.getArrayValue();
            this.rawArrayValue = this.getArrayValue(true);

            const form = this.data.table_info.forms.byFieldName(this.field_name);
            if (form && this.isCalcNumericField()) {

                this.arrayValue = this.arrayValue.map((value, index) => {
                    const rawValue = this.rawArrayValue[index];
                    // 数値または数値に変換可能な文字列の場合
                    if (typeof rawValue === 'number' || (typeof rawValue === 'string' && !isNaN(parseFloat(rawValue)))) {
                        return RecordListService.formatNumericValue(rawValue, form);
                    }
                    return value;
                });
            }
        }

        if (['image', 'file'].indexOf(this.dataType) !== -1) {
            if (this.data && this.data.table_info) {
                this.arrayValue = this.getArrayValue();
                this.rawArrayValue = this.getArrayValue(true);
            }
        } else if (!this.isTextField) {
            if (this.data && this.data.table_info) {
                let form = this.data.table_info.forms.byFieldName(this.field_name);
                if (form && form.is_multi_value_mode && !!this.data.child_data_by_table[form.multiple_table_name]) {

                    this.arrayValue = this.data.child_data_by_table[form.multiple_table_name].map(d => {
                    let value = d.view_data['value'] !== "null" && d.view_data['value'] !== null && d.view_data['value'] !== undefined && d.view_data['value'] !== ""
                        ? d.view_data['value']
                        : d.raw_data['value'];

                    value = RecordListService.formatNumericValue(value, form);
                    return value;
                }).filter(v => v !== null && v !== undefined && v !== "" && v !== "null");

                    this.rawArrayValue = this.data.child_data_by_table[form.multiple_table_name].map(d => d.raw_data['value'])


                } else {
                    this.arrayValue = this.getArrayValue();
                    this.rawArrayValue = this.getArrayValue(true);

                    // 数値フォーマットを適用（numberフィールドまたはcalcフィールドで数値結果の場合）
                    const isNumericField = this.dataType === 'number' ||
                        (form?.original_type === 'calc' && form?.option && form.option['calc_result_type'] === 'number') ||
                        (form?.original_type === 'calc' && form?.custom_field && form.custom_field['calc_result_type'] === 'number');


                    if (isNumericField && form) {

                        this.arrayValue = this.arrayValue.map((value, index) => {
                            const rawValue = this.rawArrayValue[index];
                            // 数値または数値に変換可能な文字列の場合
                            if (typeof rawValue === 'number' || (typeof rawValue === 'string' && !isNaN(parseFloat(rawValue)))) {
                                return RecordListService.formatNumericValue(rawValue, form);
                            }
                            return value;
                        });
                    }
                }
            }
        }

        if (this.field_name) {
            this.form = this.table_info.forms.byFieldName(this.field_name)
        }

        // yフィールド（集計結果）の場合は、arrayValueとrawArrayValueを準備してフォーマット
        if (this.field_name && this.field_name.match(/^y\d+$/)) {
            if (this.data && this.data.table_info) {
                this.arrayValue = this.getArrayValue();
                this.rawArrayValue = this.getArrayValue(true);

                // yフィールドの元フィールドから設定を取得してフォーマット
                const summaryField = this.getSummaryFieldFromYField(this.field_name);
                if (summaryField && this.table_info && this.table_info.forms) {
                    const summaryForm = this.table_info.forms.byFieldName(summaryField);
                    if (summaryForm) {
                        this.arrayValue = this.arrayValue.map((value, index) => {
                            const rawValue = this.rawArrayValue[index];
                            if (typeof rawValue === 'number' || (typeof rawValue === 'string' && !isNaN(parseFloat(rawValue)))) {
                                return RecordListService.formatNumericValue(rawValue, summaryForm);
                            }
                            return value;
                        });
                    }
                }
            }
        }

        if (this.dataType === 'grant_group' && this.loadGrantGroupAuto && this.data && this.data.raw_data[this.field_name]) {
            this._connect.get('/admin/view/grant_group/' + this.data.raw_data[this.field_name]).subscribe((data) => {
                this._share.getTableInfo('grant_group').subscribe(_table_info => {
                    this.grantGroupData = new GrantGroupData(_table_info)
                    this.grantGroupData.setInstanceData(data.data)
                    this.changeDetectorRef.detectChanges();
                })
            });
        }

    }


    getSanitizedValue(value): SafeHtml {

        if (Array.isArray(value)) {
            value = value.join(', ');
        }
        if (typeof value !== 'string') {
            value = String(value);
        }
 
        value = value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        let allowedTags = ['a', 'p', 'br', 'span', 'div', 'b', 'i', 'u', 'strong', 'em', 's', 'table', 'tr', 'td', 'th', 'tbody', 'thead', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        if (this._router.url.includes('/view/')) {
            allowedTags = allowedTags.concat(['iframe', 'img', 'video']);
        }
        const cleanHtml = this.dompurifySanitizer.sanitize(SecurityContext.HTML, value, {
            ALLOWED_TAGS: allowedTags,
            ADD_ATTR: ['target', 'rel'],
            FORCE_BODY: true
        }).replace(/<p>/g, '<p class="mb-0">');
        return this.domSanitizer.bypassSecurityTrustHtml(cleanHtml);

    }

    getNumericStyle(index: number): any {
        // 集計結果（yフィールド）の場合は特別な処理を行う
        const isYField = this.field_name && this.field_name.match(/^y\d+$/);
        const isSummaryRow = this.data && this.data.raw_data && this.data.raw_data['is_summary_row'];

        if (isYField) {
            console.log('dynamic-data-view y-field getNumericStyle:', {
                field_name: this.field_name,
                index: index,
                value: this.rawArrayValue ? this.rawArrayValue[index] : null,
                isSummaryRow: isSummaryRow,
                form: this.form,
                data_raw: this.data ? this.data.raw_data : null
            });

            // yフィールドの場合は常に対応する元フィールドの設定を使用（集計行でも詳細行でも）
            if (this.table_info && this.table_info.forms && this.rawArrayValue && this.rawArrayValue[index] !== undefined) {
                // yフィールドから対応する元フィールドを取得（例：y1 -> field__51）
                const summaryField = this.getSummaryFieldFromYField(this.field_name);
                if (summaryField) {
                    const summaryForm = this.table_info.forms.byFieldName(summaryField);
                    if (summaryForm) {
                        const style = RecordListService.getNumericStyle(this.rawArrayValue[index], summaryForm);
                        console.log('dynamic-data-view y-field applying source field style:', {
                            field_name: this.field_name,
                            value: this.rawArrayValue[index],
                            summaryField: summaryField,
                            summaryForm: summaryForm,
                            summaryForm_custom_field: summaryForm.custom_field,
                            style: style
                        });
                        return style;
                    }
                }
            }
        }

        if (!this.form || !this.rawArrayValue || !this.rawArrayValue[index]) {
            return {};
        }

        const style = RecordListService.getNumericStyle(this.rawArrayValue[index], this.form);

        return style;
    }

    /**
     * yフィールドから対応する集計対象フィールドを取得する
     * @param yField y1, y2, y3などの集計結果フィールド名
     * @returns 対応する元フィールド名（例：field__51）
     */
    private getSummaryFieldFromYField(yField: string): string | null {
        // yフィールドのパターンをチェック（y1, y2, y3など）
        const yMatch = yField.match(/^y(\d+)$/);
        if (!yMatch) {
            return null;
        }

        const yIndex = parseInt(yMatch[1]) - 1; // 0ベースのインデックスに変換

        // customFilterのsummarizeFilter.summary_aから実際のフィールド名を取得
        if (this.customFilter && this.customFilter.summarizeFilter && this.customFilter.summarizeFilter.summary_a) {
            const summaryA = this.customFilter.summarizeFilter.summary_a;
            if (summaryA[yIndex]) {
                const summaryField = summaryA[yIndex].summary_field;
                console.log(`dynamic-data-view - yフィールド ${yField} -> summary_a[${yIndex}] -> ${summaryField}`, {
                    yField: yField,
                    yIndex: yIndex,
                    summary_a: summaryA,
                    summaryField: summaryField
                });
                return summaryField;
            }
        }

        // フォールバック: chart_paramsのsummary_aから実際のフィールド名を取得
        if (this.data && this.data.raw_data && this.data.raw_data['chart_params']) {
            const chartParams = this.data.raw_data['chart_params'];
            if (chartParams.summary_a && chartParams.summary_a[yIndex]) {
                const summaryField = chartParams.summary_a[yIndex].summary_field;
                console.log(`dynamic-data-view - fallback yフィールド ${yField} -> chart_params.summary_a[${yIndex}] -> ${summaryField}`, {
                    yField: yField,
                    yIndex: yIndex,
                    summary_a: chartParams.summary_a,
                    summaryField: summaryField
                });
                return summaryField;
            }
        }

        // 将来的には他のyフィールドに対応する場合はここに追加
        // y2 -> field__52, y3 -> field__53 などのマッピングルールを定義可能

        return null;
    }

    isCalcNumericField(): boolean {
        const form = this.table_info.forms.byFieldName(this.field_name);
        if (!form || form.original_type !== 'calc') {
            return false;
        }

        // custom_fieldまたはoptionからcalc_result_typeを確認
        const isNumeric = (form.custom_field && form.custom_field['calc_result_type'] === 'number') ||
            (form.option && form.option['calc_result_type'] === 'number');


        return isNumeric;
    }

    /**
     * yフィールド（集計結果）かどうかを判定する
     * @returns yフィールドの場合true
     */
    isYField(): boolean {
        return this.field_name && this.field_name.match(/^y\d+$/) !== null;
    }

    is_show_download() {
        //1週間前まで
        let date = new Date(this.data.raw_data['created']);

        let week_ago = new Date();
        week_ago.setDate(week_ago.getDate() - 7)
        console.log(date)
        console.log(week_ago)

        return date > week_ago

    }

    download_csv() {
        //console.time('download_csv:');
        let csv_id = this.data.raw_data['id']

        const url = this._connect.getApiUrl() + '/admin/download-csv/' + csv_id;
        this.downloading = url;
        this._connect.get(url, null, {'responseType': 'blob'}).subscribe((data: any) => {
            this.downloading = null;
            this.changeDetectorRef.detectChanges();
            if (data.size === 0) {
                alert('ダウンロードに失敗しました。権限を確認して下さい。');
                return;
            }
            const blob = new Blob([data], {type: 'text/csv'});
            //let filename = this.table_info.getLabel() + '_' + this._share.dateFormat.format(new Date(), 'yyyyMMdd_hhmm') + '.csv';
            FileSaver.saveAs(blob, this.data.raw_data['filename']);
        })

        //console.timeEnd('download_csv:');
    }


    view() {
        this._router.navigate([this._share.getAdminTable(), this.table_info.table, 'view', this.data.raw_data['id']]);
    }


    openImg(i: number) {
        let album = this.arrayValue.map(file_info => {
            return {
                src: file_info.url,
                thumb: file_info.thumbnail_url,
                caption: file_info.name,
            }
        })
        // album = album.filter((fileinfo,num)=>{
        //     return num==i
        // })
        this.lightboxIndex = i
        this._lightbox.open(album, i, {showZoom: true, centerVertically: true, disableScrolling: true, fadeDuration: 0, resizeDuration: 0.2, enableTransition: false});
        this._subscription = this._lightboxEvent.lightboxEvent$
            .subscribe(event => this._onReceivedEvent(event));
    }


    private _subscription: Subscription;

    private _onReceivedEvent(event: any): void {
        console.log(event)
        // remember to unsubscribe the event when lightbox is closed
        if (event.id === LIGHTBOX_EVENT.CLOSE) {
            // event CLOSED is fired
            this._subscription.unsubscribe();
        }

        if (event.id === LIGHTBOX_EVENT.OPEN) {
            // event OPEN is fired
        }

        if (event.id === LIGHTBOX_EVENT.CHANGE_PAGE) {
            // event change page is fired
            console.log(event.data); // -> image index that lightbox is switched to
            if (event.data == this.lightboxIndex) {
                return;
            }
            this._subscription.unsubscribe();
            this._lightbox.close()
            this.openImg(event.data)
        }
    }

    clickLink(url: string) {
        // 20240509 Kanazawa 追加
        // templateから渡される時stringを担保できないので追加（他の箇所で同様の処理をしているのを確認）
        url = url.toString()
        url = url.trim();
        if (!url.match(/^http/)) {
            this._share.copyMessage(this.getLink(url))
            this.toasterService.success('URLをコピーしました')
        } else {
            window.open(this.getLink(this.getLink(url)), '_blank')
        }
    }

    isUrl(url: string) {
        if (!url) {
            return false;
        }
        url = url.toString()
        url = url.trim();

        // スペースがある場合は false を返す
        // https://loftal.slack.com/archives/C05CK6Z7YDQ/p1695620082106199 の対応で消す
        // if (url.includes(' ')) {
        //     return false;
        // }

        // Check if the url is wrapped in an a element
        let reg = /<a [^>]*>.*<\/a>/g;
        if (url.match(reg)) {
            return false;
        }

        return url && (url.match(/^http/) || url.match(/^\\/) || url.match(/^file:/))
    }

    getLink(path: string) {
        if (path.match(/,/)) {
            //for dezie
            return path.split(',')[0]
        }
        return path
    }

    getFileName(path: string) {
        if (path.match(/,/)) {
            //for dezie
            return path.split(',')[1]
        }
        return path
    }

    isPdfFile(filename) {
        return filename && filename.match(/.pdf$/)
    }

    isDownloading(_url: string): boolean {
        return this.downloading == _url
    }

    textToHtml(text: string) {
        //convert text to urlencode
        if (!text) {
            return text;
        }
        if (this.dataType == 'text') {
            return this.encodeHTML(text).replace(/ /g, '&nbsp;');
        }

        if (['textarea', 'email'].includes(this.dataType)) {
            text = this.textToUrl(text);
            text = this.textToEmail(text);
            return this.sanitizeAndAllowSafeTags(text);
        }

        return this.encodeHTML(text);
    }

    textToUrl(text: string) {
        // Match URLs that are not inside anchor tags and don't contain spaces
        let reg = /(?<!<a [^>]*>)(?<!href=["'])(https?:\/\/[^\s"'<>]+)(?![^<]*<\/a>)/g;
        //check text is string
        if (!text) {
            return text;
        }
        text = text.toString()
        return text.replace(reg, function (url) {
            return '<a href="' + url + '" target="_blank">' + url + '</a>';
        })
    }

    textToEmail(text: string) {
        let reg = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
        return text.replace(reg, function (mail) {
            return '<a href="mailto:' + mail + '">' + mail + '</a>';
        });
    }


    encodeHTML(str) {
        return str.toString().replace(/[\u00A0-\u9999<>\&]/g, function (i) {
            return '&#' + i.charCodeAt(0) + ';';
        });
    }

    googleAuth(){
        this.google_calendar_setting = true;
    }

    handleGoogleFileInput(files: FileList, calendar_id: string) {

        if(!calendar_id){
            this.toasterService.error('カレンダーIDは必須です');
            return;
        }
        if(!files){
            this.toasterService.error('jsonファイルを選択してください');
            return;
        }
        const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!emailPattern.test(calendar_id)) {
            this.toasterService.error('形式が正しくありません。');
            return;
        }
        if (files && files.length > 0) {
            this.calendarLoading = true;

            const fileToUpload = files.item(0);
            const url = this._connect.getApiUrl() + '/admin/google-calendar-setting';
            const formData: FormData = new FormData();
            formData.append('json', fileToUpload, fileToUpload.name);
            formData.append('calendar_id', calendar_id);
            this._connect.postUpload(url, formData).subscribe((response) => {
                this.calendarLoading = false;
                this.toasterService.success('Google 連携が完了しました。')
                this.google_calendar_setting = false;
                this.changeDetectorRef.detectChanges()
                window.location.reload();
            }, (error) => {
                this.calendarLoading = false;
                this.changeDetectorRef.detectChanges()
                this.toasterService.error(error.error.error_message + ':::手順書の確認と、カレンダーIDを確認してください。')
            })
        }
    }

    formatArrayValue(value: any): string {
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return value;
    }

    getGoogelMapLink(){
        const lat = this.data.raw_data[this.table_info.menu.getGoogleMapLatField()]
        const lng = this.data.raw_data[this.table_info.menu.getGoogleMapLngField()]
        return 'https://www.google.com/maps/search/?api=1&query=' + lat +  ',' + lng
    }
    formatFileSize(bytes: number): string {
        if (!bytes) {
            return '';
        }
        return bytes > 1024 * 1024
            ? (bytes / (1024 * 1024)).toFixed(2) + 'MB'
            : (bytes / 1024).toFixed(2) + 'KB';
    }

    formatSimpleLabel(label: string): string {
        if (!label) {
            return '';
        }
        const items = label.split('<br>').filter(item => item.trim());
        if (items.length <= 3) {
            return label;
        }
        const firstThree = items.slice(0, 3).join('<br>');
        const remaining = items.length - 3;
        return `${firstThree}<br>他 ${remaining}名`;
    }

    getSimpleLabel(label: string, type: 'user' | 'org'): string {
        if (!label) {
            return '';
        }

        let items = label.split('<br>').filter(item => item.trim());

        if (type === 'user') {
            items = items.map(item => {
                const emailIndex = item.indexOf('@');
                if (emailIndex > -1) {
                    const startIndex = item.lastIndexOf(' ', emailIndex);
                    if (startIndex > -1) {
                        return item.substring(0, startIndex);
                    }
                }
                return item;
            });
        }

        return items.join(', ');
    }

    getCombinedLabels(adminLabel: string, divisionLabel: string): Array<{type: 'user' | 'org', text: string}> {
        const result: Array<{type: 'user' | 'org', text: string}> = [];

        if (adminLabel) {
            const userItems = adminLabel.split('<br>').filter(item => item.trim());
            userItems.forEach(item => {
                const emailIndex = item.indexOf('@');
                let userName = item;

                if (emailIndex > -1) {
                    const startIndex = item.lastIndexOf(' ', emailIndex);
                    if (startIndex > -1) {
                        userName = item.substring(0, startIndex);
                    }
                }

                result.push({type: 'user', text: userName});
            });
        }

        if (divisionLabel) {
            const orgItems = divisionLabel.split(',').map(item => item.trim()).filter(item => item);
            orgItems.forEach(item => {
                result.push({type: 'org', text: item});
            });
        }

        return result;
    }

    sanitizeAndAllowSafeTags(text: string): string {
        if (!text) return '';

        if (typeof text !== 'string') {
            text = String(text);
        }

        const allowedTags = [
        'a', 'b', 'i', 'u', 'em', 'strong', 'br', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'span', 'div', 'img', 'hr', 'blockquote', 'code', 'pre', 'small'
        ];

        const tagPattern = new RegExp(`</?(${allowedTags.join('|')})(\\s[^>]*)?>`, 'gi');

        const placeholders: string[] = [];

        const textWithPlaceholders = text.replace(tagPattern, (match) => {
            placeholders.push(match);
            return `__SAFE_TAG_${placeholders.length - 1}__`;
        });

        // Escape all < and > (to show any non-safe tag like <A1対応機種>)
        let escaped = textWithPlaceholders
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Restore only the whitelisted tags
        placeholders.forEach((tag, i) => {
            escaped = escaped.replace(`__SAFE_TAG_${i}__`, tag);
        });

        return escaped.trim();
    }


}
