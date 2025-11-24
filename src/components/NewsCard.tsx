import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface NewsCardProps {
  title: string;
  description: string;
  image: string;
  category: string;
  date: string;
  featured?: boolean;
}

export const NewsCard = ({
  title,
  description,
  image,
  category,
  date,
  featured = false,
}: NewsCardProps) => {
  return (
    <Card className="group overflow-hidden hover:shadow-elevated transition-all duration-300 cursor-pointer h-full">
      <div className="relative overflow-hidden">
        <img
          src={image}
          alt={title}
          className={`w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            featured ? 'h-[300px] lg:h-[400px]' : 'h-[200px]'
          }`}
        />
        <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground hover:bg-primary">
          {category}
        </Badge>
      </div>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground mb-2">{date}</div>
        <h3 className={`font-bold mb-2 group-hover:text-primary transition-colors ${
          featured ? 'text-xl lg:text-2xl' : 'text-lg'
        }`}>
          {title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};
