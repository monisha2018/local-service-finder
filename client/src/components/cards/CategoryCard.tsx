import { Link } from "react-router-dom";
import { Category } from "../../types";
import Icon from "../ui/Icon";

export default function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      to={`/search?category=${category._id}`}
      className="group bg-surface-container-lowest rounded-xl p-md flex flex-col items-center gap-sm shadow-sm hover:shadow-md hover:-translate-y-1 transition-all text-center"
    >
      <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center group-hover:bg-primary-fixed transition-colors">
        <Icon name={category.icon || "handyman"} className="text-primary text-[32px]" />
      </div>
      <span className="font-label-lg text-label-lg text-on-surface">{category.name}</span>
    </Link>
  );
}
