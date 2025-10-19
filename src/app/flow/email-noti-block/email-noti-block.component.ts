import {Component, Input, OnInit} from '@angular/core';
import {EmailNotificationBlock, TriggerBlock} from '../flow.component';

@Component({
  selector: 'app-email-noti-block',
  templateUrl: './email-noti-block.component.html',
  styleUrls: ['./email-noti-block.component.scss']
})
export class EmailNotiBlockComponent implements OnInit {

  @Input() public block: EmailNotificationBlock;

  constructor() {
  }

  ngOnInit(): void {
  }

}
