import {Data} from '../class/Data';
import {CrossTableHeader} from '../class/CrossTableHeader';
import {CustomFilter} from '../class/Filter/CustomFilter';
import {TableInfo} from '../class/TableInfo';
import {Form} from '../class/Form';

export class RecordListService {
    public data: Array<Object> = null;
    public data_a: Array<Data> = null;
    public crossTableHeader: CrossTableHeader = null;

    public constructor(response_list_data: Object, customFilter: CustomFilter, table_info: TableInfo) {
        this.data_a = [];
        if (customFilter && customFilter.summarizeFilter && customFilter.summarizeFilter.cross_table) {
            response_list_data['cross_data_a'].forEach(_data => {
                let newdata = new Data(table_info);
                newdata.setInstanceData(_data)
                this.data_a.push(newdata);
            })

            this.crossTableHeader = new CrossTableHeader(response_list_data['cross_horizontal_header_a'], response_list_data['cross_vertical_summarize_a'], response_list_data['summarize_by_record'])
            console.log('CROSS HEADER')
            console.log(this.crossTableHeader)
        } else if (response_list_data['data'] && response_list_data['data']['data']) {
            //summarize mode
            this.data = response_list_data['data']
        } else if (response_list_data['data_a']) {
            //summarize mode

            response_list_data['data_a'].forEach(_data => {
                let newdata = new Data(table_info);
                newdata.setInstanceData(_data)
                this.data_a.push(newdata);
            })
        } else {
            response_list_data['data'].forEach(_data => {
                let newdata = new Data(table_info);
                newdata.setInstanceData(_data)
                this.data_a.push(newdata);
            })
        }


    }


    /**
     * サマリー行データを作成するメソッド
     * @param baseData ベースとなるデータ
     * @param x1Value x1値
     * @param summaryData 集計データ
     * @param summaryTypes 集計タイプの配列
     * @param table_info テーブル情報
     * @param customFilter カスタムフィルター（summary_a取得用）
     * @returns サマリー行データ
     */

    /**
     * 数値をフォーマットする
     * @param value 数値
     * @param form フォーム情報
     * @returns フォーマット済みの文字列
     */
    public static formatNumericValue(value: any, form: any): string {

        // 文字列の場合は数値に変換
        let numericValue = value;
        if (typeof value === 'string') {
            numericValue = parseFloat(value.replace(/,/g, ''));
        }

        // 数値でない場合はそのまま返す
        if (typeof numericValue !== 'number' || isNaN(numericValue)) {
            return value;
        }

        // 小数点以下の桁数を適用
        let formattedValue = numericValue;
        if (form.decimal_places !== undefined && form.decimal_places !== null) {
            formattedValue = Number(numericValue.toFixed(form.decimal_places));
        }

        // 桁区切りを適用（num_separatorがtrueの場合は桁区切りなし）
        const decimalPlaces = form.decimal_places ?? 0;
        let displayValue = form.num_separator === true
                            ? formattedValue.toFixed(decimalPlaces)
                            : formattedValue.toLocaleString('ja-JP', {
                                minimumFractionDigits: decimalPlaces,
                                maximumFractionDigits: decimalPlaces
                            });

        // マイナス符号の処理
        const isNegative = formattedValue < 0;

        // custom_fieldから設定を取得、fallbackとしてform直下のプロパティも確認
        const useTriangle = (form.custom_field && form.custom_field['minus_format_triangle']) ||
            form.minus_format_triangle ||
            (form.option && form.option['minus_format_triangle']);

        // 単位記号の追加（三角処理の前に実行）
        if (form.num_unit) {
            if (form.num_unit_order === 'first') {
                displayValue = form.num_unit + displayValue;
            } else {
                displayValue = displayValue + form.num_unit;
            }
        }

        // 三角記号の処理（単位記号の後に実行）
        if (isNegative && useTriangle) {
            if (form.num_unit && form.num_unit_order === 'first') {
                // 単位が前にある場合: ￥-100 → ▲￥100
                displayValue = '▲' + form.num_unit + displayValue.substring(form.num_unit.length + 1);
            } else {
                // 単位が後にある場合または単位なし: -100￥ → ▲100￥
                displayValue = '▲' + displayValue.substring(1);
            }
        }
        return displayValue;
    }

    /**
     * 数値のスタイルを取得する
     * @param value 数値
     * @param form フォーム情報
     * @returns スタイルオブジェクト
     */
    public static getNumericStyle(value: any, form: Form): any {

        // 文字列の場合は数値に変換
        let numericValue = value;
        if (typeof value === 'string') {
            numericValue = parseFloat(value);
        }

        if (typeof numericValue !== 'number' || isNaN(numericValue)) {
            return {};
        }

        const style: any = {};

        // マイナス値を赤字表示

        // custom_fieldから設定を取得、fallbackとしてform直下のプロパティも確認
        const showRed = form.show_minus_red;
        if (numericValue < 0 && showRed) {
            style.color = 'red';
        }

        return style;
    }

}
