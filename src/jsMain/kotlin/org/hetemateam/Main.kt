package org.hetemateam

import androidx.compose.runtime.Composable
import org.jetbrains.compose.web.dom.*
import org.jetbrains.compose.web.renderComposable

fun main() {
    renderComposable(rootElementId = "root") {
        App()
    }
}

@Composable
fun App() {
    Div({ classes("min-h-screen", "bg-base-100", "flex", "items-center", "justify-center") }) {
        Div({ classes("card", "w-96", "bg-base-200", "shadow-xl") }) {
            Div({ classes("card-body", "items-center", "text-center") }) {
                H2({ classes("card-title") }) { Text("VaxTrack") }
                P { Text("Family vaccination tracker") }
                Div({ classes("card-actions") }) {
                    Button({ classes("btn", "btn-primary") }) { Text("Get started") }
                }
            }
        }
    }
}
