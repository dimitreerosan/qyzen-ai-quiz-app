"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { getToken } from "@/lib/auth";

export function useRequireAuth() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  return { ready };
}

