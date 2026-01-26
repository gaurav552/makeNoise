/**
 * React Context for MakeNoise Player
 * 
 * Provides a React Context that makes the MakeNoise player instance
 * available to all child components without prop drilling.
 * 
 * Requirements: 11.4, 11.5
 */

import { createContext, useContext, useRef, type ReactNode } from 'react';
import { MakeNoise } from '../../core/MakeNoise';
// Import PlayerUI to register the custom element
import '../../ui/PlayerUI';

/**
 * Context for MakeNoise player instance
 */
const MediaPlayerContext = createContext<MakeNoise | null>(null);

/**
 * Props for MediaPlayerProvider component
 */
export interface MediaPlayerProviderProps {
  /** Child components that will have access to the player */
  children: ReactNode;
}

/**
 * MediaPlayerProvider component
 * 
 * Wraps your application (or part of it) to provide access to the
 * MakeNoise player instance via the useMediaPlayer hook.
 * 
 * The player instance is created once and persists for the lifetime
 * of the provider component.
 * 
 * @param props - Component props
 * @returns Provider component
 * 
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <MediaPlayerProvider>
 *       <MyPlayerComponent />
 *       <MyPlaylistComponent />
 *     </MediaPlayerProvider>
 *   );
 * }
 * ```
 */
export function MediaPlayerProvider({ children }: MediaPlayerProviderProps) {
  // Use ref to hold Player instance (persists across renders)
  // Initialize on first render using lazy initialization
  const playerRef = useRef<MakeNoise>(MakeNoise.getInstance());

  return (
    <MediaPlayerContext.Provider value={playerRef.current}>
      {children}
    </MediaPlayerContext.Provider>
  );
}

/**
 * Hook to access the MakeNoise player instance from context
 * 
 * Must be used within a MediaPlayerProvider component.
 * Throws an error if used outside of a provider.
 * 
 * @returns The MakeNoise player instance
 * @throws Error if used outside MediaPlayerProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const player = useMediaPlayer();
 *   
 *   const handlePlay = () => {
 *     player.play();
 *   };
 *   
 *   return <button onClick={handlePlay}>Play</button>;
 * }
 * ```
 */
export function useMediaPlayer(): MakeNoise {
  const player = useContext(MediaPlayerContext);
  
  if (!player) {
    throw new Error(
      'useMediaPlayer must be used within a MediaPlayerProvider. ' +
      'Wrap your component tree with <MediaPlayerProvider> to use this hook.'
    );
  }
  
  return player;
}
