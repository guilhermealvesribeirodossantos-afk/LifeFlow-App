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

        webView.setLayerType(
            View.LAYER_TYPE_HARDWARE,
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

                    activateAndroidMode(view)
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

    private fun activateAndroidMode(
        view: WebView?
    ) {

        val script = """
            (function () {

                if (
                    document.getElementById(
                        'lifeflow-android-mode'
                    )
                ) {
                    return;
                }

                document.documentElement
                    .classList
                    .add('lifeflow-android-app');

                const style =
                    document.createElement('style');

                style.id =
                    'lifeflow-android-mode';

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
                    }

                    .lifeflow-android-app *,
                    .lifeflow-android-app *::before,
                    .lifeflow-android-app *::after {

                        backdrop-filter:
                            none !important;

                        -webkit-backdrop-filter:
                            none !important;
                    }

                    .lifeflow-android-app
                    [class*="orb"],

                    .lifeflow-android-app
                    [class*="ambient"],

                    .lifeflow-android-app
                    [class*="noise"],

                    .lifeflow-android-app
                    [class*="glow"] {

                        animation:
                            none !important;
                    }

                    .lifeflow-android-app
                    .premium-card,

                    .lifeflow-android-app
                    .lf61-cockpit-hero,

                    .lifeflow-android-app
                    .task,

                    .lifeflow-android-app
                    .lf64-quick-hub button,

                    .lifeflow-android-app
                    .lf65-weekly {

                        backdrop-filter:
                            none !important;

                        -webkit-backdrop-filter:
                            none !important;
                    }

                    .lifeflow-android-app
                    #lifeflowDrawer {

                        backdrop-filter:
                            none !important;

                        -webkit-backdrop-filter:
                            none !important;

                        background:
                            #050907 !important;
                    }

                    .lifeflow-android-app
                    .bottom-nav {

                        backdrop-filter:
                            none !important;

                        -webkit-backdrop-filter:
                            none !important;

                        background:
                            rgba(
                                3,
                                6,
                                4,
                                0.98
                            ) !important;
                    }

                    .lifeflow-android-app
                    * {

                        text-rendering:
                            optimizeLegibility;

                        -webkit-font-smoothing:
                            antialiased;
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

        if (
            webView.canGoBack()
        ) {

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
