import {Component, ElementRef, ViewChild, Input, Output, EventEmitter} from '@angular/core';
import {Forms} from '../../class/Forms';

/**
 * @title Chips Autocomplete
 */
@Component({
    selector: 'admin-forms-image',
    templateUrl: './forms-image.component.html'
})
export class FormsImageComponent {
    @Input('fields') fields: Array<any>;
    @Input('forms') forms: Forms;
    @Input('data') data: {};
    @Input('error_a') error_a;
    @Input('grant_menu_a') grant_menu_a;

    constructor() {
    }

    ngOnInit() {
    }

}
