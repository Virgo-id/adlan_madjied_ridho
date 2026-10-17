type IconProps = { className?: string };

const base = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function IconClose({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

export function IconArrowLeft({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

export function IconSend({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
  );
}

export function IconLogout({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
    </svg>
  );
}

export function IconChat({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
    </svg>
  );
}

export function IconCheck({ className = "w-3.5 h-3.5" }: IconProps) {
  return (
    <svg {...base} strokeWidth={2.5} className={className}>
      <path d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

export function IconCheckDouble({ className = "w-3.5 h-3.5" }: IconProps) {
  return (
    <svg {...base} strokeWidth={2.5} className={className}>
      <path d="m1.5 12.75 5.5 5.5 9-13" />
      <path d="m11 16.5 1.75 1.75 9.25-13.5" />
    </svg>
  );
}

export function IconClock({ className = "w-3.5 h-3.5" }: IconProps) {
  return (
    <svg {...base} strokeWidth={2.5} className={className}>
      <path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

export function IconSpinner({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg {...base} className={`${className} animate-spin`}>
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}

export function IconGoogle({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

export function IconArrowRight({ className = "w-3.5 h-3.5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  );
}

export function IconEye({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

export function IconEyeOff({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}