package com.vajra.mobile;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.ArrayList;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * VAJRA Mobile — Native Android Speech Recognition & Wake Word Plugin
 * 
 * Directly wraps android.speech.SpeechRecognizer and android.speech.RecognitionListener.
 * Supports:
 * 1. Command Recognition (single-shot directive capture)
 * 2. Dedicated Wake Word Listening ("Hello Vajra", "Hey Vajra", "Hi Vajra")
 * 3. Lifecycle-aware resource management and permission validation.
 */
@CapacitorPlugin(
    name = "VajraNativeSpeech",
    permissions = {
        @Permission(
            alias = "speechRecognition",
            strings = { Manifest.permission.RECORD_AUDIO }
        )
    }
)
public class VajraNativeSpeechPlugin extends Plugin {

    private SpeechRecognizer speechRecognizer = null;
    private SpeechRecognizer wakeRecognizer = null;
    private boolean isListening = false;
    private boolean isWakeWordActive = false;
    private boolean isRestartingWake = false;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private Runnable restartWakeRunnable = null;

    private static final Pattern WAKE_REGEX = Pattern.compile(
        "^(?:hello|hey|hi|ok|acha|suno|oye|vaire)?[\\s,.:;!-]*(?:vajra|jarvis)\\b[\\s,.:;!-]*([\\s\\S]*)$",
        Pattern.CASE_INSENSITIVE
    );

    private boolean hasAudioPermission() {
        Context context = getContext();
        if (context == null) return false;
        return ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        Context context = getContext();
        boolean available = context != null && SpeechRecognizer.isRecognitionAvailable(context);
        JSObject ret = new JSObject();
        ret.put("available", available);
        call.resolve(ret);
    }

    @PluginMethod
    public void checkPermission(PluginCall call) {
        JSObject ret = new JSObject();
        if (hasAudioPermission()) {
            ret.put("permissionState", "GRANTED");
        } else {
            PermissionState state = getPermissionState("speechRecognition");
            if (state == PermissionState.DENIED) {
                ret.put("permissionState", "DENIED");
            } else {
                ret.put("permissionState", "NOT_REQUESTED");
            }
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (hasAudioPermission()) {
            JSObject ret = new JSObject();
            ret.put("permissionState", "GRANTED");
            call.resolve(ret);
        } else {
            requestPermissionForAlias("speechRecognition", call, "speechPermissionCallback");
        }
    }

    @PermissionCallback
    private void speechPermissionCallback(PluginCall call) {
        JSObject ret = new JSObject();
        if (hasAudioPermission()) {
            ret.put("permissionState", "GRANTED");
        } else {
            ret.put("permissionState", "DENIED");
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void startListening(PluginCall call) {
        if (!hasAudioPermission()) {
            requestPermissionForAlias("speechRecognition", call, "startListeningPermissionCallback");
            return;
        }
        startListeningInternal(call);
    }

    @PermissionCallback
    private void startListeningPermissionCallback(PluginCall call) {
        if (hasAudioPermission()) {
            startListeningInternal(call);
        } else {
            call.reject("Microphone permission is required for voice input.");
        }
    }

    private void startListeningInternal(PluginCall call) {
        final String language = call.getString("language", "en-US");

        mainHandler.post(() -> {
            try {
                // Ensure wake word recognizer is suspended so both never run simultaneously
                pauseWakeInternal();

                // Destroy previous command instance cleanly
                cleanupRecognizerInternal();

                Context context = getContext();
                if (context == null || !SpeechRecognizer.isRecognitionAvailable(context)) {
                    call.reject("Speech recognition is not available on this device.");
                    return;
                }

                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context);
                speechRecognizer.setRecognitionListener(new NativeRecognitionListener(this));

                Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                if (language != null && !language.trim().isEmpty()) {
                    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, language);
                    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, language);
                } else {
                    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault().toString());
                }
                intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
                intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
                intent.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, context.getPackageName());

                speechRecognizer.startListening(intent);
                isListening = true;

                JSObject res = new JSObject();
                res.put("success", true);
                call.resolve(res);
            } catch (Exception e) {
                isListening = false;
                cleanupRecognizerInternal();
                call.reject("Failed to initialize native speech recognizer: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        mainHandler.post(() -> {
            try {
                if (speechRecognizer != null && isListening) {
                    speechRecognizer.stopListening();
                }
            } catch (Exception ignored) {
            } finally {
                isListening = false;
                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            }
        });
    }

    @PluginMethod
    public void isListening(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("isListening", isListening);
        call.resolve(ret);
    }

    // ==========================================
    // Dedicated Android Wake Word Detection
    // ==========================================

    @PluginMethod
    public void startWakeWord(PluginCall call) {
        if (!hasAudioPermission()) {
            requestPermissionForAlias("speechRecognition", call, "startWakePermissionCallback");
            return;
        }
        startWakeWordInternal(call);
    }

    @PermissionCallback
    private void startWakePermissionCallback(PluginCall call) {
        if (hasAudioPermission()) {
            startWakeWordInternal(call);
        } else {
            call.reject("Microphone permission required for wake word");
        }
    }

    private void startWakeWordInternal(PluginCall call) {
        final String language = call.getString("language", "en-US");

        mainHandler.post(() -> {
            try {
                isWakeWordActive = true;
                startWakeInternal(language);
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("message", "Wake word standby active");
                call.resolve(ret);
            } catch (Exception e) {
                isWakeWordActive = false;
                call.reject("Could not start wake word detection: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void stopWakeWord(PluginCall call) {
        mainHandler.post(() -> {
            isWakeWordActive = false;
            cancelWakeRestart();
            pauseWakeInternal();
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        });
    }

    @PluginMethod
    public void isWakeWordActive(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("active", isWakeWordActive);
        call.resolve(ret);
    }

    private void startWakeInternal(String language) {
        if (!isWakeWordActive || isListening) {
            return;
        }

        cancelWakeRestart();
        pauseWakeInternal();

        Context context = getContext();
        if (context == null || !SpeechRecognizer.isRecognitionAvailable(context)) {
            return;
        }

        try {
            wakeRecognizer = SpeechRecognizer.createSpeechRecognizer(context);
            wakeRecognizer.setRecognitionListener(new RecognitionListener() {
                @Override
                public void onReadyForSpeech(Bundle params) {}

                @Override
                public void onBeginningOfSpeech() {}

                @Override
                public void onRmsChanged(float rmsdB) {}

                @Override
                public void onBufferReceived(byte[] buffer) {}

                @Override
                public void onEndOfSpeech() {}

                @Override
                public void onError(int error) {
                    if (isWakeWordActive && !isListening) {
                        scheduleWakeRestart(language);
                    }
                }

                @Override
                public void onResults(Bundle results) {
                    ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    if (matches != null && !matches.isEmpty()) {
                        checkWakeCandidate(matches.get(0), language);
                    }
                    if (isWakeWordActive && !isListening) {
                        scheduleWakeRestart(language);
                    }
                }

                @Override
                public void onPartialResults(Bundle partialResults) {
                    ArrayList<String> matches = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    if (matches != null && !matches.isEmpty()) {
                        checkWakeCandidate(matches.get(0), language);
                    }
                }

                @Override
                public void onEvent(int eventType, Bundle params) {}
            });

            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            if (language != null && !language.trim().isEmpty()) {
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, language);
            } else {
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-US");
            }
            intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
            intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
            intent.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, context.getPackageName());

            wakeRecognizer.startListening(intent);
        } catch (Exception e) {
            if (isWakeWordActive && !isListening) {
                scheduleWakeRestart(language);
            }
        }
    }

    private void checkWakeCandidate(String rawText, String language) {
        if (rawText == null || !isWakeWordActive || isListening) return;

        String clean = rawText.trim();
        Matcher matcher = WAKE_REGEX.matcher(clean);

        if (matcher.find()) {
            String lower = clean.toLowerCase(Locale.ROOT);
            String matchedPhrase = "Hello Vajra";
            if (lower.startsWith("hey")) matchedPhrase = "Hey Vajra";
            else if (lower.startsWith("hi")) matchedPhrase = "Hi Vajra";

            String remainingCommand = matcher.group(1) != null ? matcher.group(1).trim() : "";
            remainingCommand = remainingCommand.replaceFirst("^[\\s,.:;!-]+", "").trim();

            pauseWakeInternal();

            JSObject data = new JSObject();
            data.put("phrase", matchedPhrase);
            data.put("remainingCommand", remainingCommand);
            notifySpeechListeners("wakeWordDetected", data);
        }
    }

    private void scheduleWakeRestart(String language) {
        cancelWakeRestart();
        if (!isWakeWordActive || isListening) return;

        isRestartingWake = true;
        restartWakeRunnable = () -> {
            isRestartingWake = false;
            if (isWakeWordActive && !isListening) {
                startWakeInternal(language);
            }
        };
        mainHandler.postDelayed(restartWakeRunnable, 800);
    }

    private void cancelWakeRestart() {
        if (restartWakeRunnable != null) {
            mainHandler.removeCallbacks(restartWakeRunnable);
            restartWakeRunnable = null;
        }
        isRestartingWake = false;
    }

    private void pauseWakeInternal() {
        if (wakeRecognizer != null) {
            try {
                wakeRecognizer.setRecognitionListener(null);
                wakeRecognizer.cancel();
            } catch (Exception ignored) {}
            try {
                wakeRecognizer.destroy();
            } catch (Exception ignored) {}
            wakeRecognizer = null;
        }
    }

    @PluginMethod
    public void cleanup(PluginCall call) {
        mainHandler.post(() -> {
            cleanupRecognizerInternal();
            cancelWakeRestart();
            pauseWakeInternal();
            isWakeWordActive = false;
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        });
    }

    void notifySpeechListeners(String eventName, JSObject data) {
        notifyListeners(eventName, data);
    }

    void cleanupAfterResult() {
        mainHandler.post(this::cleanupRecognizerInternal);
    }

    private void cleanupRecognizerInternal() {
        isListening = false;
        if (speechRecognizer != null) {
            try {
                speechRecognizer.setRecognitionListener(null);
                speechRecognizer.cancel();
            } catch (Exception ignored) {}
            try {
                speechRecognizer.destroy();
            } catch (Exception ignored) {}
            speechRecognizer = null;
        }
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        cancelWakeRestart();
        pauseWakeInternal();
        cleanupRecognizerInternal();
    }

    @Override
    protected void handleOnStop() {
        super.handleOnStop();
        cancelWakeRestart();
        pauseWakeInternal();
        cleanupRecognizerInternal();
    }

    @Override
    protected void handleOnPause() {
        super.handleOnPause();
        cancelWakeRestart();
        pauseWakeInternal();
    }

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        if (isWakeWordActive && !isListening) {
            startWakeInternal("en-US");
        }
    }
}
