import { ArrowRight, Phone } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import AuthShell from "../../components/auth/AuthShell";
import api from "../../api/axios";

function ForgotPassword() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!phoneNumber.trim()) {
      setError("Phone number is required.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const response = await api.post("/auth/forgot-password", { phoneNumber });
      setMessage(
        response.data?.message ||
          "If an account exists, reset instructions have been sent.",
      );
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to send reset instructions.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <div>
        <h1 className="m-0 text-[21px] font-bold leading-[1.3] tracking-[-0.02em] text-[#0f172a]">
          Forgot your password?
        </h1>
        <p className="mb-[22px] mt-[7px] text-[13.5px] leading-[1.5] text-[#64748b]">
          Enter your phone number to receive reset instructions.
        </p>
      </div>
      <form className="flex flex-col gap-[18px]" onSubmit={handleSubmit}>
        <div>
          <label
            className="mb-1.5 block text-[13px] font-medium text-[#334155]"
            htmlFor="phoneNumber"
          >
            Phone Number
          </label>
          <div className="flex h-10 items-center rounded-lg border-[1.5px] border-[#d1d9e6] bg-white px-[11px] text-[#94a3b8] transition focus-within:border-[#0757c9] focus-within:shadow-[0_0_0_3px_rgb(7_87_201_/_8%)]">
            <Phone size={16} />
            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="+251 912345678"
              autoComplete="tel"
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
          className="mt-1 flex h-[42px] items-center justify-center gap-2 rounded-lg border-0 bg-[#0757c9] text-sm font-semibold text-white transition hover:bg-[#0546b0] hover:shadow-[0_4px_12px_rgb(7_87_201_/_25%)] disabled:cursor-wait disabled:opacity-65"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending..." : "Send instructions"}
          <ArrowRight size={16} />
        </button>
      </form>
      <div className="mt-5 border-t border-[#e5eaf1] pt-4 text-center text-[13px] text-[#64748b]">
        <Link to="/login">Back to Sign In</Link>
      </div>
    </AuthShell>
  );
}

export default ForgotPassword;
