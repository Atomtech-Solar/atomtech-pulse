import { RegisterForm } from "@/components/auth/RegisterForm";

export default function AuthSection() {
  return (
    <section id="auth" className="landing-auth py-16 sm:py-24 px-4 sm:px-6 bg-[#030712] scroll-mt-20">
      <div className="max-w-2xl mx-auto">
        <RegisterForm embedded />
      </div>
    </section>
  );
}
