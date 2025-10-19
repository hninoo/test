<?php
require_once "../config.php";

$config = [
	'api_url'=>API_BASE_PATH,
	'production'=>!DEBUG_MODE,
];

echo json_encode($config);
