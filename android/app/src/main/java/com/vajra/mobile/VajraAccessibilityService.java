package com.vajra.mobile;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;

/**
 * VAJRA Mobile — Optional Accessibility-Assisted Control Service
 * 
 * Strict Privacy & Safety Architecture:
 * 1. Disabled by default until the user explicitly enables it in Android Settings.
 * 2. Does NOT inspect arbitrary window content (canRetrieveWindowContent=false).
 * 3. Never captures credentials, passwords, or personal data.
 * 4. Provides an instant Emergency Stop switch.
 * 5. Respects all operating system security boundaries and app locks.
 */
public class VajraAccessibilityService extends AccessibilityService {

    private static final String TAG = "VajraAccessibility";
    private static volatile boolean isServiceConnected = false;
    private static volatile boolean isAssistanceActive = false;

    public static boolean isConnected() {
        return isServiceConnected;
    }

    public static boolean isAssistanceActive() {
        return isAssistanceActive;
    }

    public static void setAssistanceActive(boolean active) {
        isAssistanceActive = active;
        Log.i(TAG, "VAJRA Assisted Control toggled: " + active);
    }

    public static void emergencyStop() {
        isAssistanceActive = false;
        Log.w(TAG, "EMERGENCY STOP engaged. All assisted control halted immediately.");
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        isServiceConnected = true;
        Log.i(TAG, "VajraAccessibilityService connected by Android System.");
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (!isAssistanceActive) {
            return;
        }

        // Strictly bounded to logging state transition of active user-authorized workflow
        if (event != null) {
            CharSequence pkg = event.getPackageName();
            if (pkg != null) {
                Log.d(TAG, "Observed window change for package: " + pkg);
            }
        }
    }

    @Override
    public void onInterrupt() {
        isAssistanceActive = false;
        Log.w(TAG, "VajraAccessibilityService interrupted.");
    }

    @Override
    public boolean onUnbind(Intent intent) {
        isServiceConnected = false;
        isAssistanceActive = false;
        Log.i(TAG, "VajraAccessibilityService unbound.");
        return super.onUnbind(intent);
    }
}
