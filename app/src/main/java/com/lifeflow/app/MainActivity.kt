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

        webView.setBackgroundColor(
            Color.rgb(3, 5, 4)
        )

        /*
         * IMPORTANTE:
         * Software rendering para evitar flicker
         * causado pelo compositor gráfico do WebView.
         */
        webView.setLayerType(
            View.LAYER_TYPE_SOFTWARE,
            null
        )

        webView.overScrollMode =
            View.OVER_SCROLL_NEVER

        webView.isVerticalScrollBarEnabled =
            false

        webView.isHorizontalScrollBarEnabled =
            false

        setContentView(webView)

        val settings: WebSettings =
            webView.settings

        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true

        settings.allowFileAccess = true
        settings.allowContentAccess = true

        settings.cacheMode =
            WebSettings.LOAD_DEFAULT

        settings.useWideViewPort = true
        settings.loadWithOverviewMode = false

        settings.setSupportZoom(false)
        settings.builtInZoomControls = false
        settings.displayZoomControls = false

        settings.mediaPlaybackRequiresUserGesture =
            false

        webView.webChromeClient =
            WebChromeClient()

        webView.webViewClient =
            object : WebViewClient() {

                override fun onPageFinished(
                    view: WebView?,
                    url: String?
                ) {
                    super.onPageFinished(
                        view,
                        url
                    )

                    activateAndroidStableMode(
                        view
                    )
                }
            }

        if (savedInstanceState == null) {

            webView.loadUrl(
                "https://guilhermealvesribeirodossantos-afk.github.io/LifeFlow/"
            )

        } else {

            webView.restoreState(
                savedInstanceState
            )
        }
    }

    private fun activateAndroidStableMode(
        view: WebView?
    ) {

        val script = """
            (function () {

                if (
                    document.getElementById(
                        'lifeflow-android-stable-v2'
                    )
                ) {
                    return;
                }

                document.documentElement.classList.add(
                    'lifeflow-android-app'
                );

                const style =
                    document.createElement('style');

                style.id =
                    'lifeflow-android-stable-v2';

                style.innerHTML = `

                    html,
                    body {
                        background:
                            #030504 !important;

                        overscroll-behavior:
                            none !important;
                    }

                    * {
                        -webkit-tap-highlight-color:
                            transparent !important;

                        backdrop-filter:
                            none !important;

                        -webkit-backdrop-filter:
                            none !important;

                        filter:
                            none !important;

                        will-change:
                            auto !important;
                    }

                    *::before,
                    *::after {
                        backdrop-filter:
                            none !important;

                        -webkit-backdrop-filter:
                            none !important;

                        filter:
                            none !important;

                        will-change:
                            auto !important;
                    }

                    [class*="orb"],
                    [class*="ambient"],
                    [class*="noise"] {
                        display:
                            none !important;
                    }

                    html.lifeflow-android-app *,
                    html.lifeflow-android-app *::before,
                    html.lifeflow-android-app *::after {
                        animation:
                            none !important;

                        transition:
                            none !important;
                    }

                    #lifeflowDrawer {
                        background:
                            #050907 !important;
                    }

                    .bottom-nav {
                        background:
                            #050806 !important;
                    }

                    .premium-card,
                    .task,
                    .lf61-cockpit-hero,
                    .lf64-quick-hub button,
                    .lf65-weekly {

                        background-color:
                            #080c09 !important;
                    }

                    body {
                        -webkit-font-smoothing:
                            antialiased !important;

                        text-rendering:
                            optimizeLegibility !important;
                    }
                `;

                document.head.appendChild(
                    style
                );

            })();
        """.trimIndent()

        view?.evaluateJavascript(
            script,
            null
        )
    }

    override fun onSaveInstanceState(
        outState: Bundle
    ) {

        webView.saveState(
            outState
        )

        super.onSaveInstanceState(
            outState
        )
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

        webView.stopLoading()

        webView.loadUrl(
            "about:blank"
        )

        webView.clearHistory()

        webView.removeAllViews()

        webView.destroy()

        super.onDestroy()
    }
}
