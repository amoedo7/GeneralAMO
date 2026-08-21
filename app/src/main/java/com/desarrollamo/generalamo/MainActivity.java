package com.desarrollamo.generalamo;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
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
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

public class MainActivity extends Activity {
    private static final Set<String> VALID_CATEGORIES = new HashSet<>();

    static {
        String[] categories = {"1", "2", "3", "4", "5", "6", "straight", "full", "poker", "generala", "double"};
        for (String category : categories) VALID_CATEGORIES.add(category);
    }

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
        public String getVersionName() {
            return BuildConfig.VERSION_NAME;
        }

        @JavascriptInterface
        public boolean openExternal(String url) {
            try {
                Uri uri = Uri.parse(url);
                String scheme = uri.getScheme();
                String host = uri.getHost();
                if (!"https".equalsIgnoreCase(scheme) || host == null) return false;
                boolean allowed = host.equalsIgnoreCase("github.com")
                        || host.equalsIgnoreCase("raw.githubusercontent.com")
                        || host.endsWith(".githubusercontent.com");
                if (!allowed) return false;
                runOnUiThread(() -> {
                    Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                    startActivity(intent);
                });
                return true;
            } catch (Exception ignored) {
                return false;
            }
        }

        @JavascriptInterface
        public String startSharing(String stateJson) {
            try {
                if (localServer == null) localServer = new LocalGameServer();
                localServer.setState(stateJson);
                localServer.start();
                return localServer.info().toString();
            } catch (Exception e) {
                try {
                    return new JSONObject()
                            .put("ok", false)
                            .put("error", e.getMessage() == null ? "No se pudo iniciar el acceso local" : e.getMessage())
                            .toString();
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
        private final String editToken = token(10);

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
            if (serverSocket == null) {
                throw last == null ? new IllegalStateException("No hay un puerto local disponible") : last;
            }

            running = true;
            acceptThread = new Thread(() -> {
                while (running) {
                    try {
                        Socket socket = serverSocket.accept();
                        Thread client = new Thread(() -> handle(socket), "GeneralAMO-client");
                        client.setDaemon(true);
                        client.start();
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
            try {
                if (serverSocket != null) serverSocket.close();
            } catch (Exception ignored) {
            }
            serverSocket = null;
        }

        synchronized void setState(String json) {
            try {
                state = new JSONObject(json);
            } catch (Exception ignored) {
            }
        }

        JSONObject info() throws Exception {
            String ip = localIp();
            String base = "http://" + ip + ":" + port + "/" + code;
            return new JSONObject()
                    .put("ok", true)
                    .put("viewerUrl", base)
                    .put("editorUrl", base + "/play/" + editToken)
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

                char[] bodyChars = new char[Math.max(0, Math.min(contentLength, 16_384))];
                int read = 0;
                while (read < bodyChars.length) {
                    int n = in.read(bodyChars, read, bodyChars.length - read);
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
                } else if (method.equals("GET") && path.equals("/" + code + "/play/" + editToken)) {
                    send(out, 200, "text/html; charset=utf-8", remotePage(true));
                } else if (method.equals("GET") && path.equals("/api/state") && code.equals(param(query, "code"))) {
                    send(out, 200, "application/json; charset=utf-8", state.toString());
                } else if (method.equals("POST") && path.equals("/api/action") && editToken.equals(param(query, "token"))) {
                    JSONObject action = body.isEmpty() ? new JSONObject() : new JSONObject(body);
                    if (!validAction(action)) {
                        send(out, 400, "application/json; charset=utf-8", "{\"ok\":false,\"error\":\"acción inválida\"}");
                    } else {
                        applyRemoteAction(action);
                        send(out, 200, "application/json; charset=utf-8", "{\"ok\":true}");
                    }
                } else if (method.equals("POST") && path.equals("/api/score") && editToken.equals(param(query, "token"))) {
                    JSONObject legacy = new JSONObject(body);
                    JSONObject action = new JSONObject()
                            .put("type", "score")
                            .put("pid", legacy.optString("pid"))
                            .put("cat", legacy.optString("cat"));
                    if (legacy.has("value") && !legacy.isNull("value")) action.put("value", legacy.get("value"));
                    else action.put("value", JSONObject.NULL);
                    if (validAction(action)) {
                        applyRemoteAction(action);
                        send(out, 200, "application/json; charset=utf-8", "{\"ok\":true}");
                    } else {
                        send(out, 400, "application/json; charset=utf-8", "{\"ok\":false,\"error\":\"anotación inválida\"}");
                    }
                } else {
                    send(out, 404, "text/plain; charset=utf-8", "GeneralAMO · enlace no válido");
                }
            } catch (Exception ignored) {
            }
        }

        private boolean validAction(JSONObject action) {
            String type = action.optString("type", "");
            if (type.equals("roll")) return true;

            if (type.equals("hold")) {
                int index = action.optInt("index", -1);
                return index >= 0 && index < 5;
            }

            if (type.equals("digital-score")) {
                return VALID_CATEGORIES.contains(action.optString("cat", ""));
            }

            if (type.equals("score")) {
                String pid = action.optString("pid", "");
                String cat = action.optString("cat", "");
                if (!VALID_CATEGORIES.contains(cat) || !stateHasPlayer(pid)) return false;
                if (!action.has("value") || action.isNull("value")) return true;
                Object value = action.opt("value");
                if (!(value instanceof Number)) return false;
                double number = ((Number) value).doubleValue();
                return number >= 0 && number <= 999;
            }

            return false;
        }

        private boolean stateHasPlayer(String pid) {
            JSONArray players = state.optJSONArray("players");
            if (players == null) return false;
            for (int i = 0; i < players.length(); i++) {
                JSONObject item = players.optJSONObject(i);
                if (item != null && pid.equals(item.optString("id"))) return true;
            }
            return false;
        }

        private void applyRemoteAction(JSONObject action) {
            String payload = action.toString();
            String js = "window.applyRemoteAction(JSON.parse(" + JSONObject.quote(payload) + "));";
            runOnUiThread(() -> webView.evaluateJavascript(js, null));
        }

        private String remotePage(boolean editor) throws Exception {
            String html;
            try (InputStream input = getAssets().open("remote.html");
                 ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[8_192];
                int n;
                while ((n = input.read(buffer)) >= 0) output.write(buffer, 0, n);
                html = output.toString(StandardCharsets.UTF_8.name());
            }

            return html
                    .replace("__EDITOR__", editor ? "true" : "false")
                    .replace("__CODE__", code)
                    .replace("__TOKEN__", editor ? editToken : "");
        }

        private void send(BufferedWriter out, int status, String type, String body) throws Exception {
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            String label = status == 200 ? " OK" : status == 400 ? " Bad Request" : " Not Found";
            out.write("HTTP/1.1 " + status + label + "\r\n");
            out.write("Content-Type: " + type + "\r\n");
            out.write("Content-Length: " + bytes.length + "\r\n");
            out.write("Cache-Control: no-store\r\n");
            out.write("X-Content-Type-Options: nosniff\r\n");
            out.write("Connection: close\r\n\r\n");
            out.flush();
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
                        if (address instanceof Inet4Address && !address.isLoopbackAddress() && address.isSiteLocalAddress()) {
                            return address.getHostAddress();
                        }
                    }
                }
            } catch (Exception ignored) {
            }
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
