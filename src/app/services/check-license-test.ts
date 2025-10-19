import {NgModule} from '@angular/core';
import 'rxjs/Rx';
import {environment} from '../../environments/environment';
import {Connect} from './connect';

@NgModule({
    imports: [],
    providers: [Connect],
    declarations: []
})
export class CL {
    constructor(private _connect: Connect) {
    }

    /**
     * checkValidLisence
     */
    cbl() {
        const url = 'https://test.pigeon-fw.com/cl'
        return this._connect.post(url, {'key': environment.key}).toPromise();
    }
}
