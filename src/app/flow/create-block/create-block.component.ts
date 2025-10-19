import {Component, Input, OnInit} from '@angular/core';
import {BlockBaseComponent} from '../block-base/block-base.component';
import {CreateBlock} from '../flow.component';

@Component({
    selector: 'app-create-block',
    templateUrl: './create-block.component.html',
    styleUrls: ['./create-block.component.scss']
})
export class CreateBlockComponent extends BlockBaseComponent implements OnInit {

    @Input() public block: CreateBlock;

    ngOnInit(): void {
    }

}
