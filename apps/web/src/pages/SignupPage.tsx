import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import type { SignupRequest } from "@inseoul/shared-contracts";
import { signup } from "../api";
import { useAuthStore } from "../store/authStore";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import ErrorBanner from "../components/ui/ErrorBanner";

export default function SignupPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<SignupRequest>();
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (data: SignupRequest) => {
    setLoading(true);
    setError("");
    try {
      const result = await signup(data);
      setAuth({ user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken });
      navigate("/app/input", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900 mb-6">회원가입</h1>
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
        placeholder="8자 이상"
        error={errors.password?.message}
        {...register("password", { required: "비밀번호를 입력해주세요.", minLength: { value: 8, message: "8자 이상 입력해주세요." } })}
      />
      <Input
        label="닉네임"
        placeholder="표시될 이름"
        error={errors.nickname?.message}
        {...register("nickname", { required: "닉네임을 입력해주세요." })}
      />
      <Button type="submit" loading={loading} className="w-full mt-2">
        가입하기
      </Button>
      <p className="text-center text-sm text-gray-500">
        이미 계정이 있으신가요?{" "}
        <Link to="/login" className="text-blue-600 hover:underline">로그인</Link>
      </p>
    </form>
  );
}
