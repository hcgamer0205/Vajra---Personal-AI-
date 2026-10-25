package com.vajra.mobile;

import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.SpeechRecognizer;
import com.getcapacitor.JSObject;
import java.util.ArrayList;

/**
 * Top-level listener for Android SpeechRecognizer events.
 */
class NativeRecognitionListener implements RecognitionListener {

    private final VajraNativeSpeechPlugin plugin;

    public NativeRecognitionListener(VajraNativeSpeechPlugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public void onReadyForSpeech(Bundle params) {
        JSObject data = new JSObject();
        data.put("isListening", true);
        plugin.notifySpeechListeners("listeningState", data);
    }

    @Override
    public void onBeginningOfSpeech() {
        // Audio input detected
    }

    @Override
    public void onRmsChanged(float rmsdB) {
        // Sound level changes
    }

    @Override
    public void onBufferReceived(byte[] buffer) {
        // Audio buffer
    }

    @Override
    public void onEndOfSpeech() {
        // Speech input ended
    }

    @Override
    public void onError(int error) {
        String errorCode = mapErrorCode(error);
        String userMessage = mapErrorMessage(error);
        boolean isPermissionDenied = (error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS);

        JSObject errObj = new JSObject();
        errObj.put("code", errorCode);
        errObj.put("message", userMessage);
        errObj.put("isPermissionDenied", isPermissionDenied);
        plugin.notifySpeechListeners("error", errObj);

        JSObject stateObj = new JSObject();
        stateObj.put("isListening", false);
        plugin.notifySpeechListeners("listeningState", stateObj);

        plugin.cleanupAfterResult();
    }

    @Override
    public void onResults(Bundle results) {
        ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        if (matches != null && !matches.isEmpty()) {
            String text = matches.get(0);
            if (text != null && !text.trim().isEmpty()) {
                JSObject data = new JSObject();
                data.put("text", text.trim());
                plugin.notifySpeechListeners("finalResult", data);
            }
        }

        JSObject stateObj = new JSObject();
        stateObj.put("isListening", false);
        plugin.notifySpeechListeners("listeningState", stateObj);

        plugin.cleanupAfterResult();
    }

    @Override
    public void onPartialResults(Bundle partialResults) {
        ArrayList<String> matches = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        if (matches != null && !matches.isEmpty()) {
            String text = matches.get(0);
            if (text != null && !text.trim().isEmpty()) {
                JSObject data = new JSObject();
                data.put("text", text.trim());
                plugin.notifySpeechListeners("partialResult", data);
            }
        }
    }

    @Override
    public void onEvent(int eventType, Bundle params) {
    }

    private String mapErrorCode(int error) {
        switch (error) {
            case SpeechRecognizer.ERROR_AUDIO:
                return "audio";
            case SpeechRecognizer.ERROR_CLIENT:
                return "client";
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS:
                return "permission";
            case SpeechRecognizer.ERROR_NETWORK:
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT:
                return "network";
            case SpeechRecognizer.ERROR_NO_MATCH:
                return "no_match";
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY:
                return "busy";
            case SpeechRecognizer.ERROR_SERVER:
                return "server";
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT:
                return "no_speech";
            default:
                return "unknown";
        }
    }

    private String mapErrorMessage(int error) {
        switch (error) {
            case SpeechRecognizer.ERROR_AUDIO:
                return "Microphone unavailable. Please check microphone access.";
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS:
                return "Microphone permission is required for voice input.";
            case SpeechRecognizer.ERROR_NETWORK:
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT:
                return "Voice input unavailable right now. Please try again or type your directive.";
            case SpeechRecognizer.ERROR_NO_MATCH:
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT:
                return "I couldn't understand that. Please try again.";
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY:
                return "Voice input is busy. Please try again.";
            default:
                return "Voice input is unavailable on this device.";
        }
    }
}
