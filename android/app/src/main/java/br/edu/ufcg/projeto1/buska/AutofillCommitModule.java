package br.edu.ufcg.projeto1.buska;

import android.app.Activity;
import android.os.Build;
import android.view.autofill.AutofillManager;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;

/**
 * Avisa o Android que o formulário de login foi enviado. O app tem uma Activity só e a tela de
 * login sai da hierarquia em vez de a Activity terminar, então sem esta chamada o gerenciador de
 * senhas (Google, Samsung Pass, Bitwarden) não sabe que deve oferecer salvar a senha.
 */
public class AutofillCommitModule extends ReactContextBaseJavaModule {

  AutofillCommitModule(ReactApplicationContext context) {
    super(context);
  }

  @Override
  public String getName() {
    return "AutofillCommit";
  }

  @ReactMethod
  public void commit() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return;
    }
    UiThreadUtil.runOnUiThread(() -> {
      Activity activity = getCurrentActivity();
      if (activity == null) {
        return;
      }
      AutofillManager manager = activity.getSystemService(AutofillManager.class);
      if (manager != null) {
        manager.commit();
      }
    });
  }
}
