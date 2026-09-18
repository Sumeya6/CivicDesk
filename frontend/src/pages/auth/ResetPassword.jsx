import { ArrowRight, Lock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import AuthShell from "../../components/auth/AuthShell";
import api from "../../api/axios";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlToken = searchParams.get("token");

  const [token, setToken] = useState(urlToken || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(!urlToken);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token.trim()) {
      setError("Reset token is required.");
      return;
    }
    if (!newPassword || !confirmPassword) {
      setError("Both fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await api.post("/auth/reset-password", {
        token: token.trim(),
        newPassword,
      });
      setMessage(
        response.data?.message || "Password has been reset successfully.",
      );
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to reset password. Token may be expired or invalid.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <div>
        <h1 className="m-0 text-[21px] font-bold leading-[1.3] tracking-[-0.02em] text-[#0f172a]">
          Reset Password
        </h1>
        <p className="mb-5.5 mt-1.75 text-[13.5px] leading-normal text-[#64748b]">
          {urlToken
            ? "Enter your new password below."
            : "Enter the reset code you received via SMS and your new password."}
        </p>
      </div>
      <form className="flex flex-col gap-4.5" onSubmit={handleSubmit}>
        {showTokenInput && (
          <div>
            <label
              className="mb-1.5 block text-[13px] font-medium text-[#334155]"
              htmlFor="token"
            >
              Reset Code
            </label>
            <div className="flex h-10 items-center rounded-lg border-[1.5px] border-[#d1d9e6] bg-white px-2.75 text-[#94a3b8] transition focus-within:border-[#0757c9] focus-within:shadow-[0_0_0_3px_rgb(7_87_201/8%)]">
              <Lock size={16} className="mr-3" />
              <input
                id="token"
                type="text"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="Enter reset code from SMS"
                autoComplete="one-time-code"
                className="flex-1 bg-transparent outline-none text-[#0f172a] placeholder:text-[#94a3b8] text-center tracking-widest"
              />
            </div>
          </div>
        )}
        <div>
          <label
            className="mb-1.5 block text-[13px] font-medium text-[#334155]"
            htmlFor="newPassword"
          >
            New Password
          </label>
          <div className="relative">
            <div className="flex h-10 items-center rounded-lg border-[1.5px] border-[#d1d9e6] bg-white px-2.75 text-[#94a3b8] transition focus-within:border-[#0757c9] focus-within:shadow-[0_0_0_3px_rgb(7_87_201/8%)]">
              <Lock size={16} className="mr-3" />
              <input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
                className="flex-1 bg-transparent outline-none text-[#0f172a] placeholder:text-[#94a3b8]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[#94a3b8] hover:text-[#0f172a]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>
        <div>
          <label
            className="mb-1.5 block text-[13px] font-medium text-[#334155]"
            htmlFor="confirmPassword"
          >
            Confirm New Password
          </label>
          <div className="flex h-10 items-center rounded-lg border-[1.5px] border-[#d1d9e6] bg-white px-2.75 text-[#94a3b8] transition focus-within:border-[#0757c9] focus-within:shadow-[0_0_0_3px_rgb(7_87_201/8%)]">
            <Lock size={16} className="mr-3" />
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
              className="flex-1 bg-transparent outline-none text-[#0f172a] placeholder:text-[#94a3b8]"
            />
          </div>
        </div>
        {error && (
          <p className="mt-1 text-[12.5px] leading-[1.4] text-red-600">
            {error}
          </p>
        )}
        {message && (
          <p className="mt-1 text-[12.5px] leading-[1.4] text-green-600">
            {message}
          </p>
        )}
        <button
          className="mt-1 flex h-10.5 items-center justify-center gap-2 rounded-lg border-0 bg-[#0757c9] text-sm font-semibold text-white transition hover:bg-[#0546b0] hover:shadow-[0_4px_12px_rgb(7_87_201/25%)] disabled:cursor-wait disabled:opacity-65"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Resetting..." : "Reset Password"}
          <ArrowRight size={16} />
        </button>
      </form>
      {!urlToken && (
        <p className="mt-3 text-center text-[12.5px] text-[#64748b]">
          Have a reset link with a token?{" "}
          <button
            type="button"
            onClick={() => setShowTokenInput(false)}
            className="text-[#0757c9] hover:underline"
          >
            Use token from URL instead
          </button>
        </p>
      )}
      <div className="mt-5 border-t border-[#e5eaf1] pt-4 text-center text-[13px] text-[#64748b]">
        <Link to="/login">Back to Sign In</Link>
      </div>
    </AuthShell>
  );
}

export default ResetPassword;
