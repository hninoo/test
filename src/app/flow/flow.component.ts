import {Component, ElementRef, AfterViewInit, ViewChildren, QueryList, ViewChild, OnInit} from '@angular/core';
import {Endpoint, jsPlumb} from 'jsplumb';
import {TriggerHistoryService} from '../services/trigger-history-service';
import ToastrService from '../toastr-service-wrapper.service';
import {SharedService} from '../services/shared';
import {SimpleTableInfo} from '../class/SimpleTableInfo';
import {Conditions} from '../class/Conditions';
import {ActivatedRoute} from '@angular/router';
import {Connect} from '../services/connect';
import {FormAndValue} from '../class/FormAndValue';
import {TableInfo} from '../class/TableInfo';
import {Observable} from 'rxjs/Observable';
import {RecordListService} from '../services/RecordListService';
import {CustomFilter} from '../class/Filter/CustomFilter';
import {Data} from '../class/Data';
import {cloneDeep} from 'lodash';
import {SortParam} from '../class/Filter/SortParam';
import {CanComponentDeactivate} from '../shared/guards/can-deactivate-guard.service';


export class Block {
    static readonly TYPE_TRIGGER = 'TRIGGER';
    static readonly TYPE_CONDITION = 'CONDITION';
    static readonly TYPE_SLEEP = 'SLEEP';
    static readonly TYPE_COPY = 'COPY';
    static readonly TYPE_COPY_OTHER_TABLE = 'COPY_OTHER_TABLE';
    static readonly TYPE_FILTER = 'FILTER';
    static readonly TYPE_CREATE = 'CREATE_DATA';
    static readonly TYPE_UPDATE = 'UPDATE_DATA';
    static readonly TYPE_DELETE = 'DELETE_DATA';


    static readonly TYPE_SLACK_NOTIFICATION = 'SLACK_NOTIFICATION';
    static readonly TYPE_EMAIL_NOTIFICATION = 'EMAIL_NOTIFICATION';
    static readonly TYPE_API_CALL = 'API_CALL';


    id: string;
    type: string;
    x?: number;
    y?: number;
    trueNext?: string;
    falseNext?: string;
    next?: string;
    name?: string;

    //tmp
    _data_count: number = null;

    constructor(id: string, type: string, name: string) {
        this.id = id;
        this.type = type;
        this.name = name;
    }

    public debug_display() {
        console.log(JSON.stringify(this))
    }

    public toArray() {
        let obj = Object.assign({}, this);
        //remove _data_count
        delete obj['_data_count'];
        return obj;
    }

    setByHash(hash) {
        this.id = hash['id']
        this.type = hash['type']
        this.x = hash['x']
        this.y = hash['y']
        this.trueNext = hash['trueNext']
        this.falseNext = hash['falseNext']
        this.next = hash['next']
        this.name = hash['name']
    }
}

export class TriggerBlock extends Block {
    // トリガの種類
    static readonly TRIGGER_TYPE = {
        DAILY: 'daily',
        WEEKLY: 'weekly',
        MONTHLY: 'monthly',
        YEARLY: 'yearly',
        // ON_DATA_CHANGE: 'onDataChange',
        INSERT: 'insert',
        UPDATE: 'update',
        DELETE: 'delete',
        WORKFLOW_COMPLETED: 'workflowCompleted',
    };

    trigger_type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'insert' | 'update' | 'delete' | 'workflowCompleted';
    time?: string;
    dayOfWeek?: number;
    day?: number; // 曜日の数値 (0=日曜日, 6=土曜日)
    month?: number; // 月

    setByHash(hash) {
        this.trigger_type = hash['trigger_type']
        this.time = hash['time']
        this.dayOfWeek = hash['dayOfWeek']
        this.day = hash['day']
        this.month = hash['month']
        //parent
        super.setByHash(hash)
    }

    constructor(id: string, name: string) {
        super(id, Block.TYPE_TRIGGER, name);
    }
}

export class ConditionBlock extends Block {
    conditions: Array<any>

    constructor(id: string, name: string, conditions: Array<any>) {
        super(id, Block.TYPE_CONDITION, name);
        this.conditions = conditions;
    }
}

export class FilterBlock extends Block {
    conditions: Conditions;
    sort_params: Array<SortParam> = [];
    limit: number = null;

    filter_id: number = null;

    constructor(id: string, name: string, conditions: Conditions = null) {
        super(id, Block.TYPE_FILTER, name);
        if (!conditions) {
            conditions = new Conditions([])
        }
        this.conditions = conditions;
    }

    setByHash(hash) {
        this.conditions = new Conditions(hash['conditions'])
        this.filter_id = hash['filter_id']
        this.sort_params = [];
        if (hash['sort_params']) {
            hash['sort_params'].forEach(sort_param => {
                this.sort_params.push(new SortParam(sort_param['field'], sort_param['asc_desc']))
            });
        }
        this.limit = hash['limit'] ?? null
        //parent
        super.setByHash(hash)

    }

    toArray() {
        let obj = Object.assign({}, this);
        delete obj['conditions'];
        // @ts-ignore
        obj['conditions'] = this.conditions ? this.conditions.getSearchParam() : [];
        obj['sort_params'] = this.sort_params.map(s => s.toArray());

        return obj;
    }
}

export class CopyBlock extends Block {
    copy_fields: Array<string> = []

    constructor(id: string, name: string) {
        super(id, Block.TYPE_COPY, name);
    }

    setByHash(hash) {
        this.copy_fields = hash['copy_fields']
        //parent
        super.setByHash(hash)
    }
}

export class CopyOtherTableBlock extends Block {
    //[{from:XXXX, to:YYYY}]
    target_table: string = null;
    copy_from_to_fields: Array<CopyFromToField> = []

    //追加で自由入力する分
    update_fields: Array<FormAndValue> = []

    //output type
    output_data_type: string = 'copy_base_data';
    constructor(id: string, name: string) {
        super(id, Block.TYPE_COPY_OTHER_TABLE, name);
    }

    addCopyField() {
        this.copy_from_to_fields.push(new CopyFromToField('', ''))
    }

    private _tmp_update_fields: Array<Object>;
    setByHash(hash) {
        this.copy_from_to_fields = [];
        //parent
        super.setByHash(hash)
        hash['copy_from_to_fields'].forEach(f => {
            this.copy_from_to_fields.push(new CopyFromToField(f['from'], f['to']))
        })
        this.target_table = hash['target_table']
        if (hash['update_fields']) {
            this._tmp_update_fields = hash['update_fields']
        }
        this.output_data_type = hash['output_data_type'] ?? 'copy_data'
    }

    setTargetTableInfo(table_info: TableInfo, update_fields: Array<FormAndValue> = []) {
        if (Array.isArray(this._tmp_update_fields ) && this._tmp_update_fields.length > 0) {
            this.update_fields = this._tmp_update_fields?.map(f => {
                let form_and_value = new FormAndValue();
                let form = table_info.forms.byFieldName(f['field'])
                form_and_value.set(form, f['value'])
                return form_and_value
            })
        } else {
            this.update_fields = update_fields.map(f => {
                let form_and_value = new FormAndValue();
                let form = table_info.forms.byFieldName(f['field'])
                form_and_value.set(form, f['value'])
                return form_and_value
            });
        }
    }

    toArray() {
        let obj = Object.assign({}, this);
        delete obj['copy_from_to_fields'];
        // @ts-ignore
        obj['copy_from_to_fields'] = this.copy_from_to_fields.map(f => f.toArray());
        // @ts-ignore
        obj['update_fields'] = this.update_fields.map(f => f.toArray());

        obj['output_data_type'] = this.output_data_type;

        return obj;
    }

    addUpdateField() {
        this.update_fields.push(new FormAndValue())
    }
}

export class CopyFromToField {
    from: string;
    to: string;

    constructor(from: string, to: string) {
        this.from = from;
        this.to = to;
    }

    toArray() {
        let obj = Object.assign({}, this);
        return obj;
    }

}

export class CreateBlock extends Block {
    public form_and_values: Array<FormAndValue> = [];
    public target_table: string = null;
    private table_info: TableInfo;
    private target_table_info: TableInfo;

    constructor(id: string, name: string, table_info: TableInfo = null) {
        super(id, Block.TYPE_CREATE, name);
        this.table_info = table_info;
    }

    setTable(table_info: TableInfo) {
        this.table_info = table_info;
        this.refresh();
    }

    setTargetTable(target_table_info: TableInfo) {
        this.target_table_info = target_table_info;
        if (target_table_info) {
            this.target_table = target_table_info.table;
            this.refresh();
        }
    }

    toArray() {
        let obj = Object.assign({}, this);
        delete obj['form_and_values'];
        delete obj['table_info'];
        delete obj['target_table_info'];
        // @ts-ignore
        obj['form_and_values'] = this.form_and_values.map(f => f.toArray());
        return obj;
    }

    private _tmp_form_and_values: Array<Object>;

    setByHash(hash) {
        this.target_table = hash['target_table'];
        this._tmp_form_and_values = hash['form_and_values'];
        this.refresh();
        // parent
        super.setByHash(hash);
    }

    refresh() {
        if (this.target_table_info && this._tmp_form_and_values) {
            this.form_and_values = this._tmp_form_and_values.map(f => {
                let form_and_value = new FormAndValue();
                let form = this.target_table_info.forms.byFieldName(f['field']);
                form_and_value.set(form, f['value']);
                return form_and_value;
            });
        }
    }

    getTargetTableInfo(): TableInfo {
        return this.target_table_info;
    }
}

export class UpdateBlock extends Block {

    public form_and_values: Array<FormAndValue> = []
    private table_info: TableInfo;

    constructor(id: string, name: string, table_info: TableInfo = null) {
        super(id, Block.TYPE_UPDATE, name);
        this.table_info = table_info;
    }

    setTable(table_info: TableInfo) {
        this.table_info = table_info;
        this.refresh()
    }

    toArray() {
        let obj = Object.assign({}, this);
        delete obj['form_and_values'];
        delete obj['table_info'];
        // @ts-ignore
        obj['form_and_values'] = this.form_and_values.map(f => f.toArray());
        return obj;
    }

    private _tmp_form_and_values: Array<Object>;
    setByHash(hash) {

        this._tmp_form_and_values = hash['form_and_values']
        this.refresh()
        //parent
        super.setByHash(hash)
    }

    refresh() {
        if (this.table_info) {
            this.form_and_values = this._tmp_form_and_values?.map(f => {
                let form_and_value = new FormAndValue();
                let form = this.table_info.forms.byFieldName(f['field'])
                form_and_value.set(form, f['value'])
                console.log(form_and_value)
                return form_and_value
            })
        }
    }
}

export class DeleteBlock extends Block {

    constructor(id: string, name: string) {
        super(id, Block.TYPE_DELETE, name);
    }


}


export class SleepBlock extends Block {
    sleep_sec: number = null;

    constructor(id: string, name: string, sleep_sec: number = 10) {
        super(id, 'SLEEP', name);
        this.sleep_sec = sleep_sec;
    }

}

export class SlackNotificationBlock extends Block {
    webhook_url: string = '';
    body: string = '';


    constructor(id: string, name: string) {
        super(id, 'SLACK_NOTIFICATION', name);
    }

    setByHash(hash) {
        this.webhook_url = hash['webhook_url']
        this.body = hash['body']
        //parent
        super.setByHash(hash)
    }
}

export class EmailNotificationBlock extends Block {
    to: string;
    cc_a: Array<string> = [];
    bcc_a: Array<string> = [];
    body: string;
    subject: string;

    //settter
    set to_str(to: string) {
        this.to = to;
    }

    public setByHash(hash) {
        this.to = hash['to']
        this.cc_a = hash['cc_a']
        this.bcc_a = hash['bcc_a']
        this.body = hash['body']
        this.subject = hash['subject']
        //parent
        super.setByHash(hash)
    }
    constructor(id: string, name: string, emailAddress: string) {
        super(id, 'EMAIL_NOTIFICATION', name);
        this.to = emailAddress;
    }
}

export class ApiCallBlock extends Block {
    option: any;

    constructor(id: string, name: string, option: any) {
        super(id, 'API_CALL', name);
        this.option = option;
    }
}


// export interface TriggerOptions {
//     type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'onDataChange';
//     time?: string;
//     dayOfWeek?: number;
//     day?: number; // 曜日の数値 (0=日曜日, 6=土曜日)
//     month?: number; // 月
// }

@Component({
    selector: 'flow',
    templateUrl: './flow.component.html',
    styleUrls: ['./flow.component.scss']
})
export class FlowComponent implements AfterViewInit, OnInit, CanComponentDeactivate {

    @ViewChildren('blockBox') blockBoxes: QueryList<ElementRef>;


    @ViewChild('jsonModal') jsonModal: any;
    @ViewChild('pigeonAiModal') pigeonAiModal: any;
    @ViewChild('addModal') addModal: any;
    @ViewChild('blockDeleteConfirmModal') blockDeleteConfirmModal: any;
    @ViewChild('saveConfirmModal') saveConfirmModal: any;

    @ViewChild('triggerModal') triggerModal: any;
    @ViewChild('emailNotificationBlockModal') emailNotificationBlockModal: any;
    @ViewChild('slackNotificationBlockModal') slackNotificationBlockModal: any;
    @ViewChild('apiCallBlockModal') apiCallBlockModal: any;
    @ViewChild('sleepBlockModal') sleepBlockModal: any;
    @ViewChild('copyBlockModal') copyBlockModal: any;
    @ViewChild('copyOtherTableBlockModal') copyOtherTableBlockModal: any;
    @ViewChild('filterBlockModal') filterBlockModal: any;
    @ViewChild('createBlockModal') createBlockModal: any;
    @ViewChild('updateBlockModal') updateBlockModal: any;
    @ViewChild('deleteBlockModal') deleteBlockModal: any;


    public id: number = null;
    public name: string = null;
    public table: string = null;
    //triggerブロックのtable info
    public prev_enabled: boolean = false;
    public enabled: boolean = false;
    public table_info: TableInfo = null;
    public isShow = true;
    public edittingBlocks: string = '';

    public selectedBlockType: string = '';

    public data_a: Array<Data> = [];


    public blockTypeLabels = {
        'TRIGGER': 'トリガブロック',
        'EMAIL_NOTIFICATION': 'メール通知ブロック',
        'SLACK_NOTIFICATION': 'Slack通知',
        // 'CONDITION': '分岐ブロック',
        'SLEEP': '一定時間待機ブロック',
        // 'API_CALL': 'APIコール',
        'FILTER': 'フィルタブロック',
        'COPY': 'データコピーブロック',
        'COPY_OTHER_TABLE': 'データコピーブロック(他テーブル)',
        'CREATE_DATA': 'データ追加ブロック',
        'UPDATE_DATA': 'データ更新ブロック',
        'DELETE_DATA': 'データ削除ブロック',
    }

    // blockTypeLabelsオブジェクトから配列を生成
    public blockTypeOptions: Array<any> = []

    public requestGptText: string = ''
    public gptLoading: boolean = false


    edittingBlock: Block; // EmailBlockはBlockを拡張した型


    blocks: Array<Block> = [];  // JSONのblocksをここにコピー

    inputCommon = {
        maxConnections: 1,
        connector: 'Flowchart',
        connectorStyle: {
            strokeWidth: 2,
            stroke: '#346789'  // あるいは希望の色コード
        },
        isTarget: true,
        isSource: false,
    };
    ouotputCommon = {
        maxConnections: 1,
        connector: 'Flowchart',
        connectorStyle: {
            strokeWidth: 2,
            stroke: '#346789'  // あるいは希望の色コード
        },
        isTarget: false,
        isSource: true,
    };

    tables: Array<SimpleTableInfo> = []
    public loading: boolean = false;

    constructor(private el: ElementRef, public triggerHistoryService: TriggerHistoryService, public toasterService: ToastrService, private _share: SharedService, private _route: ActivatedRoute, private _connect: Connect) {
    }

    ngOnInit() {
        this.tables = this._share.exist_table_a.filter(t => {
            return true;
        })
        // blockTypeLabelsオブジェクトから配列を生成
        this.blockTypeOptions = Object.keys(this.blockTypeLabels).map(key => ({
            value: key,
            label: this.blockTypeLabels[key]
        }));
        //TRIGGERは削除
        this.blockTypeOptions = this.blockTypeOptions.filter(b => b.value != Block.TYPE_TRIGGER)

        this._route.params.subscribe(params => {
            if (params['id'] != 'new') {
                this.id = params['id'];
                if (this.id) {
                    console.log('LOAD')
                    this.loadFlow(this.id)
                }
            } else {
                if (params['id'] === 'new' || !params['id']) {
                    // add
                    this.loadFlow(params['ref'], true)
                } else {
                    this.addInitialTriggerBlock()
                }
            }
        });
    }


    ngAfterViewInit() {

        // this.loadBlocksFromLocalStorage();

        this.reRendering()
    }

    canDeactivate() {
        return window.confirm('別のページに遷移してよろしいですか？');
    }

    setEdittingBlock(block: Block): boolean {
        //filtaerAを編集し、filterBを編集すると、同期されてしまう
        this.edittingBlock = cloneDeep(block);
        this.loadCustomFilterUntilEdittingBlock()
        this.loadCurrentTableUntilEdittingBlock()
        return true;
    }

    addInitialTriggerBlock() {

        const triggerBlock = new TriggerBlock('r1', 'トリガ');
        triggerBlock.trigger_type = 'daily'
        triggerBlock.time = '09:00'


        // blocks配列に追加
        this.blocks.push(triggerBlock);
    }

    // ローカルストレージにルールを保存
    // saveBlocksToLocalStorage() {
    //     console.log(this.blocks)
    //     localStorage.setItem('blocks', JSON.stringify(this.blocks));
    //     this.toasterService.success('設定を保存しました。');
    // }
    loadFlow(id, duplicate_flg = false) {
        if (!id) {
            return;
        }
        this._connect.get('/admin/rpa/get/' + id).subscribe(res => {
            res = res['data']
            if (!duplicate_flg) {
                this.id = res['id']
            }
            this.name = res['name']
            this.table = res['table']
            this.prev_enabled = res['status'] == 'enabled'
            this.enabled = !duplicate_flg && res['status'] == 'enabled'

            this.onChangeTable().subscribe(() => {
                this.setBlockByJson(JSON.parse(res['flow_json']))
                if (this.blocks.length === 0) {
                    this.addInitialTriggerBlock();
                }
                this.onBlockChanged()
                this.reRendering()
            })
        });
    }

    onChangeTable(): Observable<any> {
        return new Observable<any>(observer => {
            if (this.table) {
                this._share.getTableInfo(this.table).subscribe(table_info => {
                    this.table_info = table_info;
                    observer.next()
                });
            } else {
                observer.next()
            }
        })

    }

    saveFlowCheck() {
        if (this.enabled) {
            this.saveConfirmModal.show();
        } else {
            this.saveFlow()
        }
    }

    saveFlow() {
        this.saveConfirmModal.hide();
        let flow = {
            id: this.id,
            name: this.name,
            table: this.table,
            blocks: this.convertBlocktoJson(),
            status: this.enabled ? 'enabled' : 'disabled'
        }

        //validate blocks
        if (!this.validateBlocks()) {
            return;
        }

        this.loading = true;
        if (!this.id) {
            if (!this.name) {
                this.toasterService.error('RPA名を入力してください。');
                this.loading = false;
                return;
            }
            this._connect.post('/admin/rpa/add', flow).subscribe(res => {
                this.loading = false;
                this.toasterService.success('設定を保存しました。');
                this.id = res['id']
                location.href = '/admin/rpa/edit/' + this.id
            });
        } else {
            this._connect.post('/admin/rpa/update', flow).subscribe(res => {
                this.loading = false;
                this.toasterService.success('設定を保存しました。');
            });
        }
    }

    validateBlocks() {
        //if enable
        if (this.enabled) {
            //check trigger
            if (!this.blocks.some(block => block.type === 'TRIGGER')) {
                this.toasterService.error('トリガブロックが存在しません。');
                return false;
            }
        }
        this.blocks.forEach(block => {
            //check type exists
            if (!this.blockTypeLabels[block.type]) {
                this.toasterService.error('不明なブロックが存在します。:' + block.type);
                return false;
            }
        });
        return true;
    }

    // ローカルストレージからルールをロード
    // loadBlocksFromLocalStorage() {
    //     const storedBlocks = localStorage.getItem('blocks');
    //     if (storedBlocks) {
    //         this.setBlockByJson(JSON.parse(storedBlocks))
    //     }
    // }

    setBlockByJson(blocks) {
        this.blocks = []
        let current_table: string = this.table;
        blocks.forEach(block => {
            let newBlock;
            if (block.type == Block.TYPE_TRIGGER) {
                newBlock = new TriggerBlock(block.id, block.name);
            } else if (block.type == Block.TYPE_CONDITION) {
                newBlock = new ConditionBlock(block.id, block.name, block.conditions)
            } else if (block.type == Block.TYPE_FILTER) {
                newBlock = new FilterBlock(block.id, block.name);
            } else if (block.type == Block.TYPE_SLEEP) {
                newBlock = new SleepBlock(block.id, block.name)
            } else if (block.type == Block.TYPE_API_CALL) {
                newBlock = new ApiCallBlock(block.id, block.name, block.option)
            } else if (block.type == Block.TYPE_CREATE) {
                newBlock = new CreateBlock(block.id, block.name, null);
                if (block.target_table) {
                    this._share.getTableInfo(block.target_table).subscribe(target_table_info => {
                        (newBlock as CreateBlock).setTargetTable(target_table_info);
                    });
                }
                this._share.getTableInfo(current_table).subscribe(table_info => {
                    (newBlock as CreateBlock).setTable(table_info);
                });
            } else if (block.type == Block.TYPE_UPDATE) {
                newBlock = new UpdateBlock(block.id, block.name)
                this._share.getTableInfo(current_table).subscribe(table_info => {
                    (newBlock as UpdateBlock).setTable(table_info)
                });
            } else if (block.type == Block.TYPE_DELETE) {
                newBlock = new DeleteBlock(block.id, block.name)
            } else if (block.type == Block.TYPE_SLACK_NOTIFICATION) {
                newBlock = new SlackNotificationBlock(block.id, block.name)
            } else if (block.type == Block.TYPE_EMAIL_NOTIFICATION) {
                newBlock = new EmailNotificationBlock(block.id, block.name, block.option)
            } else if (block.type == Block.TYPE_COPY) {
                newBlock = new CopyBlock(block.id, block.name)
            } else if (block.type == Block.TYPE_COPY_OTHER_TABLE) {
                newBlock = new CopyOtherTableBlock(block.id, block.name)
                let target_current_table = block['target_table']
                this._share.getTableInfo(target_current_table).subscribe(table_info => {
                    let update_fields = block['update_fields'] ?? [];
                    (newBlock as CopyOtherTableBlock).setTargetTableInfo(table_info, update_fields)
                });
            } else {
                console.error('Unknown block type', block.type)
                return;
            }
            newBlock.setByHash(block)
            this.blocks.push(newBlock)
        });
    }

    getBoxStyle(index: number) {
        const block = this.blocks[index];
        if (block['x'] !== undefined && block['y'] !== undefined) {
            return {
                top: block['y'] + 'px',
                left: block['x'] + 'px'
            };
        } else {
            // デフォルトの位置を返す（例: xが0、yがindex * 200）
            return {
                top: (index * 150) + 'px',
                left: '0px'
            };
        }
    }

    addBlock() {
        // if (this.blocks.some(block => block.type === 'TRIGGER')) {
        //     alert('トリガブロックは既に存在します。');
        //     return;
        // }

        //set default
        this.selectedBlockType = Block.TYPE_EMAIL_NOTIFICATION;

        this.addModal.show();

    }

    addBlockSave() {
        //find max id
        console.log('TYPE IS ', this.selectedBlockType)
        let maxId = 0;
        this.blocks.forEach(block => {
            if (parseInt(block.id.substring(1)) > maxId) {
                maxId = parseInt(block.id.substring(1));
            }
        });

        let newBlock = null;
        if (this.selectedBlockType == Block.TYPE_CONDITION) {
            newBlock = new ConditionBlock('r' + (maxId + 1), '条件ブロック', []);
        } else if (this.selectedBlockType == Block.TYPE_SLEEP) {
            newBlock = new SleepBlock('r' + (maxId + 1), '10秒待機', 10);
        } else if (this.selectedBlockType == Block.TYPE_COPY) {
            newBlock = new CopyBlock('r' + (maxId + 1), 'コピー');
        } else if (this.selectedBlockType == Block.TYPE_COPY_OTHER_TABLE) {
            newBlock = new CopyOtherTableBlock('r' + (maxId + 1), '他テーブルにコピー');
        } else if (this.selectedBlockType == Block.TYPE_FILTER) {
            newBlock = new FilterBlock('r' + (maxId + 1), 'フィルター', null);
        } else if (this.selectedBlockType == Block.TYPE_API_CALL) {
            newBlock = new ApiCallBlock('r' + (maxId + 1), 'APIコール', {});
        } else if (this.selectedBlockType == Block.TYPE_CREATE) {
            newBlock = new CreateBlock('r' + (maxId + 1), 'データ追加', this.table_info);
        } else if (this.selectedBlockType == Block.TYPE_UPDATE) {
            newBlock = new UpdateBlock('r' + (maxId + 1), 'データ更新', this.table_info);
        } else if (this.selectedBlockType == Block.TYPE_DELETE) {
            newBlock = new DeleteBlock('r' + (maxId + 1), 'データ削除');
        } else if (this.selectedBlockType == Block.TYPE_SLACK_NOTIFICATION) {
            newBlock = new SlackNotificationBlock('r' + (maxId + 1), 'Slack通知');
        } else if (this.selectedBlockType == Block.TYPE_EMAIL_NOTIFICATION) {
            newBlock = new EmailNotificationBlock('r' + (maxId + 1), 'メール通知', '');
        }

        if (!newBlock) {
            return;
        }

        //set Block x as last block's right position
        if (this.blocks.length > 0) {
            let lastBlock = this.blocks[this.blocks.length - 1]
            newBlock.x = lastBlock.x + 250
            newBlock.y = lastBlock.y
        }


        // block配列に新しいアクションを追加
        this.blocks.push(newBlock);
        this.onBlockChanged()

        this.addModal.hide();

        // DOMが更新されるのを待つ
        setTimeout(() => {
            this.reRendering()
        }, 0);
    }

    reRendering() {
        const instance = jsPlumb.getInstance();
        const endpoints = document.querySelectorAll('.jtk-endpoint');
        endpoints.forEach(endpoint => endpoint.remove());
        instance.reset();

        this.isShow = false;
        let _this = this;
        setTimeout(() => {
            this.isShow = true;
            setTimeout(() => {

                let arrowOverlay = ['Arrow', {width: 12, length: 12, location: 1}];


                this.blocks.forEach(block => {
                    if (block instanceof TriggerBlock) {
                        // OUTPUT (next) endpointのみ追加
                        instance.addEndpoint(block.id, {
                            anchor: 'BottomCenter',
                            uuid: block.id + '-next',
                            endpoint: ['Dot', {cssClass: 'custom-endpoint '}],
                            paintStyle: {fill: '#FFFFFF', stroke: '#000000', strokeWidth: 2},
                            maxConnections: 1
                        }, this.ouotputCommon);
                    } else if (block instanceof ConditionBlock) {
                        // TRUE endpoint
                        instance.addEndpoint(block.id, {
                            anchor: 'BottomCenter',
                            uuid: block.id + '-true',
                            endpoint: ['Dot', {cssClass: 'custom-endpoint true-endpoint'}],
                            paintStyle: {fill: '#FFFFFF', stroke: '#2196F3', strokeWidth: 2},
                            maxConnections: 1
                        }, this.ouotputCommon);

                        // FALSE endpoint
                        instance.addEndpoint(block.id, {
                            anchor: 'BottomRight',
                            uuid: block.id + '-false',
                            endpoint: ['Dot', {cssClass: 'custom-endpoint false-endpoint'}],
                            paintStyle: {fill: '#FFFFFF', stroke: '#FF5722', strokeWidth: 2},
                            maxConnections: 1
                        }, this.ouotputCommon);

                        // INPUT endpoint
                        instance.addEndpoint(block.id, {
                            anchor: 'TopCenter',
                            uuid: block.id + '-input',
                            endpoint: ['Dot', {cssClass: 'custom-endpoint'}],
                            paintStyle: {fill: '#FFFFFF', stroke: '#000000', strokeWidth: 2},
                            maxConnections: 1,
                        }, this.inputCommon);


                    } else {
                        // OUTPUT (next) endpoint
                        instance.addEndpoint(block.id, {
                            anchor: 'BottomCenter',
                            uuid: block.id + '-next',
                            endpoint: ['Dot', {cssClass: 'custom-endpoint '}],
                            paintStyle: {fill: '#FFFFFF', stroke: '#000000', strokeWidth: 2},
                            maxConnections: 1
                        }, this.ouotputCommon);

                        // INPUT endpoint
                        instance.addEndpoint(block.id, {
                            uuid: block.id + '-input',
                            anchor: 'TopCenter',
                            endpoint: ['Dot', {cssClass: 'custom-endpoint'}],
                            paintStyle: {fill: '#FFFFFF', stroke: '#000000', strokeWidth: 2},
                            maxConnections: 1,
                        }, this.inputCommon);

                        // Using the 'next' for connection

                    }
                });
                this.blocks.forEach(block => {
                    // Using the 'trueNext' and 'falseNext' for connections
                    if (block.trueNext) {
                        instance.connect({
                            uuids: [block.id + '-true', block.trueNext + '-input'],
                            connector: 'Flowchart',
                            overlays: [arrowOverlay as any]
                        });
                    }
                    if (block.falseNext) {
                        instance.connect({
                            uuids: [block.id + '-false', block.falseNext + '-input'],
                            connector: 'Flowchart',
                            overlays: [arrowOverlay as any]
                        });
                    }
                    if (block.next) {
                        instance.connect({
                            uuids: [block.id + '-next', block.next + '-input'],
                            connector: 'Flowchart',
                            overlays: [arrowOverlay as any]
                        });
                    }
                });

                // すべての.block-box要素をドラッグ＆ドロップ可能にする
                this.blockBoxes.forEach(blockBoxElRef => {
                    instance.draggable(blockBoxElRef.nativeElement, {
                        containment: 'parent',
                        start: (params) => {
                        },
                        stop: (params) => {
                            const el = params.el;
                            const id = el.id;
                            const block = this.blocks.find(r => r.id === id);
                            if (block) {
                                block['x'] = el.offsetLeft;
                                block['y'] = el.offsetTop;
                            }
                            this.onBlockChanged(false)
                        }
                    });
                });

                // Connection established event
                instance.bind('connection', (info) => {
                    const sourceEndpointElement = info.sourceEndpoint.getElement();
                    // Here, for example, you can check some custom attributes or classes on the DOM element to identify the type of endpoint (true, false, next)

                    const sourceBlockId = info.sourceId;
                    const targetBlockId = info.targetId;

                    const sourceBlock = _this.blocks.find(r => r.id === sourceBlockId);
                    console.log(sourceBlock)

                    // Depending on the source endpoint, update the corresponding block field in JSON
                    if (info.sourceEndpoint['canvas'].classList.contains('true-endpoint')) {
                        sourceBlock.trueNext = targetBlockId;
                    } else if (info.sourceEndpoint['canvas'].classList.contains('false-endpoint')) {
                        sourceBlock.falseNext = targetBlockId;
                    } else {
                        sourceBlock.next = targetBlockId;
                    }
                    // 変更をローカルストレージに保存
                    this.onBlockChanged()

                    this.reRendering()
                });


// Connection detached event
                // Connection detached event
                instance.bind('connectionDetached', (info) => {
                    console.log('connectionDetached', info)
                    const sourceEndpointElement = info.sourceEndpoint.getElement();

                    const sourceBlockId = info.sourceId;
                    const sourceBlock = _this.blocks.find(r => r.id === sourceBlockId);

                    // Depending on the source endpoint, remove the corresponding block field in JSON
                    if (info.sourceEndpoint['canvas'].classList.contains('true-endpoint')) {
                        sourceBlock.trueNext = null;
                    } else if (info.sourceEndpoint['canvas'].classList.contains('false-endpoint')) {
                        sourceBlock.falseNext = null;
                    } else {
                        sourceBlock.next = null;
                    }
                    // 変更をローカルストレージに保存
                    // this.saveBlocksToLocalStorage();
                    // 変更をローカルストレージに保存
                    this.onBlockChanged()

                    this.reRendering()
                });


                instance.repaintEverything(true)

            });


        }, 0);


    }


    // // ローカルストレージをリセットするメソッド
    // resetLocalStorage() {
    //     localStorage.removeItem('blocks'); // 'blocks'キーに関連するデータを削除
    //
    //     // ここでルールをデフォルト状態にリセットするか、リロードして状態をクリアするかを選択できます
    //     // 例えば、デフォルトのルールセットをリロードする場合は以下のようにします
    //     // トリガブロック
    //     const triggerBlock = new TriggerBlock('r1', 'トリガ');
    //     triggerBlock.trigger_type = 'daily'
    //     triggerBlock.time = '09:00'
    //     triggerBlock.next = 'r5';
    //
    //
    //     // 条件ブロック
    //     const conditionBlock = new ConditionBlock('r5', '条件', [{
    //         field: 'status',
    //         op: 'eq',
    //         value: 'update'
    //     }]);
    //     conditionBlock.trueNext = 'r2';
    //     conditionBlock.falseNext = 'r3';
    //
    //     // メール通知ブロック
    //     const emailBlock = new EmailNotificationBlock('r2', 'メール通知', 'test@test.com');
    //
    //     // 待機ブロック
    //     const sleepBlock = new SleepBlock('r3', '10秒待機', 10);
    //
    //     // // Slack通知ブロック
    //     // const slackBlock = new SlackNotificationBlock('r4', 'Slack通知', 'http://slack.com');
    //
    //     // blocks配列に追加
    //     this.blocks = [];
    //     this.blocks.push(triggerBlock);
    //
    //     // リロード後のレンダリングを再実行
    //     this.reRendering();
    //
    //     this.arrangeBlocks();
    //     this.reflectJson()
    // }
    //

    openJsonModal() {
        this.edittingBlocks = this.convertBlocktoJson();
        this.jsonModal.show();
    }

    reflectJson() {
        //check Json format: edittingBlocks
        try {
            JSON.parse(this.edittingBlocks);

        } catch (e) {
            //error
            this.toasterService.error('JSONのフォーマットが正しくありません。');
            return;
        }
        //change this.block
        this.setBlockByJson(JSON.parse(this.edittingBlocks))
        //re-rendering
        this.reRendering();
        //close modal
        this.jsonModal.hide();

    }

    convertBlocktoJson() {
        let jsonList = [];
        this.blocks.forEach(block => {
            jsonList.push(block.toArray())
        });

        return JSON.stringify(jsonList, null, 2);
    }


    arrangeBlocks(startX: number = 0, startY: number = 20, xSpacing: number = 250, ySpacing: number = 150): void {
        let blocks = this.blocks
        let currentX = startX;
        let currentY = startY;

        // IDをキーとしたルールの座標を格納するオブジェクト
        let blockPositions: { [id: string]: { x: number; y: number } } = {};

        blocks.forEach(block => {
            // ルールがまだ配置されていない場合、位置を決定する
            if (!blockPositions[block.id]) {
                blockPositions[block.id] = {x: currentX, y: currentY};

                // trueNext と falseNext がある場合は横に並べる
                if (block.trueNext && block.falseNext) {
                    if (!blockPositions[block.trueNext]) {
                        blockPositions[block.trueNext] = {x: currentX, y: currentY + ySpacing};
                    }
                    if (!blockPositions[block.falseNext]) {
                        blockPositions[block.falseNext] = {x: currentX + xSpacing, y: currentY + ySpacing};
                    }
                    // Y座標を更新して次の行に移動
                    currentY += ySpacing * 2;
                } else if (block.next) {
                    // next がある場合は下に配置する
                    if (!blockPositions[block.next]) {
                        blockPositions[block.next] = {x: currentX, y: currentY + ySpacing};
                    }
                    // 次のnextの位置を決定するために、Y座標を更新
                    currentY += ySpacing;
                }

                // 次のX座標を更新する
                currentX += xSpacing;
            }
        });

        // 決定した座標をルールに適用する
        blocks.forEach(block => {
            const position = blockPositions[block.id];
            if (position) {
                block.x = position.x;
                block.y = position.y;
            }
        });
        this.reRendering()
    }


    addTriggerBlock() {
        // 新しいトリガブロックのデフォルト設定
        const newTriggerBlock = new TriggerBlock('r1', '初期トリガ');
        newTriggerBlock.trigger_type = 'daily'
        newTriggerBlock.time = '09:00'

        // ブロック配列に新しいトリガブロックを追加
        this.blocks.push(newTriggerBlock);
        this.onBlockChanged()

        // DOMが更新されるのを待つ
        setTimeout(() => {
            this.reRendering();
        }, 0);
    }


    onBlockChanged(needLoadDataCount: boolean = true) {
        this.triggerHistoryService.addState(this.convertBlocktoJson());
        if (needLoadDataCount) {
            this.loadEachBlockDataCount();
        }
    }

    undoChanges() {
        const previousState = this.triggerHistoryService.undo();
        if (previousState) {
            this.setBlockByJson(JSON.parse(previousState))
            this.reRendering()
        }
    }

    redoChanges() {
        const redoState = this.triggerHistoryService.redo();
        if (redoState) {
            console.log(redoState)
            this.setBlockByJson(JSON.parse(redoState))
            this.reRendering()
        }
    }


    getTriggerTypeLabel(type: string): string {
        let typeLabels: { [key: string]: string } = {}
        this._share.triggerTypeOptions.forEach(option => {
            typeLabels[option.value] = option.label;
        });

        return typeLabels[type] || type;
    }


    selectedBlockId: string = null;

    deleteConfirm(blockId) {
        this.selectedBlockId = blockId;
        this.blockDeleteConfirmModal.show();

    }

    deleteBlock() {
        const index = this.blocks.findIndex(block => block.id === this.selectedBlockId);
        if (index > -1) {
            this.blocks.splice(index, 1);
            // 必要に応じて他の処理（例えば履歴の更新など）
        }
        this.blockDeleteConfirmModal.hide();
        this.onBlockChanged()
        this.reRendering()
    }

    isEmailNotificationBlock(block: Block): block is EmailNotificationBlock {
        return block.type === 'EMAIL_NOTIFICATION';
    }

    isConditionBlock(block: Block): block is ConditionBlock {
        return block.type === 'CONDITION';
    }


    isSleepBlock(block: Block): block is SleepBlock {
        return block.type === 'SLEEP';
    }

    isSlackNotificationBlock(block: Block): block is SlackNotificationBlock {
        return block.type === 'SLACK_NOTIFICATION';
    }

    isApiCallBlock(block: Block): block is ApiCallBlock {
        return block.type === 'API_CALL';
    }

    isTriggerBlock(block: Block): block is TriggerBlock {
        return block.type === 'TRIGGER';
    }


    saveEmailSettings() {
        if (this.isEmailNotificationBlock(this.edittingBlock)) {
            console.log('保存されたメールアドレス:', this.edittingBlock.to);
            // 保存処理...
            this.emailNotificationBlockModal.hide();
        }
    }


    /**
     * EMAIL BLOCK=======
     */
    // メールアドレスが更新されたときの処理
    updateEmail(blockId: string, emailAddress: string) {
        const block = this.blocks.find(b => b.id === blockId);
        if (block instanceof EmailNotificationBlock) {
            block.to = emailAddress;
            // 履歴の更新など、必要な処理を追加
        }
    }


    onChangeEdittingBlock($event: Object, type) {
        console.log($event)
        let editedBlock: Block;
        editedBlock = $event['block']

        if (!editedBlock) {
            console.error('editedBlock is null')
            return;
        }
        this.blocks.forEach((block, index) => {
            if (block.id == editedBlock.id) {
                console.log('SET EDITED BLOCK')
                this.blocks[index] = editedBlock
            }
        });
        this.onBlockChanged()
        this.reRendering()

    }

    getTriggerBlock(): TriggerBlock {
        return this.blocks.find(block => block.type === 'TRIGGER') as TriggerBlock;
    }

    tableChanged($event: Object) {
        if (($event['table_info'] as TableInfo).table == this.table) {
            return;
        }
        this.table = ($event['table_info'] as TableInfo).table
        this.table_info = $event['table_info'] as TableInfo
        this.reRendering()

        console.log('tableChanged')
    }

    copyJson() {
        let copyText = document.getElementById('jsonText') as HTMLInputElement;
        copyText.select();
        document.execCommand('copy');
        this.toasterService.success('コピーしました。');
    }

    preview(block: Block) {

        this.data_a = [];
        let _filter: CustomFilter = null;
        this._connect.getList(this.table_info, 1, 10).subscribe(data => {
            let recordListService = new RecordListService(data, _filter, this.table_info)
            this.data_a = recordListService.data_a
        });

    }

    loadEachBlockDataCount() {
        //order block from trigger to end
        let blocks = this.getBlockFlow()

        let filter = new CustomFilter();

        let count = 0;

        let triggerBlock = this.getTriggerBlock()
        if (!triggerBlock) {
            return;
        }
        let COUNT_FORCE_ONE = false;
        if (triggerBlock.trigger_type == 'insert' || triggerBlock.trigger_type == 'update' || triggerBlock.trigger_type == 'delete') {
            COUNT_FORCE_ONE = true;
        }

        let loadNextBlockDataCount = (index: number) => {
            if (index >= blocks.length) {
                return;
            }
            let block = blocks[index]

            if (COUNT_FORCE_ONE) {
                block._data_count = 1
                loadNextBlockDataCount(index + 1)
                return;
            } else if (block instanceof FilterBlock || block instanceof TriggerBlock) {
                if (block instanceof FilterBlock) {
                    let conditions: Conditions = block.conditions;
                    filter.conditions.addChildConditions(conditions)
                    filter.force_limit = block.limit
                }
                this._connect.getList(this.table_info, 1, 1, filter).subscribe(data => {
                    block._data_count = data['count']
                    count = data['count']
                    loadNextBlockDataCount(index + 1)
                });
            } else {
                block._data_count = count
                loadNextBlockDataCount(index + 1)
            }
        }

        loadNextBlockDataCount(0)

    }


    public EdittingBlockfilter: CustomFilter = null;


    loadCustomFilterUntilEdittingBlock() {
        let filter = new CustomFilter({'table': this.table})
        let blocks = this.getBlockFlow(true)
        blocks.forEach(block => {
            if (block instanceof FilterBlock) {
                let conditions: Conditions = block.conditions;
                filter.conditions.addChildConditions(conditions)
                filter.sort_params = block.sort_params
                filter.force_limit = block.limit
            }
        });

        filter.setAsTable()
        this.EdittingBlockfilter = filter;
        return true;
    }

    public edittingBlockTableInfo: TableInfo = null;
    loadCurrentTableUntilEdittingBlock() {
        let current_table: string = this.table

        let blocks = this.getBlockFlow(true)
        blocks.forEach(block => {
            if (block.id == this.edittingBlock.id) {
                return;
            }
            if (block instanceof CopyOtherTableBlock) {
                current_table = block.target_table
            }
        });

        this._share.getTableInfo(current_table).subscribe(table_info => {
            this.edittingBlockTableInfo = table_info;
        });
    }

    getBlockFlow(untilEdittingBlock = false): Array<Block> {
        let blocks = []
        //backtrace from editting block
        let block: Block = this.getTriggerBlock()
        if (block && this.edittingBlock && block.id == this.edittingBlock.id) {
            return [block]
        }
        blocks.push(block)
        console.log('Editting block', this.edittingBlock)
        while (block) {
            let nextblock = null;
            this.blocks.forEach(b => {
                if (b.id == block.next) {
                    nextblock = b
                }
            });
            if (!nextblock) {
                break;
            }
            //if already exist
            if (blocks.some(b => b.id == nextblock.id)) {
                break;
            }
            blocks.push(nextblock)
            console.log(blocks)
            if (blocks.length > 100) {
                console.error('Loop detected')
                break;
            }
            if (untilEdittingBlock && nextblock.id == this.edittingBlock.id) {
                console.log('found editting block');
                console.log(nextblock)
                break;
            }
            block = nextblock
        }

        return blocks
    }

    openPigeonAiModal() {
        //check table selected
        if (!this.table) {
            this.toasterService.error('テーブルを選択してください。');
            return;
        }
        this.pigeonAiModal.show();

    }

    requestPigeonAi() {
        if (confirm('現在のフローが上書きされます。よろしいですか？')) {
            this.gptLoading = true
            this._connect.post('/admin/rpa/create-json-by-gpt', {text: this.requestGptText, table: this.table}, {}, false).subscribe(res => {
                console.log(res)
                if (res.data) {
                    const blocks = res.data;
                    console.log(blocks)
                    this.setBlockByJson(blocks)
                    this.onBlockChanged()
                    this.arrangeBlocks();
                    this.pigeonAiModal.hide();
                } else {
                    this.toasterService.error('エラーが発生しました。');
                }
                this.gptLoading = false
            }, error => {
                this.gptLoading = false
                this.toasterService.error(error.error.error_message);
                console.log(error)
            });
        }
    }

    protected readonly Block = Block;

    json_schema = {
        '$schema': 'http://json-schema.org/draft-07/schema#',
        'description': 'ブロックの配列.最初に必ずトリガブロックがあり、他のブロックがその後に続く。',
        'type': 'array',
        'minItems': 2,
        'items': [
            {
                'type': 'object',
                'description': ' トリガブロック。必ず最初に配置する。trigger_typeによって、timeは必須。dayOfWeek,day,month,insert,update,deleteのいずれかが必須.monthは1-12の数値。dayOfWeekは0-6の数値。',
                'properties': {
                    'id': {'type': 'string'},
                    'type': {'const': 'TRIGGER'},
                    'name': {'type': 'string'},
                    'next': {
                        'description': '次のブロックのID',
                        'type': 'string'
                    },
                    'trigger_type': {
                        'type': 'string',
                        'enum': ['daily', 'weekly', 'monthly', 'yearly', 'insert', 'update', 'delete']
                    },
                    'time': {'type': 'string'},
                    'dayOfWeek': {'type': 'number'},
                    'day': {'type': 'number'},
                    'month': {'type': 'number'},

                },
                'required': ['id', 'type', 'name', 'trigger_type'],
            }
        ],
        'additionalItems': {
            'description': 'ブロックの配列',
            'type': 'object',
            'properties': {
                'id': {'type': 'string'},
                'type': {
                    'type': 'string',
                    'enum': ['TRIGGER', 'FILTER', 'UPDATE_DATA', 'DELETE_DATA']
                },
                'name': {'type': 'string'},
                'next': {
                    'description': '次のブロックのID',
                    'type': 'string'
                }
            },
            'required': ['id', 'type', 'name'],
            'oneOf': [
                {
                    'if': {'properties': {'type': {'const': 'FILTER'}}},
                    'then': {
                        'properties': {
                            'conditions': {'$ref': 'conditions-schema.json'}
                        }
                    }
                },
                // 各ブロックタイプに対する他のif-then条件...
                {
                    'if': {'properties': {'type': {'const': 'UPDATE_DATA'}}},
                    'then': {
                        'properties': {
                            'form_and_values': {
                                'type': 'array',
                                'items': {
                                    'type': 'object',
                                    'properties': {
                                        'field': {
                                            'type': 'string',
                                            'pattern': '^(id|created|updated|field__.*)$'
                                        },
                                        'value': {'type': 'string'}
                                    },
                                    'required': ['field', 'value']
                                }
                            }
                        }
                    }
                },
            ]
        }
    }


    tableNotSelected() {
        return !this.table || this.blocks.length == 0;
    }
}
