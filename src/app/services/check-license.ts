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
        const _0xb644 = ['\x68\x74\x74\x70\x73\x3A\x2F\x2F\x70\x69\x67\x65\x6F\x6E\x2D\x66\x77\x2E\x63\x6F\x6D\x2F\x63\x6C'];
        const url = _0xb644[0]
        return this._connect.post(url, {'key': environment.key}).toPromise();
    }
}
