import {NgModule, VERSION} from '@angular/core';
import 'rxjs/add/operator/map'


@NgModule({
    declarations: []
})
export class PublicFormService {
    private _publicPostParams: Object;


    get publicPostParams(): Object {
        return this._publicPostParams;
    }

    set publicPostParams(value: Object) {
        this._publicPostParams = value;
    }
}

