import {Component, Input, OnInit} from '@angular/core';
import {BlockBaseComponent} from '../block-base/block-base.component';
import {TriggerBlock, UpdateBlock} from '../flow.component';

@Component({
    selector: 'app-update-block',
    templateUrl: './update-block.component.html',
    styleUrls: ['./update-block.component.scss']
})
export class UpdateBlockComponent extends BlockBaseComponent implements OnInit {

    @Input() public block: UpdateBlock;

    ngOnInit(): void {
    }

}
