plugins {
    kotlin("multiplatform") version "2.3.20"
    kotlin("plugin.serialization") version "2.3.20"
    id("org.jetbrains.compose") version "1.8.2"
    id("org.jetbrains.kotlin.plugin.compose") version "2.3.20"
}

group = "org.hetemateam"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
    google()
    maven("https://maven.pkg.jetbrains.space/public/p/compose/dev")
}

kotlin {
    js(IR) {
        browser {
            commonWebpackConfig {
                cssSupport { enabled.set(true) }
            }
            testTask { enabled = false } // pure-logic tests run in Node
        }
        nodejs {
            testTask {
                useMocha { timeout = "10s" }
            }
        }
        binaries.executable()
    }

    sourceSets {
        commonMain.dependencies {
            implementation(compose.runtime)
            implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.10.2")
            implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.6.2")
            implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.8.1")
        }
        jsMain.dependencies {
            implementation(compose.html.core)
            implementation(npm("tailwindcss", "3.4.17"))
            implementation(npm("daisyui", "4.12.23"))
            implementation(npm("postcss", "8.5.6"))
            implementation(npm("autoprefixer", "10.4.21"))
        }
        commonTest.dependencies {
            implementation(kotlin("test"))
        }
    }
}
