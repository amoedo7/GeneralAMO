package com.desarrollamo.generalamo;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Enumeration;
import java.util.Locale;

public class MainActivity extends Activity {
    private WebView webView;
    private LocalGameServer localServer;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccess(true);
        settings.setDatabaseEnabled(true);

        webView.addJavascriptInterface(new NativeBridge(), "GeneralAMONative");
        webView.setWebViewClient(new WebViewClient());
        webView.loadUrl("file:///android_asset/index.html");
        setContentView(webView);
    }

    @Override
    protected void onDestroy() {
        if (localServer != null) localServer.stop();
        if (webView != null) webView.destroy();
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    private final class NativeBridge {
        @JavascriptInterface
        public String startSharing(String stateJson) {
            try {
                if (localServer == null) localServer = new LocalGameServer();
                localServer.setState(stateJson);
                localServer.start();
                return localServer.info().toString();
            } catch (Exception e) {
                try {
                    return new JSONObject().put("ok", false).put("error", e.getMessage() == null ? "No se pudo iniciar el acceso local" : e.getMessage()).toString();
                } catch (Exception ignored) {
                    return "{\"ok\":false}";
                }
            }
        }

        @JavascriptInterface
        public void updateSharedState(String stateJson) {
            if (localServer != null) localServer.setState(stateJson);
        }

        @JavascriptInterface
        public void stopSharing() {
            if (localServer != null) {
                localServer.stop();
                localServer = null;
            }
        }

        @JavascriptInterface
        public void copyText(String text) {
            runOnUiThread(() -> {
                ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                clipboard.setPrimaryClip(ClipData.newPlainText("GeneralAMO", text));
            });
        }

        @JavascriptInterface
        public void shareText(String text) {
            runOnUiThread(() -> {
                Intent intent = new Intent(Intent.ACTION_SEND);
                intent.setType("text/plain");
                intent.putExtra(Intent.EXTRA_TEXT, text);
                startActivity(Intent.createChooser(intent, "Compartir GeneralAMO"));
            });
        }
    }

    private final class LocalGameServer {
        private final SecureRandom random = new SecureRandom();
        private volatile JSONObject state = new JSONObject();
        private volatile boolean running;
        private ServerSocket serverSocket;
        private Thread acceptThread;
        private int port;
        private final String code = token(3) + "-" + (10 + random.nextInt(90));
        private final String editToken = token(8);

        synchronized void start() throws Exception {
            if (running) return;
            Exception last = null;
            for (int candidate = 8080; candidate <= 8090; candidate++) {
                try {
                    serverSocket = new ServerSocket(candidate);
                    port = candidate;
                    break;
                } catch (Exception e) {
                    last = e;
                }
            }
            if (serverSocket == null) throw last == null ? new IllegalStateException("No hay un puerto local disponible") : last;
            running = true;
            acceptThread = new Thread(() -> {
                while (running) {
                    try {
                        Socket socket = serverSocket.accept();
                        new Thread(() -> handle(socket), "GeneralAMO-client").start();
                    } catch (Exception e) {
                        if (running) e.printStackTrace();
                    }
                }
            }, "GeneralAMO-share");
            acceptThread.setDaemon(true);
            acceptThread.start();
        }

        synchronized void stop() {
            running = false;
            try { if (serverSocket != null) serverSocket.close(); } catch (Exception ignored) {}
            serverSocket = null;
        }

        synchronized void setState(String json) {
            try { state = new JSONObject(json); } catch (Exception ignored) {}
        }

        JSONObject info() throws Exception {
            String ip = localIp();
            String base = "http://" + ip + ":" + port + "/" + code;
            return new JSONObject()
                    .put("ok", true)
                    .put("viewerUrl", base)
                    .put("editorUrl", base + "/edit/" + editToken)
                    .put("code", code)
                    .put("port", port);
        }

        private void handle(Socket socket) {
            try (Socket s = socket;
                 BufferedReader in = new BufferedReader(new InputStreamReader(s.getInputStream(), StandardCharsets.UTF_8));
                 BufferedWriter out = new BufferedWriter(new OutputStreamWriter(s.getOutputStream(), StandardCharsets.UTF_8))) {

                String request = in.readLine();
                if (request == null || request.isEmpty()) return;
                String[] first = request.split(" ");
                if (first.length < 2) return;
                String method = first[0].toUpperCase(Locale.ROOT);
                String target = first[1];
                int contentLength = 0;
                String line;
                while ((line = in.readLine()) != null && !line.isEmpty()) {
                    int colon = line.indexOf(':');
                    if (colon > 0 && line.substring(0, colon).trim().equalsIgnoreCase("Content-Length")) {
                        contentLength = Integer.parseInt(line.substring(colon + 1).trim());
                    }
                }
                char[] bodyChars = new char[Math.max(0, contentLength)];
                int read = 0;
                while (read < contentLength) {
                    int n = in.read(bodyChars, read, contentLength - read);
                    if (n < 0) break;
                    read += n;
                }
                String body = new String(bodyChars, 0, read);

                String path = target;
                String query = "";
                int q = target.indexOf('?');
                if (q >= 0) {
                    path = target.substring(0, q);
                    query = target.substring(q + 1);
                }

                if (method.equals("GET") && path.equals("/" + code)) {
                    send(out, 200, "text/html; charset=utf-8", remotePage(false));
                } else if (method.equals("GET") && path.equals("/" + code + "/edit/" + editToken)) {
                    send(out, 200, "text/html; charset=utf-8", remotePage(true));
                } else if (method.equals("GET") && path.equals("/api/state") && code.equals(param(query, "code"))) {
                    send(out, 200, "application/json; charset=utf-8", state.toString());
                } else if (method.equals("POST") && path.equals("/api/score") && editToken.equals(param(query, "token"))) {
                    JSONObject change = new JSONObject(body);
                    applyRemoteChange(change);
                    send(out, 200, "application/json; charset=utf-8", "{\"ok\":true}");
                } else {
                    send(out, 404, "text/plain; charset=utf-8", "GeneralAMO · enlace no válido");
                }
            } catch (Exception ignored) {}
        }

        private synchronized void applyRemoteChange(JSONObject change) {
            try {
                String pid = change.getString("pid");
                String cat = change.getString("cat");
                Object value = change.isNull("value") ? JSONObject.NULL : change.get("value");
                JSONObject scores = state.optJSONObject("scores");
                if (scores == null) { scores = new JSONObject(); state.put("scores", scores); }
                JSONObject player = scores.optJSONObject(pid);
                if (player == null) { player = new JSONObject(); scores.put(pid, player); }
                if (value == JSONObject.NULL || String.valueOf(value).isEmpty()) player.remove(cat);
                else player.put(cat, value);
                String js = "window.applyRemoteScore(" + JSONObject.quote(pid) + "," + JSONObject.quote(cat) + "," + (value == JSONObject.NULL ? "null" : JSONObject.quote(String.valueOf(value))) + ");";
                runOnUiThread(() -> webView.evaluateJavascript(js, null));
            } catch (Exception ignored) {}
        }

        private String remotePage(boolean editor) {
            String editFlag = editor ? "true" : "false";
            return "<!doctype html><html lang='es'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>" +
                    "<title>GeneralAMO</title><style>body{font-family:system-ui;margin:0;background:#07131f;color:#f7fbff}main{max-width:960px;margin:auto;padding:22px}.hero,.card{background:#10263a;border:1px solid #24435d;border-radius:22px;padding:18px;margin:12px 0}h1{margin:0}.muted{color:#9fb4c7}.score{overflow:auto}table{border-collapse:collapse;min-width:680px;width:100%}th,td{border:1px solid #24435d;padding:10px;text-align:center}th:first-child,td:first-child{position:sticky;left:0;background:#10263a;text-align:left}input{width:68px;background:#07131f;color:#fff;border:1px solid #355c77;border-radius:9px;padding:8px;text-align:center}.pill{display:inline-block;padding:7px 10px;border-radius:999px;background:#16344e;color:#67d2ff}</style></head>" +
                    "<body><main><section class='hero'><span class='pill'>MISMA WI-FI / HOTSPOT</span><h1>🎲 GeneralAMO</h1><p class='muted'>" + (editor ? "Edición compartida. Los cambios se reflejan en el teléfono que creó la mesa." : "Vista en vivo de la partida. Este enlace no permite modificar puntos.") + "</p></section><section class='card'><div id='summary'></div><div class='score'><table id='table'></table></div></section></main>" +
                    "<script>const EDIT=" + editFlag + ",CODE=" + JSONObject.quote(code) + ",TOKEN=" + JSONObject.quote(editToken) + ";const C=[['1','Unos'],['2','Doses'],['3','Treses'],['4','Cuatros'],['5','Cincos'],['6','Seises'],['straight','Escalera'],['full','Full'],['poker','Póker'],['generala','Generala'],['double','Doble generala']];let last='';async function load(){try{const r=await fetch('/api/state?code='+encodeURIComponent(CODE),{cache:'no-store'});const s=await r.json();const raw=JSON.stringify(s);if(raw===last)return;last=raw;render(s)}catch(e){}}function total(s,p){return C.reduce((n,c)=>n+(Number((s.scores&&s.scores[p]||{})[c[0]])||0),0)}function esc(x){return String(x||'').replace(/[&<>\"']/g,'')}function render(s){const ps=s.players||[];document.getElementById('summary').innerHTML='<h2>'+(s.title||'Partida')+'</h2><p class=muted>'+ps.map(p=>esc(p.name)+': '+total(s,p.id)).join(' · ')+'</p>';let h='<tr><th>Categoría</th>'+ps.map(p=>'<th>'+esc(p.name)+'</th>').join('')+'</tr>';C.forEach(c=>{h+='<tr><td>'+c[1]+'</td>'+ps.map(p=>{const v=((s.scores||{})[p.id]||{})[c[0]];return '<td>'+(EDIT?'<input type=number min=0 max=999 data-p=\"'+p.id+'\" data-c=\"'+c[0]+'\" value=\"'+(v??'')+'\">':(v??'—'))+'</td>'}).join('')+'</tr>'});h+='<tr><td><b>TOTAL</b></td>'+ps.map(p=>'<td><b>'+total(s,p.id)+'</b></td>').join('')+'</tr>';document.getElementById('table').innerHTML=h;if(EDIT)document.querySelectorAll('input').forEach(i=>i.onchange=()=>save(i))}async function save(i){const value=i.value===''?null:Number(i.value);await fetch('/api/score?token='+encodeURIComponent(TOKEN),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pid:i.dataset.p,cat:i.dataset.c,value})});last='';load()}load();setInterval(load,1500)</script></body></html>";
        }

        private void send(BufferedWriter out, int status, String type, String body) throws Exception {
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            out.write("HTTP/1.1 " + status + (status == 200 ? " OK" : " Not Found") + "\r\n");
            out.write("Content-Type: " + type + "\r\n");
            out.write("Content-Length: " + bytes.length + "\r\n");
            out.write("Cache-Control: no-store\r\nConnection: close\r\n\r\n");
            out.flush();
            sWrite(out, body);
        }

        private void sWrite(BufferedWriter out, String body) throws Exception {
            out.write(body);
            out.flush();
        }

        private String param(String query, String name) {
            for (String part : query.split("&")) {
                int i = part.indexOf('=');
                String k = i < 0 ? part : part.substring(0, i);
                if (name.equals(URLDecoder.decode(k, StandardCharsets.UTF_8))) {
                    return URLDecoder.decode(i < 0 ? "" : part.substring(i + 1), StandardCharsets.UTF_8);
                }
            }
            return "";
        }

        private String localIp() {
            try {
                Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
                while (interfaces.hasMoreElements()) {
                    NetworkInterface ni = interfaces.nextElement();
                    Enumeration<InetAddress> addresses = ni.getInetAddresses();
                    while (addresses.hasMoreElements()) {
                        InetAddress address = addresses.nextElement();
                        if (address instanceof Inet4Address && !address.isLoopbackAddress() && address.isSiteLocalAddress()) return address.getHostAddress();
                    }
                }
            } catch (Exception ignored) {}
            return "127.0.0.1";
        }

        private String token(int length) {
            final String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            StringBuilder b = new StringBuilder();
            for (int i = 0; i < length; i++) b.append(alphabet.charAt(random.nextInt(alphabet.length())));
            return b.toString();
        }
    }
}
