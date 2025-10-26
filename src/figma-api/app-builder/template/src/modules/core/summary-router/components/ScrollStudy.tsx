/**
 * ScrollStudy.tsx - Advanced Scroll Detection for React Native Web
 * 
 * PROBLEM SOLVED:
 * React Native Web has a complex issue where pointer release events get "swallowed" 
 * when dragging starts from interactive elements (TouchableOpacity, Pressable, etc.).
 * This makes it impossible to detect when a user finishes scrolling by releasing 
 * their finger/mouse after starting a drag from a button or tile.
 * 
 * THE SOLUTION - "Fresh Listener Strategy":
 * 1. Track pointer down/move events globally at document level with coordinate filtering
 * 2. Only activate scroll detection for drags that start inside the ScrollView bounds
 * 3. When drag starts, React Native Web immediately cancels the original pointer
 * 4. Add delayed fresh listeners to avoid immediate cancel interference
 * 5. On EVERY scroll event during drag, refresh the pointer release listener
 * 6. These "fresh" listeners aren't affected by the original pointer capture/cancel
 * 7. When user releases, the most recent fresh listener catches it successfully
 * 
 * HOW IT WORKS:
 * - Document-level capture phase listeners detect initial pointer down/move
 * - Coordinate-based filtering ensures only ScrollView drags are tracked
 * - Multiple fallback strategies (pointerup, mouseup, touchend) for cross-platform support
 * - Constantly refreshing release listeners during scroll ensures detection
 * - Intelligent timing thresholds prevent false triggers from React Native Web cleanup
 * - Visual indicators show scroll detection state vs normal click interactions
 * - Both systems work independently: clicks fire normally, scroll detection works reliably
 * 
 * KEY FEATURES:
 * - Header/non-scrollable area isolation - no false triggers
 * - Debug flag (ENABLE_SCROLL_DEBUG) for easy troubleshooting
 * - Production-ready with silent mode
 * - Robust timing-based filtering of React Native Web's internal events
 * 
 * CROSS-PLATFORM NOTES:
 * - Web: Uses pointer events + mouse events + touch events for maximum coverage
 * - iOS/Android: Should work via touch events, but responder system may be more reliable
 * - The strategy of refreshing listeners during scroll should work across platforms
 * 
 * INTEGRATION:
 * Replace the setIsScrollDetectionActive calls with your actual scroll handlers:
 * - setIsScrollDetectionActive(true) → Hide bottom navigation/menu
 * - setIsScrollDetectionActive(false) → Show bottom navigation/menu
 * - Add scroll animations, state resets, etc.
 * 
 * This technique solves one of React Native Web's most challenging interaction problems.
 */

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  Pressable,
} from "react-native";

// Debug flag - set to false to disable all console logs
const ENABLE_SCROLL_DEBUG = false;

declare global {
  var window: any;
}

export default function BasicApp() {
  const [isScrollDetectionActive, setIsScrollDetectionActive] = useState(false);

  // Add drag state tracking
  const dragState = useRef({
    isDragging: false,
    dragStartTime: 0,
    releaseCount: 0,
    isPointerDown: false
  });

  // Track current fresh listener for the winning strategy
  const currentFreshListener = useRef<((event: any) => void) | null>(null);
  
  // Track ScrollView bounds
  const scrollViewRef = useRef<any>(null);
  const scrollViewBounds = useRef<{ top: number; bottom: number; left: number; right: number } | null>(null);

  // Measure ScrollView bounds
  useEffect(() => {
    if (Platform.OS === 'web') {
      const measureScrollView = () => {
        if (scrollViewRef.current) {
          const element = scrollViewRef.current;
          const rect = element.getBoundingClientRect();
          scrollViewBounds.current = {
            top: rect.top,
            bottom: rect.bottom,
            left: rect.left,
            right: rect.right
          };
        }
      };

      const timer = setTimeout(measureScrollView, 100);
      window.addEventListener('resize', measureScrollView);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', measureScrollView);
      };
    }
  }, []);

  // Add empty useEffect hook structure for web detection
  useEffect(() => {
    if (Platform.OS === "web") {
      console.log("Web scroll detection hook initialized");
      
      const handlePointerDown = (event: any) => {
        // Check if the drag started inside the ScrollView bounds
        const isInsideScrollView = scrollViewBounds.current && 
          event.clientY >= scrollViewBounds.current.top &&
          event.clientY <= scrollViewBounds.current.bottom &&
          event.clientX >= scrollViewBounds.current.left &&
          event.clientX <= scrollViewBounds.current.right;

        if (!isInsideScrollView) {
          if (ENABLE_SCROLL_DEBUG) console.log("Ignoring pointer down outside ScrollView area");
          return;
        }

        dragState.current = {
          isDragging: false,
          dragStartTime: Date.now(),
          releaseCount: 0,
          isPointerDown: true
        };
        setIsScrollDetectionActive(false);
      };

      const handlePointerMove = (event: any) => {
        if (!dragState.current.isDragging && dragState.current.isPointerDown) {
          dragState.current.isDragging = true;
          setIsScrollDetectionActive(true);
          
          // Add first fresh listener immediately but with a delay to avoid immediate firing
          setTimeout(() => {
            if (dragState.current.isDragging) {
              addFreshReleaseListener();
              if (ENABLE_SCROLL_DEBUG) console.log("Added delayed fresh listener");
            }
          }, 100);
          
          if (ENABLE_SCROLL_DEBUG) console.log("Drag started - adding delayed listener");
        }
      };

      const handlePointerUp = (event: any) => {
        dragState.current.isPointerDown = false;
        const timeSinceStart = Date.now() - dragState.current.dragStartTime;

        if (dragState.current.isDragging && timeSinceStart > 100) {
          dragState.current.isDragging = false;
          setIsScrollDetectionActive(false);
          if (ENABLE_SCROLL_DEBUG) console.log("✅ Scroll ended via pointerup");
        }
      };

      const handlePointerCancel = (event: any) => {
        const timeSinceStart = Date.now() - dragState.current.dragStartTime;
        
        // Ignore immediate cancels (React Native Web cleanup) - don't treat as scroll end
        if (timeSinceStart < 200) {
          if (ENABLE_SCROLL_DEBUG) console.log("Ignoring immediate cancel - keeping drag active");
          return;
        }
        
        // Only treat as real release if it's been a significant time
        if (dragState.current.isDragging && timeSinceStart > 500) {
          dragState.current.isDragging = false;
          dragState.current.isPointerDown = false;
          setIsScrollDetectionActive(false);
          if (ENABLE_SCROLL_DEBUG) console.log("✅ Scroll ended via long cancel");
        }
      };

      // Add fresh listeners during scroll to constantly refresh release detection
      const addFreshReleaseListener = () => {
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
          setIsScrollDetectionActive(false);
          
          if (ENABLE_SCROLL_DEBUG) console.log("✅ Scroll ended via fresh listener");
        };
        
        document.addEventListener("pointerup", freshReleaseListener, true);
        document.addEventListener("mouseup", freshReleaseListener, true);
        document.addEventListener("touchend", freshReleaseListener, true);
        currentFreshListener.current = freshReleaseListener;
      };

      const handleScroll = () => {
        if (dragState.current.isDragging) {
          if (ENABLE_SCROLL_DEBUG) console.log("Scroll event during drag - refreshing listener");
          addFreshReleaseListener();
        }
      };

      // Add all listeners including scroll detection
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
        console.log("Web scroll detection hook cleanup");
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
        
        // Clean up any remaining fresh listener
        if (currentFreshListener.current) {
          document.removeEventListener("pointerup", currentFreshListener.current, true);
          document.removeEventListener("mouseup", currentFreshListener.current, true);
          document.removeEventListener("touchend", currentFreshListener.current, true);
        }
      };
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Fixed Header</Text>
      </View>

      {/* Scroll Detection Status Indicator */}
      <View style={{ 
        padding: 10, 
        backgroundColor: isScrollDetectionActive ? '#ff6b6b' : '#51cf66',
        margin: 10,
        borderRadius: 8
      }}>
        <Text style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>
          Menu: {isScrollDetectionActive ? '🔴 HIDDEN (scrolling)' : '🟢 VISIBLE'}
        </Text>
      </View>

      {/* Scrollable Content with Interactive Elements */}
      <ScrollView ref={scrollViewRef} style={styles.scrollView}>
        {Array.from({ length: 20 }).map((_, i) => (
          <Pressable
            key={i}
            style={({ pressed }) => [
              styles.item,
              i === 5 && styles.specialItem,
              pressed && styles.pressed
            ]}
            onPress={() => {
              console.log(`Item ${i + 1} clicked!`);
            }}
            {...(Platform.OS === "web" && {
              onDragStart: (e: React.DragEvent) => e.preventDefault(),
            })}
          >
            <Text style={[
              styles.itemText,
              i === 5 && styles.specialItemText
            ]}>
              {i === 5 ? "🔴 Special Clickable Item" : `📄 Item ${i + 1} (clickable)`}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    height: 80,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Platform.OS === 'web' ? 0 : 40, // Account for status bar on mobile
  },
  headerText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  item: {
    height: 80,
    backgroundColor: "#fff",
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  specialItem: {
    backgroundColor: "#ff6b6b",
  },
  pressed: {
    backgroundColor: "#495057",
    borderColor: "#74c0fc",
    transform: [{ scale: 0.98 }],
  },
  itemText: {
    fontSize: 16,
    color: "#333",
    fontWeight: 'bold',
  },
  specialItemText: {
    color: "#fff",
  },
});