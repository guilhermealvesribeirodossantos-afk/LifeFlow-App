package com.lifeflow.app

import android.app.Activity
import android.content.ComponentName
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.browser.customtabs.CustomTabsCallback
import androidx.browser.customtabs.CustomTabsClient
import androidx.browser.customtabs.CustomTabsService
import androidx.browser.customtabs.CustomTabsServiceConnection
import androidx.browser.customtabs.CustomTabsSession
import androidx.browser.trusted.TrustedWebActivityIntentBuilder

class MainActivity : Activity() {

    private val lifeFlowUrl =
        "https://guilhermealvesribeirodossantos-afk.github.io/LifeFlow/"

    private val lifeFlowOrigin =
        Uri.parse(
            "https://guilhermealvesribeirodossantos-afk.github.io"
        )

    private var launched = false
    private var validationAnswered = false

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

            Toast.makeText(
                this,
                "Nenhum navegador compatível encontrado.",
                Toast.LENGTH_LONG
            ).show()

            openBrowserDirectly()
            return
        }

        val connection =
            object : CustomTabsServiceConnection() {

                override fun onCustomTabsServiceConnected(
                    name: ComponentName,
                    client: CustomTabsClient
                ) {

                    client.warmup(0L)

                    val callback =
                        object : CustomTabsCallback() {

                            override fun onRelationshipValidationResult(
                                relation: Int,
                                requestedOrigin: Uri,
                                result: Boolean,
                                extras: Bundle?
                            ) {

                                if (validationAnswered) return

                                validationAnswered = true

                                runOnUiThread {

                                    if (result) {

                                        Toast.makeText(
                                            this@MainActivity,
                                            "Domínio verificado ✅",
                                            Toast.LENGTH_LONG
                                        ).show()

                                    } else {

                                        Toast.makeText(
                                            this@MainActivity,
                                            "Domínio NÃO verificado ❌",
                                            Toast.LENGTH_LONG
                                        ).show()
                                    }
                                }
                            }
                        }

                    val session =
                        client.newSession(
                            callback
                        )

                    if (session == null) {

                        Toast.makeText(
                            this@MainActivity,
                            "Não foi possível criar a sessão TWA.",
                            Toast.LENGTH_LONG
                        ).show()

                        openBrowserDirectly()
                        return
                    }

                    val validationStarted =
                        session.validateRelationship(
                            CustomTabsService.RELATION_HANDLE_ALL_URLS,
                            lifeFlowOrigin,
                            null
                        )

                    if (!validationStarted) {

                        Toast.makeText(
                            this@MainActivity,
                            "Chrome não iniciou a validação.",
                            Toast.LENGTH_LONG
                        ).show()
                    }

                    launchTrustedApp(
                        session
                    )
                }

                override fun onServiceDisconnected(
                    name: ComponentName
                ) {
                }
            }

        val connected =
            CustomTabsClient.bindCustomTabsService(
                this,
                packageName,
                connection
            )

        if (!connected) {

            Toast.makeText(
                this,
                "Falha ao conectar ao navegador.",
                Toast.LENGTH_LONG
            ).show()

            openBrowserDirectly()
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

    private fun openBrowserDirectly() {

        if (launched) return

        launched = true

        val intent =
            android.content.Intent(
                android.content.Intent.ACTION_VIEW,
                Uri.parse(lifeFlowUrl)
            )

        startActivity(intent)
    }
}
