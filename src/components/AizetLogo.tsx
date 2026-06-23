interface AizetLogoProps {
  className?: string;
  zetColor?: string;
}

export function AizetLogo({ className = '', zetColor = '#2A2A2A' }: AizetLogoProps) {
  return (
    <span className={className}>
      <span style={{ color: '#C9A227' }}>AI</span>
      <span style={{ color: zetColor }}>ZET</span>
    </span>
  );
}
