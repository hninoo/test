import {Base} from './Base';

export class User extends Base {
    get email(): string {
        return this._email;
    }


    private _image_url: string = null
    private _name: string
    private _email: string

    constructor(hash) {
        super(hash)
        if (!hash) {
            this._name = 'NO USER'
            return;
        }
        for (const key of Object.keys(hash)) {
            this['_' + key] = hash[key];
        }
    }

    get image_url(): string {
        if (!this._image_url) {
            return 'assets/img/avatars/user.png'
        }
        return this._image_url;
    }

    get name(): string {
        return this._name;
    }
}
