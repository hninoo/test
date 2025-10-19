import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable()
export class ConfigService {
    config: any;

    constructor(private http: Http) {
    }

    load() {
        return new Promise((resolve) => {
            this.http.get('config.json')
                .map(res => res.json())
                .subscribe(json => {
                    this.config = json;
                    resolve(null);
                });
        });
    }
}
