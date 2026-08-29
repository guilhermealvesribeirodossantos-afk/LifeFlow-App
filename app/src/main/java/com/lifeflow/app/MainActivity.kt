package com.lifeflow.app

import android.app.Activity
import android.content.ComponentName
import android.net.Uri
import android.os.Bundle
import androidx.browser.customtabs.CustomTabsClient
import androidx.browser.customtabs.CustomTabsServiceConnection
import androidx.browser.customtabs.CustomTabsSession
import androidx.browser.trusted.TrustedWebActivityIntentBuilder

class MainActivity : Activity() {

    private val lifeFlowUrl =
        "https://guilhermealvesribeirodossantos-afk.github.io/LifeFlow/"

    private var launched = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        openLifeFlow()
    }

    private fun openLifeFlow() {

        val packageName =
            CustomTabsClient.getPackageName(
                this,
                null
            )

        if (packageName == null) {
            openFallback()
            return
        }

        val connection =
            object : CustomTabsServiceConnection() {

                override fun onCustomTabsServiceConnected(
                    name: ComponentName,
                    client: CustomTabsClient
                ) {

                    client.warmup(0L)

                    val session =
                        client.newSession(null)

                    if (session != null) {

                        launchTrustedApp(
                            session
                        )

                    } else {

                        openFallback()
                    }
                }

                override fun onServiceDisconnected(
                    name: ComponentName
                ) {
                    // Nenhuma ação necessária.
                }
            }

        val connected =
            CustomTabsClient.bindCustomTabsService(
                this,
                packageName,
                connection
            )

        if (!connected) {
            openFallback()
        }
    }

    private fun launchTrustedApp(
        session: CustomTabsSession
    ) {

        if (launched) return

        launched = true

        val uri =
            Uri.parse(
                lifeFlowUrl
            )

        val twaIntent =
            TrustedWebActivityIntentBuilder(
                uri
            )
                .build(
                    session
                )

        twaIntent.launchTrustedWebActivity(
            this
        )
    }

    private fun openFallback() {

        if (launched) return

        launched = true

        val uri =
            Uri.parse(
                lifeFlowUrl
            )

        val packageName =
            CustomTabsClient.getPackageName(
                this,
                null
            )

        val connection =
            object : CustomTabsServiceConnection() {

                override fun onCustomTabsServiceConnected(
                    name: ComponentName,
                    client: CustomTabsClient
                ) {

                    client.warmup(0L)

                    val session =
                        client.newSession(null)

                    if (session != null) {

                        val intent =
                            androidx.browser.customtabs
                                .CustomTabsIntent
                                .Builder(session)
                                .build()

                        intent.launchUrl(
                            this@MainActivity,
                            uri
                        )

                    } else {

                        openBrowserDirectly()
                    }
                }

                override fun onServiceDisconnected(
                    name: ComponentName
                ) {
                }
            }

        if (
            packageName == null ||
            !CustomTabsClient.bindCustomTabsService(
                this,
                packageName,
                connection
            )
        ) {
            openBrowserDirectly()
        }
    }

    private fun openBrowserDirectly() {

        val intent =
            android.content.Intent(
                android.content.Intent.ACTION_VIEW,
                Uri.parse(lifeFlowUrl)
            )

        startActivity(intent)
    }

    override fun onResume() {
        super.onResume()

        if (launched) {
            // Mantemos a Activity leve.
        }
    }
}
