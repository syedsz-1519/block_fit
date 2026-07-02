import 'package:flutter/material';
import 'package:webview_flutter/webview_flutter.dart';

class GameWebViewContainer extends StatefulWidget {
  const GameWebViewContainer({super.key});

  @override
  State<GameWebViewContainer> createState() => _GameWebViewContainerState();
}

class _GameWebViewContainerState extends State<GameWebViewContainer> {
  late final WebViewController _controller;
  bool _isLoading = true;
  double _loadingProgress = 0.0;

  // Change this to your deployed Vercel URL!
  // Android emulator fallback: Use http://10.0.2.2:3000 to test against local dev server
  static const String _productionUrl = 'https://block-fit.vercel.app';
  static const String _localUrl = 'http://10.0.2.2:3000';

  @override
  void initState() {
    super.initState();

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF18181B)) // Match dark theme zinc background
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            setState(() {
              _loadingProgress = progress / 100.0;
            });
          },
          onPageStarted: (String url) {
            setState(() {
              _isLoading = true;
            });
          },
          onPageFinished: (String url) {
            setState(() {
              _isLoading = false;
            });
          },
          onWebResourceError: (WebResourceError error) {
            debugPrint('Web resource error: ${error.description}');
          },
        ),
      )
      ..loadRequest(Uri.parse(_productionUrl));
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        if (await _controller.canGoBack()) {
          await _controller.goBack();
          return false; // Prevent closing the app
        }
        return true; // Close the app
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF18181B), // Match dark background
        body: SafeArea(
          bottom: false, // Let full bleed content reach the bottom
          child: Stack(
            children: [
              // 1. The high-performance WebView
              WebViewWidget(controller: _controller),

              // 2. Splash / Loading Screen Overlay
              if (_isLoading)
                Container(
                  color: const Color(0xFF121214),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Premium logo placeholder / visual identity
                        const Text(
                          'BLOCK FIT',
                          style: TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.black,
                            color: Colors.white,
                            letterSpacing: 4,
                          ),
                        ),
                        const SizedBox(height: 10),
                        const Text(
                          'DYNAMIC TANGRAM PUZZLE',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF6D8F7F),
                            letterSpacing: 2,
                          ),
                        ),
                        const SizedBox(height: 48),

                        // Progress bar or indicator
                        SizedBox(
                          width: 200,
                          child: Column(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                                child: LinearProgressIndicator(
                                  value: _loadingProgress,
                                  backgroundColor: Colors.white.withOpacity(0.1),
                                  valueColor: const AlwaysStoppedAnimation<Color>(
                                    Color(0xFF6D8F7F),
                                  ),
                                  minHeight: 4,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                '${(_loadingProgress * 100).toInt()}%',
                                style: const TextStyle(
                                  color: Colors.white60,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
