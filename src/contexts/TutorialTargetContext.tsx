import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  LayoutChangeEvent,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";

export type TutorialTargetRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type TutorialTargetContextValue = {
  targets: Record<string, TutorialTargetRect | undefined>;
  setTarget: (id: string, rect: TutorialTargetRect) => void;
  removeTarget: (id: string) => void;
};

const TutorialTargetContext =
  createContext<TutorialTargetContextValue | null>(null);

export function TutorialTargetProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [targets, setTargets] = useState<
    Record<string, TutorialTargetRect | undefined>
  >({});

  const setTarget = useCallback((id: string, rect: TutorialTargetRect) => {
    setTargets((prev) => {
      const current = prev[id];
      if (
        current &&
        Math.abs(current.x - rect.x) < 0.5 &&
        Math.abs(current.y - rect.y) < 0.5 &&
        Math.abs(current.width - rect.width) < 0.5 &&
        Math.abs(current.height - rect.height) < 0.5
      ) {
        return prev;
      }

      return { ...prev, [id]: rect };
    });
  }, []);

  const removeTarget = useCallback((id: string) => {
    setTargets((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ targets, setTarget, removeTarget }),
    [removeTarget, setTarget, targets],
  );

  return (
    <TutorialTargetContext.Provider value={value}>
      {children}
    </TutorialTargetContext.Provider>
  );
}

export function useTutorialTargetRect(id?: string) {
  const context = useContext(TutorialTargetContext);
  return id && context ? context.targets[id] : undefined;
}

export function TutorialTarget({
  id,
  children,
  style,
}: {
  id: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const context = useContext(TutorialTargetContext);
  const ref = useRef<View>(null);

  const measure = useCallback(() => {
    if (!context) return;
    requestAnimationFrame(() => {
      ref.current?.measureInWindow((x, y, width, height) => {
        if (width <= 0 || height <= 0) return;
        context.setTarget(id, { x, y, width, height });
      });
    });
  }, [context, id]);

  const handleLayout = useCallback(
    (_event: LayoutChangeEvent) => {
      measure();
    },
    [measure],
  );

  React.useEffect(() => {
    measure();
    const retry = setTimeout(measure, 350);

    return () => {
      clearTimeout(retry);
      context?.removeTarget(id);
    };
  }, [context, id, measure]);

  return (
    <View
      ref={ref}
      collapsable={false}
      onLayout={handleLayout}
      style={style}
    >
      {children}
    </View>
  );
}
