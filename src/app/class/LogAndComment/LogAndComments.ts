import {LogAndComment} from './LogAndComment';
import {Comment} from '../Comment';
import {Log} from '../Log';

export class LogAndComments {

    public comment_a: Array<Comment>;
    public log_a: Array<Log>;

    public log_and_comment_merge_a: Array<LogAndComment>;

    public constructor(comment_a: Array<Comment>, log_a: Array<Log>) {

        this.comment_a = comment_a;
        this.log_a = log_a;


        let log_by_id = {};
        this.log_a.forEach(log => {
            log_by_id[log.id] = log;

        });

        let added_log_id_a = [];
        this.log_and_comment_merge_a = [];

        //コメント一覧
        this.comment_a.forEach(comment => {
            let log_and_comment: LogAndComment = new LogAndComment();
            log_and_comment.comment = comment;
            if (comment.log_id && log_by_id[comment.log_id]) {
                log_and_comment.log = log_by_id[comment.log_id];
            }
            added_log_id_a.push(comment.log_id)

            this.log_and_comment_merge_a.push(log_and_comment)
        })

        //操作ログ一覧
        this.log_a.forEach(log => {
            if (added_log_id_a.indexOf(log.id) == -1) {
                let log_and_comment: LogAndComment = new LogAndComment();
                log_and_comment.log = log;

                this.log_and_comment_merge_a.push(log_and_comment)
            }
        })

        this.log_and_comment_merge_a.sort((a, b) => {
            let a_date = a.getCreated();
            let b_date = b.getCreated();
            if (a_date > b_date) {
                return -1;
            } else if (a_date < b_date) {
                return 1
            }
            return 0;
        })

    }


}
