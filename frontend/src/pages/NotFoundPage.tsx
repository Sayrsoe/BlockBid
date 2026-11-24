import { Link } from "react-router";
import { EmptyState } from "../components/EmptyState";

export function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      description="The page you requested does not exist in the BlockBid frontend."
      action={
        <Link to="/" className="button-primary">
          Return to marketplace
        </Link>
      }
    />
  );
}
