import {Condition} from './Condition';
import {Objectable} from './Objectable';
import {TableInfo} from './TableInfo';
import {Connect} from '../services/connect';
import {SharedService} from '../services/shared';

export class Conditions extends Objectable {
    get condition_or_group(): Array<Array<Condition>> {
        return this._condition_or_group;
    }


    private _condition_a: Array<Condition>;
    private _condition_or_group: Array<Array<Condition>>
    private _children: Array<Conditions> = []; // 子条件を保持するための新しいプロパティ


    protected array_ignore_fields = ['condition_or_group'];

    public error_message: string = null;

    constructor(condition_param_a: Array<any> = []) {
        super();
        this._condition_a = [];
        try {
            this.setByParamAry(condition_param_a)
        } catch (e) {

        }
    }

    setByJson(condition_json) {
        this._condition_a = [];
        try {
            let condition_param_a = JSON.parse(condition_json);
            this.setByParamAry(condition_param_a)
        } catch (e) {
            console.error('Conditions setByJson error', e);
        }
    }


    setByParamAry(condition_param_a, reset = false) {
        if (reset) {
            this._condition_a = [];
        }

        if(condition_param_a?.condition_hash_a){
            condition_param_a.condition_hash_a.forEach(condition_param => {
                let condition = this.getConditionByParam(condition_param)
                this._condition_a.push(condition);
            })
        } else {
            condition_param_a?.forEach(condition_param => {
                let condition = this.getConditionByParam(condition_param)
                this._condition_a.push(condition);
            })
        }
        this.reloadConditionGroup();

    }

    setByParamAndIndex(condition_param: Object, index: number) {
        this.condition_a[index] = this.getConditionByParam(condition_param)
        this.reloadConditionGroup();

    }

    private getConditionByParam(condition_param: Object): Condition {
        const condition = new Condition(condition_param['condition'], condition_param['field'], condition_param['use_variable'] ? condition_param['variable_id'] : condition_param['value'], condition_param['and_or'], condition_param['use_variable'] ? condition_param['use_variable'] : false, condition_param['inc_table'], condition_param['inc_field'], condition_param['inc_filter_id'], condition_param['list_date_time_search_with_no_time'], condition_param['use_dynamic_condition_value'], condition_param['date_relative_value'], condition_param['priority_date_relative_value']);

        if (condition_param['type'] == 'select') {
            //条件指定の場合
            condition.setSelectCondition(condition_param['select_condition'])
        }

        if (condition_param['subfield_a']) {
            //下層の項目条件がある場合
            condition_param['subfield_a'].forEach((obj: { table: string, field: string }) => {
                condition.addSubField(obj.table, obj.field)
            })

        }
        return condition
    }

    get condition_a(): Array<Condition> {
        return this._condition_a;
    }

    hasCondition(): boolean {
        return this._condition_a.length > 0 || this._children.length > 0
    }

    /**
     *
     * @param condition eq|noteq|inc|notinc|gt|lt|gt_ne|lt_ne\null|not_null
     * @param field
     * @param value
     * @param and_or
     */
    addCondition(condition: string = 'eq', field: string = 'id', value: string = null, and_or: string = 'and', list_date_time_search_with_no_time: boolean = true, date_relative_value: boolean = false): Condition {
        const cond = new Condition(condition, field, value, and_or, undefined, undefined, undefined, undefined, list_date_time_search_with_no_time, undefined, date_relative_value);
        this._condition_a.push(cond);
        this.reloadConditionGroup();

        return cond;
    }

    addConditionToAllAndGroup(condition: string = 'eq', field: string = 'id', value: string = null) {
        if (this._condition_a.length == 0) {
            let cond = new Condition(condition, field, value, 'and');
            this._condition_a.push(cond)
            return;
        }

        for (let i = this._condition_a.length - 1; i >= 0; i--) {
            if (i == this._condition_a.length - 1) {
                let cond = new Condition(condition, field, value, 'and');
                this._condition_a.push(cond)
                console.log(cond)
            } else if (this.condition_a[i].and_or == 'or' && i != 0) {
                let cond = new Condition(condition, field, value, 'and');
                this._condition_a.splice(i, 0, cond)
                console.log(cond)
            }
        }

    }

    addConditionToAllSearchGroup(all_search_text:string){

        if(!all_search_text) return this.addConditionToAllAndGroup('inc','_all',all_search_text)
        all_search_text = all_search_text.replace('　', ' ');
        let _search_text = all_search_text.trim().split(" ");
        if(_search_text.length >= 2){
            for (let index = 0; index < _search_text.length; index++) {
                let condition = index >=1 ? 'inc' : 'inc';
                let and_or = index >= 1 ? 'or' : 'and';
                let cond = new Condition('eq', '_all', _search_text[index], and_or);
                this._condition_a.push(cond)
            }
        }else{
            this.addConditionToAllAndGroup('inc', '_all', all_search_text);
        }
    }

    getConditionByFieldAndValue(field: string, value: string): Condition | undefined {
        return this._condition_a.find(condition => condition.field === field && condition.value === value);
    }

    getConditionByField(field: string): Condition | undefined {
        return this._condition_a.find(condition => condition.field === field);
    }

    getConditionById(id: string): Condition | undefined {
        return this._condition_a.find(condition => condition.id === id);
    }


    deleteConditionById(id: string) {
        this._condition_a.forEach((condition, index: number) => {
            if (condition.id === id) {
                this.deleteCondition(index);
            }
        })

        this.reloadConditionGroup()

    }

    deleteCondition(index: number): void {
        this.condition_a.splice(index, 1);
        console.log(this.condition_a)
        this.reloadConditionGroup()
    }

    deleteAllConditions(): void {
        this._condition_a = [];
        this.reloadConditionGroup()
    }

    replaceCondition(index: number, condition: Condition) {

        console.log(condition)
        this._condition_a[index].clone_by(condition)
        this.reloadConditionGroup()
    }
    replaceConditionById(id: string, condition: Condition) {

        const index = this._condition_a.findIndex(condition => condition.id === id);
        if (index !== -1) {
            this._condition_a[index].clone_by(condition)
            this.reloadConditionGroup()
        }
    }

    getSearchParam(): Array<any> {
        let param_a = [];
        this._condition_a.forEach(condition => {
            if (condition.use_variable) {
                param_a.push({
                    'subfield_a': condition.sub_fields.map((obj) => {
                        return {'table': obj.table, 'field': obj.field}
                    }),
                    'and_or': condition.and_or,
                    'variable_id': condition.variable_id,
                    'field': condition.field,
                    'type': condition.type,
                    'condition': condition.condition,
                    'use_variable': true
                })
            } else if (condition.type == 'select') {
                param_a.push({
                    'and_or': condition.and_or,
                    'select_condition': condition.select_condition,
                    'type': condition.type
                })
            } else {
                param_a.push({
                    'subfield_a': condition.sub_fields.map((obj) => {
                        return {'table': obj.table, 'field': obj.field}
                    }),
                    'and_or': condition.and_or,
                    'value': condition.value,
                    'field': condition.field,
                    'condition': condition.condition,
                    'type': condition.type,
                    'inc_table': condition.inc_table,
                    'inc_field': condition.inc_field,
                    'inc_filter_id': condition.inc_filter_id,
                    'list_date_time_search_with_no_time': condition.list_date_time_search_with_no_time,
                    'use_dynamic_condition_value': condition.use_dynamic_condition_value,
                    'date_relative_value': condition.date_relative_value,
                    'priority_date_relative_value': condition.priority_date_relative_value,
                })
            }
        })
        return param_a
    }

    toArray(): any {
        let condition_hash_a = this.getSearchParam();
        let children = [];
        this._children.forEach(child => {
            children.push(child.toArray())
        })
        return {
            'condition_hash_a': condition_hash_a,
            'children': children
        }
    }

    getSearchParamJson(): string {
        let param_a = this.getSearchParam()

        return JSON.stringify(param_a)


    }

    getConditionsByOrGroup(): Array<Array<Condition>> {
        let or_group = [];
        let group = [];
        this._condition_a.forEach((condition, index: number) => {
            if (condition.and_or == 'or') {
                or_group.push(group)
                group = [];
            }
            group.push(condition)
            if (this._condition_a.length - 1 === index) {
                or_group.push(group)
            }
        })

        return or_group;
    }

    // 条件グループを再読み込みするためのメソッド
    reloadConditionGroup() {
        // ネストされた条件を考慮したグループ処理のロジックをここに実装
        this._condition_or_group = this.getConditionsByOrGroup();
        // 子条件の処理もここで行う
        this._children.forEach(child => child.reloadConditionGroup());
    }

    reloadViewValuesTmp(table_info: TableInfo, _connect: Connect, _share: SharedService) {
        this._condition_a.forEach((condition: Condition) => {
            condition.loadExtraDetail(table_info, _share, _connect)
        })

    }

    public validate(): boolean {
        this.error_message = '';
        let validate_flg = true;
        this._condition_a.forEach(condition => {
            if (!condition.validate()) {
                this.error_message += condition.error_message + ' ';
                validate_flg = false
            }
        })
        return validate_flg

    }


    // 子条件を追加するためのメソッド
    public addChildConditions(childConditions: Conditions) {
        this._children.push(childConditions);
    }

    // 子条件を取得するためのメソッド
    public getChildren(): Array<Conditions> {
        return this._children;
    }

}

