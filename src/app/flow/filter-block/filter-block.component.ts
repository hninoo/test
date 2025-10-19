import {Component, Input, OnInit} from '@angular/core';
import {FilterBlock, TriggerBlock} from '../flow.component';
import {TableInfo} from '../../class/TableInfo';
import {SharedService} from '../../services/shared';
import {SimpleTableInfo} from '../../class/SimpleTableInfo';
import {Connect} from '../../services/connect';

@Component({
    selector: 'app-filter-block',
    templateUrl: './filter-block.component.html',
    styleUrls: ['./filter-block.component.scss']
})
export class FilterBlockComponent implements OnInit {

    @Input() table_info: TableInfo;
    @Input() block: FilterBlock;


    constructor(private _shared: SharedService, private _connect: Connect) {
    }

    ngOnInit(): void {
        this.block.conditions.condition_a.forEach(condition => {
            condition.loadExtraDetail(this.table_info, this._shared, this._connect)
        });

    }

    // Add this method to your component's TypeScript file
    calculateIndentationLevel(conditions, index) {
        let level = 0;
        for (let i = 0; i < index; i++) {
            if (conditions[i].and_or === 'or') {
                level++;
            }
        }
        return level * 20; // 20pxをインデントレベルとする
    }


}
