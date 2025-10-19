export class CrossTableHeader {
    private _sub_label_a: Array<string>;
    private _header_summarize_by_sublabel: Object;
    private _summarize_by_record: Array<number>;


    constructor(sub_label_a: Array<string>, header_summarize_by_sublabel: Object = [], summarize_by_record: Array<number> = []) {
        this._sub_label_a = sub_label_a
        this._header_summarize_by_sublabel = header_summarize_by_sublabel;
        this._summarize_by_record = summarize_by_record;
    }

    /*
    sub_label_hash():Array<Object>{
        let sub_label_group = []
        let prev_label = null
        let counter = 1
        this._sub_label_a.forEach((sub_label,i)=>{
            if(sub_label != prev_label || i==this._sub_label_a.length-1){
                sub_label_group.push({
                    'label':sub_label,
                    'rowspan':counter,
                })
                counter = 1
            }else{
                counter++;
            }
        })
        console.log(sub_label_group)
        return sub_label_group


    }
     */

    get sub_label_a(): Array<string> {
        return this._sub_label_a;
    }


    get header_summarize_by_sublabel(): Object {
        return this._header_summarize_by_sublabel;
    }


    get summarize_by_record(): Array<number> {
        return this._summarize_by_record;
    }
}
