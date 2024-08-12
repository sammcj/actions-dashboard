import { Loader } from "lucide-react";

export default function ReposLoading() {
  return (
    <div className="container mx-auto py-5 flex justify-center space-x-2">
      <Loader className="animate-spin" />
      <span>Loading repos</span>
    </div>
  );
}
