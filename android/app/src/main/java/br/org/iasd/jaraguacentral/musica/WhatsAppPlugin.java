package br.org.iasd.jaraguacentral.musica;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;

/**
 * Envia um arquivo (os slides .pptx) direto pelo WhatsApp, sem passar pela lista de apps do Android.
 * Abre o WhatsApp na escolha do contato; com um número (phone), tenta abrir já a conversa desse contato.
 * Sem WhatsApp instalado, responde com o código SEM_WHATSAPP (o app então abre o compartilhar comum).
 */
@CapacitorPlugin(name = "WhatsApp")
public class WhatsAppPlugin extends Plugin {

    private static final String[] PACOTES = { "com.whatsapp", "com.whatsapp.w4b" };

    private boolean instalado(String pacote) {
        try {
            getContext().getPackageManager().getPackageInfo(pacote, 0);
            return true;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }

    @PluginMethod
    public void available(PluginCall call) {
        JSObject r = new JSObject();
        r.put("whatsapp", instalado(PACOTES[0]));
        r.put("business", instalado(PACOTES[1]));
        call.resolve(r);
    }

    @PluginMethod
    public void shareFile(PluginCall call) {
        String caminho = call.getString("path");
        if (caminho == null || caminho.isEmpty()) { call.reject("Arquivo não informado", "ARQUIVO"); return; }
        File arq = caminho.startsWith("file:") ? new File(Uri.parse(caminho).getPath()) : new File(caminho);
        if (!arq.exists()) { call.reject("Arquivo não encontrado", "ARQUIVO"); return; }
        Uri uri;
        try {
            uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", arq);
        } catch (IllegalArgumentException e) {
            call.reject("Arquivo fora da pasta permitida", "ARQUIVO");
            return;
        }
        String mime = call.getString("mime", "*/*");
        String texto = call.getString("text");
        String fone = call.getString("phone");
        for (String pacote : PACOTES) {
            if (!instalado(pacote)) continue;
            Intent i = new Intent(Intent.ACTION_SEND);
            i.setType(mime);
            i.putExtra(Intent.EXTRA_STREAM, uri);
            if (texto != null && !texto.isEmpty()) i.putExtra(Intent.EXTRA_TEXT, texto);
            if (fone != null && fone.matches("\\d{10,15}")) i.putExtra("jid", fone + "@s.whatsapp.net");   // conversa direta (quando o WhatsApp aceita)
            i.setPackage(pacote);
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                getActivity().startActivity(i);
                JSObject r = new JSObject();
                r.put("app", pacote);
                call.resolve(r);
                return;
            } catch (ActivityNotFoundException e) {
                // tenta o próximo (WhatsApp Business)
            }
        }
        call.reject("WhatsApp não encontrado", "SEM_WHATSAPP");
    }
}
