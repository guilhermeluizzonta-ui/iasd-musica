package br.org.iasd.jaraguacentral.musica;

import android.view.Window;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Tela cheia do app (cifra/partitura): esconde a barra de status e a de navegação do Android.
 * Elas voltam por alguns segundos quando o usuário desliza a partir da borda, e somem de novo sozinhas.
 */
@CapacitorPlugin(name = "Immersive")
public class ImmersivePlugin extends Plugin {

    private WindowInsetsControllerCompat controller() {
        Window window = getActivity().getWindow();
        return WindowCompat.getInsetsController(window, window.getDecorView());
    }

    @PluginMethod
    public void enter(final PluginCall call) {
        getBridge().executeOnMainThread(() -> {
            WindowInsetsControllerCompat c = controller();
            c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            c.hide(WindowInsetsCompat.Type.systemBars());
            call.resolve();
        });
    }

    @PluginMethod
    public void exit(final PluginCall call) {
        getBridge().executeOnMainThread(() -> {
            controller().show(WindowInsetsCompat.Type.systemBars());
            call.resolve();
        });
    }
}
