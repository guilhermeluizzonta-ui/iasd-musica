package br.org.iasd.jaraguacentral.musica;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ImmersivePlugin.class);   // tela cheia (plugin próprio do app)
        super.onCreate(savedInstanceState);
    }
}
