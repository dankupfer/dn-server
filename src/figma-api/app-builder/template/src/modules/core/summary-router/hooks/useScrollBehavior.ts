// src/modules/core/summary-router/hooks/useScrollBehavior.ts
import { useState, useRef, useEffect } from 'react';
import { Platform } from 'react-native';

declare global {
  var document: any;
  var window: any;
}

interface ScrollBounds {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface UseScrollBehaviorOptions {
  enabled?: boolean;
  debugMode?: boolean;
  scrollEndTimeout?: number;
}

interface UseScrollBehaviorReturn {
  isScrolling: boolean;
  shouldHideBottomNav: boolean;
  measureScrollViewBounds: (scrollViewRef: any) => void;
  handleScroll: () => void;
  handleScrollEnd: () => void;
  handleScrollBeginDrag: () => void;
  handleScrollEndDrag: () => void;
}

export const useScrollBehavior = ({
  enabled = true,
  debugMode = false,
  scrollEndTimeout = 30000
}: UseScrollBehaviorOptions = {}): UseScrollBehaviorReturn => {

  const [isScrolling, setIsScrolling] = useState(false);
  const [shouldHideBottomNav, setShouldHideBottomNav] = useState(false);

  // Drag state tracking
  const dragState = useRef({
    isDragging: false,
    dragStartTime: 0,
    isPointerDown: false
  });

  // Fresh listener management
  const currentFreshListener = useRef<((event: any) => void) | null>(null);
  const scrollViewBounds = useRef<ScrollBounds | null>(null);
  const scrollEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Measure ScrollView bounds for coordinate filtering
  const measureScrollViewBounds = (scrollViewRef: any) => {
    if (Platform.OS === 'web' && scrollViewRef?.current) {
      const element = scrollViewRef.current as any;
      const rect = element.getBoundingClientRect();
      scrollViewBounds.current = {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right
      };
      if (debugMode) console.log('📐 ScrollView bounds measured:', scrollViewBounds.current);
    }
  };

  // Fresh listener strategy to handle React Native Web pointer capture issues
  const addFreshReleaseListener = () => {
    if (!enabled) return;

    // Clean up existing listener
    if (currentFreshListener.current) {
      document.removeEventListener("pointerup", currentFreshListener.current, true);
      document.removeEventListener("mouseup", currentFreshListener.current, true);
      document.removeEventListener("touchend", currentFreshListener.current, true);
    }

    const freshReleaseListener = (event: any) => {
      document.removeEventListener("pointerup", freshReleaseListener, true);
      document.removeEventListener("mouseup", freshReleaseListener, true);
      document.removeEventListener("touchend", freshReleaseListener, true);
      currentFreshListener.current = null;

      dragState.current.isDragging = false;
      dragState.current.isPointerDown = false;
      setIsScrolling(false);
      setShouldHideBottomNav(false);

      if (debugMode) console.log("✅ Scroll ended via fresh listener");
    };

    document.addEventListener("pointerup", freshReleaseListener, true);
    document.addEventListener("mouseup", freshReleaseListener, true);
    document.addEventListener("touchend", freshReleaseListener, true);
    currentFreshListener.current = freshReleaseListener;

    if (debugMode) console.log("🔄 Added fresh release listener");
  };

  const handleScrollEnd = () => {
    if (Platform.OS !== 'web') {
      if (scrollEndTimeoutRef.current) {
        clearTimeout(scrollEndTimeoutRef.current);
      }
      setIsScrolling(false);
      setShouldHideBottomNav(false);
      if (debugMode) console.log("✅ Native scroll ended - showing bottom nav");
    }
  };

  const handleScrollBeginDrag = () => {
    if (Platform.OS !== 'web') {
      setIsScrolling(true);
      setShouldHideBottomNav(true);
      if (debugMode) console.log("🟡 Native drag started - hiding bottom nav");
    }
  };

  const handleScrollEndDrag = () => {
    if (Platform.OS !== 'web') {
      setIsScrolling(false);
      setShouldHideBottomNav(false);
      if (debugMode) console.log("✅ Native drag ended - showing bottom nav");
    }
  };

  const handleScroll = () => {
    // console.log(55555)

    // For native platforms, directly trigger scroll behavior
    if (Platform.OS !== 'web') {
      setIsScrolling(true);
      setShouldHideBottomNav(true);

      // Set a timeout to reset the state after scrolling stops
      if (scrollEndTimeoutRef.current) {
        clearTimeout(scrollEndTimeoutRef.current);
      }
      scrollEndTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
        setShouldHideBottomNav(false);
        if (debugMode) console.log("⏰ Native scroll timeout - showing bottom nav");
      }, 1000); // Adjust timeout as needed

      return;
    }

    // Web logic (existing)
    if (!enabled || !dragState.current.isDragging) return;

    if (debugMode) console.log("📜 Scroll during drag - refreshing listener");
    addFreshReleaseListener();

    // Add timeout fallback
    // if (scrollEndTimeoutRef.current) {
    //   clearTimeout(scrollEndTimeoutRef.current);
    // }
    // scrollEndTimeoutRef.current = setTimeout(() => {
    //   if (dragState.current.isDragging) {
    //     if (debugMode) console.log("⏰ Timeout fallback - assuming scroll ended");
    //     dragState.current.isDragging = false;
    //     dragState.current.isPointerDown = false;
    //     setIsScrolling(false);
    //     setShouldHideBottomNav(false);
    //   }
    // }, scrollEndTimeout);
  };

  // Core scroll detection logic for web
  useEffect(() => {
    if (!enabled || Platform.OS !== "web") return;

    if (debugMode) console.log("🚀 Scroll behavior hook initialized");

    const handlePointerDown = (event: any) => {
      // Check if drag started inside ScrollView bounds
      const isInsideScrollView = scrollViewBounds.current &&
        event.clientY >= scrollViewBounds.current.top &&
        event.clientY <= scrollViewBounds.current.bottom &&
        event.clientX >= scrollViewBounds.current.left &&
        event.clientX <= scrollViewBounds.current.right;

      if (!isInsideScrollView) {
        if (debugMode) console.log("Ignoring pointer down outside ScrollView area");
        return;
      }

      dragState.current = {
        isDragging: false,
        dragStartTime: Date.now(),
        isPointerDown: true
      };
      setIsScrolling(false);
      setShouldHideBottomNav(false);
    };

    const handlePointerMove = (event: any) => {
      if (!dragState.current.isDragging && dragState.current.isPointerDown) {
        dragState.current.isDragging = true;
        setIsScrolling(true);
        setShouldHideBottomNav(true);

        // Add fresh listener with delay
        setTimeout(() => {
          if (dragState.current.isDragging) {
            addFreshReleaseListener();
            if (debugMode) console.log("Added delayed fresh listener");
          }
        }, 100);

        if (debugMode) console.log("🟡 Scroll started - hiding bottom nav");
      }
    };

    const handlePointerUp = (event: any) => {
      dragState.current.isPointerDown = false;
      const timeSinceStart = Date.now() - dragState.current.dragStartTime;

      if (dragState.current.isDragging && timeSinceStart > 100) {
        dragState.current.isDragging = false;
        setIsScrolling(false);
        setShouldHideBottomNav(false);
        if (debugMode) console.log("✅ Scroll ended via pointerup");
      }
    };

    const handlePointerCancel = (event: any) => {
      const timeSinceStart = Date.now() - dragState.current.dragStartTime;

      // Ignore immediate cancels (React Native Web cleanup)
      if (timeSinceStart < 200) {
        if (debugMode) console.log("Ignoring immediate cancel - keeping drag active");
        return;
      }

      // Only treat as real release if significant time passed
      if (dragState.current.isDragging && timeSinceStart > 500) {
        dragState.current.isDragging = false;
        dragState.current.isPointerDown = false;
        setIsScrolling(false);
        setShouldHideBottomNav(false);
        if (debugMode) console.log("✅ Scroll ended via long cancel");
      }
    };

    // Add all event listeners
    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("mousedown", handlePointerDown, true);
    document.addEventListener("touchstart", handlePointerDown, true);

    document.addEventListener("pointermove", handlePointerMove, true);
    document.addEventListener("mousemove", handlePointerMove, true);
    document.addEventListener("touchmove", handlePointerMove, true);

    document.addEventListener("pointerup", handlePointerUp, true);
    document.addEventListener("mouseup", handlePointerUp, true);
    document.addEventListener("touchend", handlePointerUp, true);

    document.addEventListener("pointercancel", handlePointerCancel, true);
    document.addEventListener("scroll", handleScroll, true);

    return () => {
      if (debugMode) console.log("🧹 Scroll behavior hook cleanup");

      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("mousedown", handlePointerDown, true);
      document.removeEventListener("touchstart", handlePointerDown, true);

      document.removeEventListener("pointermove", handlePointerMove, true);
      document.removeEventListener("mousemove", handlePointerMove, true);
      document.removeEventListener("touchmove", handlePointerMove, true);

      document.removeEventListener("pointerup", handlePointerUp, true);
      document.removeEventListener("mouseup", handlePointerUp, true);
      document.removeEventListener("touchend", handlePointerUp, true);

      document.removeEventListener("pointercancel", handlePointerCancel, true);
      document.removeEventListener("scroll", handleScroll, true);

      // Clean up fresh listener
      if (currentFreshListener.current) {
        document.removeEventListener("pointerup", currentFreshListener.current, true);
        document.removeEventListener("mouseup", currentFreshListener.current, true);
        document.removeEventListener("touchend", currentFreshListener.current, true);
      }

      // Clean up timeout
      if (scrollEndTimeoutRef.current) {
        clearTimeout(scrollEndTimeoutRef.current);
      }
    };
  }, [enabled, debugMode, scrollEndTimeout]);

  return {
    isScrolling,
    shouldHideBottomNav,
    measureScrollViewBounds,
    handleScroll,
    handleScrollEnd,
    handleScrollBeginDrag,
    handleScrollEndDrag
  };
};