import {Component, Input, OnInit} from '@angular/core';
import {DeleteBlock, UpdateBlock} from '../flow.component';

@Component({
    selector: 'app-delete-block',
    templateUrl: './delete-block.component.html',
    styleUrls: ['./delete-block.component.scss']
})
export class DeleteBlockComponent implements OnInit {

    @Input() public block: DeleteBlock;
    constructor() {
    }

    ngOnInit(): void {
    }

}
