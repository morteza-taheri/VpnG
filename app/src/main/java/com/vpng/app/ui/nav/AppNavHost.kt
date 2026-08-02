package com.vpng.app.ui.nav

import androidx.compose.runtime.Composable
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.vpng.app.ui.home.HomeScreen
import com.vpng.app.ui.home.HomeViewModel
import com.vpng.app.ui.servers.ServersScreen

private object Routes {
    const val HOME = "home"
    const val SERVERS = "servers"
}

@Composable
fun AppNavHost(onRequestVpnConsent: () -> Unit) {
    val navController = rememberNavController()

    // Single HomeViewModel shared between Home and Servers screens (hiltViewModel()
    // called here, outside any specific route, resolves to the Activity's
    // ViewModelStoreOwner) — Servers needs to write into the same connection
    // state that Home reads from.
    val homeViewModel: HomeViewModel = hiltViewModel()

    NavHost(navController = navController, startDestination = Routes.HOME) {
        composable(Routes.HOME) {
            HomeScreen(
                onRequestVpnConsent = onRequestVpnConsent,
                onNavigateToServers = { navController.navigate(Routes.SERVERS) },
                viewModel = homeViewModel
            )
        }
        composable(Routes.SERVERS) {
            ServersScreen(
                viewModel = homeViewModel,
                onServerConnectRequested = { server ->
                    homeViewModel.selectServerAndConnect(server)
                    navController.popBackStack(Routes.HOME, inclusive = false)
                },
                onNeedsVpnConsent = onRequestVpnConsent
            )
        }
    }
}
