package com.desarrollamo.generalamo;

import android.app.AlertDialog;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JsResult;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

/**
 * Android launcher activity for GeneralAMO.
 *
 * The web UI uses confirm()/alert() for destructive or blocking actions.
 * A plain WebView without a chrome client can leave those actions without
 * visible feedback, so this activity installs an explicit dialog handler
 * while reusing the existing MainActivity state, sharing bridge and storage.
 */
public class MainActivityV2 extends MainActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView webView = findWebView(findViewById(android.R.id.content));
        if (webView != null) {
            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public boolean onJsConfirm(WebView view, String url, String message, JsResult result) {
                    new AlertDialog.Builder(MainActivityV2.this)
                            .setMessage(message)
                            .setPositiveButton("Confirmar", (dialog, which) -> result.confirm())
                            .setNegativeButton("Cancelar", (dialog, which) -> result.cancel())
                            .setOnCancelListener(dialog -> result.cancel())
                            .show();
                    return true;
                }

                @Override
                public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
                    new AlertDialog.Builder(MainActivityV2.this)
                            .setMessage(message)
                            .setPositiveButton("Aceptar", (dialog, which) -> result.confirm())
                            .setOnCancelListener(dialog -> result.cancel())
                            .show();
                    return true;
                }
            });
        }
    }

    private WebView findWebView(View view) {
        if (view instanceof WebView) return (WebView) view;
        if (view instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) view;
            for (int i = 0; i < group.getChildCount(); i++) {
                WebView found = findWebView(group.getChildAt(i));
                if (found != null) return found;
            }
        }
        return null;
    }
}
