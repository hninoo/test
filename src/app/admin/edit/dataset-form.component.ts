import {Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild, EventEmitter, Output, ElementRef} from '@angular/core';
import {Connect} from '../../services/connect';
import ToastrService from '../../toastr-service-wrapper.service';
import {Data} from '../../class/Data';
import {WorkflowTemplate} from '../../class/Workflow/WorkflowTemplate';
import {TableInfo} from '../../class/TableInfo';
import {SharedService} from '../../services/shared';
import {GrantGroupData} from '../../class/GrantGroupData';


@Component({
    selector: 'dataset-form',
    templateUrl: './dataset-form.component.html',
})

export class DatasetFormComponent implements OnInit, OnChanges {
    @Input('data') data: Data;
    @Input('workflow_template_a') workflow_template_a: Array<WorkflowTemplate>;
    @Input('system_table_info') system_table_info: TableInfo;
    @Input('error_a') error_a;
    @Input('is_system_table') is_system_table: boolean;
    @Input('parent') parent;
    @Input('data_lastchanged') data_lastchanged;
    @Input('workflow_template_csv') workflow_template_csv;

    @ViewChild('grantGroupModal') grantGroupModal: any;
    @ViewChild('csvInput') csvInput: ElementRef;

    @Output() csvLoaded: EventEmitter<File> = new EventEmitter();


    public grantGroupData: GrantGroupData = null;

    public workflow_template_csv_name;

    public isDatasetSettingOptionCollapsed = true;
    // カレンダー表示で参照する日時フィールドの候補
    public calendar_view_datetime_list = [];

    public calendar_view_display_list = [];
    // カレンダーで表示したい画像フィールドの候補
    public calendar_view_image_list = [];
    private toasterService: ToastrService;

    public dataset_table_info: TableInfo = null;

    public isInsert: boolean = false;

    public group_list = null;
    public last_option_changed_date: Date = null;

    public show_bulk_copy = false;
    public workflow_mention_list = [];
    public workflow_field_options = [];
    public calendar_date_color_data = [];
    public calendar_date_colors = new Set();


    @ViewChild('selectOtherEditModal') selectOtherEditModal: any;
    @ViewChild('setCalenderBgColor') setCalenderBgColor: any;

    constructor(private _connect: Connect, toasterService: ToastrService, public _share: SharedService) {
        this.toasterService = toasterService;
    }

    ngOnInit() {
        console.log('dataset form onninit')
        console.log(this.data)
        if (location.href.indexOf('http://localhost') === 0 || location.href.indexOf('https://flex.pigeon-cloud.com') === 0 || location.href.indexOf('https://flex.pigeon-demo.com') === 0) {
            this.show_bulk_copy = true;
        }
        if (!this.data.raw_data['id']) {
            this.isInsert = true
            this.setDefault()

        }
        this.isDatasetSettingOptionCollapsed = true;
        setTimeout(() => {
            this.calendarViewActive()
            if(this.data.raw_data['is_calendar_view_enabled']){
                // 詳細画面からの複製のとき、fieldの値に合わせてカレンダーの一部値を変更する必要がある
                this.checkCalendarValue()
            }

        }, 1000)
        this._share.getTableInfo('dataset').subscribe(res => {
            this.dataset_table_info = res;
        })

        this._share.getTableInfo('dataset_group').subscribe(_table_info => {
            this._connect.getList(_table_info).subscribe(res => {
                this.group_list = res['data_a'].map(d => d['raw_data'])
            })
        })
    }

    setDefault() {
        this.data.setRawData({
            'show_id': 'true',
            'show_menu': 'true',
            'show_admin': 'true',
            'show_created': 'true',
            'editable_on_list': 'true',
            'sortable': 'true',
            'search': 'true',
            'download_csv': 'true',
            'upload_csv': 'true',
            'sort_order': 'desc',
            'sort_field': 'updated'
        })

    }

    ngOnChanges(changes: SimpleChanges): void {
        console.log('dataset form onchange')
        console.log(this.data)
        this.calendarViewActive()
        this.workflowActive()

        if (this.data.raw_data['calendar_date_color']) {
            this.calendar_date_color_data = JSON.parse(this.data.raw_data['calendar_date_color']);
            this.calendar_date_color_data.forEach( date => {
                if( !this.calendar_date_colors.has(date.color) ){
                    this.calendar_date_colors.add(date.color)
                }
            })
        }

        if (typeof this.data.raw_data['csv_main_key_field'] === 'string') {
            this.data.raw_data['csv_main_key_field'] = this.data.raw_data['csv_main_key_field'].split(',');
        }
    }

    flgChangeJson(key, val, $event): void {
        if ($event.target.checked) {
            this.data.addValueOfJsonField(key, val)
        } else {
            this.data.removeValueOfJsonField(key, val)
        }
    }

    showTopMemoChange(key, $event) {

        this.flgChange(key, $event)
        if (this.data.raw_data['show_top_memo'] == 'true') {
            if (!this.data.raw_data['top_memo_display_view']) {
                this.data.addValueOfJsonField('top_memo_display_view', 'list')
                //this.data.setRawData({'top_memo_display_view':['list']});
            }
        }
    }

    flgChange(key, $event) {
        let hash = {}
        if ($event.target.checked) {
            hash[key] = 'true'
            if (key == 'include_files_to_csv') hash['include_file_name_to_csv'] = 'false';
            if (key == 'include_file_name_to_csv') hash['include_files_to_csv'] = 'false';
        } else {
            hash[key] = 'false'
        }
        this.data.setRawData(hash);
        console.log(this.data.raw_data)
    }

    onValueChanged(workflow_template: WorkflowTemplate, cond_index: number, $event) {
        workflow_template.conditions.replaceCondition(cond_index, $event.condition);
    }

    addWorkflowTempate() {
        this.workflow_template_a.push(new WorkflowTemplate())
    }

    getTableName() {
        return 'dataset__' + this.data.raw_data['id'];
    }

    onWorkflowChanged(workflow_template: WorkflowTemplate, $event) {
        workflow_template.workflow = $event.workflow;
    }

    calendarViewActive() {
        console.log('view active')
        this.calendar_view_datetime_list = [];
        this.calendar_view_display_list = [];
        this.calendar_view_image_list = [];
        if (!this.data.child_data_by_table['dataset_field']) {
            return;
        }
        this.data.child_data_by_table['dataset_field'].forEach(data => {
            if (data.raw_data.type == 'datetime' || data.raw_data.type == 'date') {
                this.calendar_view_datetime_list.push({
                    name: data.raw_data['name'],
                    value: (data.raw_data['id']) ? 'field__' + data.raw_data['id'] : data.raw_data['unique_key_name']
                });
            }
            if (data.raw_data.type == 'image') {
                this.calendar_view_image_list.push({
                    name: data.raw_data['name'],
                    value: (data.raw_data['id']) ? 'field__' + data.raw_data['id'] : data.raw_data['unique_key_name']
                })
            } else {
                if (data.raw_data.type == 'fixed_html') {
                    return;
                }
                this.calendar_view_display_list.push({
                    name: data.raw_data['name'],
                    value: (data.raw_data['id']) ? 'field__' + data.raw_data['id'] : data.raw_data['unique_key_name']
                });
            }
        });
        //this.data.raw_data['from_to_calendar_view_datetime'] = "false";
        console.log(this.calendar_view_datetime_list)
    }

    workflowActive() {
        this.workflow_mention_list = [];
        this.workflow_field_options = [];
        if (this.data.child_data_by_table['dataset_field']) {
            this.data.child_data_by_table['dataset_field'].forEach(data => {
                if (data.raw_data['type'] != 'fixed_html') {
                    this.workflow_mention_list.push({
                        name: data.raw_data['name'],
                        value: (data.raw_data['id']) ? 'field__' + data.raw_data['id'] : data.raw_data['unique_key_name']
                    })
                }

                if (data.raw_data['type'] == 'select_other_table' && data.raw_data.option['item-table'] == 'admin' && data.raw_data.option['required'] && data.raw_data['id']) {
                    this.workflow_field_options.push({
                        label: data.raw_data['name'],
                        field_name: 'field__' + data.raw_data['id']
                    })
                }
            });
        }
        this.workflow_mention_list.push({name: '作成者', value: 'admin_id'})
        this.workflow_mention_list.push({name: 'ID', value: 'id'})
        this.workflow_mention_list.push({name: '作成日時', value: 'created'})
        this.reloadGrantGroupData('workflow_done_can_edit_grant_group_id')

        this.workflow_field_options.push({label: '作成者', field_name: 'admin_id'})
        this.workflow_field_options.push({label: '最終更新者', field_name: 'updated_admin_id'})


    }

    checkCalendarValue() {
        const checkvalues = ['calendar_view_datetime_from', 'calendar_view_datetime_to']

        checkvalues.forEach(checkvalue => {
            const valueToCheck = this.data.raw_data[checkvalue];
            const existsInList = this.calendar_view_datetime_list.some(item => item.value === valueToCheck);

            if (!existsInList) {
                const datasetFields = this.data.child_data_by_table['dataset_field'];
                for (const datasetField of datasetFields) {
                    const fieldMenuConfigJson = JSON.parse(datasetField.raw_data.field_menu_config_json);
                    if (fieldMenuConfigJson.field === valueToCheck) {
                        this.data.raw_data[checkvalue] = datasetField.raw_data.unique_key_name;
                        break;
                    }
                }
            }
        });

        const imageValueToCheck = this.data.raw_data['image_field_displaying_in_calendar_view']
        const existsImageInList = this.calendar_view_image_list.some(item => item.value === imageValueToCheck);
        if (!existsImageInList) {
            const datasetFields = this.data.child_data_by_table['dataset_field'];
            for (const datasetField of datasetFields) {
                const fieldMenuConfigJson = JSON.parse(datasetField.raw_data.field_menu_config_json);
                if (fieldMenuConfigJson.field === imageValueToCheck) {
                    this.data.raw_data['image_field_displaying_in_calendar_view'] = datasetField.raw_data.unique_key_name;
                    break;
                }
            }
        }

    }

    mentionSelect(event) {
        return '{' + event.name + '}';
    }

    uploadCsv() {
        this.csvInput.nativeElement.click();
    }

    changeCsv(event) {
        const fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            this.workflow_template_csv = fileList[0];
            this.workflow_template_csv_name = this.workflow_template_csv.name;
            this.csvLoaded.emit(this.workflow_template_csv);
        }
    }

    downloadCsv() {
        console.log(this.dataset_table_info.table)
        this._connect.get('/admin/workflow/csv_download/' + this.data.raw_data['id'], null, null, false).subscribe((data) => {
            console.log(data)
            const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
            let blob = new Blob([bom, data['csvData']], {type: 'text/csv'});
            let url = window.URL.createObjectURL(blob);

            let a = document.createElement('a');
            a.href = url;
            a.download = 'dataset__' + this.data.raw_data['id'] + '_workflow_template.csv';
            a.click();
        });
    }

    chnaged($event, key) {
        let hash = {}
        hash[key] = $event.value;
        this.data.setRawData(hash)

    }

    onInputGrantGroup($event, field_name) {
        this.data.raw_data[field_name] = $event.id
        this.grantGroupModal.hide()

        this.reloadGrantGroupData(field_name)
    }

    private reloadGrantGroupData(field_name) {
        if (this.data.raw_data[field_name]) {
            this._connect.get('/admin/view/grant_group/' + this.data.raw_data[field_name], null, null, false).subscribe((data) => {
                this._share.getTableInfo('grant_group').subscribe(_table_info => {
                    this.grantGroupData = new GrantGroupData(_table_info)
                    this.grantGroupData.setInstanceData(data.data)
                })
            });
        }
    }


    onDuplicateFieldChanged($event) {
        this.data.setRawData({'duplicate_fields': $event.selected_field_name_a})
    }

    onSubmitSelectOtherNewData($event) {
        let form = this.dataset_table_info.forms.byFieldName('dataset_group_id');
        form.clearOptions()

        let updHash = {}
        updHash['dataset_group_id'] = parseInt($event.id);
        this.data.setRawData(updHash)
        this.last_option_changed_date = new Date()
        this.selectOtherEditModal.hide();
    }

    onCancelSelectOtherNewData() {
        this.selectOtherEditModal.hide();
    }


    isUnionMode(): boolean {
        return this.data.raw_data['union_mode'] == 'true'
    }

    isAdd(): boolean {
        return !this.data.raw_data['id']
    }

    // Duplicate date
    calendarDuplicateDate( ) {
        this.calendar_date_color_data.push({
            value: '',
            color: '#fff'
        })
    }

    // Delete date
    calendarDeleteDate( index ) {
        this.calendar_date_color_data.splice(index, 1);
        this.calendarDateColorChange()
    }

    calendarDateColorChange( ){
        this.data.setRawData({'calendar_date_color': JSON.stringify(this.calendar_date_color_data)})
    }

    calendarSetColor( index, color ) {
        this.calendar_date_color_data[index].color = color
        this.calendarDateColorChange()
    }

    addMainKeyField() {
        if (!Array.isArray(this.data.raw_data['csv_main_key_field'])) {
            this.data.raw_data['csv_main_key_field'] = [];
        }
        if (this.data.raw_data['csv_main_key_field'].length >= 5) {
            alert('主キーの設定は最大5つまでです。');
            return;
        }
        this.data.raw_data['csv_main_key_field'].push('id');
    }

    removeMainKeyField(index: number) {
        this.data.raw_data['csv_main_key_field'].splice(index, 1);
        if (this.data.raw_data['csv_main_key_field'].length === 0) {
            this.data.raw_data['csv_main_key_field'] = ['id'];
        }

    }

    getCSVMainKeyFields(): string[] {
        if (!this.data.raw_data['csv_main_key_field']) {
          return [];
        }
        if (typeof this.data.raw_data['csv_main_key_field'] === 'string') {
          return this.data.raw_data['csv_main_key_field'].split(',');
        }
        return this.data.raw_data['csv_main_key_field'];
      }


    getUniqeField() {
        if (Array.isArray(this.data.child_data_by_table['dataset_field'])) {
            let copy_fields = [];
            this.data.child_data_by_table['dataset_field'].forEach(field => {
                if (field.raw_data['type'] === 'select_other_table') {
                    field.raw_data['option']['copy-fields']?.forEach(copyField => {
                        copy_fields.push(copyField.to);
                    });
                }
            });
            let primary_fields = this.data.child_data_by_table['dataset_field'].filter(field => {                
                const { type, option, unique_key_name, id } = field.raw_data;
                const isNotFixedType = !["fixed_html", "file", "image", "relation_table"].includes(type);
                const isSingleValueMode = !option['is_multi_value_mode'];
                const isNotInCopyFields = !copy_fields.includes(unique_key_name) && !copy_fields.includes('field__' + id);

                return isNotFixedType && isSingleValueMode && isNotInCopyFields;
            });

            return primary_fields;
        } else {
            return [];
        }
    }

    getStringFields() {
        if (Array.isArray(this.data.child_data_by_table['dataset_field'])) {
            return this.data.child_data_by_table['dataset_field'].filter(field => {
                // 文字列タイプのフィールドのみを返す
                return field.raw_data.type === 'text'
            });
        }
        return [];
    }

    getNumberFields() {
        if (Array.isArray(this.data.child_data_by_table['dataset_field'])) {
            return this.data.child_data_by_table['dataset_field'].filter(field => {
                return field.raw_data.type === 'number';
            });
        }
        return [];
    }
}
