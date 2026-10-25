package com.vajra.mobile;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(VajraNativeSpeechPlugin.class);
        registerPlugin(VajraAndroidControlPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
