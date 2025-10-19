const UglifyPhp = require('uglify-php');

let options = {
    "excludes": [
        '$GLOBALS',
        '$_SERVER',
        '$_GET',
        '$_POST',
        '$_FILES',
        '$_REQUEST',
        '$_SESSION',
        '$_ENV',
        '$_COOKIE',
        '$php_errormsg',
        '$HTTP_RAW_POST_DATA',
        '$http_response_header',
        '$argc',
        '$argv',
        '$app',
        '$cms_menu_setting',
        '$this'
    ],
    "minify": {
        "replace_variables": true,
        "remove_whitespace": true,
        "remove_comments": true,
        "minify_html": false
    },
    "output": "/tmp/test.php" // If it's empty the promise will return the minified source code
}

// You can use a path or the source code
UglifyPhp.minify("/Users/yasaipopo/Dropbox/sync/PhpStormProjects/PopoframeworkSlim/Application/Class/Dao.php", options).then(function (source) {
    console.log('pe')
    console.log(source);
});