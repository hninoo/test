export class SelectOptionItemsFilterWhere {
    private _target_field_name: string = null;
    private _condition_field_name: string = null;
    private _target_field_select_other_field: string = null;
    private _value: string = null;

    public constructor(_target_field_name: string, _target_field_select_other_field: string, _condition_field_name: string, _value: string) {
        this._target_field_name = _target_field_name;
        this._condition_field_name = _condition_field_name
        this._target_field_select_other_field = _target_field_select_other_field
        this._value = _value;
    }


    get target_field_name(): string {
        return this._target_field_name;
    }

    get condition_field_name(): string {
        return this._condition_field_name;
    }


    get target_field_select_other_field(): string {
        return this._target_field_select_other_field;
    }

    get value(): string {
        return this._value;
    }

    public toArray() {
        return {
            'target_field_name': this.target_field_name,
            'condition_field_name': this.condition_field_name,
            'target_field_select_other_field': this.target_field_select_other_field,
            'value': this.value,
        }
    }
}
