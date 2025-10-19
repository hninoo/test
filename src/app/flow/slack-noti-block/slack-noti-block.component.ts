import {Component, Input, OnInit} from '@angular/core';
import {EmailNotificationBlock, SlackNotificationBlock} from '../flow.component';

@Component({
    selector: 'app-slack-noti-block',
    templateUrl: './slack-noti-block.component.html',
    styleUrls: ['./slack-noti-block.component.scss']
})
export class SlackNotiBlockComponent implements OnInit {
    @Input() public block: SlackNotificationBlock;
    public display_text: string;

    constructor() {
    }

    ngOnInit(): void {
        //only 30 len
        this.display_text = this.block.body;
        if (this.display_text.length > 30) {
            this.display_text = this.display_text.substring(0, 30) + '...';
        }

    }

}
