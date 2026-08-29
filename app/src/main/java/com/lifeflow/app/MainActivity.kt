package com.lifeflow.app

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient

class MainActivity : Activity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)

        // Fundo preto para evitar flashes brancos.
        webView.setBackgroundColor(Color.rgb(3, 5, 4))

        // Força aceleração de hardware.
        webView.setLayerType(
            View.LAYER_TYPE_HARDWARE,
            null
        )

        // Remove efeitos de rolagem que podem causar flashes.
        webView.overScrollMode = View.OVER_SCROLL_NEVER
        webView.isVerticalScrollBarEnabled = false
        webView.isHorizontalScrollBarEnabled = false

        setContentView(webView)

        val settings: WebSettings = webView.settings

        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true

        settings.allowFileAccess = true
        settings.allowContentAccess = true

        settings.cacheMode = WebSettings.LOAD_DEFAULT

        settings.useWideViewPort = true
        settings.loadWithOverviewMode = false

        settings.setSupportZoom(false)
        settings.builtInZoomControls = false
        settings.displayZoomControls = false

        settings.mediaPlaybackRequiresUserGesture = false

        webView.webChromeClient = WebChromeClient()

        webView.webViewClient = object : WebViewClient() {

            override fun onPageFinished(
                view: WebView?,
                url: String?
            ) {
                super.onPageFinished(view, url)

                // Evita flashes provocados pelo redesenho de elementos
                // com blur/backdrop-filter dentro do Android WebView.
                view?.evaluateJavascript(
                    """
                    (function() {
                        if (
                            document.getElementById(
                                'lifeflow-android-stability'
                            )
                        ) return;

                        const style =
                            document.createElement('style');

                        style.id =
                            'lifeflow-android-stability';

                        style.innerHTML = `
                            html,
                            body {
                                background: #030504 !important;
                            }

                            * {
                                -webkit-tap-highlight-color:
                                    transparent !important;
                            }

                            body {
                                -webkit-overflow-scrolling:
                                    touch;
                            }
                        `;

                        document.head.appendChild(style);
                    })();
                    """.trimIndent(),
                    null
                )
            }
        }

        if (savedInstanceState == null) {

            webView.loadUrl(
                "https://guilhermealvesribeirodossantos-afk.github.io/LifeFlow/"
            )

        } else {

            webView.restoreState(savedInstanceState)

        }
    }

    override fun onSaveInstanceState(
        outState: Bundle
    ) {
        webView.saveState(outState)
        super.onSaveInstanceState(outState)
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {

        if (webView.canGoBack()) {

            webView.goBack()

        } else {

            super.onBackPressed()

        }
    }

    override fun onDestroy() {

        webView.apply {

            stopLoading()
            loadUrl("about:blank")
            clearHistory()
            removeAllViews()
            destroy()

        }

        super.onDestroy()
    }
}
