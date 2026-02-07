import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function AppHome() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Home</h1>
        <p className="mt-0.5 text-sm text-neutral-600">
          Upload receipts and track reimbursements.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <a href="/app/upload">
          <Card className="transition-shadow hover:shadow-md">
            <div className="flex items-center gap-4">
              <span className="text-3xl">📤</span>
              <div>
                <p className="font-semibold text-neutral-900">Upload receipt</p>
                <p className="text-sm text-neutral-600">
                  Add a new receipt for reimbursement.
                </p>
              </div>
            </div>
          </Card>
        </a>
        <a href="/app/receipts">
          <Card className="transition-shadow hover:shadow-md">
            <div className="flex items-center gap-4">
              <span className="text-3xl">🧾</span>
              <div>
                <p className="font-semibold text-neutral-900">View receipts</p>
                <p className="text-sm text-neutral-600">
                  See your submitted receipts and status.
                </p>
              </div>
            </div>
          </Card>
        </a>
      </div>
    </div>
  );
}
