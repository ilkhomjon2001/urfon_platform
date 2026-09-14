import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "@/components/ui";
import { AuthProvider } from "@/lib/auth";
import { ParentChildProvider } from "@/lib/parent-child";
import { queryClient } from "@/lib/query";
import { router } from "./routes";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ParentChildProvider>
          <RouterProvider router={router} future={{ v7_startTransition: true }} />
        </ParentChildProvider>
      </AuthProvider>
      <Toaster />
    </QueryClientProvider>
  );
}
