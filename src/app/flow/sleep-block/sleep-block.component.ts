import {Component, Input, OnInit} from '@angular/core';
import {TableInfo} from '../../class/TableInfo';
import {CopyBlock, SleepBlock} from '../flow.component';

@Component({
    selector: 'app-sleep-block',
    templateUrl: './sleep-block.component.html',
    styleUrls: ['./sleep-block.component.scss']
})
export class SleepBlockComponent implements OnInit {
    @Input() public table_info: TableInfo;
    @Input() public block: SleepBlock;

    constructor() {
    }

    ngOnInit(): void {
    }

}
