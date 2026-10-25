package com.vajra.mobile;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
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

/**
 * VAJRA Mobile — Native Android Speech Recognition & Wake Word Plugin
 * 
 * Directly wraps android.speech.SpeechRecognizer and android.speech.RecognitionListener.
 * Supports:
 * 1. Command Recognition (single-shot directive capture)
 * 2. Dedicated Wake Word Listening ("Hello Vajra", "Hey Vajra", "Hi Vajra")
 * 3. Lifecycle-aware resource management and mutual exclusion.
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

    @PluginMethod
    public void isAvailable(PluginCall call) {
        Context context = getContext();
        boolean available = SpeechRecognizer.isRecognitionAvailable(context);
        JSObject ret = new JSObject();
        ret.put("available", available);
        call.resolve(ret);
    }

    @PluginMethod
    public void checkPermission(PluginCall call) {
        JSObject ret = new JSObject();
        PermissionState state = getPermissionState("speechRecognition");
        if (state == PermissionState.GRANTED) {
            ret.put("permissionState", "GRANTED");
        } else if (state == PermissionState.DENIED) {
            ret.put("permissionState", "DENIED");
        } else {
            ret.put("permissionState", "NOT_REQUESTED");
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (getPermissionState("speechRecognition") == PermissionState.GRANTED) {
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
        if (getPermissionState("speechRecognition") == PermissionState.GRANTED) {
            ret.put("permissionState", "GRANTED");
        } else {
            ret.put("permissionState", "DENIED");
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void startListening(PluginCall call) {
        if (getPermissionState("speechRecognition") != PermissionState.GRANTED) {
            call.reject("Microphone permission not granted");
            return;
        }

        final String language = call.getString("language", "en-US");

        mainHandler.post(() -> {
            try {
                // Ensure wake word recognizer is suspended so both never run simultaneously
                pauseWakeInternal();

                // Destroy previous command instance cleanly
                cleanupRecognizerInternal();

                Context context = getContext();
                if (!SpeechRecognizer.isRecognitionAvailable(context)) {
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
        if (getPermissionState("speechRecognition") != PermissionState.GRANTED) {
            call.reject("Microphone permission required for wake word detection");
            return;
        }

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
        if (!SpeechRecognizer.isRecognitionAvailable(context)) {
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
                    // On silence or no-match in wake standby, cleanly schedule a short restart
                    if (isWakeWordActive && !isListening) {
                        scheduleWakeRestart(language);
                    }
                }

                @Override
                public void onResults(Bundle results) {
                    ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    if (matches != null && !matches.isEmpty()) {
                        checkWakeCandidate(matches.get(0), language);
                    } else if (isWakeWordActive && !isListening) {
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

        String clean = rawText.trim().toLowerCase(Locale.ROOT);
        String matchedPhrase = null;
        String remainingCommand = "";

        if (clean.startsWith("hello vajra")) {
            matchedPhrase = "Hello Vajra";
            remainingCommand = rawText.trim().substring(Math.min(rawText.trim().length(), 11)).trim();
        } else if (clean.startsWith("hey vajra")) {
            matchedPhrase = "Hey Vajra";
            remainingCommand = rawText.trim().substring(Math.min(rawText.trim().length(), 9)).trim();
        } else if (clean.startsWith("hi vajra")) {
            matchedPhrase = "Hi Vajra";
            remainingCommand = rawText.trim().substring(Math.min(rawText.trim().length(), 8)).trim();
        }

        if (matchedPhrase != null) {
            // Wake word detected! Immediately pause wake listening
            pauseWakeInternal();

            // Clean leading punctuation from remaining command
            remainingCommand = remainingCommand.replaceFirst("^[\\s,.:;!-]+", "").trim();

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
        mainHandler.postDelayed(restartWakeRunnable, 600);
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
