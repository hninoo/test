<?php

namespace Tests\IntegrationTest;

require_once __DIR__ . '/../Support/TestTableManager.php';

use CustomClass\Dataset;
use CustomClass\Entity\Admin\Admin;
use CustomClass\Entity\Table;
use CustomClass\Form;
use CustomClass\MenuGroup;
use CustomClass\ResultCache;
use CustomClass\Repository\ORMEX;
use PHPUnit\Framework\TestCase;
use Tests\Support\TestTableManager;
use Service\CrossTableService;
use CustomClass\UseCase\Record\RecordListAction;

class CrossTableServiceTest extends TestCase
{
    private $dbPath;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setupTestEnvironment();
        $this->createTestTables();
        $this->addCreatedColumnToTestTable();
        TestTableManager::createWorkflowTables();
        TestTableManager::createSystemTables();
        TestTableManager::createNotificationTables();
        $this->setupTestData();
    }

    protected function tearDown(): void
    {
        ORMEX::reset_config();
        ResultCache::clearCache();
        // Drop view table if it exists
        // DbDaoをリセット
        try {
            \ORM::raw_execute("DROP TABLE IF EXISTS dataset__13");
            \ORM::raw_execute("DROP TABLE IF EXISTS dataset_field");
        } catch (\Exception $e) {
            // Ignore errors if view doesn't exist
        }
        parent::tearDown();
    }

    private function setupTestEnvironment(): void
    {
		// テストクラス名とメソッド名を使用してユニークなデータベースファイルを作成
		$testClass = static::class;
		$testMethod = $this->getName();
		$uniqueId = uniqid() . '_' . microtime(true);
		$this->dbPath = '/tmp/test_' . md5($testClass . $testMethod) . '_' . $uniqueId . '.db';

		// 既存の接続をクリア
		ORMEX::reset_config();
		\ORM::reset_config();

		// ORMEXの設定
		ORMEX::configure('sqlite:' . $this->dbPath);
		ORMEX::configure('logging', false);

		// 通常のORM設定も同じデータベースを使用
		\ORM::configure('sqlite:' . $this->dbPath);
		\ORM::configure('logging', false);

		// reader接続も同じデータベースを使用
		\ORM::configure('sqlite:' . $this->dbPath, null, 'reader');
		\ORM::configure('logging', false, 'reader');

		// SQLiteの初期設定
		$db = ORMEX::get_db();
		$db->exec('PRAGMA foreign_keys = ON');
		$db->exec('PRAGMA synchronous = OFF');
		$db->exec('PRAGMA journal_mode = MEMORY');
        ORMEX::configure('identifier_quote_character', '`');
        \ORM::configure('identifier_quote_character', '`');
		if (method_exists(ORMEX::class, 'configure_reserved_words')) {
            ORMEX::configure_reserved_words(['order', 'group', 'limit', 'offset', 'having', 'where', 'select', 'from']);
        }

		// SQLiteの互換性向上のため、limit_clause_styleを設定
		ORMEX::configure('limit_clause_style', 'limit');
		\ORM::configure('limit_clause_style', 'limit');
		\ORM::configure('limit_clause_style', 'limit', 'reader');
    }

    private function createTestTables(): void
    {
        $db = ORMEX::get_db();
        // dataset__13 table for crosstable
        $db->exec('DROP TABLE IF EXISTS `dataset__13`');
        $db->exec('CREATE TABLE `dataset__13` (
            `id` INTEGER PRIMARY KEY AUTOINCREMENT,
            `field__1` INTEGER,
            `field__2` INTEGER,
            `field__3` INTEGER
        )');
        // dataset_field table
        $db->exec('DROP TABLE IF EXISTS `dataset_field`');
        $db->exec('CREATE TABLE `dataset_field` (
            `id` INTEGER PRIMARY KEY AUTOINCREMENT,
            `dataset_id` INTEGER,
            `type` TEXT,
            `name` TEXT,
            `option` TEXT,
            `order` INTEGER,
            `edit_component_y_order` INTEGER,
            `created` TEXT
        )');
        // dataset table
        $db->exec('DROP TABLE IF EXISTS `dataset`');
        $db->exec('CREATE TABLE `dataset` (
            `id` INTEGER PRIMARY KEY AUTOINCREMENT,
            `system_table` TEXT,
            `order` INTEGER,
            `name` TEXT,
            `table` TEXT,
            `label` TEXT,
            `grant_type` TEXT,
            `created` TEXT,
            `updated` TEXT
        )');
    }


    private function setupTestData(): void
    {
        $db = ORMEX::get_db();
        for ($i = 1; $i <= 10; $i++) {
            $db->exec("INSERT INTO `dataset__13` (`field__1`, `field__2`, `field__3`) VALUES ($i, " . ($i*10) . ", " . ($i*100) . ")");
        }
        $dataset = ORMEX::for_table('dataset')->create();
        $dataset->set([
            'id' => 13,
            'name' => 'Test Dataset',
            'table' => 'dataset__13',
            'label' => '条件付き承認テスト',
            'grant_type' => 'everyone',
            'created' => date('Y-m-d H:i:s'),
            'updated' => date('Y-m-d H:i:s')
        ]);
        $dataset->save();

        $dataset_field = ORMEX::for_table('dataset_field')->create();
        $dataset_field->set([
            'id' => 1,
            'dataset_id' => 13,
            'type' => 'number',
            'name' => '金額',
            'option' => json_encode(['label' => '金額']),
            'order' => 1,
            'created' => date('Y-m-d H:i:s')
        ]);
        $dataset_field->save();

        $dataset_field = ORMEX::for_table('dataset_field')->create();
        $dataset_field->set([
            'id' => 2,
            'dataset_id' => 13,
            'type' => 'text',
            'name' => '金額',
            'option' => json_encode(['label' => '金額']),
            'order' => 2,
            'created' => date('Y-m-d H:i:s')
        ]);
        $dataset_field->save();

        $dataset_field = ORMEX::for_table('dataset_field')->create();
        $dataset_field->set([
            'id' => 3,
            'dataset_id' => 13,
            'type' => 'text',
            'name' => '金額',
            'option' => json_encode(['label' => '金額']),
            'order' => 3,
            'created' => date('Y-m-d H:i:s')
        ]);
        $dataset_field->save();
    }

    public function testGetCrossTableData()
    {
        $admin = $this->getAdminEntity();

        \CustomClass\AdminCommon::setAdminById('admin', 1);

        // Create MenuGroup and get the menu for dataset__13
        $menuGroup = new MenuGroup();

        $menu = $menuGroup->getMenuByTable('dataset__13');

        $recordListAction = new RecordListAction($admin, $menu->getTable());

        $searchParams = [
            'condition_json' => "{\"condition_hash_a\":[{\"subfield_a\":[],\"and_or\":\"and\",\"value\":\"0 month\",\"field\":\"created\",\"condition\":\"eq\",\"type\":\"field\",\"inc_table\":null,\"inc_field\":null,\"inc_filter_id\":null,\"list_date_time_search_with_no_time\":false,\"use_dynamic_condition_value\":null,\"date_relative_value\":true,\"priority_date_relative_value\":false},{\"subfield_a\":[],\"and_or\":\"or\",\"value\":\"-1 month\",\"field\":\"created\",\"condition\":\"eq\",\"type\":\"field\",\"inc_table\":null,\"inc_field\":null,\"inc_filter_id\":null,\"list_date_time_search_with_no_time\":false,\"use_dynamic_condition_value\":null,\"date_relative_value\":true,\"priority_date_relative_value\":false}],\"children\":[]}",
            'show_fields' => [],
            'sort_params' => [ ['asc_desc' => 'desc', 'field' => 'id'] ],
            'variables' => [],
        ];

        // Prepare a realistic empty resultset (records are fetched inside service)
        $chart_params = [
            'type' => 'table',
            'fields' => [
                [
                    'is_date' => true,
                    'term_field' => false,
                    'field' => 'created',
                    'term' => 'month',
                    'term_month_start' => 1,
                ],
                [
                    'is_date' => false,
                    'term_field' => false,
                    'field' => 'id',
                    'term' => 'month',
                    'term_month_start' => 1,
                    'label' => 'ID',
                ],
                [
                    'is_date' => false,
                    'term_field' => false,
                    'field' => 'field__1',
                    'term' => 'month',
                    'term_month_start' => 1,
                    'label' => '自動採番',
                ],
                [
                    'is_date' => false,
                    'term_field' => false,
                    'field' => 'field__2',
                    'term' => 'month',
                    'term_month_start' => 1,
                    'label' => '文字列(一行)',
                ],
                [
                    'is_date' => false,
                    'term_field' => false,
                    'field' => 'field__3',
                    'term' => 'month',
                    'term_month_start' => 1,
                    'label' => '数値',
                ],
            ],
            'summary_a' => [
                [
                    'label' => null,
                    'summary_type' => 'count',
                    'is_edit_mode' => false,
                    'summary_field_type' => 'table_field',
                    'calc_value' => null,
                    'graph_type' => 'line',
                    'condition_json' => '[]',
                ],
            ],
            'cross_table' => true,
            'size' => 'medium',
            'color' => 'office.Habitat6',
            'max_field_num' => 2,
            'options' => [
                'fill' => false,
                'sum' => false,
                'sum_previous' => false,
                'compare_previous' => false,
                'enable_totaling_start_month' => false,
                'y_min_start' => 0,
                'hide_zero_data' => false,
                'do_not_show_legend_if_over_6_more' => false,
                'stacked' => false,
                'stacked_100per' => false,
                'percent_label' => false,
                'nps_flg' => false,
                'nps_color' => 'Lignt Pink',
            ],
            'title' => '新しいフィルタ_20250801',
            'table' => 'dataset__13'
        ];
        // sortParamsObj: for RecordListAction (object)
        $sortParamsObj = new \CustomClass\Entity\SortParams();
        $sortParamsObj->addParam('field__1', 'desc');

        $resultset_a = $recordListAction->action(
            $searchParams,
            3,
            1,
            $sortParamsObj,
        );

        // sort_params_arr: for CrossTableService (array)
        $sort_params_arr = [
            [
                'asc_desc' => 'desc',
                'field' => 'field__1',
                'cross_tab' => false
            ]
        ];

        // Arrange: create service and call getCrossTableData with correct arguments
        $service = new CrossTableService('dataset__13');

        // Test: sort_params includes a field
        $result = $service->getCrossTableData($resultset_a, $chart_params, 1, $sort_params_arr);
        $this->assertIsArray($result);
        $this->assertArrayHasKey('cross_data_a', $result);
        $this->assertArrayHasKey('cross_horizontal_header_a', $result);
        $this->assertArrayHasKey('cross_vertical_summarize_a', $result);
        $this->assertArrayHasKey('summarize_by_record', $result);
        $this->assertIsArray($result['cross_data_a']);

        // Test: sort_params does NOT include a field
        $sort_params_invalid_arr = [
            [
                'asc_desc' => 'desc',
                'cross_tab' => true
            ]
        ];
        $result_invalid = $service->getCrossTableData($resultset_a, $chart_params, 1, $sort_params_invalid_arr);
        $this->assertIsArray($result_invalid);
        $this->assertArrayHasKey('cross_data_a', $result_invalid);
        $this->assertArrayHasKey('cross_horizontal_header_a', $result_invalid);
        $this->assertArrayHasKey('cross_vertical_summarize_a', $result_invalid);
        $this->assertArrayHasKey('summarize_by_record', $result_invalid);
        $this->assertIsArray($result_invalid['cross_data_a']);
    }

    /**
     * Test: No fill option with 12-month fiscal year gap detection (CORRECTED)
     * Tests the fiscal year noteq range detection with proper search conditions
     * Expected: Data should be split at the fiscal year gap boundary when noteq condition is set
     */
    public function testGetCrossTableDataWithNoFillAndFiscalYearGap()
    {
        $admin = $this->getAdminEntity();
        \CustomClass\AdminCommon::setAdminById('admin', 1);

        $db = ORMEX::get_db();
        $db->exec("DELETE FROM `dataset__13`");
        // Create data with a 12-month gap simulating fiscal year exclusion
        // Period 1: Jan-Mar 2024
        $db->exec("INSERT INTO `dataset__13` (`id`, `field__1`, `field__2`, `field__3`, `created`) VALUES (1, 1, 10, 100, '2024-01-15 10:00:00')");
        $db->exec("INSERT INTO `dataset__13` (`id`, `field__1`, `field__2`, `field__3`, `created`) VALUES (2, 2, 20, 200, '2024-02-10 10:00:00')");
        $db->exec("INSERT INTO `dataset__13` (`id`, `field__1`, `field__2`, `field__3`, `created`) VALUES (3, 3, 30, 300, '2024-03-20 10:00:00')");
        // 12-month gap (Apr 2024 - Mar 2025) - simulates fiscal year exclusion
        // Period 2: Apr 2025 - Jun 2025
        $db->exec("INSERT INTO `dataset__13` (`id`, `field__1`, `field__2`, `field__3`, `created`) VALUES (4, 4, 40, 400, '2025-04-15 10:00:00')");
        $db->exec("INSERT INTO `dataset__13` (`id`, `field__1`, `field__2`, `field__3`, `created`) VALUES (5, 5, 50, 500, '2025-05-10 10:00:00')");
        $db->exec("INSERT INTO `dataset__13` (`id`, `field__1`, `field__2`, `field__3`, `created`) VALUES (6, 6, 60, 600, '2025-06-20 10:00:00')");

        $chart_params = [
            'type' => 'table',
            'fields' => [
                [
                    'is_date' => true,
                    'field' => 'created',
                    'term' => 'month',
                    'term_month_start' => 4, // Fiscal year starts in April
                ],
            ],
            'summary_a' => [
                [
                    'summary_type' => 'count',
                    'summary_field' => 'field__1',
                ],
            ],
            'cross_table' => true,
            'options' => [
                'fill' => false,
            ],
            'table' => 'dataset__13'
        ];

        $menuGroup = new MenuGroup();
        $menu = $menuGroup->getMenuByTable('dataset__13');
        $recordListAction = new RecordListAction($admin, $menu->getTable());

        $resultset_a = $recordListAction->action([], 10, 0, null, \CustomClass\DbDao::NO_PARENT, $chart_params);

        $service = new CrossTableService('dataset__13');
        
        // Set search conditions to trigger fiscal year noteq detection
        $search_conditions = [
            'condition_hash_a' => [
                [
                    'condition' => 'noteq',
                    'value' => '-1 year fy',
                    'field' => 'created',
                    'date_relative_value' => true
                ]
            ],
            'children' => []
        ];
        $service->setSearchConditions($search_conditions);
        
        $result = $service->getCrossTableData($resultset_a, $chart_params, 1, []);

        // Assertions: should detect fiscal year noteq and exclude 2024-04 to 2025-03
        $this->assertIsArray($result);
        $this->assertArrayHasKey('cross_horizontal_header_a', $result);
        $headers = $result['cross_horizontal_header_a'];

        // Should have 6 months total (3 from each segment)
        $this->assertCount(6, $headers, "Should generate 6 monthly headers split into two segments");

        // First segment: Jan-Mar 2024
        $this->assertEquals('2024年1月', $headers[0], "First header should be Jan 2024");
        $this->assertEquals('2024年3月', $headers[2], "Third header should be Mar 2024");

        // Second segment: Apr-Jun 2025 (after the fiscal year exclusion)
        $this->assertEquals('2025年4月', $headers[3], "Fourth header should be Apr 2025");
        $this->assertEquals('2025年6月', end($headers), "Last header should be Jun 2025");
    }

    /**
     * Test: No fill option with large gap > 60 months triggers segment splitting
     * Tests the GAP_THRESHOLD_MONTHS logic without fiscal year conditions
     * Expected: Two distinct time segments without filling the large gap in between
     */
    public function testGetCrossTableDataWithNoFillAndLargeGap()
    {
        $admin = $this->getAdminEntity();
        \CustomClass\AdminCommon::setAdminById('admin', 1);

        $db = ORMEX::get_db();
        $db->exec("DELETE FROM `dataset__13`");
        // Create data with a 72-month gap (6 years)
        // Period 1: Jan-Feb 2020
        $db->exec("INSERT INTO `dataset__13` (`id`, `field__1`, `field__2`, `field__3`, `created`) VALUES (1, 1, 10, 100, '2020-01-15 10:00:00')");
        $db->exec("INSERT INTO `dataset__13` (`id`, `field__1`, `field__2`, `field__3`, `created`) VALUES (2, 2, 20, 200, '2020-02-10 10:00:00')");
        // 72-month gap (> 60 month threshold)
        // Period 2: Feb-Mar 2026
        $db->exec("INSERT INTO `dataset__13` (`id`, `field__1`, `field__2`, `field__3`, `created`) VALUES (3, 3, 30, 300, '2026-02-15 10:00:00')");
        $db->exec("INSERT INTO `dataset__13` (`id`, `field__1`, `field__2`, `field__3`, `created`) VALUES (4, 4, 40, 400, '2026-03-10 10:00:00')");

        $chart_params = [
            'type' => 'table',
            'fields' => [
                [
                    'is_date' => true,
                    'field' => 'created',
                    'term' => 'month',
                ],
            ],
            'summary_a' => [
                [
                    'summary_type' => 'count',
                    'summary_field' => 'field__1',
                ],
            ],
            'cross_table' => true,
            'options' => [
                'fill' => false,
            ],
            'table' => 'dataset__13'
        ];

        $menuGroup = new MenuGroup();
        $menu = $menuGroup->getMenuByTable('dataset__13');
        $recordListAction = new RecordListAction($admin, $menu->getTable());

        $resultset_a = $recordListAction->action([], 10, 0, null, \CustomClass\DbDao::NO_PARENT, $chart_params);

        $service = new CrossTableService('dataset__13');
        $result = $service->getCrossTableData($resultset_a, $chart_params, 1, []);

        // Assertions: should split into 2 segments at the large gap
        $this->assertIsArray($result);
        $this->assertArrayHasKey('cross_horizontal_header_a', $result);
        $headers = $result['cross_horizontal_header_a'];

        // Should have 4 months total (2 from each segment)
        $this->assertCount(4, $headers, "Should generate 4 monthly headers split into two segments");

        // First segment: Jan-Feb 2020
        $this->assertEquals('2020年1月', $headers[0], "First header should be Jan 2020");
        $this->assertEquals('2020年2月', $headers[1], "Second header should be Feb 2020");

        // Second segment: Feb-Mar 2026
        $this->assertEquals('2026年2月', $headers[2], "Third header should be Feb 2026");
        $this->assertEquals('2026年3月', $headers[3], "Fourth header should be Mar 2026");
    }

    /**
     * Test: Fiscal year noteq condition with JSON string format
     * Tests the JSON string parsing in setSearchConditions method
     * Expected: Should properly parse JSON string and apply fiscal year exclusion
     */
    public function testGetCrossTableDataWithFiscalYearNoteqJsonString()
    {
        $admin = $this->getAdminEntity();
        \CustomClass\AdminCommon::setAdminById('admin', 1);

        $db = ORMEX::get_db();
        $db->exec("DELETE FROM `dataset__13`");
        // Create data spanning fiscal year boundary
        $db->exec("INSERT INTO `dataset__13` (`id`, `field__1`, `field__2`, `field__3`, `created`) VALUES (1, 1, 10, 100, '2023-05-15 10:00:00')");
        $db->exec("INSERT INTO `dataset__13` (`id`, `field__1`, `field__2`, `field__3`, `created`) VALUES (2, 2, 20, 200, '2024-05-10 10:00:00')");
        $db->exec("INSERT INTO `dataset__13` (`id`, `field__1`, `field__2`, `field__3`, `created`) VALUES (3, 3, 30, 300, '2025-05-20 10:00:00')");

        $chart_params = [
            'type' => 'table',
            'fields' => [
                [
                    'is_date' => true,
                    'field' => 'created',
                    'term' => 'month',
                    'term_month_start' => 4, // Fiscal year starts in April
                ],
            ],
            'summary_a' => [
                [
                    'summary_type' => 'count',
                    'summary_field' => 'field__1',
                ],
            ],
            'cross_table' => true,
            'options' => [
                'fill' => false,
            ],
            'table' => 'dataset__13'
        ];

        $menuGroup = new MenuGroup();
        $menu = $menuGroup->getMenuByTable('dataset__13');
        $recordListAction = new RecordListAction($admin, $menu->getTable());

        $resultset_a = $recordListAction->action([], 10, 0, null, \CustomClass\DbDao::NO_PARENT, $chart_params);

        $service = new CrossTableService('dataset__13');
        
        // Set search conditions as JSON string (like real usage)
        $search_json = json_encode([
            'condition_hash_a' => [
                [
                    'condition' => 'noteq',
                    'value' => '-1 year fy',
                    'field' => 'created',
                    'date_relative_value' => true
                ]
            ],
            'children' => []
        ]);
        $service->setSearchConditions($search_json);
        
        $result = $service->getCrossTableData($resultset_a, $chart_params, 1, []);

        // Assertions: should exclude 2024-04 to 2025-03 (fiscal year)
        $this->assertIsArray($result);
        $this->assertArrayHasKey('cross_horizontal_header_a', $result);
        $headers = $result['cross_horizontal_header_a'];

        // Should exclude 2024年5月 (within fiscal year range)
        $this->assertNotContains('2024年5月', $headers, "Should exclude 2024年5月 (within fiscal year noteq range)");
        
        // Should include dates outside the fiscal year range
        $this->assertContains('2023年5月', $headers, "Should include 2023年5月 (before fiscal year range)");
        $this->assertContains('2025年5月', $headers, "Should include 2025年5月 (after fiscal year range)");
    }

    /**
     * Test: Fiscal year noteq condition with invalid JSON
     * Tests error handling when JSON parsing fails
     * Expected: Should handle JSON parsing errors gracefully and not crash
     */
    public function testGetCrossTableDataWithInvalidSearchJson()
    {
        $admin = $this->getAdminEntity();
        \CustomClass\AdminCommon::setAdminById('admin', 1);

        $db = ORMEX::get_db();
        $db->exec("DELETE FROM `dataset__13`");
        $db->exec("INSERT INTO `dataset__13` (`id`, `field__1`, `field__2`, `field__3`, `created`) VALUES (1, 1, 10, 100, '2024-05-15 10:00:00')");

        $chart_params = [
            'type' => 'table',
            'fields' => [
                [
                    'is_date' => true,
                    'field' => 'created',
                    'term' => 'month',
                ],
            ],
            'summary_a' => [
                [
                    'summary_type' => 'count',
                    'summary_field' => 'field__1',
                ],
            ],
            'cross_table' => true,
            'table' => 'dataset__13'
        ];

        $menuGroup = new MenuGroup();
        $menu = $menuGroup->getMenuByTable('dataset__13');
        $recordListAction = new RecordListAction($admin, $menu->getTable());

        $resultset_a = $recordListAction->action([], 10, 0, null, \CustomClass\DbDao::NO_PARENT, $chart_params);

        $service = new CrossTableService('dataset__13');
        
        // Set invalid JSON string
        $service->setSearchConditions('{"invalid": json}');
        
        $result = $service->getCrossTableData($resultset_a, $chart_params, 1, []);

        // Assertions: should not crash and return valid result
        $this->assertIsArray($result);
        $this->assertArrayHasKey('cross_horizontal_header_a', $result);
        $this->assertArrayHasKey('cross_data_a', $result);
        $this->assertArrayHasKey('count', $result);
    }

    /**
     * Test: Multiple fiscal year conditions
     * Tests behavior when multiple noteq conditions exist
     * Expected: Should detect the first matching fiscal year noteq condition
     */
    public function testGetCrossTableDataWithMultipleFiscalYearConditions()
    {
        $admin = $this->getAdminEntity();
        \CustomClass\AdminCommon::setAdminById('admin', 1);

        $db = ORMEX::get_db();
        $db->exec("DELETE FROM `dataset__13`");
        $db->exec("INSERT INTO `dataset__13` (`id`, `field__1`, `field__2`, `field__3`, `created`) VALUES (1, 1, 10, 100, '2023-05-15 10:00:00')");
        $db->exec("INSERT INTO `dataset__13` (`id`, `field__1`, `field__2`, `field__3`, `created`) VALUES (2, 2, 20, 200, '2025-05-20 10:00:00')");

        $chart_params = [
            'type' => 'table',
            'fields' => [
                [
                    'is_date' => true,
                    'field' => 'created',
                    'term' => 'month',
                    'term_month_start' => 4,
                ],
            ],
            'summary_a' => [
                [
                    'summary_type' => 'count',
                    'summary_field' => 'field__1',
                ],
            ],
            'cross_table' => true,
            'options' => [
                'fill' => false,
            ],
            'table' => 'dataset__13'
        ];

        $menuGroup = new MenuGroup();
        $menu = $menuGroup->getMenuByTable('dataset__13');
        $recordListAction = new RecordListAction($admin, $menu->getTable());

        $resultset_a = $recordListAction->action([], 10, 0, null, \CustomClass\DbDao::NO_PARENT, $chart_params);

        $service = new CrossTableService('dataset__13');
        
        // Set multiple conditions including fiscal year noteq
        $search_conditions = [
            'condition_hash_a' => [
                [
                    'condition' => 'eq',
                    'value' => '2024',
                    'field' => 'created',
                    'date_relative_value' => false
                ],
                [
                    'condition' => 'noteq',
                    'value' => '-1 year fy',
                    'field' => 'created',
                    'date_relative_value' => true
                ],
                [
                    'condition' => 'noteq',
                    'value' => '-2 year fy',
                    'field' => 'created',
                    'date_relative_value' => true
                ]
            ],
            'children' => []
        ];
        $service->setSearchConditions($search_conditions);
        
        $result = $service->getCrossTableData($resultset_a, $chart_params, 1, []);

        // Assertions: should process the first fiscal year noteq condition
        $this->assertIsArray($result);
        $this->assertArrayHasKey('cross_horizontal_header_a', $result);
        $headers = $result['cross_horizontal_header_a'];
        
        // Should have 2 headers (before and after fiscal year exclusion)
        $this->assertCount(2, $headers, "Should generate headers excluding fiscal year range");
    }

    /**
     * Helper to add 'created' column to test table for date-based tests.
     */
    private function addCreatedColumnToTestTable()
    {
        $db = ORMEX::get_db();
        
        $db->exec('ALTER TABLE `dataset__13` ADD COLUMN `created` TEXT');
       
    }

    private function createAdminSettingTable(): void
    {
        $db = ORMEX::get_db();
        $db->exec('DROP TABLE IF EXISTS `admin_setting`');
        $db->exec('CREATE TABLE `admin_setting` (
            `id` INTEGER PRIMARY KEY AUTOINCREMENT,
            `month_start` INTEGER
        )');
    }

    /**
     * Get an Admin entity for testing
     */
    private function getAdminEntity(): Admin
    {
        // Create admin directly with constructor parameters (id, email, password)
        $admin = new Admin(1, 'admin@test.com', 'password');
        $admin->name = 'Test Admin';
        return $admin;
    }
}