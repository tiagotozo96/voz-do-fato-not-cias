interface AdBannerProps {
  size?: 'large' | 'medium' | 'small';
  className?: string;
}

export const AdBanner = ({ size = 'large', className = '' }: AdBannerProps) => {
  const sizes = {
    large: 'h-[200px]',
    medium: 'h-[150px]',
    small: 'h-[100px]',
  };

  return (
    <div className={`bg-muted border border-border rounded-lg flex items-center justify-center ${sizes[size]} ${className}`}>
      <div className="text-center text-muted-foreground">
        <p className="text-sm font-medium">Espaço Publicitário</p>
        <p className="text-xs mt-1">{size === 'large' ? '1900x200' : size === 'medium' ? '728x90' : '468x60'}</p>
      </div>
    </div>
  );
};
