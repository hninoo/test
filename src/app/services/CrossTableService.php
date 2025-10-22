<?php

namespace Service;

use CustomClass\Chart;
use CustomClass\Chart\CrossTableRecord;
use CustomClass\ConditionHandler;
use CustomClass\DbDao;
use CustomClass\Entity\Table;
use CustomClass\Record;
use CustomClass\Form;
use CustomClass\TableField;
use function s;

class CrossTableService {

	private string $table_name;
	private int $GAP_THRESHOLD_MONTHS = 60;

	public function __construct(string $table_name) {
		$this->table_name = $table_name;
	}

	public function getCrossTableData($resultset_a, $chart_params, $page = 1, $sort_params = []) {
		$result_hash = [];
		//FIXME:only cross table
		/**
		 * @var array<CrossTableRecord> $crossRecord_a
		 */
		[$crossRecord_a, $x1_sub_a, $count] = $this->getRecordsAndHeaders($resultset_a, $chart_params, $page);
		$result_hash['count'] = $count;
		$result_hash['cross_data_a'] = $crossRecord_a;
		$result_hash['cross_horizontal_header_a'] = $x1_sub_a;

		$summary_type = $chart_params['summary_a'][0]['summary_type'];

		$summary_field = $chart_params['summary_a'][0]['summary_field'];
		$field = new TableField(['Field' => $summary_field]);
		$summary_form = new Form($field);
		$num_separator = $summary_form->num_separator;

		$cross_vertical_summarize_a = [];
		foreach ($x1_sub_a as $x1_sub_label) {
			$y_a = array_map(function (CrossTableRecord $d) use ($x1_sub_label) { return $d->raw_data['x1_a'][$x1_sub_label]; }, $crossRecord_a);
			$sum = Chart::getSummary($y_a, $summary_type);
			$cross_vertical_summarize_a[$x1_sub_label] = is_numeric($sum) && !$num_separator ? number_format($sum) : $sum;
		}

		//全ての集計
		$sum = Chart::getSummary($cross_vertical_summarize_a, $summary_type);
		$cross_vertical_summarize_a['sum'] = is_numeric($sum) && !$num_separator ? number_format($sum) : $sum;

		//縦軸
		$result_hash['cross_vertical_summarize_a'] = $cross_vertical_summarize_a;

		$summarize_by_record = [];

		foreach ($crossRecord_a as $crossRecord) {
			$val_a = [];
			$num_separator = $crossRecord->num_separator;

			foreach ($chart_params['summary_a'] as $summary) {
				if ($summary['summary_field'] == $crossRecord->breakdown_item['field']) {
					$summary_type = $summary['summary_type'];
					break;
				}
			}

			foreach ($x1_sub_a as $x1_sub_label) {
				$val_a[] = is_string($crossRecord->raw_data['x1_a'][$x1_sub_label]) ? floatval(str_replace(',', '', $crossRecord->raw_data['x1_a'][$x1_sub_label])) : $crossRecord->raw_data['x1_a'][$x1_sub_label];
			}
			$sum = Chart::getSummary($val_a, $summary_type);

			$formatted_sum = is_numeric($sum) && !$num_separator ? number_format($sum) : $sum;

			$summarize_by_record[] = $formatted_sum;

			$crossRecord->summarize_record = is_numeric( $sum ) ? (int) $sum : $sum;
			$crossRecord->summarize_record_formatted = $formatted_sum;

		}

		// Extract the 'summarize_record' column from crossRecord_a
		$summarize_by_records = array_column($crossRecord_a, 'summarize_record');
		$result_hash['summarize_by_record'] = $summarize_by_records;

		// do sort $result_hash['summarize_by_record'],$result_hash['cross_data_a'] if sumarry type is not minimum.
		// if( $summary_type != 'min' ) {
			if (!empty($sort_params)) {
				$first_sort = $sort_params[0];
				if ($first_sort['cross_tab']) {
					$asc_desc = $first_sort['asc_desc'];
					array_multisort($result_hash['summarize_by_record'], $asc_desc == 'asc' ? SORT_ASC : SORT_DESC, $result_hash['cross_data_a']);
				}
			}
		// }
		// Extract the 'summarize_record_formatted' column from $result_hash['cross_data_a']
		$summarize_by_records = array_column($result_hash['cross_data_a'], 'summarize_record_formatted');
		$result_hash['summarize_by_record'] = $summarize_by_records;
		
		return $result_hash;

	}


	/**
	 * @param array<Record> $record_a
	 * @return void
	 * @throws \Exception
	 */
	private function getRecordsAndHeaders(array $record_a, $chart_params, int $page = 1) {

		$fields = $chart_params['fields'];
		$summary_a = $chart_params['summary_a'];
		$matchedFields = [];

		if (count($summary_a) > 1) {
			$newFields = [];
			foreach ($fields as $field) {
				$matchFound = false;
				foreach ($summary_a as $summary) {
					if ($field['field'] == $summary['summary_field']) {
						$matchFound = true;
						$matchedFields[] = $field;
						break;
					}
				}
				if (!$matchFound) {
					$newFields[] = $field;
				}
			}
			if (!empty($newFields)) $fields = $newFields;
		}

		$horizontal_field = $fields[0];

		if ($horizontal_field['is_date']) {
			// If there is no data, we should not generate any date headers.
			if (empty($record_a)) {
				$x1_sub_a = [];
				return [[], $x1_sub_a, 0];
			}

			// Detect fiscal year "noteq" condition by analyzing search conditions
			$fy_noteq_range = $this->detectFiscalYearNoteqRange($chart_params);
			
			$no_fill = isset($chart_params['options']['fill']) && $chart_params['options']['fill'] === false;
			$first_dt = null;
			$last_dt = null;
        
			if ($no_fill) {
				// Build headers as continuous ranges, splitting at fiscal year noteq gap if present
				$view_format = Chart::$datetime_a[$horizontal_field['term']]['view'];
				// Collect unique present months (Y-m-01)
				$month_keys = [];
				foreach ($record_a as $record) {
					if (!empty($record->raw_data['x1']) && !preg_match("/^1700/", $record->raw_data['x1'])) {
						$dt = new \DateTime($record->raw_data['x1']);
						$month_keys[$dt->format('Y-m-01')] = true;
					}
				}
				$months = array_values(array_keys($month_keys));
				sort($months);
				if (empty($months)) { $x1_sub_a = []; return [[], [], 0]; }

				$segments = [];
				
				// If fiscal year noteq range exists, split at that boundary
				if ($fy_noteq_range !== null) {
					$before_fy = [];
					$after_fy = [];
					
					foreach ($months as $month) {
						$month_dt = new \DateTime($month);
						// Before fiscal year: dates that are strictly before gap_start
						if ($month_dt < $fy_noteq_range['start']) {
							$before_fy[] = $month;
						} 
						// After fiscal year: dates that are greater than gap_end
						elseif ($month_dt > $fy_noteq_range['end']) {
							$after_fy[] = $month;
						}
						// Skip months within the fiscal year noteq range
					}
					
					if (!empty($before_fy)) {
						$segments[] = [$before_fy[0], $before_fy[count($before_fy)-1]];
					}
					if (!empty($after_fy)) {
						$segments[] = [$after_fy[0], $after_fy[count($after_fy)-1]];
					}
				} else {
					// Original gap detection logic when no fiscal year noteq
					// Find the largest gap (in months) between consecutive present months
					$max_gap = -1; $max_idx = -1;
					for ($i = 0; $i < count($months)-1; $i++) {
						$cur = new \DateTime($months[$i]);
						$next = new \DateTime($months[$i+1]);
						$diff = ((int)$next->format('Y'))*12 + (int)$next->format('n') - (((int)$cur->format('Y'))*12 + (int)$cur->format('n'));
						if ($diff > $max_gap) { $max_gap = $diff; $max_idx = $i; }
					}

					// If the largest gap is small (<= threshold months), treat as one contiguous span
					$GAP_THRESHOLD_MONTHS = $this->GAP_THRESHOLD_MONTHS; // configurable threshold for deciding whether to split
					if ($max_gap <= $GAP_THRESHOLD_MONTHS) {
						$segments[] = [$months[0], $months[count($months)-1]];
					} else {
						// Build up to two segments split at the largest gap
						$first_start = $months[0];
						$first_end = $months[$max_idx];
						$segments[] = [$first_start, $first_end];
						if ($max_idx+1 < count($months)) {
							$second_start = $months[$max_idx+1];
							$second_end = $months[count($months)-1];
							$segments[] = [$second_start, $second_end];
						}
					}
				}

				// Expand each segment into continuous months
				$x1_sub_a = [];
				foreach ($segments as [$start_m, $end_m]) {
					$cursor = new \DateTime($start_m);
					$end_dt = new \DateTime($end_m);
					while ($cursor <= $end_dt) {
						$x1_sub_a[] = $cursor->format($view_format);
						$cursor->modify('+1 month');
					}
				}
			} else {
				// Handle fiscal year time condition to set the full date range
				$time_condition = $chart_params['time_condition'] ?? null;
				if ($time_condition && str_contains($time_condition, 'year') && ($chart_params['is_fy'] ?? false)) {
					$time_range = ConditionHandler::returnTimeRange($time_condition);
					$first_dt = new \DateTime($time_range['start']);
					$last_dt = new \DateTime($time_range['end']);
					// The end date from returnTimeRange is exclusive, so subtract one day for the loop boundary.
					$last_dt->modify('-1 day');
				}

				foreach ($record_a as $record) {
					if (!empty($record->raw_data['x1']) && !preg_match("/^1700/", $record->raw_data['x1'])) {
						$current_rec_dt = new \DateTime($record->raw_data['x1']);
						if ($first_dt === null) {
							$first_dt = $current_rec_dt;
							$last_dt = $current_rec_dt;
						} else {
							if ($first_dt > $current_rec_dt) $first_dt = $current_rec_dt;
							if ($last_dt < $current_rec_dt) $last_dt = $current_rec_dt;
						}
					}
				}
				if ($first_dt === null) {
					$first_dt = new \DateTime();
					$last_dt = new \DateTime();
				}
			}

			if (!$no_fill && $first_dt !== null) {
				$downer_term = Chart::getDownerTerm($horizontal_field['term']);
				if (empty($downer_term)) {
					$downer_term = $horizontal_field['term'];
				}

				$format = Chart::$datetime_a[$downer_term]['start_format'];
				$first_dt = new \DateTime($first_dt->format($format));
				$last_dt = new \DateTime($last_dt->format($format));

				$view_format = Chart::$datetime_a[$horizontal_field['term']]['view'];
				$start_dt = clone $first_dt;
				$x1_sub_a = [];

				while ($start_dt <= $last_dt) {
					$current_date_view_str = $start_dt->format($view_format);
					
					// Skip dates within fiscal year noteq range
					if ($fy_noteq_range !== null) {
						$current_month_start = new \DateTime($start_dt->format('Y-m-01'));
						if ($current_month_start >= $fy_noteq_range['start'] && $current_month_start <= $fy_noteq_range['end']) {
							$start_dt->modify('+ 1' . $horizontal_field['term']);
							continue;
						}
					}
					
					$x1_sub_a[] = $current_date_view_str;
					$start_dt->modify('+ 1' . $horizontal_field['term']);
				}
			}

		} else {
			$table = Table::getInstance($this->table_name);
			$option_a = $table->getFormsByKey()[$horizontal_field['field']]->getOptionSelectItems();
			$x1_sub_a = array_map(fn($option) => $option['view_label'] ?? $option['label'], $option_a);
		}

		$dao = DbDao::getInstance($this->table_name);

		$horizontal_field = new TableField(['Field' => $fields[0]['field']]);
		$horizontal_form = new Form($horizontal_field);

		//X2,X3...XnのKeyでrecordをまとめる。
		$record_a_by_cross_key = [];
		foreach ($record_a as $record) {
			$cross_key_a = [];
			foreach ($fields as $i => $chart_field) {
				if ($i == 0) {
					//horizontal field
					continue;
				}
				$cross_key_a[] = $record->raw_data[$chart_field['field'] . '_view'];

			}
			$cross_key = implode("_", $cross_key_a);
			$record_a_by_cross_key[$cross_key][] = $record;

			// マルチのその他テーブル対応
			foreach ($dao->forms_by_key as $form) {
				if ($form->is_multi_value_mode && $form->original_type == Form::TYPE_SELECT_OTHER_TABLE) {
					if (array_key_exists($form->field->Field . '_view', $record->view_data)) {
						$other_table_id = $record->view_data[$form->field->Field . '_view'];
						$other_field = $form->item_fields[0];
						$result = \ORM::for_table($form->item_table)->find_one($other_table_id);
						// 集計項目がないときにはいれない
						if ($record->view_data[$form->field->Field] != null) {
							$record->view_data[$form->field->Field . '_view'] = $result[$other_field];
						}
					}
				}
			}

			// x1(horizontal field)が複数項目かつその他テーブルのとき対応
			if ($horizontal_form->is_multi_value_mode && $horizontal_form->original_type == Form::TYPE_SELECT_OTHER_TABLE) {
				$other_table_id = $record->view_data['x1'];
				if ($other_table_id) {
					$other_field = $horizontal_form->item_fields[0];
					$result = \ORM::for_table($horizontal_form->item_table)->find_one($other_table_id);
					$record->view_data['x1'] = $result[$other_field];
				}
			}
		}


		$crossRecord_a = [];
		foreach ($record_a_by_cross_key as $corss_key => $t_record_a) {
			if (!empty($matchedFields)) {
				foreach ($matchedFields as $index => $matched_field) {
					$crossRecord_a[] = new Chart\CrossTableRecord($chart_params, $t_record_a, $x1_sub_a, $index, $matched_field);
				}
			} else {
				$crossRecord_a[] = new Chart\CrossTableRecord($chart_params, $t_record_a, $x1_sub_a);
			}
		}

		$count = count($crossRecord_a);
		//per page = 50
		//		$crossRecord_a = array_slice($crossRecord_a, ($page-1)*50, 50);

		return [$crossRecord_a, $x1_sub_a, $count];
	}

	/**
	 * Detect fiscal year "noteq" condition from search parameters
	 * Returns the date range that should be excluded from headers
	 */
	private function detectFiscalYearNoteqRange($chart_params) {
		// Check if there's a search condition with "noteq" and "-1 year fy"
		$search = $chart_params['search'] ?? null;
		if (!$search || !isset($search['condition_json'])) {
			return null;
		}

		$condition_json = json_decode($search['condition_json'], true);
		if (!$condition_json || !isset($condition_json['condition_hash_a'])) {
			return null;
		}

		// Look for noteq condition with "-1 year fy" value
		foreach ($condition_json['condition_hash_a'] as $condition) {
			if (isset($condition['condition']) && $condition['condition'] === 'noteq' &&
				isset($condition['value']) && $condition['value'] === '-1 year fy' &&
				isset($condition['date_relative_value']) && $condition['date_relative_value'] === true) {
				
				// Get fiscal year start month from chart params
				$fy_start_month = 4; // Default April start
				if (isset($chart_params['fields'][0]['term_month_start'])) {
					$fy_start_month = $chart_params['fields'][0]['term_month_start'];
				}

				// Calculate the fiscal year range to exclude
				// Current year is 2025, so -1 year fy would be 2024-04 to 2025-03 (if fy_start_month = 4)
				$current_year = date('Y');
				$fy_year = $current_year - 1; // Previous fiscal year
				
				$fy_start = new \DateTime(sprintf('%d-%02d-01', $fy_year, $fy_start_month));
				$fy_end = clone $fy_start;
				$fy_end->modify('+11 months'); // End of fiscal year (11 months later)
				
				return [
					'start' => $fy_start,
					'end' => $fy_end
				];
			}
		}

		return null;
	}
}