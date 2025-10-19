import {NgModule} from '@angular/core';
import 'rxjs/Rx';
import {Connect} from './connect';

@NgModule({
    imports: [],
    providers: [Connect],
    declarations: []
})
export class CL {
    constructor(private _connect: Connect) {
    }

    cbl() {
        return new Promise((resolve, reject) => {
            resolve({
                'result': 'success',
                'client': {'froala_key': 'PD2B4I4I3B12C10iB6E5F4E3I2I3C7B6B5B4C-11NGNe1IODMGYNSFKV==', 'expired': '2050-11-11 00:00:00'}
            });
        });
    }
}
