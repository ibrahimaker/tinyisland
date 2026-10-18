import { StatusBar } from 'expo-status-bar';
import { useMemo, useRef, useState } from 'react';
import { Image, ImageBackground, PanResponder, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

type Screen = 'menu' | 'island' | 'settings';

const menuArt = require('../assets/menu-coastal-farm.png');
const islandGround = require('../assets/island-ground.png');
const treeOak = require('../assets/tree-oak.png');
const treePine = require('../assets/tree-pine.png');
const coastalRocks = require('../assets/rocks-coastal.png');

export default function HomeScreen() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [zoom, setZoom] = useState(1.04);
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const cameraStart = useRef({ x: 0, y: 0 });
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) + Math.abs(gesture.dy) > 4,
    onPanResponderGrant: () => { cameraStart.current = camera; },
    onPanResponderMove: (_, gesture) => setCamera({
      x: Math.max(-170, Math.min(170, cameraStart.current.x + gesture.dx)),
      y: Math.max(-90, Math.min(90, cameraStart.current.y + gesture.dy)),
    }),
  }), [camera]);

  if (screen === 'island') {
    return <SafeAreaView style={styles.app}>
      <View style={styles.islandScene} {...panResponder.panHandlers}>
        <View pointerEvents="none" style={[styles.worldLayer, { transform: [{ translateX: camera.x }, { translateY: camera.y }, { scale: zoom }] }]}>
          <ImageBackground source={islandGround} resizeMode="cover" style={styles.groundLayer}>
            <Image source={coastalRocks} resizeMode="contain" style={[styles.worldAsset, styles.rockA]} />
            <Image source={coastalRocks} resizeMode="contain" style={[styles.worldAsset, styles.rockB]} />
            <Image source={treeOak} resizeMode="contain" style={[styles.worldAsset, styles.treeOakA]} />
            <Image source={treeOak} resizeMode="contain" style={[styles.worldAsset, styles.treeOakB]} />
            <Image source={treePine} resizeMode="contain" style={[styles.worldAsset, styles.treePineA]} />
            <Image source={treePine} resizeMode="contain" style={[styles.worldAsset, styles.treePineB]} />
          </ImageBackground>
        </View>
        <View pointerEvents="none" style={styles.topHud}>
          <View style={styles.levelChip}><Text style={styles.levelText}>Lv. 1</Text></View>
          <View style={styles.resources}><Resource label="ALTIN" value="1.250" tone="gold" /><Resource label="ELMAS" value="50" tone="blue" /></View>
        </View>
        <View pointerEvents="none" style={styles.questCard}>
          <View style={styles.questAvatar}><Text style={styles.questAvatarText}>M</Text></View>
          <View><Text style={styles.questEyebrow}>GÜNLÜK GÖREV</Text><Text style={styles.questTitle}>Buğdayları topla</Text><View style={styles.progressTrack}><View style={styles.progressFill} /></View></View>
        </View>
        <View style={styles.leftRail}><HudButton label="HARİTA" /><HudButton label="GÖREV" /><HudButton label="ÇANTA" /></View>
        <View style={styles.cameraControls}>
          <Pressable style={styles.zoomButton} onPress={() => setZoom((value) => Math.min(1.35, value + 0.08))}><Text style={styles.zoomText}>+</Text></Pressable>
          <Pressable style={styles.zoomButton} onPress={() => setZoom((value) => Math.max(0.9, value - 0.08))}><Text style={styles.zoomText}>−</Text></Pressable>
        </View>
        <Pressable style={styles.backButton} onPress={() => setScreen('menu')}><Text style={styles.backText}>MENÜ</Text></Pressable>
        <View pointerEvents="none" style={styles.cameraHint}><Text style={styles.cameraHintText}>Sürükle: kamerayı hareket ettir</Text></View>
      </View><StatusBar style="light" />
    </SafeAreaView>;
  }

  return <SafeAreaView style={styles.app}>
    <ImageBackground source={menuArt} resizeMode="cover" style={styles.menuScene}>
      <View style={styles.menuShade} />
      <View style={styles.logoLockup}><Text style={styles.logoTiny}>TINY</Text><Text style={styles.logoIsland}>ISLAND</Text><Text style={styles.logoTagline}>Küçük bir ada, büyük hayaller.</Text></View>
      <View style={styles.menuPanel}>
        {screen === 'settings' ? <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>AYARLAR</Text><Text style={styles.settingsCopy}>Ses, bildirimler ve dil seçenekleri yakında burada olacak.</Text>
          <Pressable style={[styles.menuButton, styles.blueButton]} onPress={() => setScreen('menu')}><Text style={styles.menuButtonText}>GERİ DÖN</Text></Pressable>
        </View> : <><MenuButton title="OYUNA BAŞLA" color="green" onPress={() => setScreen('island')} /><MenuButton title="AYARLAR" color="gold" onPress={() => setScreen('settings')} /><MenuButton title="ÇIKIŞ" color="red" onPress={() => setScreen('menu')} /></>}
      </View>
    </ImageBackground><StatusBar style="light" />
  </SafeAreaView>;
}

function MenuButton({ title, color, onPress }: { title: string; color: 'green' | 'gold' | 'red'; onPress: () => void }) {
  const background = color === 'green' ? styles.greenButton : color === 'gold' ? styles.goldButton : styles.redButton;
  return <Pressable accessibilityRole="button" style={[styles.menuButton, background]} onPress={onPress}><Text style={styles.menuButtonText}>{title}</Text></Pressable>;
}

function Resource({ label, value, tone }: { label: string; value: string; tone: 'gold' | 'blue' }) {
  return <View style={styles.resource}><View style={[styles.resourceMark, tone === 'gold' ? styles.goldMark : styles.blueMark]} /><View><Text style={styles.resourceLabel}>{label}</Text><Text style={styles.resourceValue}>{value}</Text></View></View>;
}

function HudButton({ label }: { label: string }) { return <Pressable style={styles.hudButton}><Text style={styles.hudButtonText}>{label}</Text></Pressable>; }

const styles = StyleSheet.create({
  app: { backgroundColor: '#071d2e', flex: 1 },
  backButton: { backgroundColor: '#6b4321', borderColor: '#f4ce8c', borderRadius: 18, borderWidth: 2, bottom: 22, left: 24, paddingHorizontal: 18, paddingVertical: 10, position: 'absolute' },
  backText: { color: '#fff9e9', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  blueButton: { backgroundColor: '#2587d8' }, blueMark: { backgroundColor: '#4bc7ff' },
  cameraControls: { bottom: 22, flexDirection: 'row', gap: 8, position: 'absolute', right: 24 },
  cameraHint: { alignSelf: 'center', backgroundColor: 'rgba(9,39,48,0.72)', borderRadius: 12, bottom: 20, paddingHorizontal: 14, paddingVertical: 7, position: 'absolute' },
  cameraHintText: { color: '#e8fff5', fontSize: 11, fontWeight: '700' },
  goldButton: { backgroundColor: '#ee9d1c' }, goldMark: { backgroundColor: '#ffcf3f' }, greenButton: { backgroundColor: '#4baf29' },
  hudButton: { alignItems: 'center', backgroundColor: '#ebfaf5', borderColor: '#7fbfb8', borderRadius: 14, borderWidth: 2, height: 54, justifyContent: 'center', shadowColor: '#073a3c', shadowOpacity: 0.25, shadowRadius: 7, width: 62 },
  hudButtonText: { color: '#245a58', fontSize: 9, fontWeight: '900' },
  groundLayer: { flex: 1 },
  islandScene: { backgroundColor: '#159bd0', flex: 1, overflow: 'hidden' }, leftRail: { gap: 8, left: 20, position: 'absolute', top: 104 },
  levelChip: { backgroundColor: '#295f36', borderColor: '#b5ef83', borderRadius: 18, borderWidth: 2, paddingHorizontal: 14, paddingVertical: 8 }, levelText: { color: 'white', fontSize: 14, fontWeight: '900' },
  logoIsland: { color: '#fff6df', fontSize: 47, fontWeight: '900', letterSpacing: 1, lineHeight: 48, textShadowColor: '#5a2c12', textShadowOffset: { height: 4, width: 0 }, textShadowRadius: 2 },
  logoLockup: { left: 36, position: 'absolute', top: 28 }, logoTagline: { color: '#fff8df', fontSize: 13, fontWeight: '800', marginTop: 10, textShadowColor: '#23421b', textShadowOffset: { height: 2, width: 0 }, textShadowRadius: 2 },
  logoTiny: { color: '#ffcf42', fontSize: 36, fontWeight: '900', letterSpacing: 2, lineHeight: 35, textShadowColor: '#9d3c0f', textShadowOffset: { height: 4, width: 0 }, textShadowRadius: 2 },
  menuButton: { alignItems: 'center', borderColor: '#fff3c8', borderRadius: 25, borderWidth: 3, justifyContent: 'center', minHeight: 58, shadowColor: '#2a190d', shadowOffset: { height: 5, width: 0 }, shadowOpacity: 0.42, shadowRadius: 3, width: 238 },
  menuButtonText: { color: '#fffdf3', fontSize: 18, fontWeight: '900', letterSpacing: 0.4, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { height: 2, width: 0 }, textShadowRadius: 2 },
  menuPanel: { gap: 13, position: 'absolute', right: 34, top: '38%' }, menuScene: { flex: 1, overflow: 'hidden' }, menuShade: { backgroundColor: 'rgba(5,44,61,0.12)', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  progressFill: { backgroundColor: '#f7c94c', borderRadius: 4, height: 7, width: '38%' }, progressTrack: { backgroundColor: '#c9d1b6', borderRadius: 4, height: 7, marginTop: 7, overflow: 'hidden', width: 145 },
  questAvatar: { alignItems: 'center', backgroundColor: '#f7bd64', borderColor: '#fff2d1', borderRadius: 24, borderWidth: 2, height: 48, justifyContent: 'center', width: 48 }, questAvatarText: { color: '#824823', fontSize: 22, fontWeight: '900' },
  questCard: { alignItems: 'center', backgroundColor: 'rgba(255,252,235,0.94)', borderColor: '#e6bc76', borderRadius: 18, borderWidth: 2, flexDirection: 'row', gap: 10, left: 92, paddingHorizontal: 12, paddingVertical: 9, position: 'absolute', top: 24 }, questEyebrow: { color: '#a57b3d', fontSize: 9, fontWeight: '900', letterSpacing: 0.7 }, questTitle: { color: '#4c3b27', fontSize: 14, fontWeight: '800', marginTop: 1 },
  redButton: { backgroundColor: '#cc4d3f' },
  resource: { alignItems: 'center', backgroundColor: 'rgba(12,48,64,0.86)', borderColor: 'rgba(255,255,255,0.32)', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 7, minWidth: 101, paddingHorizontal: 10, paddingVertical: 6 }, resourceLabel: { color: '#c8e7ee', fontSize: 8, fontWeight: '800', letterSpacing: 0.6 }, resourceMark: { borderColor: '#fff8d5', borderRadius: 10, borderWidth: 2, height: 20, width: 20 }, resourceValue: { color: '#fffdf6', fontSize: 17, fontWeight: '900', lineHeight: 19 }, resources: { flexDirection: 'row', gap: 8 },
  settingsCard: { alignItems: 'center', backgroundColor: 'rgba(31,77,88,0.95)', borderColor: '#fff2c4', borderRadius: 22, borderWidth: 2, padding: 20, width: 250 }, settingsCopy: { color: '#e5f6f1', fontSize: 13, lineHeight: 18, marginBottom: 16, textAlign: 'center' }, settingsTitle: { color: '#ffe06c', fontSize: 20, fontWeight: '900', marginBottom: 9 },
  topHud: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', left: 20, position: 'absolute', right: 20, top: 18 },
  worldAsset: { position: 'absolute' },
  worldLayer: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  rockA: { bottom: '10%', height: 90, left: '8%', width: 130 },
  rockB: { height: 72, right: '11%', top: '42%', width: 102 },
  treeOakA: { height: 175, left: '13%', top: '18%', width: 170 },
  treeOakB: { height: 128, right: '12%', top: '19%', width: 123 },
  treePineA: { height: 148, right: '23%', top: '48%', width: 118 },
  treePineB: { bottom: '18%', height: 116, left: '31%', width: 94 },
  zoomButton: { alignItems: 'center', backgroundColor: '#fdf0ca', borderColor: '#946430', borderRadius: 17, borderWidth: 2, height: 38, justifyContent: 'center', width: 38 }, zoomText: { color: '#6e4927', fontSize: 24, fontWeight: '900', lineHeight: 26 },
});
