package org.hetemateam

import org.hetemateam.db.IdbRepository
import org.jetbrains.compose.web.renderComposable

fun main() {
    val repo = IdbRepository()
    renderComposable(rootElementId = "root") {
        App(repo)
    }
}
