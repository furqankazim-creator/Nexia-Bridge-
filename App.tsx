import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { WEB_APP_HTML } from './mobile/webAppHtml';

const BG = '#FBF7F2';
const INK = '#1F1B3A';
const SLOW_AFTER_MS = 12000;

export default function App() {
  // react-native-webview has no browser implementation, so the web target embeds the app in an iframe.
  if (Platform.OS === 'web') {
    return (
      <iframe
        title="Nexia Bridge"
        srcDoc={WEB_APP_HTML}
        style={{ border: 0, width: '100%', height: '100vh', display: 'block', background: BG }}
        allow="microphone; camera"
      />
    );
  }
  return <NativeShell />;
}

function NativeShell() {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0); // bump to remount the WebView

  useEffect(() => {
    if (ready) return;
    const id = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(id);
  }, [ready, attempt]);

  const retry = () => {
    setFailed(null);
    setSlow(false);
    setReady(false);
    setAttempt((n) => n + 1);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar style="dark" />
        <WebView
          key={attempt}
          style={styles.web}
          originWhitelist={['*']}
          source={{ html: WEB_APP_HTML, baseUrl: 'http://nexia-bridge.local/' }}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="always"
          bounces={false}
          overScrollMode="never"
          setSupportMultipleWindows={false}
          allowsBackForwardNavigationGestures={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          onMessage={(e) => {
            if (e.nativeEvent.data === 'ready') setReady(true);
          }}
          onLoadEnd={() => setTimeout(() => setReady(true), 1500)} // safety net if the ready message is missed
          onError={(e) => setFailed(e.nativeEvent.description || 'The app could not load.')}
          onHttpError={(e) => setFailed(`HTTP ${e.nativeEvent.statusCode}`)}
          onRenderProcessGone={() => setFailed('The web view stopped. Tap retry.')}
          onContentProcessDidTerminate={() => setFailed('The web view stopped. Tap retry.')}
        />

        {!ready && (
          <View style={styles.overlay} pointerEvents="box-none">
            {failed ? (
              <View style={styles.panel}>
                <Text style={styles.title}>Couldn't open the app</Text>
                <Text style={styles.body}>{failed}</Text>
                <Pressable style={styles.btn} onPress={retry} accessibilityRole="button">
                  <Text style={styles.btnText}>Retry</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.panel}>
                <ActivityIndicator size="large" color="#0F766E" />
                <Text style={styles.title}>Opening Nexia Bridge…</Text>
                {slow && (
                  <>
                    <Text style={styles.body}>This is taking longer than usual.</Text>
                    <Pressable style={styles.btn} onPress={retry} accessibilityRole="button">
                      <Text style={styles.btnText}>Reload</Text>
                    </Pressable>
                  </>
                )}
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  web: { flex: 1, backgroundColor: BG },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', padding: 24 },
  panel: { alignItems: 'center', gap: 12 },
  title: { color: INK, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  body: { color: '#6B6785', fontSize: 14, textAlign: 'center' },
  btn: { marginTop: 4, backgroundColor: '#0F766E', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 14 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
