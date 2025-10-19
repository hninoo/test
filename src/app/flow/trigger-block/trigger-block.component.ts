import {Component, Input, OnInit} from '@angular/core';
import {EmailNotificationBlock, TriggerBlock} from '../flow.component';
import {SharedService} from '../../services/shared';

@Component({
    selector: 'app-trigger-block',
    templateUrl: './trigger-block.component.html',
    styleUrls: ['./trigger-block.component.scss']
})
export class TriggerBlockComponent implements OnInit {


    @Input() public block: TriggerBlock;

    constructor(public _shared: SharedService) {
    }

    ngOnInit(): void {
    }

    // 曜日の数値を曜日の名前に変換するメソッド
    convertDayOfWeek(day: number): string {
        const days = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
        return days[day];
    }


}
