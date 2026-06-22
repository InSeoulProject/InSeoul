import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import type { LoginRequest } from "@inseoul/shared-contracts";
import { login } from "../api";
import { useAuthStore } from "../store/authStore";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import ErrorBanner from "../components/ui/ErrorBanner";

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>();
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (data: LoginRequest) => {
    setLoading(true);
    setError("");
    try {
      const result = await login(data);
      setAuth({ user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken });
      navigate("/app/input", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900 mb-6">로그인</h1>
      {error && <ErrorBanner message={error} />}
      <Input
        label="이메일"
        type="email"
        placeholder="name@example.com"
        error={errors.email?.message}
        {...register("email", { required: "이메일을 입력해주세요." })}
      />
      <Input
        label="비밀번호"
        type="password"
        error={errors.password?.message}
        {...register("password", { required: "비밀번호를 입력해주세요." })}
      />
      <Button type="submit" loading={loading} className="w-full mt-2">
        로그인
      </Button>
      <p className="text-center text-sm text-gray-500">
        계정이 없으신가요?{" "}
        <Link to="/signup" className="text-blue-600 hover:underline">회원가입</Link>
      </p>
    </form>
  );
}
