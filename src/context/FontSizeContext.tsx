import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type FontSizeContextType = {
  fontScale: number;
  setFontScale: (scale: number) => Promise<void>;
};

export const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

const FONT_SIZE_KEY = '@app_font_scale';

export const FontSizeProvider = ({ children }: { children: React.ReactNode }) => {
  const [fontScale, setFontScaleState] = useState<number>(1);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(FONT_SIZE_KEY);
        if (saved) {
          const parsed = parseFloat(saved);
          if (!isNaN(parsed)) setFontScaleState(parsed);
        }
      } catch (e) {
        console.error('Failed to load font scale', e);
      }
    };
    load();
  }, []);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setFontScale = async (scale: number) => {
    // Update the react state immediately so UI updates in real-time
    setFontScaleState(scale);

    // Debounce the AsyncStorage filesystem write to prevent UI thread lag
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(FONT_SIZE_KEY, scale.toString());
      } catch (e) {
        console.error('Failed to save font scale', e);
      }
    }, 250); // 250ms debounce
  };

  return (
    <FontSizeContext.Provider value={{ fontScale, setFontScale }}>
      {children}
    </FontSizeContext.Provider>
  );
};

export const useFontScale = () => {
  const context = useContext(FontSizeContext);
  if (!context) {
    throw new Error('useFontScale must be used within a FontSizeProvider');
  }
  return context;
};

// Apply global monkey patch to React Native's Text component
try {
  const { Text: RNText, StyleSheet: RNStyleSheet } = require('react-native');
  
  if (RNText && !RNText.__patched) {
    const OriginalText = RNText;
    
    const PatchedText = React.forwardRef((props: any, ref: any) => {
      let scaledStyle = props.style;
      try {
        const { fontScale } = useFontScale();
        if (fontScale !== 1) {
          const flat = RNStyleSheet.flatten(props.style || {});
          const newStyle = { ...flat };
          
          const baseFontSize = newStyle.fontSize ?? 14;
          newStyle.fontSize = baseFontSize * fontScale;
          
          if (typeof newStyle.lineHeight === 'number') {
            newStyle.lineHeight = newStyle.lineHeight * fontScale;
          }
          scaledStyle = newStyle;
        }
      } catch (e) {
        // Fallback if context is not available (e.g. rendered outside provider)
      }
      
      return <OriginalText {...props} style={scaledStyle} ref={ref} />;
    });
    
    (PatchedText as any).__patched = true;
    
    // Copy all static properties of the original component
    Object.keys(OriginalText).forEach((key) => {
      (PatchedText as any)[key] = (OriginalText as any)[key];
    });
    
    // Override the exported Text property on the react-native module
    const RNModule = require('react-native');
    try {
      Object.defineProperty(RNModule, 'Text', {
        get() {
          return PatchedText;
        },
        configurable: true,
        enumerable: true,
      });
    } catch (err) {
      try {
        RNModule.Text = PatchedText;
      } catch (err2) {
        console.error('Failed to override Text property via direct assignment', err2);
      }
    }
  }
} catch (e) {
  console.error('Failed to apply global Text font scale patch', e);
}

