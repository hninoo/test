export class Objectable {
    protected array_ignore_fields = [];

    public toArray() {
        let new_hash = {};
        for (const key of Object.keys(this)) {
            const new_key = key.replace(/^_/i, '');
            if (this.array_ignore_fields.indexOf(new_key) >= 0 || new_key == 'array_ignore_fields') {
                continue;
            }
            if (Array.isArray(this[key]) && !!this[key][0]) {
                new_hash[new_key] = [];
                this[key].forEach(_child => {
                    new_hash[new_key].push(this.changeArrayIfObjectable(_child))
                })
            } else {
                new_hash[new_key] = this.changeArrayIfObjectable(this[key])
            }
        }
        let obj = JSON.parse(JSON.stringify(new_hash));
        return obj;
        //return this.removeFirstUnderLine(obj)
    }

    private changeArrayIfObjectable(obj) {
        if (obj instanceof Objectable) {
            return obj.toArray();
        } else {
            return obj;
        }
    }


    protected getId() {
        var number = Math.random() // 0.9394456857981651
        number.toString(36); // '0.xtis06h6'
        var id = number.toString(36).substr(2, 14); // 'xtis06h6'
        return id;
    }
}
