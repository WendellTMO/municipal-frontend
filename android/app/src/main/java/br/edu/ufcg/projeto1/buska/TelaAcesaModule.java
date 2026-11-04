package br.edu.ufcg.projeto1.buska;

import android.app.Activity;
import android.view.WindowManager;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;

/**
 * Impede que a tela apague enquanto o motorista acompanha a viagem. Usa o FLAG_KEEP_SCREEN_ON da
 * janela, que não pede permissão e solta sozinho quando o app sai de cena.
 */
public class TelaAcesaModule extends ReactContextBaseJavaModule {

  TelaAcesaModule(ReactApplicationContext context) {
    super(context);
  }

  @Override
  public String getName() {
    return "TelaAcesa";
  }

  @ReactMethod
  public void definir(boolean acesa) {
    UiThreadUtil.runOnUiThread(() -> {
      Activity activity = getCurrentActivity();
      if (activity == null) {
        return;
      }
      if (acesa) {
        activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
      } else {
        activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
      }
    });
  }
}
