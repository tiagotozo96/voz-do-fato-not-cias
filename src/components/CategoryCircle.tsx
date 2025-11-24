interface CategoryCircleProps {
  name: string;
  icon: string;
  color?: string;
}

export const CategoryCircle = ({ name, icon, color = "bg-primary" }: CategoryCircleProps) => {
  return (
    <a
      href="#"
      className="flex flex-col items-center gap-2 group transition-transform hover:scale-110"
    >
      <div className={`w-20 h-20 rounded-full ${color} overflow-hidden border-4 border-white shadow-lg transition-all group-hover:border-accent`}>
        <img
          src={icon}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      <span className="text-xs font-medium text-center max-w-[80px] leading-tight group-hover:text-primary transition-colors">
        {name}
      </span>
    </a>
  );
};
