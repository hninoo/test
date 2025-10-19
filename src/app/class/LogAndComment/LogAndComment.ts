import {Base} from '../Base';
import {Comment} from '../Comment';
import {Log} from '../Log';

export class LogAndComment extends Base {

    private _comment: Comment;
    private _log: Log;


    get comment(): Comment {
        return this._comment;
    }

    set comment(value: Comment) {
        this._comment = value;
    }

    get log(): Log {
        return this._log;
    }

    set log(value: Log) {
        this._log = value;
    }

    getCreated() {
        if (this._comment) {
            return new Date(this._comment.created);
        } else if (this._log) {
            return new Date(this._log.created);
        }
        return null;
    }
}
