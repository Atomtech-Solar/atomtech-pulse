import { AuthSwitchContainer } from "@/components/auth/AuthSwitchContainer";

export default function AuthSection() {
  return (
    <section
      id="auth"
      className="landing-auth flex flex-col items-center justify-center scroll-mt-20 bg-[#030712] px-4 py-16 sm:px-6 sm:py-24"
    >
      <div className="flex w-full max-w-6xl flex-col items-center">
        <AuthSwitchContainer />
      </div>
    </section>
  );
}
