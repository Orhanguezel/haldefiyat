type Props = {
  eyebrow: string;
  title: string;
  description: string;
  level?: "h1" | "h2";
};

export function FirmFormHeader({ eyebrow, title, description, level = "h2" }: Props) {
  const Heading = level;
  return (
    <header className="mb-5">
      <span className="font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.1em] text-(--color-brand)">
        {eyebrow}
      </span>
      <Heading className="mt-1 font-(family-name:--font-display) text-xl font-bold text-(--color-foreground)">
        {title}
      </Heading>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-(--color-muted)">
        {description}
      </p>
    </header>
  );
}
