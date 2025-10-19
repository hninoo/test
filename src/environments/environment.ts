function loadJSON(filePath) {
    let base_path = '/';
    if (location.pathname.match(/^\/cms/)) {
        base_path = '/cms/';
    }
    let json = loadTextFileAjaxSync(base_path + filePath, 'application/json');
    if (json == null && base_path == '/cms/') {
        base_path = '/';
        json = loadTextFileAjaxSync(base_path + filePath, 'application/json');

    }
    try {
        return JSON.parse(json);
    } catch (e) {
        alert('config.json parse error');
    }
    return null;
}

function loadTextFileAjaxSync(filePath, mimeType) {
    const xmlhttp = new XMLHttpRequest();
    xmlhttp.open('GET', filePath, false);
    if (mimeType != null) {
        if (xmlhttp.overrideMimeType) {
            xmlhttp.overrideMimeType(mimeType);
        }
    }
    xmlhttp.send();
    if (xmlhttp.status == 200) {
        return xmlhttp.responseText;
    } else {
        return null;
    }
}

export const environment = loadJSON('pw_config.php');
