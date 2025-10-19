import {Base} from './Base';
import {Data} from './Data';
import {TableInfo} from './TableInfo';
import {OptionItem} from './OptionItem';
import {Conditions} from './Conditions';
import {SelectOptionItemsFilterWhere} from './SelectOptionItemsFilterWhere';

export class SelectOptionItemsFilter extends Base {

    private where_a: Array<SelectOptionItemsFilterWhere> = [];

    private has_where_once_field_a: Array<string> = []

    //ex. target_field = admin_field,target_field_select_other_field = division_ids, condition_field = division_field
    public add(target_field: string, target_field_select_other_field: string, condition_field: string, value: string) {
        let filterWhere = new SelectOptionItemsFilterWhere(target_field, target_field_select_other_field, condition_field, value);
        this.where_a.push(filterWhere)

        //resetされてもここを保持しないと、resetで条件がなくなった場合にreloadされないため。
        this.has_where_once_field_a.push(target_field)
    }

    public reset(target_field: string, condition_field_name: string) {
        this.where_a = this.where_a.filter(where => {
            return !(where.target_field_name === target_field && where.condition_field_name === condition_field_name)
        })

    }

    public toArray(): Array<any> {
        return this.where_a.map(where => {
            return where.toArray()
        })
    }

    public isEmpty() {
        return this.where_a.length == 0 && this.has_where_once_field_a.length == 0;
    }

    public hasWhere(field_name: string): boolean {
        if (this.has_where_once_field_a.indexOf(field_name) >= 0) {
            return true;
        }
        return this.where_a.filter(where => {
            return where.target_field_name === field_name;
        }).length > 0
    }

    public getConditions(target_field: string, table_info: TableInfo): Conditions {
        let conditions = new Conditions();
        this.where_a.filter(where => {
            return where.target_field_name === target_field;
        }).map(where => {
            let condition_cond = 'eq';
            console.log(table_info.forms.byFieldName(where.condition_field_name).original_type)
            console.log(table_info.forms.byFieldName(where.condition_field_name).type)

            if (!table_info.forms.byFieldName(where.condition_field_name).isSelectOtherTable()) {
                condition_cond = 'inc'
            }
            conditions.addCondition(condition_cond, where.target_field_select_other_field, where.value)
            return where;
        })
        return conditions

    }

    public inputCompleteFilterCompareValue(target_field: string) {
        let flg = true

        this.where_a.forEach(where => {
            if (where.target_field_name === target_field && where.value == null) {
                flg = false
            }
        })
        return flg
    }

    public getUninputtedFields(target_field: string) {
        let field_name_a = []
        this.where_a.forEach(where => {
            if (where.target_field_name === target_field && where.value == null) {
                field_name_a.push(where.condition_field_name)
            }
        })
        return field_name_a

    }

    public getUniqueHash(): string {
        //where_a,has_where_once_field_a の中身が変わると、hashが変わるようにする。
        let hash = JSON.stringify(this.where_a) + JSON.stringify(this.has_where_once_field_a)
        return hash

    }

    public hasWhereData(): boolean {
        return this.where_a.length > 0 || this.has_where_once_field_a.length > 0
    }
}



