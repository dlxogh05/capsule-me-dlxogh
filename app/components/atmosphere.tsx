export function Atmosphere() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        background:
          "radial-gradient(70% 50% at 8% 0%, rgb(214 196 168 / 0.45), transparent 58%), radial-gradient(50% 40% at 100% 100%, rgb(196 186 168 / 0.28), transparent 55%)",
      }}
    />
  );
}
