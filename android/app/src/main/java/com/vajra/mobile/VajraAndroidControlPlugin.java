package com.vajra.mobile;

import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.media.AudioManager;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.BatteryManager;
import android.os.Build;
import android.provider.MediaStore;
import android.provider.Settings;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * VAJRA Mobile — Universal Android Phone Control Plugin
 * 
 * Exposes official, user-authorized Android system intents and device sensors:
 * - App Launching via PackageManager
 * - Settings screens (Wi-Fi, Bluetooth, Display, Sound, Battery, Apps, Accessibility, Main)
 * - Camera app (without secret capture)
 * - Dialer with prefilled number
 * - SMS / Email draft composition
 * - Maps / Geolocation navigation
 * - Volume adjustment with system UI feedback
 * - Battery and Network status
 * - Accessibility Service integration and Emergency Stop
 */
@CapacitorPlugin(name = "VajraAndroidControl")
public class VajraAndroidControlPlugin extends Plugin {

    private static final String TAG = "VajraAndroidControl";

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("available", true);
        ret.put("platform", "android");
        ret.put("sdkInt", Build.VERSION.SDK_INT);
        ret.put("manufacturer", Build.MANUFACTURER);
        ret.put("model", Build.MODEL);
        call.resolve(ret);
    }

    @PluginMethod
    public void getDeviceCapabilities(PluginCall call) {
        Context context = getContext();
        JSObject ret = new JSObject();

        ret.put("platform", "android");
        ret.put("sdkInt", Build.VERSION.SDK_INT);
        ret.put("canLaunchApps", true);
        ret.put("canOpenSettings", true);
        ret.put("canOpenDialer", true);
        ret.put("canDraftSms", true);
        ret.put("canDraftEmail", true);
        ret.put("canOpenMaps", true);
        ret.put("canOpenCamera", true);
        ret.put("canAdjustVolume", true);

        // Battery check
        try {
            IntentFilter ifilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent batteryStatus = context.registerReceiver(null, ifilter);
            if (batteryStatus != null) {
                int level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
                int scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
                int status = batteryStatus.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
                boolean isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
                                     status == BatteryManager.BATTERY_STATUS_FULL;
                float pct = (level >= 0 && scale > 0) ? (level * 100.0f / scale) : -1;

                JSObject batt = new JSObject();
                batt.put("level", Math.round(pct));
                batt.put("isCharging", isCharging);
                ret.put("battery", batt);
            }
        } catch (Exception e) {
            Log.w(TAG, "Battery inspection error: " + e.getMessage());
        }

        // Network check
        try {
            ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm != null) {
                JSObject net = new JSObject();
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    android.net.Network activeNet = cm.getActiveNetwork();
                    NetworkCapabilities caps = cm.getNetworkCapabilities(activeNet);
                    boolean isConnected = caps != null && (
                        caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                        caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                        caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
                    );
                    boolean isWifi = caps != null && caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI);
                    boolean isCellular = caps != null && caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR);

                    net.put("connected", isConnected);
                    net.put("type", isWifi ? "wifi" : (isCellular ? "cellular" : "unknown"));
                } else {
                    NetworkInfo info = cm.getActiveNetworkInfo();
                    boolean isConnected = info != null && info.isConnected();
                    net.put("connected", isConnected);
                    net.put("type", info != null ? info.getTypeName().toLowerCase() : "unknown");
                }
                ret.put("network", net);
            }
        } catch (Exception e) {
            Log.w(TAG, "Network inspection error: " + e.getMessage());
        }

        // Accessibility service status
        JSObject a11y = new JSObject();
        a11y.put("serviceConnected", VajraAccessibilityService.isConnected());
        a11y.put("assistanceActive", VajraAccessibilityService.isAssistanceActive());
        ret.put("accessibility", a11y);

        call.resolve(ret);
    }

    @PluginMethod
    public void openApp(PluginCall call) {
        Context context = getContext();
        String packageName = call.getString("packageName");
        String appName = call.getString("appName", "App");

        // Map standard application identifiers to common package names
        if (packageName == null || packageName.isEmpty()) {
            String lower = appName.toLowerCase();
            if (lower.contains("youtube")) {
                packageName = "com.google.android.youtube";
            } else if (lower.contains("chrome") || lower.contains("browser")) {
                packageName = "com.android.chrome";
            } else if (lower.contains("calc")) {
                packageName = "com.google.android.calculator";
            } else if (lower.contains("map")) {
                packageName = "com.google.android.apps.maps";
            } else if (lower.contains("camera")) {
                openCamera(call);
                return;
            } else if (lower.contains("setting")) {
                openSettings(call);
                return;
            }
        }

        if (packageName != null && !packageName.isEmpty()) {
            Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(packageName);
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(launchIntent);
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("mode", "native_intent");
                ret.put("message", "Launched " + appName + " (" + packageName + ")");
                call.resolve(ret);
                return;
            }
        }

        // Try viewing intent via standard Market or fallback
        JSObject ret = new JSObject();
        ret.put("success", false);
        ret.put("mode", "unsupported");
        ret.put("message", "Application " + appName + " is not installed on this Android device.");
        call.resolve(ret);
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        Context context = getContext();
        String screen = call.getString("screen", "main");
        String action = Settings.ACTION_SETTINGS;

        switch (screen.toLowerCase()) {
            case "wifi":
                action = Settings.ACTION_WIFI_SETTINGS;
                break;
            case "bluetooth":
                action = Settings.ACTION_BLUETOOTH_SETTINGS;
                break;
            case "display":
                action = Settings.ACTION_DISPLAY_SETTINGS;
                break;
            case "sound":
                action = Settings.ACTION_SOUND_SETTINGS;
                break;
            case "battery":
                action = Intent.ACTION_POWER_USAGE_SUMMARY;
                break;
            case "apps":
            case "app_details":
                try {
                    Intent appIntent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                    appIntent.setData(Uri.parse("package:" + context.getPackageName()));
                    appIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(appIntent);
                    JSObject ret = new JSObject();
                    ret.put("success", true);
                    ret.put("mode", "native_intent");
                    ret.put("message", "Opened VAJRA Application Details Settings.");
                    call.resolve(ret);
                    return;
                } catch (Exception e) {
                    action = Settings.ACTION_SETTINGS;
                }
                break;
            case "accessibility":
                action = Settings.ACTION_ACCESSIBILITY_SETTINGS;
                break;
            default:
                action = Settings.ACTION_SETTINGS;
                break;
        }

        try {
            Intent intent = new Intent(action);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("mode", "native_intent");
            ret.put("message", "Opened Android " + screen + " settings.");
            call.resolve(ret);
        } catch (Exception e) {
            // Fallback to main settings
            try {
                Intent fallback = new Intent(Settings.ACTION_SETTINGS);
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(fallback);
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("mode", "native_intent");
                ret.put("message", "Opened Android System Settings.");
                call.resolve(ret);
            } catch (Exception ex) {
                JSObject ret = new JSObject();
                ret.put("success", false);
                ret.put("mode", "error");
                ret.put("message", "Could not open Android settings: " + ex.getMessage());
                call.resolve(ret);
            }
        }
    }

    @PluginMethod
    public void openCamera(PluginCall call) {
        Context context = getContext();
        try {
            Intent intent = new Intent(MediaStore.INTENT_ACTION_STILL_IMAGE_CAMERA);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("mode", "native_intent");
            ret.put("message", "Opened Camera application.");
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("mode", "error");
            ret.put("message", "Camera app unavailable: " + e.getMessage());
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void openDialer(PluginCall call) {
        Context context = getContext();
        String phoneNumber = call.getString("phoneNumber", "");
        try {
            Intent intent = new Intent(Intent.ACTION_DIAL);
            if (!phoneNumber.isEmpty()) {
                intent.setData(Uri.parse("tel:" + Uri.encode(phoneNumber)));
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("mode", "native_intent");
            ret.put("message", phoneNumber.isEmpty() ? "Opened Dialer." : "Prefilled phone number " + phoneNumber + " in Dialer.");
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("mode", "error");
            ret.put("message", "Dialer intent failed: " + e.getMessage());
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void composeSms(PluginCall call) {
        Context context = getContext();
        String phoneNumber = call.getString("phoneNumber", "");
        String message = call.getString("message", "");
        try {
            Uri uri = Uri.parse("smsto:" + Uri.encode(phoneNumber));
            Intent intent = new Intent(Intent.ACTION_SENDTO, uri);
            if (!message.isEmpty()) {
                intent.putExtra("sms_body", message);
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("mode", "native_intent");
            ret.put("message", "Drafted SMS for review. User confirmation required before sending.");
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("mode", "error");
            ret.put("message", "SMS composition failed: " + e.getMessage());
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void composeEmail(PluginCall call) {
        Context context = getContext();
        String email = call.getString("email", "");
        String subject = call.getString("subject", "VAJRA Note");
        String body = call.getString("body", "");
        try {
            Uri uri = Uri.parse("mailto:" + Uri.encode(email));
            Intent intent = new Intent(Intent.ACTION_SENDTO, uri);
            intent.putExtra(Intent.EXTRA_SUBJECT, subject);
            intent.putExtra(Intent.EXTRA_TEXT, body);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("mode", "native_intent");
            ret.put("message", "Drafted Email to " + email + " for review.");
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("mode", "error");
            ret.put("message", "Email intent failed: " + e.getMessage());
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void openMaps(PluginCall call) {
        Context context = getContext();
        String destination = call.getString("destination", "");
        try {
            Uri uri;
            if (!destination.isEmpty()) {
                uri = Uri.parse("geo:0,0?q=" + Uri.encode(destination));
            } else {
                uri = Uri.parse("geo:0,0");
            }
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("mode", "native_intent");
            ret.put("message", "Opened Maps for: " + (destination.isEmpty() ? "Current location" : destination));
            call.resolve(ret);
        } catch (Exception e) {
            // Fallback to web maps URL
            try {
                Intent webIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://maps.google.com/?q=" + Uri.encode(destination)));
                webIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(webIntent);
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("mode", "web_fallback");
                ret.put("message", "Opened Google Maps in browser.");
                call.resolve(ret);
            } catch (Exception ex) {
                JSObject ret = new JSObject();
                ret.put("success", false);
                ret.put("mode", "error");
                ret.put("message", "Maps launch failed: " + ex.getMessage());
                call.resolve(ret);
            }
        }
    }

    @PluginMethod
    public void adjustVolume(PluginCall call) {
        Context context = getContext();
        String direction = call.getString("direction", "up");
        int stream = AudioManager.STREAM_MUSIC;

        try {
            AudioManager am = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
            if (am != null) {
                int adjustDir = AudioManager.ADJUST_SAME;
                if ("up".equalsIgnoreCase(direction)) {
                    adjustDir = AudioManager.ADJUST_RAISE;
                } else if ("down".equalsIgnoreCase(direction)) {
                    adjustDir = AudioManager.ADJUST_LOWER;
                } else if ("mute".equalsIgnoreCase(direction)) {
                    adjustDir = AudioManager.ADJUST_MUTE;
                }

                am.adjustStreamVolume(stream, adjustDir, AudioManager.FLAG_SHOW_UI);
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("mode", "native_audio");
                ret.put("message", "Adjusted media volume: " + direction);
                call.resolve(ret);
                return;
            }
        } catch (Exception e) {
            Log.w(TAG, "Volume adjust error: " + e.getMessage());
        }

        JSObject ret = new JSObject();
        ret.put("success", false);
        ret.put("mode", "unsupported");
        ret.put("message", "Volume adjustment failed on this device.");
        call.resolve(ret);
    }

    @PluginMethod
    public void emergencyStop(PluginCall call) {
        VajraAccessibilityService.emergencyStop();
        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("message", "Global emergency stop engaged. All active phone assistance halted.");
        call.resolve(ret);
    }
}
