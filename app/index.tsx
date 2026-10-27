import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, ImageBackground, PanResponder, Pressable, SafeAreaView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { islandTiles } from '../constants/islandTiles';

type Screen = 'menu' | 'island' | 'settings' | 'admin';

const GRID_SIZE = 10;
const WORLD_CELL = 90;
const BOARD_W = GRID_SIZE * WORLD_CELL;
const BOARD_H = GRID_SIZE * WORLD_CELL;

const menuArt = require('../assets/menu-coastal-farm.png');
const waveOverlay = require('../assets/wave-overlay.png');

export default function HomeScreen() {
  const viewport = useWindowDimensions();
  const [screen, setScreen] = useState<Screen>('menu');
  const [zoom, setZoom] = useState(1.08);
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const cameraStart = useRef({ x: 0, y: 0 });
  const waveDrift = useRef(new Animated.Value(0)).current;
  const wavePulse = useRef(new Animated.Value(0)).current;

  const fitIsland = () => {
    setCamera({ x: 0, y: 0 });
    setZoom(Math.min(1.18, Math.max((viewport.width + 8) / BOARD_W, (viewport.height + 8) / BOARD_H)));
  };

  useEffect(() => {
    const drift = Animated.loop(Animated.sequence([
      Animated.timing(waveDrift, { duration: 4400, easing: Easing.inOut(Easing.sin), toValue: 1, useNativeDriver: true }),
      Animated.timing(waveDrift, { duration: 4400, easing: Easing.inOut(Easing.sin), toValue: 0, useNativeDriver: true }),
    ]));
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(wavePulse, { duration: 2800, toValue: 1, useNativeDriver: true }),
      Animated.timing(wavePulse, { duration: 2800, toValue: 0, useNativeDriver: true }),
    ]));
    drift.start(); pulse.start();
    return () => { drift.stop(); pulse.stop(); };
  }, [waveDrift, wavePulse]);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) + Math.abs(gesture.dy) > 4,
    onPanResponderGrant: () => { cameraStart.current = camera; },
    onPanResponderMove: (_, gesture) => setCamera({
      x: Math.max(-430, Math.min(430, cameraStart.current.x + gesture.dx)),
      y: Math.max(-330, Math.min(330, cameraStart.current.y + gesture.dy)),
    }),
  }), [camera]);

  if (screen === 'island') {
    return <SafeAreaView style={styles.app}>
      <ImageBackground source={islandTiles[0][4]} resizeMode="cover" style={styles.islandScene} {...panResponder.panHandlers}>
        <Animated.View pointerEvents="none" style={[styles.waveLayer, styles.waveA, {
          opacity: wavePulse.interpolate({ inputRange: [0, 1], outputRange: [0.14, 0.30] }),
          transform: [{ translateX: waveDrift.interpolate({ inputRange: [0, 1], outputRange: [-42, 32] }) }],
        }]}><Image source={waveOverlay} resizeMode="stretch" style={styles.waveImage} /></Animated.View>
        <Animated.View pointerEvents="none" style={[styles.waveLayer, styles.waveB, {
          opacity: wavePulse.interpolate({ inputRange: [0, 1], outputRange: [0.27, 0.11] }),
          transform: [{ translateX: waveDrift.interpolate({ inputRange: [0, 1], outputRange: [35, -34] }) }, { scaleX: -1 }],
        }]}><Image source={waveOverlay} resizeMode="stretch" style={styles.waveImage} /></Animated.View>

        <View pointerEvents="none" style={[styles.worldLayer, { transform: [{ translateX: camera.x }, { translateY: camera.y }, { scale: zoom }] }]}>
          <View style={styles.tileBoard}>{islandTiles.flatMap((row, rowIndex) => row.map((source, columnIndex) => <IslandPiece key={`${rowIndex}-${columnIndex}`} source={source} row={rowIndex} column={columnIndex} />))}</View>
        </View>

        <GameHud setScreen={setScreen} zoom={zoom} setZoom={setZoom} onFit={fitIsland} />
      </ImageBackground>
      <StatusBar style="light" />
    </SafeAreaView>;
  }

  return <SafeAreaView style={styles.app}>
    <ImageBackground source={menuArt} resizeMode="cover" style={styles.menuScene}>
      <View style={styles.menuShade} />
      <View style={styles.logoLockup}><Text style={styles.logoTiny}>TINY</Text><Text style={styles.logoIsland}>ISLAND</Text><Text style={styles.logoTagline}>Küçük bir ada, büyük hayaller.</Text></View>
      <View style={styles.menuPanel}>{screen === 'settings' ? <InfoCard title="AYARLAR" copy="Ses, bildirimler ve dil seçenekleri yakında burada olacak." onBack={() => setScreen('menu')} /> : screen === 'admin' ? <InfoCard title="ADMIN PANELİ" copy="Ağaç ve taş yerleştirme araçları için ayrılan yönetim alanı." onBack={() => setScreen('menu')} /> : <>
        <MenuButton title="OYUNA BAŞLA" color="green" onPress={() => { fitIsland(); setScreen('island'); }} />
        <MenuButton title="AYARLAR" color="gold" onPress={() => setScreen('settings')} />
        <MenuButton title="ADMIN PANELİ" color="blue" onPress={() => setScreen('admin')} />
        <MenuButton title="ÇIKIŞ" color="red" onPress={() => setScreen('menu')} />
      </>}</View>
    </ImageBackground>
    <StatusBar style="light" />
  </SafeAreaView>;
}

function IslandPiece({ source, row, column }: { source: number; row: number; column: number }) {
  return <Image source={source} resizeMode="stretch" style={[styles.islandPiece, { left: column * WORLD_CELL - 0.35, top: row * WORLD_CELL - 0.35 }]} />;
}

function GameHud({ setScreen, zoom, setZoom, onFit }: { setScreen: (screen: Screen) => void; zoom: number; setZoom: (value: number) => void; onFit: () => void }) {
  return <>
    <View pointerEvents="none" style={styles.topHud}><View style={styles.levelChip}><Text style={styles.levelText}>Lv. 1</Text></View><View style={styles.resources}><Resource label="ALTIN" value="1.250" tone="gold" /><Resource label="ELMAS" value="50" tone="blue" /></View></View>
    <View pointerEvents="none" style={styles.questCard}><View style={styles.questAvatar}><Text style={styles.questAvatarText}>M</Text></View><View><Text style={styles.questEyebrow}>GÜNLÜK GÖREV</Text><Text style={styles.questTitle}>Köyün için yer aç</Text><View style={styles.progressTrack}><View style={styles.progressFill} /></View></View></View>
    <View style={styles.leftRail}><HudButton label="HARİTA" /><HudButton label="GÖREV" /><HudButton label="ÇANTA" /></View>
    <View style={styles.cameraControls}><Pressable style={styles.fitButton} onPress={onFit}><Text style={styles.fitText}>ADAYI GÖR</Text></Pressable><Pressable style={styles.zoomButton} onPress={() => setZoom(Math.min(1.45, zoom + 0.08))}><Text style={styles.zoomText}>+</Text></Pressable><Pressable style={styles.zoomButton} onPress={() => setZoom(Math.max(0.42, zoom - 0.08))}><Text style={styles.zoomText}>−</Text></Pressable></View>
    <Pressable style={styles.backButton} onPress={() => setScreen('menu')}><Text style={styles.backText}>MENÜ</Text></Pressable>
    <View pointerEvents="none" style={styles.cameraHint}><Text style={styles.cameraHintText}>10 × 10 PARÇADAN OLUŞAN ADA  •  Sürükle: kamerayı hareket ettir</Text></View>
  </>;
}

function InfoCard({ title, copy, onBack }: { title: string; copy: string; onBack: () => void }) { return <View style={styles.settingsCard}><Text style={styles.settingsTitle}>{title}</Text><Text style={styles.settingsCopy}>{copy}</Text><MenuButton title="GERİ DÖN" color="blue" onPress={onBack} /></View>; }
function MenuButton({ title, color, onPress }: { title: string; color: 'green' | 'gold' | 'red' | 'blue'; onPress: () => void }) { const background = color === 'green' ? styles.greenButton : color === 'gold' ? styles.goldButton : color === 'red' ? styles.redButton : styles.blueButton; return <Pressable style={[styles.menuButton, background]} onPress={onPress}><Text style={styles.menuButtonText}>{title}</Text></Pressable>; }
function Resource({ label, value, tone }: { label: string; value: string; tone: 'gold' | 'blue' }) { return <View style={styles.resource}><View style={[styles.resourceMark, tone === 'gold' ? styles.goldMark : styles.blueMark]} /><View><Text style={styles.resourceLabel}>{label}</Text><Text style={styles.resourceValue}>{value}</Text></View></View>; }
function HudButton({ label }: { label: string }) { return <Pressable style={styles.hudButton}><Text style={styles.hudButtonText}>{label}</Text></Pressable>; }

const styles = StyleSheet.create({
  app: { backgroundColor: '#071d2e', flex: 1 }, islandScene: { backgroundColor: '#159bd0', flex: 1, overflow: 'hidden' },
  waveLayer: { height: '47%', position: 'absolute', width: '116%' }, waveImage: { height: '100%', width: '100%' }, waveA: { left: '-8%', top: '2%' }, waveB: { bottom: '-3%', left: '-8%' },
  worldLayer: { alignItems: 'center', bottom: 0, justifyContent: 'center', left: 0, position: 'absolute', right: 0, top: 0 }, tileBoard: { height: BOARD_H, position: 'relative', width: BOARD_W }, islandPiece: { height: WORLD_CELL + 0.7, position: 'absolute', width: WORLD_CELL + 0.7 },
  backButton: { backgroundColor: '#6b4321', borderColor: '#f4ce8c', borderRadius: 18, borderWidth: 2, bottom: 22, left: 24, paddingHorizontal: 18, paddingVertical: 10, position: 'absolute' }, backText: { color: '#fff9e9', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  cameraControls: { bottom: 22, flexDirection: 'row', gap: 8, position: 'absolute', right: 24 }, cameraHint: { alignSelf: 'center', backgroundColor: 'rgba(9,39,48,0.72)', borderRadius: 12, bottom: 20, paddingHorizontal: 14, paddingVertical: 7, position: 'absolute' }, cameraHintText: { color: '#e8fff5', fontSize: 10, fontWeight: '700' }, zoomButton: { alignItems: 'center', backgroundColor: '#fdf0ca', borderColor: '#946430', borderRadius: 17, borderWidth: 2, height: 38, justifyContent: 'center', width: 38 }, zoomText: { color: '#6e4927', fontSize: 24, fontWeight: '900', lineHeight: 26 }, fitButton: { alignItems: 'center', backgroundColor: '#3d8e67', borderColor: '#d5f2ae', borderRadius: 17, borderWidth: 2, height: 38, justifyContent: 'center', paddingHorizontal: 13 }, fitText: { color: '#fffceb', fontSize: 9, fontWeight: '900' },
  leftRail: { gap: 8, left: 20, position: 'absolute', top: 104 }, hudButton: { alignItems: 'center', backgroundColor: '#ebfaf5', borderColor: '#7fbfb8', borderRadius: 14, borderWidth: 2, height: 54, justifyContent: 'center', width: 62 }, hudButtonText: { color: '#245a58', fontSize: 9, fontWeight: '900' }, topHud: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', left: 20, position: 'absolute', right: 20, top: 18 }, levelChip: { backgroundColor: '#295f36', borderColor: '#b5ef83', borderRadius: 18, borderWidth: 2, paddingHorizontal: 14, paddingVertical: 8 }, levelText: { color: 'white', fontSize: 14, fontWeight: '900' },
  resources: { flexDirection: 'row', gap: 8 }, resource: { alignItems: 'center', backgroundColor: 'rgba(12,48,64,0.86)', borderColor: 'rgba(255,255,255,0.32)', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 7, minWidth: 101, paddingHorizontal: 10, paddingVertical: 6 }, resourceLabel: { color: '#c8e7ee', fontSize: 8, fontWeight: '800' }, resourceMark: { borderColor: '#fff8d5', borderRadius: 10, borderWidth: 2, height: 20, width: 20 }, resourceValue: { color: '#fffdf6', fontSize: 17, fontWeight: '900' }, goldMark: { backgroundColor: '#ffcf3f' }, blueMark: { backgroundColor: '#4bc7ff' },
  questCard: { alignItems: 'center', backgroundColor: 'rgba(255,252,235,0.94)', borderColor: '#e6bc76', borderRadius: 18, borderWidth: 2, flexDirection: 'row', gap: 10, left: 92, paddingHorizontal: 12, paddingVertical: 9, position: 'absolute', top: 24 }, questAvatar: { alignItems: 'center', backgroundColor: '#f7bd64', borderRadius: 24, height: 48, justifyContent: 'center', width: 48 }, questAvatarText: { color: '#824823', fontSize: 22, fontWeight: '900' }, questEyebrow: { color: '#a57b3d', fontSize: 9, fontWeight: '900' }, questTitle: { color: '#4c3b27', fontSize: 14, fontWeight: '800' }, progressTrack: { backgroundColor: '#c9d1b6', borderRadius: 4, height: 7, marginTop: 7, overflow: 'hidden', width: 145 }, progressFill: { backgroundColor: '#f7c94c', height: 7, width: '38%' },
  menuScene: { flex: 1, overflow: 'hidden' }, menuShade: { backgroundColor: 'rgba(5,44,61,0.12)', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }, logoLockup: { left: 36, position: 'absolute', top: 28 }, logoTiny: { color: '#ffcf42', fontSize: 36, fontWeight: '900', lineHeight: 35, textShadowColor: '#9d3c0f', textShadowOffset: { height: 4, width: 0 }, textShadowRadius: 2 }, logoIsland: { color: '#fff6df', fontSize: 47, fontWeight: '900', lineHeight: 48, textShadowColor: '#5a2c12', textShadowOffset: { height: 4, width: 0 }, textShadowRadius: 2 }, logoTagline: { color: '#fff8df', fontSize: 13, fontWeight: '800', marginTop: 10 },
  menuPanel: { gap: 9, position: 'absolute', right: 34, top: '28%' }, menuButton: { alignItems: 'center', borderColor: '#fff3c8', borderRadius: 25, borderWidth: 3, justifyContent: 'center', minHeight: 52, width: 238 }, menuButtonText: { color: '#fffdf3', fontSize: 17, fontWeight: '900' }, greenButton: { backgroundColor: '#4baf29' }, goldButton: { backgroundColor: '#ee9d1c' }, redButton: { backgroundColor: '#cc4d3f' }, blueButton: { backgroundColor: '#2587d8' }, settingsCard: { alignItems: 'center', backgroundColor: 'rgba(31,77,88,0.95)', borderColor: '#fff2c4', borderRadius: 22, borderWidth: 2, padding: 20, width: 270 }, settingsCopy: { color: '#e5f6f1', fontSize: 13, lineHeight: 18, marginBottom: 16, textAlign: 'center' }, settingsTitle: { color: '#ffe06c', fontSize: 20, fontWeight: '900', marginBottom: 9 },
});
