import { Link } from "react-router-dom";
import { buttonVariants, EmptyState, Icon } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useDocumentTitle } from "@/lib/hooks";
import { roleHome } from "@/lib/roles";

export default function NotFoundPage() {
  useDocumentTitle("Sahifa topilmadi");
  const { user } = useAuth();
  const home = user ? roleHome(user.role) : "/login";
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <EmptyState
        icon="explore_off"
        title="Sahifa topilmadi"
        description="Siz qidirgan sahifa mavjud emas yoki boshqa manzilga koʻchirilgan."
        action={
          <Link to={home} className={buttonVariants()}>
            <Icon name="home" size={18} />
            {user ? "Bosh sahifaga qaytish" : "Tizimga kirish"}
          </Link>
        }
      />
    </div>
  );
}
