import { Link } from "react-router-dom";
import { Button, EmptyState } from "../components/ui";

export function NotFoundPage() {
  return (
    <div className="container" style={{ paddingBlock: "var(--space-16)" }}>
      <EmptyState
        title="Page not found"
        description="The page you're looking for doesn't exist or has moved."
        action={
          <Link to="/">
            <Button>Go home</Button>
          </Link>
        }
      />
    </div>
  );
}
