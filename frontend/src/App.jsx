import React, { useState, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LobbyPage from './pages/LobbyPage';
import { clearActiveMatch } from './utils/activeMatchStorage.js';

// Tối ưu Tải Trang: Code-Splitting các màn hình game nặng bằng React.lazy (Task 5)
const AuthPage = lazy(() => import('./pages/AuthPage'));
const GameBoard = lazy(() => import('./pages/GameBoard'));
const OnlineGameBoard = lazy(() => import('./pages/OnlineGameBoard'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const GameRulesPage = lazy(() => import('./pages/GameRulesPage'));

// Fallback Loading Cyberpunk mượt mà siêu nhẹ
function ScreenLoader() {
  return (
    <div className="min-h-screen bg-[#0b0e17] flex flex-col items-center justify-center text-cyan-400 gap-3 font-mono">
      <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-xs tracking-wider uppercase text-slate-300">Đang tải đấu trường NEO-UNO...</span>
    </div>
  );
}

function MainApp() {
  const { user } = useAuth();
  const [onlineRoom, setOnlineRoom] = useState(() => {
    try {
      const saved = sessionStorage.getItem('neo_online_room');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  // MẶC ĐỊNH VÀO SẢNH CHÍNH (LOBBY) TRỪ KHI ĐANG TRONG TRẬN ĐẤU BẠN BÈ ONLINE
  const [currentScreen, setCurrentScreen] = useState(() => {
    try {
      const saved = sessionStorage.getItem('neo_online_room');
      return saved ? 'online_game' : 'lobby';
    } catch {
      return 'lobby';
    }
  }); // 'lobby' | 'auth' | 'forgot_password' | 'game' | 'online_game' | 'rules'
  const [matchConfig, setMatchConfig] = useState({ botCount: 3, timeLimit: 300 });
  const [restoredMatchState, setRestoredMatchState] = useState(null);

  const handleStartGame = (config, restoredState = null) => {
    if (config) setMatchConfig(config);
    setRestoredMatchState(restoredState || null);
    setCurrentScreen('game');
  };

  const handleStartOnlineMatch = (room) => {
    clearActiveMatch();
    try {
      sessionStorage.setItem('neo_online_room', JSON.stringify(room));
    } catch {}
    setOnlineRoom(room);
    setCurrentScreen('online_game');
  };

  if (currentScreen === 'auth') {
    return (
      <Suspense fallback={<ScreenLoader />}>
        <AuthPage
          onEnterGameWithBot={() => setCurrentScreen('lobby')}
          onForgotPassword={() => setCurrentScreen('forgot_password')}
          onBackToLobby={() => setCurrentScreen('lobby')}
        />
      </Suspense>
    );
  }

  if (currentScreen === 'forgot_password') {
    return (
      <Suspense fallback={<ScreenLoader />}>
        <ForgotPasswordPage
          onBackToLogin={() => setCurrentScreen('auth')}
          onSuccessLogin={() => setCurrentScreen('auth')}
        />
      </Suspense>
    );
  }

  if (currentScreen === 'rules') {
    return (
      <Suspense fallback={<ScreenLoader />}>
        <GameRulesPage
          onBackToLobby={() => setCurrentScreen('lobby')}
          onStartMatch={() => handleStartGame()}
        />
      </Suspense>
    );
  }

  if (currentScreen === 'game') {
    return (
      <Suspense fallback={<ScreenLoader />}>
        <GameBoard
          matchConfig={matchConfig}
          restoredMatchState={restoredMatchState}
          onBack={(opt) => {
            setRestoredMatchState(null);
            setCurrentScreen('lobby');
            if (opt?.returnToTournament) {
              try {
                sessionStorage.setItem('neo_open_tournament', 'true');
              } catch {}
            }
          }}
        />
      </Suspense>
    );
  }

  if (currentScreen === 'online_game') {
    return (
      <Suspense fallback={<ScreenLoader />}>
        <OnlineGameBoard
          room={onlineRoom}
          user={user}
          onBack={() => {
            try {
              sessionStorage.removeItem('neo_online_room');
            } catch {}
            setOnlineRoom(null);
            setCurrentScreen('lobby');
          }}
        />
      </Suspense>
    );
  }

  // MẶC ĐỊNH LÀ SẢNH CHÍNH (LOBBY)
  return (
    <LobbyPage
      onJoinOfflineMatch={handleStartGame}
      onJoinOnlineMatch={handleStartOnlineMatch}
      onOpenRules={() => setCurrentScreen('rules')}
      onOpenAuth={() => setCurrentScreen('auth')}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}