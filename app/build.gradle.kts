plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.lifeflow.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.lifeflow.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 3
        versionName = "1.2"
    }

    signingConfigs {
        create("release") {
            storeFile = file(
                System.getenv("ANDROID_KEYSTORE_FILE")
                    ?: "lifeflow-release-key.jks"
            )

            storePassword =
                System.getenv("ANDROID_KEYSTORE_PASSWORD")

            keyAlias =
                System.getenv("ANDROID_KEY_ALIAS")

            keyPassword =
                System.getenv("ANDROID_KEY_PASSWORD")
        }
    }

    compileOptions {
        sourceCompatibility =
            JavaVersion.VERSION_17

        targetCompatibility =
            JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
        }

        release {
            isMinifyEnabled = false

            signingConfig =
                signingConfigs.getByName("release")
        }
    }
}

dependencies {
    implementation(
        "androidx.browser:browser:1.8.0"
    )
}
