import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // ユーザーが既にログインしている場合はメインページにリダイレクト
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          navigate("/");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            字幕生成ツール
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            ログインまたは新規登録してください
          </p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          localization={{
            variables: {
              sign_in: {
                email_label: "メールアドレス",
                password_label: "パスワード",
                button_label: "ログイン",
              },
              sign_up: {
                email_label: "メールアドレス",
                password_label: "パスワード",
                button_label: "アカウント作成",
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default Login;