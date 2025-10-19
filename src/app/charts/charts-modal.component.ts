import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import * as cloneDeep from 'lodash/cloneDeep';
import 'chartjs-plugin-colorschemes';
import {Connect} from '../services/connect';
import {ActivatedRoute, Router} from '@angular/router';
import {SharedService} from '../services/shared';
import {User} from '../services/user';
import {TableInfo} from '../class/TableInfo';
import {CustomFilter} from '../class/Filter/CustomFilter';
import {SummarizeFilterSummary} from '../class/Filter/SummarizeFilter/SummarizeFilterSummary';
import {TabsetComponent} from 'ngx-bootstrap';
import {Variable} from '../class/Filter/Variable';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {Condition} from '../class/Condition';
import {Conditions} from '../class/Conditions';
import {ColorFilter} from '../class/ColorFilter';
import {Form} from '../class/Form';
import {DashboardContent} from '../class/DashboardContent';


@Component({
    selector: 'charts-modal',
    templateUrl: './charts-modal.component.html',
})

export class ChartsModalComponent implements OnInit, OnChanges {
    @Input() table_info: TableInfo;
    @Input() dashboardContent: DashboardContent;
    @Input() customFilter: CustomFilter;
    @Input() chart_index: number;
    @Input() parent;
    @Input() save_on_edit: boolean = true;
    @Input() show_preview: boolean = false;
    @Input() mode: string = 'setDetail';
    @Input() dashboard_id: number = null;


    @ViewChild('sampleChart') sampleChart: any;
    @Output() onClickCancelButton: EventEmitter<Object> = new EventEmitter();
    @Output() onClickPreviewButton: EventEmitter<Object> = new EventEmitter();
    @Output() onClickSaveButton: EventEmitter<Object> = new EventEmitter();


    private isButtonVisible = true;
    private fields_by_field_key: Object = {};
    public edittingCustomFilter: CustomFilter;
    public filter_create_type: string = 'new';

    public openAdvanceMenu: boolean = false;
    public condition_target_form_a: Array<Form> = null;

    public percent_label_flg:boolean = false;
    public nps_label_flg:boolean = false;
    public exist_table_a = [];
    @ViewChild('modalTabs') tabs: TabsetComponent;

    // 平均NPSグラフカラー
    public nps_color_options: string[] = ['Lignt Pink', 'Moderate Pink', 'Light Salmon', 'Light Orange', 'Muted Green'];

    public chartSizes: Array<any> = [
        {
            'value': 4,
            'name': '小'
        },
        {
            'value': 6,
            'name': '中'
        },
        {
            'value': 12,
            'name': '大'
        }
    ]


    public terms: Array<any> = [

        // {
        //     'type': 'all',
        //     'name': '全て'
        // },
        {
            'type': 'year',
            'name': '年単位'
        },
        {
            'type': 'month',
            'name': '月単位'
        },
        /*
        {
            'type':'week',
            'name':'週単位'
        },

         */
        {
            'type': 'day',
            'name': '日単位'
        },
        {
            'type': 'hour',
            'name': '時間単位'
        },
        {
            'type': 'minute',
            'name': '分単位'
        },
    ];

    public term_month_starts: Array<any> = [
        {
            'value': 1,
            'name': '1月'
        },
        {
            'value': 2,
            'name': '2月'
        },
        {
            'value': 3,
            'name': '3月'
        },
        {
            'value': 4,
            'name': '4月'
        },
        {
            'value': 5,
            'name': '5月'
        },
        {
            'value': 6,
            'name': '6月'
        },
        {
            'value': 7,
            'name': '7月'
        },
        {
            'value': 8,
            'name': '8月'
        },
        {
            'value': 9,
            'name': '9月'
        },
        {
            'value': 10,
            'name': '10月'
        },
        {
            'value': 11,
            'name': '11月'
        },
        {
            'value': 12,
            'name': '12月'
        }
    ];


    public splitBase: Array<any> = [
        {
            'type': 'data_num',
            'name': 'データ数',
        }
    ];

    public fileStorage: Array<any> = [
        {
            'name': 'pigeon-web',
            'size': '2Gb'
        },
        {
            'name': 'pigeon-web-test',
            'size': '1Gb'
        },
        {
            'name': 'cloud-test',
            'size': '1.5Gb'
        }
    ];

    constructor(private _router: Router, private _route: ActivatedRoute, private _connect: Connect, private _share: SharedService, private _user: User) {
    }

    ngOnInit() {
        this.percent_label_flg = this.edittingCustomFilter && this.edittingCustomFilter.summarizeFilter?.summary_a[0]?.graph_type == 'pie';
        if(this.isNps()){
            this.nps_label_flg = true;
        }
        //this.loadCloudOtherTables();
        if (!this.dashboardContent){
            this.dashboardContent = new DashboardContent()
        }
        //for table select
        this.exist_table_a = this._share.exist_table_a
        if (this.dashboard_id && !this.customFilter.id) {
            this.edittingCustomFilter.filter_type = 'view'
        }
        // No need to load admin datas here, it is already loaded in the parent component
        // the code added from this commit: https://github.com/Loftal/pigeon_cloud/commit/88dee18c7a1c30a4b75baea92ce4532df97d7c83
        // this._share.loadAdminDatas();

        // Update term_year_start
        if (this.edittingCustomFilter.summarizeFilter?.options.enable_totaling_start_month ){
            this.handleOnChangeEnableTotalingStartMonth(this.edittingCustomFilter.summarizeFilter.fields[0])
        }

        // チャートタイプの場合は初期表示時にチャート設定タブを選択
        if (this.mode === 'setDetail' && this.edittingCustomFilter && this.edittingCustomFilter.type === 'chart') {
            setTimeout(() => {
                this.changeTab(this.getChartSettingsTabIndex());
            }, 200);
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        console.log(changes)
        if (!this.customFilter) {
            return;
        }
        this.edittingCustomFilter = cloneDeep(this.customFilter);
        /*
        if (!this.edittingCustomFilter.isSetSummarizeParam() && !this.edittingCustomFilter.summarizeFilter) {
            this.resetChartParam()
        }
         */
        this.useSummarize = this.edittingCustomFilter.summarizeFilter && this.edittingCustomFilter.summarizeFilter.fields.length > 0;

        // チャートタイプの場合は常にチャート設定タブを選択
        if (this.edittingCustomFilter.type === 'chart') {
            // チャートの場合、チャート設定タブは最後のタブ
            this.changeTab(this.getChartSettingsTabIndex())
        } else if (this.customFilter.isSetSummarizeParam()) {
            this.changeTab(3)
        } else {
            this.changeTab(0)
        }

        this._share.getTableInfo(this.edittingCustomFilter.table).subscribe(table_info => {
            this.table_info = table_info
        })

        this.openAdvanceMenu = this.edittingCustomFilter.variables.length > 0

        if (!this.table_info) {
            this._share.getTableInfo(this.customFilter.table).subscribe(_table_info => {
                this.table_info = _table_info
            })
        }

        this.condition_target_form_a = this.getConditionTargetFormArray()
    }

    changeTab(index) {
        if (this.mode === 'setDetail') {
        setTimeout(() => {
            this.tabs.tabs[index].active = true;
        }, 100);
        }

    }

    getChartSettingsTabIndex(): number {
        // チャートタイプの場合のタブインデックスを計算
        // タブの順序:
        // 0: 絞り込み (常に表示)
        // 1: 並び順 (チャートの場合)
        // 2: チャート設定 (チャートの場合)

        // チャートの場合、「項目」タブは表示されないので、チャート設定は3番目のタブ（インデックス2）
        return 2;
    }

    /*
    ngDoCheck(): void {console.log("NG Do Check==========");
        if (this._customFilter.summarizeFilter === null || this._customFilter.summarizeFilter.filter_field_a === undefined || Object.keys(this._customFilter.summarizeFilter.filter_field_a).length === 0) {
            this.resetChartParam()
        }
        if (!this._customFilter.summarizeFilter.options) {
            this._customFilter.summarizeFilter.options = {};

        }
    }
     */

    loadChartData() {
        if (this.sampleChart !== undefined) {
            this.sampleChart.page = 0;
            this.sampleChart.loadChartData();
        }
    }

    updateFilterType(selectedType: string, filterType = 'filter') {
        this.edittingCustomFilter.filter_type = filterType
        this.edittingCustomFilter.type = selectedType == 'sum' ? 'table' : selectedType;
        this.useSummarize = this.edittingCustomFilter.summarizeFilter && this.edittingCustomFilter.summarizeFilter.fields.length > 0;
    }

    addChartField(loadEditingChartDataAfterAdded: boolean = true) {

        this.edittingCustomFilter.summarizeFilter.addFieldFilter(
            {'field': 'created', 'term': 'month', 'term_month_start': 1, 'is_date': true}
        );
        if (loadEditingChartDataAfterAdded) {
            this.loadEditingChartData()
        }

    }


    addSummary() {
        this.edittingCustomFilter.summarizeFilter.addSummaryFilter(
            {'summary_type': 'count', 'summary_field': null}
        );
    }

    removeChartField(i) {
        this.edittingCustomFilter.summarizeFilter.fields.splice(i, 1);
        this.loadEditingChartData();
    }

    removeSummary(i) {
        this.edittingCustomFilter.summarizeFilter.summary_a.splice(i, 1);
        this.loadEditingChartData();
        this.loadChartData();
    }


    isShowType(table_name: string, field_name, summary_field_type = null) {
        const forms = this.table_info.forms;
        let showTypes = ['calc','number'];
        if (summary_field_type && ['min', 'max'].includes(summary_field_type)){
            showTypes = showTypes.concat(['date', 'datetime', 'time','year_month']);
        }
        // console.log(showTypes, forms.byFieldName(field_name).type)
        return showTypes.indexOf(forms.byFieldName(field_name).type) >= 0;
    }

    getFields(only_this_table = false, only_date = false) {
        let table = this.edittingCustomFilter.table;
        if (!table) {
            return [];
        }
        const tabledata = this.table_info
        if (!tabledata) {
            return [];
        }
        let fields = tabledata.fields;
        fields.forEach(f => {
            f.label = f.Comment;
            f.value = f.Field;
        })

        // const get_parent_field = (parents, parent_field = '', parent_label = '') => {
        //     parents.forEach(parent => {
        //         fields = fields.concat(parent.fields.filter(f => {
        //             return f.Comment !== '';
        //         }).map(f => {
        //             f.label = parent_label + parent.table_ref + '.' + f.Comment;
        //             f.value = parent_field + parent.field + '.' + f.Field;
        //             return f;
        //         }));
        //
        //         if (parent.parents) {
        //             get_parent_field(parent.parents, parent_field + parent.field + '.', parent.table_ref + '.');
        //         }
        //     })
        // }
        // if (!only_this_table) {
        //     get_parent_field(tabledata.parents);
        // }

        if (only_date) {
            fields = fields.filter(f => {
                return ['date', 'datetime'].indexOf(f['Type']) >= 0
            })
        }

        fields = fields.filter(f => {
            return ['fixed_html'].indexOf(this.table_info.forms.byFieldName(f['Field']).type) == -1
        })

        return fields;
    }


    onSelectTable(_tableInfo) {
        // alert("hd")
        this.edittingCustomFilter.table = _tableInfo.table
        //this.loadTableFields(this.chart_params['table'])
        this.filter_create_type = 'new'
        this._share.getTableInfo(this.edittingCustomFilter.table).subscribe(table_info => {
            this.table_info = table_info
            this.loadEditingChartData();
        })
    }


    onSelectField(field_index) {
        this.getFields().forEach(f => {
            if (this.edittingCustomFilter.summarizeFilter.fields[field_index].field === f['value']) {
                this.edittingCustomFilter.summarizeFilter.fields[field_index].label = f['label'];
                this.edittingCustomFilter.summarizeFilter.fields[field_index].is_date = ['date', 'datetime'].indexOf(f['Type']) >= 0;
            }
        });
        // this.chart_params['fields'][field_index]['is_date'] = this.isDateField(this.chart_params['fields'][field_index]['field']);
        this.loadEditingChartData();
    }

    /*
    onSelectOtherTableField($event,field_index:number){
        console.log($event)
        let _table_info:TableInfo = $event.table_info;
        let _form:Form = $event.form;
        this.edittingCustomFilter.summarizeFilter.fields[field_index].table= _table_info.table
        this.edittingCustomFilter.summarizeFilter.fields[field_index].field = _form.field['Field']
        this.edittingCustomFilter.summarizeFilter.fields[field_index].label = _form.label
        this.edittingCustomFilter.summarizeFilter.fields[field_index].is_date = ['date', 'datetime'].indexOf(_form.field['Type']) >= 0;
        this.loadEditingChartData();


    }
     */
    onSelectSummarizeOtherTableField($event, field_index: number) {
        console.log($event)
        let _table_info: TableInfo = $event.table_info;
        let _form: Form = $event.form;
        this.edittingCustomFilter.summarizeFilter.summary_a[field_index].summary_table = _table_info.table
        if (_form) {
            //if count summary, null
            this.edittingCustomFilter.summarizeFilter.summary_a[field_index].summary_field = _form.field['Field']
            this.edittingCustomFilter.summarizeFilter.summary_a[field_index].label = _form.label
        }
        this.edittingCustomFilter.summarizeFilter.summary_a[field_index].conditions = $event.conditions
        this.loadEditingChartData();


    }

    getConditionTargetFormArray(): Array<Form> {
        let form_a = []
        if (this.edittingCustomFilter.summarizeFilter) {
            this.edittingCustomFilter.summarizeFilter.fields.forEach((field, index) => {
                let summarizeForm = this.table_info.forms.byFieldName(field.field)
                let form = new Form({'label': '(データ項目' + (index + 1) + ')' + (field.label ? field.label : summarizeForm.label)})

                form.createDummyForm('x' + (index + 1), summarizeForm.type);
                form_a.push(form)
                console.log(summarizeForm)
                console.log(field)
                console.log(form)
            })
        }
        this.table_info.forms.getArray().forEach(_form => {
            form_a.push(_form)

        })

        return form_a

    }

    multiGraphType(): Array<string> {
        return ['line', 'bar']
    }

    onChangeGraphType(summary_index: number) {
        //LINE,BARチャート以外はyは複数セット出来ない。
        if (summary_index == 0 && this.multiGraphType().indexOf(this.edittingCustomFilter.summarizeFilter.summary_a[summary_index].graph_type) == -1) {
            this.edittingCustomFilter.summarizeFilter.summary_a.splice(1);
        }

        this.percent_label_flg = this.edittingCustomFilter.summarizeFilter.summary_a[0].graph_type == 'pie';
        if(this.isNps()){
            this.nps_label_flg = true;
        }

        this.loadEditingChartData()

    }

    loadEditingChartData() {
        // validate
        if (!this.edittingCustomFilter.summarizeFilter) {
            return;
        }
        let validated = this.edittingCustomFilter.summarizeFilter.type !== '';
        /*
        if (this._customFilter.summarizeFilter.summary === 'count') {
            this._customFilter.summarizeFilter.summary_field = null;
        }
         */
        this.edittingCustomFilter.summarizeFilter.CHART_TYPES.forEach((chartType) => {
            if (this.edittingCustomFilter.summarizeFilter.type === chartType['value']) {
                for (let i = 0; i < chartType['field_num']; i++) {

                    validated = validated && this.edittingCustomFilter.summarizeFilter.fields[i] !== undefined && this.edittingCustomFilter.summarizeFilter.fields[i]['field'] !== '';
                    // FIXME:delete
                    break;
                }

            }
        })
        this.edittingCustomFilter.summarizeFilter.summary_a.forEach(summary => {
            if (!summary['summary_type']) {
                validated = false;
            }
            if (summary['summary_type'] !== 'count' && !summary['summary_field']) {
                validated = false;
            }
        })
        if (validated) {
            if (this.isScatterChart() && this.edittingCustomFilter.summarizeFilter.fields.length == 1) {
                this.addChartField(false)
            }
            this.loadChartData();
        }
    }

    isDateField(_field) {
        const table = this.table_info
        const fields = table.fields;
        if (fields === undefined) {
            return false;
        }
        if (this.fields_by_field_key[this.edittingCustomFilter.table] === undefined || this.fields_by_field_key[this.edittingCustomFilter.table][_field] === undefined) {
            this.fields_by_field_key[this.edittingCustomFilter.table] = {};
            fields.forEach((field) => {
                this.fields_by_field_key[this.edittingCustomFilter.table][field['Field']] = field;
            })
        }
        if (this.fields_by_field_key[this.edittingCustomFilter.table][_field] === undefined) {
            return false;
        }
        const field = this.fields_by_field_key[this.edittingCustomFilter.table][_field];

        if (field['Type'] === 'date' || field['Type'] === 'datetime') {
            return true;
        }

        return false;

    }

    validate(display_error = true, ignore_title = false) {
        let error_flg = false;
        if (this.edittingCustomFilter.summarizeFilter) {
            if (this.edittingCustomFilter.summarizeFilter.type !== 'table' && this.edittingCustomFilter.name === '' && !ignore_title) {
                if (display_error) {
                    this.parent.error('タイトルを入力して下さい')
                }
                return false;
            }
            this.edittingCustomFilter.summarizeFilter.fields.forEach(field => {
                if (!field['field']) {
                    if (display_error) {
                        this.parent.error('データ項目を入力して下さい')
                    }
                    error_flg = true;
                }
            })


            this.edittingCustomFilter.summarizeFilter.summary_a.forEach(summary => {
                if (!summary['summary_type']) {
                    if (display_error) {
                        this.parent.error('集計の種類を入力して下さい')
                    }
                    error_flg = true;
                }
                if (summary['summary_type'] !== 'count' && !summary['summary_field']) {
                    if (display_error) {
                        this.parent.error('集計の項目を選択して下さい')
                    }
                    error_flg = true;
                }
            })

            this.edittingCustomFilter.show_fields.forEach(field_name => {
                if (field_name == null) {
                    this.parent.error('選択されていない表示項目があります');
                    error_flg = true;
                }

            })

            var s = new Set(this.edittingCustomFilter.show_fields);
            if (this.edittingCustomFilter.show_fields.length != s.size) {
                let duplicate_fields = this.edittingCustomFilter.show_fields.filter((x, i, self) => self.indexOf(x) !== self.lastIndexOf(x));
                this.parent.error('表示項目に同じ項目が複数存在しています' + duplicate_fields.join(','));

                error_flg = true;
            }
        }

        if (this.edittingCustomFilter.filter_type == 'filter') {
            if (this.edittingCustomFilter.hasViewParam()) {
                this.parent.error('ビューの項目が設定されているため、絞り込みフィルタとして保存出来ません', 'エラー');
                error_flg = true;
            }
        }
        
        if (this.edittingCustomFilter.filter_type == 'view') {
            if (this.edittingCustomFilter.hasFilterParam()) {
                this.parent.error('絞り込みフィルタの項目が設定されているため、ビューとして保存出来ません', 'エラー');
                error_flg = true;
            }
        }

        if (this.edittingCustomFilter.variables.length > 0) {
            this.edittingCustomFilter.variables.forEach(v => {
                if (!v.validate()) {
                    this.parent.error(v.error_message);
                    error_flg = true

                }
            })
        }
        if (this.edittingCustomFilter.conditions) {
            if (!this.edittingCustomFilter.conditions.validate()) {
                this.parent.error(this.edittingCustomFilter.conditions.error_message);
                error_flg = true

            }

        }


        //ColorFIlter
        this.edittingCustomFilter.color_filters.forEach(color_filter => {
            if (!color_filter.validate()) {
                this.parent.error(color_filter.error_a.join(','))
                error_flg = true
            }
        })

        return !error_flg;
    }

    preview() {
       
        // If filter type is 'view', clear all conditions to validation passes
        if (this.edittingCustomFilter.filter_type === 'view') {
            this.edittingCustomFilter.conditions.setByParamAry([], true);
            this.edittingCustomFilter.summarize_conditions.setByParamAry([], true);
        }

        if (!this.validate()) {
            console.log('validate error')
            return;
        }
        if (this.edittingCustomFilter.summarizeFilter) {
            this.edittingCustomFilter.summarizeFilter.summary_a.forEach(summary => {
                summary.is_edit_mode = false;
            });
        }
        //Outputにする
        this.onClickPreviewButton.emit({
            'customFilter': this.edittingCustomFilter
        });
    }

    goDetail() {
        this.edittingCustomFilter.is_display_list = false
        this.edittingCustomFilter.name = this.table_info.getLabel() + '_' + this._share.dateFormat.format(new Date(), 'yyyyMMdd')
        this.mode = 'setDetail'
    }

    saveChart() {
        if (!this.validate()) {
            return;
        }
        this.edittingCustomFilter.save(this._connect, false, this.dashboard_id, this.dashboardContent).then((result: boolean) => {
            if (result) {
                this.onClickSaveButton.emit({
                    'customFilter': this.edittingCustomFilter
                });
            } else {
                this.parent.error(this.edittingCustomFilter.error_a.join(','));
            }
        })

    }

    startEditLabel(summary: SummarizeFilterSummary, i) {
        if (!summary['label']) {
            summary.label = '集計項目' + (i + 1);
        }
        summary.is_edit_mode = true;
    }


    /**
     * not chart mode
     */
    isTableType() {
        if (!this.edittingCustomFilter) {
            return true;
        }
        return this.edittingCustomFilter.type === 'table'
    }

    isUseYAxes() {
        return this.edittingCustomFilter.summarizeFilter.type !== 'scatter'
    }

    isScatterChart() {
        return this.edittingCustomFilter.summarizeFilter.type === 'scatter'

    }

    onConditionChanged($event, conditions: Conditions = null) {
        if (!conditions) {
            conditions = this.edittingCustomFilter.conditions
        }
        conditions.replaceCondition($event.index, $event.condition);
        this.loadEditingChartData();

    }

    addCondition() {
        this.edittingCustomFilter.conditions.addCondition();
    }

    addSummarizeCondition() {
        let cond: Condition = this.edittingCustomFilter.summarize_conditions.addCondition('eq', 'y1');

    }

    delCondition(i) {
        this.edittingCustomFilter.conditions.deleteCondition(i);
        this.loadEditingChartData();
    }


    public useSummarize: boolean = true;

    changeUseSummarize() {
        if (this.useSummarize) {
            this.edittingCustomFilter.initSummarizeFilter(this._share.admin_setting['month_start']);
            if (this.edittingCustomFilter.summarizeFilter.fields.length == 0) {
                this.addChartField();
            }
            if (this.edittingCustomFilter.summarizeFilter.summary_a.length == 0) {
                this.addSummary();
            }
        } else {
            this.edittingCustomFilter.deleteSummarizeFilter();
        }

    }

    onShowFieldChanged($event) {
        this.edittingCustomFilter.show_fields = $event.selected_field_name_a;
    }

    hasDefaultFilter(filter_type = 'filter') {

        if(this.edittingCustomFilter.list_use_show_fields){
            const list_default_filter = this.table_info.getDefaultFilter('list', filter_type)
            if (list_default_filter === undefined) return false;
            if (list_default_filter.id == this.edittingCustomFilter.id) return false;
        }

        if(this.edittingCustomFilter.edit_use_show_fields){
            const edit_default_filter = this.table_info.getDefaultFilter('edit', filter_type)
            if (edit_default_filter === undefined) return false;
            if (edit_default_filter.id == this.edittingCustomFilter.id) return false;
        }

        if(this.edittingCustomFilter.view_use_show_fields){
            const view_default_filter = this.table_info.getDefaultFilter('view', filter_type)
            if (view_default_filter === undefined) return false;
            if (view_default_filter.id == this.edittingCustomFilter.id) return false;
        }

        return true;

    }

    changeVariableValue($event, variable: Variable) {
        variable.default_value = $event.value;
        variable.value = $event.value;
    }

    drop(event: CdkDragDrop<string[]>) {
        moveItemInArray(this.edittingCustomFilter.show_fields, event.previousIndex, event.currentIndex);
    }


    addColorFilter() {
        this.edittingCustomFilter.addColorFilter(this.table_info);
    }

    colorFilterChanged($event, filter_index: number) {

        this.edittingCustomFilter.color_filters[filter_index].conditions.replaceCondition($event.index, $event.condition)

    }

    onColorfilterShowFieldChanged($event, color_filter: ColorFilter, i: number) {
        color_filter.field_name_a[i] = $event.target.value;
    }

    setColor(color_filter: ColorFilter, color: string) {
        color_filter.style['backgroundColor'] = color;
        console.log(this.edittingCustomFilter.color_filters[0])
    }

    moveColorFilter(index: number, direction: 'up' | 'down') {
        const newIndex = direction === 'up' ? index - 1 : index + 1;

        if (newIndex >= 0 && newIndex < this.edittingCustomFilter.color_filters.length) {
            // 配列内の要素を入れ替える
            const temp = this.edittingCustomFilter.color_filters[index];
            this.edittingCustomFilter.color_filters[index] = this.edittingCustomFilter.color_filters[newIndex];
            this.edittingCustomFilter.color_filters[newIndex] = temp;
        }
    }

    isMultipleYvalueAvailable() {
        this.edittingCustomFilter.summarizeFilter.summary_a.length > 0 && ['bar', 'line'].indexOf(this.edittingCustomFilter.summarizeFilter.summary_a[0].graph_type) >= 0
    }

    onChangeSortParams($event) {
        this.edittingCustomFilter.sort_params = $event.value;
        this.loadEditingChartData();
    }


    onViewGrantGroupIdChanged($event: Object) {
        this.edittingCustomFilter.view_grant_group_id = $event['id'];

    }

    onEditGrantGroupIdChanged($event: Object) {
        this.edittingCustomFilter.edit_grant_group_id = $event['id'];

    }

    getFilters() {
        return this.table_info.saved_filters;


    }


    changeFilterType($event) {
        console.log($event)
    }

    onChangeCopyFilter(_selectedFilter: CustomFilter) {
        this.edittingCustomFilter = _selectedFilter.copy()

    }

    onDefaultGrantGroupIdChanged($event: Object) {
        this.edittingCustomFilter.default_view_grant_group_id = $event['id'];

    }

    setColorStyle($event, color_filter, key) {
        color_filter.style[key] = $event.target.value;
    }

    // 一旦NPS集計テーブル専用。ドーナッツ時で常に表示するならlabel.includes('NPS集計')を外す。
    isNps(){
        const label = this.table_info ? this.table_info.getLabel() : "";
        return this.nps_label_flg = this.edittingCustomFilter && this.edittingCustomFilter.summarizeFilter?.summary_a[0]?.graph_type == 'doughnut' && label.includes('NPS集計');
    }

    handleOnChangeEnableTotalingStartMonth(chart_field) {
        let year =  this.table_info.lowest_year;
        if( !year ) {
            year = new Date().getFullYear();
        }

        chart_field['term_year_start'] = year;
    }
}
