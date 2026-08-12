// src/App.tsx
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'; 
import './styles/App.css';
import type { GameState } from './types';

import { useSplendorSocket } from './hooks/useSplendorSocket';
import { useGameAnimations } from './hooks/useGameAnimations';

import { ToastContainer } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css';

import { Lobby } from './components/Lobby';  
import { HowToPlay } from './components/HowToPlay';
import ImagePreloader, { preloadImages } from './components/ImagePreloader'; 
import LoadingScreen from './components/LoadingScreen';   
import { getCriticalUIAssets, getSpecificGameAssets } from './assetUtils';      
import { GameScreen } from './components/GameScreen';
import { IMAGE_BASE_URL } from './constants'; // <-- Ensure this is imported

const StartVideoPlayer: React.FC<{ onEnded: () => void }> = ({ onEnded }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().catch((err) => {
                console.warn("Video autoplay failed:", err);
                if (videoRef.current) {
                    videoRef.current.muted = true;
                    videoRef.current.play().catch(() => {
                        onEnded();
                    });
                }
            });
        }
    }, [onEnded]);

    return (
        <div className="game-container">
            <video
                ref={videoRef}
                src="/images/start.mp4"
                poster="/images/background.png"
                playsInline
                onEnded={onEnded}
                onError={onEnded}
                style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', objectFit: 'fill', zIndex: 10000 }}
            />
        </div>
    );
};

function App() {
  const [playerName, setPlayerName] = useState(() => sessionStorage.getItem("playerName") || "");
  // --- NEW: Track selected color ---
  const [playerColor, setPlayerColor] = useState(() => sessionStorage.getItem("playerColor") || "blue");
  const [useGreyBg, setUseGreyBg] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsJoined] = useState(!!sessionStorage.getItem("playerName"));
  const [theme, setTheme] = useState<'dark' | 'light'>('dark'); 
  const [uiAssetsLoaded, setUiAssetsLoaded] = useState(false); 
  const [gameAssetsLoaded, setGameAssetsLoaded] = useState(false);  
  const uiAssetUrls = useMemo(() => getCriticalUIAssets(), []);  
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [isAwaitingServer, setIsAwaitingServer] = useState(false);
  
  const { animations, animationEndTime, triggerAnimation, removeAnimation } = useGameAnimations(); 

  const [hasPlayedStartVideo, setHasPlayedStartVideo] = useState(() => sessionStorage.getItem("startVideoPlayed") === "true");

  useEffect(() => {
      if (gameState?.status === 'lobby') {
          setHasPlayedStartVideo(false);
          sessionStorage.removeItem("startVideoPlayed");
      }
  }, [gameState?.status]);

  const handleVideoEnded = useCallback(() => {
      setHasPlayedStartVideo(true);
      sessionStorage.setItem("startVideoPlayed", "true");
  }, []);

  const handleStateUpdate = useCallback((newState: GameState) => {
      setGameState(newState);
      setIsAwaitingServer(false);
  }, []);

  const { sendMoveRaw } = useSplendorSocket(playerName, playerColor, isConnected, animationEndTime, handleStateUpdate);

  // Update Preload Effect
  useEffect(() => {
      if (gameState?.status === 'active' && !gameAssetsLoaded) {
          const style = gameState.deck_style || 'original';
          const specificAssets = getSpecificGameAssets(style);
          const mode = theme === 'dark' ? 'dark' : 'light';
          
          // Preload EVERY player's active color, plus grey
          const colorsToLoad = new Set(gameState.players.map(p => p.color));
          colorsToLoad.add('grey');
          
          colorsToLoad.forEach(c => {
              if (c) {
                  specificAssets.push(
                      `${IMAGE_BASE_URL}/images/backgrounds/${mode}1${c}.png`,
                      `${IMAGE_BASE_URL}/images/backgrounds/${mode}2${c}.png`,
                      `${IMAGE_BASE_URL}/images/backgrounds/${mode}3${c}.png`
                  );
              }
          });

          preloadImages(specificAssets).then(() => setGameAssetsLoaded(true));
      }
  }, [gameState?.status, gameState?.deck_style, gameAssetsLoaded, theme, gameState?.players]);

  const joinGame = () => {
    sessionStorage.setItem('playerName', playerName);
    sessionStorage.setItem('playerColor', playerColor); // Save color pref
    setIsJoined(true);
  };

  if (!uiAssetsLoaded) {
    return (
      <>
        <ImagePreloader imageUrls={uiAssetUrls} onComplete={() => setUiAssetsLoaded(true)} />
        <LoadingScreen />
      </>
    );
  }

  if (gameState?.status === 'active' && !hasPlayedStartVideo) {
      return <StartVideoPlayer onEnded={handleVideoEnded} />;
  }

  if (gameState?.status === 'active' && !gameAssetsLoaded) return <LoadingScreen />;

  if (!isConnected || (gameState && gameState.status === 'lobby')) {
      return (
          <>
              <ToastContainer theme="dark" />
              <Lobby 
                  isConnected={isConnected}
                  playerName={playerName}
                  setPlayerName={setPlayerName}
                  playerColor={playerColor}           // Pass down color props
                  setPlayerColor={setPlayerColor}
                  joinGame={joinGame}
                  players={gameState?.players}
                  sendMove={sendMoveRaw}
                  onOpenHowToPlay={() => setShowHowToPlay(true)}
              />
              {showHowToPlay && <HowToPlay onClose={() => setShowHowToPlay(false)} />}
          </>
      );
  }

  if (!gameState) return <div className="loading">Connecting...</div>; 

  return (
    <>
      <ToastContainer theme="dark" />
      <GameScreen 
        playerName={playerName}
        playerColor={playerColor}  // Pass down color to GameScreen
        gameState={gameState}
        theme={theme}
        onThemeToggle={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
        useGreyBg={useGreyBg}
        setUseGreyBg={setUseGreyBg}
        showHowToPlay={showHowToPlay}
        setShowHowToPlay={setShowHowToPlay}
        sendMoveRaw={sendMoveRaw}
        isAwaitingServer={isAwaitingServer}
        setIsAwaitingServer={setIsAwaitingServer}
        animations={animations}
        triggerAnimation={triggerAnimation}
        removeAnimation={removeAnimation}
      />
    </>
  );
}

export default App;