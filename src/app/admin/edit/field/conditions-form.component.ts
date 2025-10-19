import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {moveItemInArray} from '@angular/cdk/drag-drop';
import {Conditions} from '../../../class/Conditions';
import {Condition} from '../../../class/Condition';
import {TableInfo} from '../../../class/TableInfo';
import {SharedService} from '../../../services/shared';
import {Connect} from '../../../services/connect';
import {ActivatedRoute} from '@angular/router';
import {Form} from '../../../class/Form';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';


@Component({
    selector: 'conditions-form',
    templateUrl: './conditions-form.component.html',
})

export class ConditionsFormComponent implements OnInit, OnChanges {
    @Input() table: string;
    @Input() default_condition_json: string;
    @Input() ignore_type_a: Array<string> = [];
    @Input() ignore_field_name_a: Array<string> = [];
    @Input() is_grant_condition_form: boolean = false;
    @Input() grant_permission_type: string = ''; // 権限タイプ（view, edit, add, delete）

    //arbitrary
    @Input() compare_target_table: string = null
    @Input() target_form_a: Array<Form> = null

    @Input() output_json: boolean = true;
    @Input() id_prefix: string = null;

    @Output() valueChanged: EventEmitter<Object> = new EventEmitter();

    public table_info: TableInfo;

    //未実装
    public compare_target_table_info: TableInfo;
    public conditions: Conditions = new Conditions([]);
    public filteredGroups: Array<any> = [];

    constructor(private _share: SharedService, private _connect: Connect, private _route: ActivatedRoute) {
    }


    ngOnChanges(changes: SimpleChanges): void {
        this._share.getTableInfo(this.table).subscribe(_table_info => {
            this.table_info = _table_info
            this.conditions.setByJson(this.default_condition_json)
        })
        if (this.compare_target_table) {
            this._share.getTableInfo(this.compare_target_table).subscribe(_table_info => {
                this.compare_target_table_info = _table_info
            })
        }
    }

    ngOnInit(): void {
    }


    addCondition() {
        this.conditions.addCondition()
    }

    delRelationTableCondition(i: number) {
        this.conditions.deleteCondition(i);
        this.emit()
    }

    dropCondition(event) {
        moveItemInArray(this.conditions.condition_a, event.previousIndex, event.currentIndex);
    }


    onConditionChanged(cond_index: number, $event): void {
        let condition: Condition = $event.condition;
        if (!this.conditions.condition_a) {
            this.conditions.setByParamAry([])
        }
        this.conditions.setByParamAndIndex(condition.toArray(), cond_index)

        this.emit()
    }

    emit() {
        if (this.output_json) {
            // Get raw array instead of JSON string
            const conditionArray = this.conditions.getSearchParam();
            this.valueChanged.emit({condition_json: conditionArray})
        } else {
            this.valueChanged.emit({conditions: this.conditions})
        }
    }
}
