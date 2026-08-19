from pathlib import Path
import re

html = Path('app/src/main/assets/index.html').read_text(encoding='utf-8')
css = Path('app/src/main/assets/style.css').read_text(encoding='utf-8')
js = Path('app/src/main/assets/app.js').read_text(encoding='utf-8')
remote = Path('app/src/main/assets/remote.html').read_text(encoding='utf-8')
java = Path('app/src/main/java/com/desarrollamo/generalamo/MainActivity.java').read_text(encoding='utf-8')
chrome = Path('app/src/main/java/com/desarrollamo/generalamo/MainActivityV2.java').read_text(encoding='utf-8')
manifest = Path('app/src/main/AndroidManifest.xml').read_text(encoding='utf-8')
version = Path('version.properties').read_text(encoding='utf-8')
icon = Path('app/src/main/res/drawable/ic_generalamo.xml').read_text(encoding='utf-8')

required_html = [
    'GeneralAMO', 'Anotar partida', 'Jugar con dados', 'Tirar dados', 'Deshacer',
    'Nueva partida', 'Ver partida', 'Jugar en varios dispositivos', 'Enlace para jugar / anotar',
    'Escalera servida', 'Full servido', 'Póker servido', 'Tachar',
]
missing = [item for item in required_html if item not in html]
assert not missing, f'Missing UI markers: {missing}'

required_js = [
    'generalamo.state.v2', 'function normalize', 'function recordScore', 'function scoreRecency',
    'mark-last', 'mark-prev', 'mark-old', 'function openHistory', 'function renderActivity',
    'Generala servida', '❌ Tachar', "state.throws===1", "['straight','full','poker']",
    'window.applyRemoteAction', "type==='digital-score'", 'function finishIfNeeded',
]
missing_js = [item for item in required_js if item not in js]
assert not missing_js, f'Missing game markers: {missing_js}'
assert 'eval(' not in js

required_remote = [
    'MISMA WI‑FI / HOTSPOT', 'Podés jugar y anotar desde este dispositivo',
    '/api/action?token=', "type:'roll'", "type:'hold'", "type:'digital-score'",
    "type:'score'", 'setInterval(load,650)', '❌ Tachar',
]
missing_remote = [item for item in required_remote if item not in remote]
assert not missing_remote, f'Missing remote-play markers: {missing_remote}'
assert '__EDITOR__' in remote and '__CODE__' in remote and '__TOKEN__' in remote
assert 'eval(' not in remote

required_java = [
    'addJavascriptInterface', 'ServerSocket', 'startSharing', 'updateSharedState',
    '/api/state', '/api/action', '/api/score', 'validAction', 'applyRemoteAction',
    'remote.html', 'editor ? editToken : ""', 'X-Content-Type-Options',
]
missing_java = [item for item in required_java if item not in java]
assert not missing_java, f'Missing native sharing markers: {missing_java}'

required_chrome = ['WebChromeClient', 'onJsConfirm', 'result.confirm()', 'result.cancel()', 'AlertDialog']
missing_chrome = [item for item in required_chrome if item not in chrome]
assert not missing_chrome, f'Missing Android dialog regression markers: {missing_chrome}'

assert 'android.permission.INTERNET' in manifest
assert '@drawable/ic_generalamo' in manifest
assert '.MainActivityV2' in manifest
assert '<vector' in icon and '#FFFFFF' in icon
assert '.activityItem' in css and '.resultCard' in css and '.overlay' in css

m_name = re.search(r'^VERSION_NAME=(.+)$', version, re.M)
m_code = re.search(r'^VERSION_CODE=(\d+)$', version, re.M)
assert m_name and m_code, 'Version properties missing'
assert m_name.group(1) == '0.1.12'
assert int(m_code.group(1)) == 1012

print('GENERALAMO_MVP_OK', m_name.group(1), m_code.group(1))
